/**
 * PROPSY BACKEND - PSYCHOMETRIC & SPSS SYSTEM
 * Google Apps Script Backend (Production Ready)
 * 
 * Features:
 * - Automatic Folder and Spreadsheet Provisioning
 * - Centralized Schema Management
 * - Robust Scoring Engine (Reverse, Weight, Groups)
 * - Email Notifications & Logging
 */

const APP_CONFIG = {
  VERSION: "1.1.0",
  ROOT_FOLDER_NAME: "PROPSY_DATABASE_SYSTEM",
  SURVEYS_FOLDER_NAME: "01_CacBangLuongGia",
  ASSETS_FOLDER_NAME: "00_HeThong_Assets",
  MASTER_SHEET_NAME: "PROPSY_MASTER_DB",
  DEFAULT_ADMIN_EMAIL: "psyedu.research@gmail.com",
  DEFAULT_ADMIN_PIN: "123456",
  SHEETS: {
    SETTINGS: "CaiDat",
    ACCOUNTS: "TaiKhoan",
    SURVEYS: "BangLuongGia", // Registry
    RESPONSES: "PhanHoiTongHop",
    SYSTEM_LOGS: "NhatKyHeThong",
    // Individual survey files will have: Questions, Responses (Wide), Config
  }
};

/**
 * Handle POST requests from Vercel/Frontend
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload || {}; // Default to empty object if missing
    
    // Log action for debugging
    console.log(`Processing action: ${action}`);
    
    // Ensure workspace exists
    getORCreateMasterSS();
    
    let result;
    switch (action) {
      // --- SYSTEM & SETUP ---
      case 'initialize':
        result = initializeSystem();
        break;
      case 'get_config':
        result = getSystemConfig();
        break;
      case 'get_settings':
        result = getSettings();
        break;
        
      // --- AUTH ---
      case 'admin_login':
        result = handleAdminLogin(payload);
        break;
      case 'recover_password':
        result = recoverPassword(payload.email);
        break;
      case 'update_password':
        result = updatePassword(payload);
        break;
      case 'get_full_responses':
        result = getFullResponses(payload.surveyId);
        break;
        
      // --- SURVEY BUILDER (ADMIN) ---
      case 'save_survey':
        result = saveSurvey(payload);
        break;
      case 'get_surveys':
        result = getSurveys(payload); 
        break;
      case 'get_survey_detail':
        result = getSurveyDetail(payload.id || payload.code);
        break;
      case 'delete_survey':
        result = deleteSurvey(payload.id);
        break;
      case 'publish_survey':
        result = publishSurvey(payload);
        break;
        
      // --- RESPONSE FLOW (USER) ---
      case 'submit_response':
        result = handleSubmitResponse(payload);
        break;
        
      // --- DASHBOARD & ANALYTICS ---
      case 'get_responses':
        result = getResponses(payload); 
        break;
        
      case 'save_settings':
        result = saveSettings(payload);
        break;
      case 'create_workspace':
        result = createWorkspace(payload);
        break;
      case 'upload_file':
        result = handleFileUpload(payload);
        break;
        
      default:
        throw new Error(`Action '${action}' not supported.`);
    }
    
    return jsonResponse(result);
    
  } catch (error) {
    console.error('API Error: ', error);
    return jsonResponse({ success: false, message: error.toString() }, 200); // Always return 200 for client handling
  }
}

/**
 * Handle GET requests
 */
function doGet(e) {
  const action = e.parameter.action;
  if (action === 'health') {
    return jsonResponse({ status: 'ok', version: APP_CONFIG.VERSION, timestamp: new Date().toISOString() });
  }
  return jsonResponse({ message: 'ProPsy API is running. Use POST for data operations.' });
}

// ==========================================
// CORE WORKSPACE ENGINE
// ==========================================

function getORCreateMasterSS() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // 30 seconds
    const props = PropertiesService.getScriptProperties();
    let ssId = props.getProperty('MASTER_SS_ID');
    
    if (!ssId) {
      const rootFolders = DriveApp.getFoldersByName(APP_CONFIG.ROOT_FOLDER_NAME);
      let rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(APP_CONFIG.ROOT_FOLDER_NAME);
      
      const files = rootFolder.getFilesByName(APP_CONFIG.MASTER_SHEET_NAME);
      let ss;
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
        // Clean up duplicates if any
        while (files.hasNext()) {
          try {
            DriveApp.getFileById(files.next().getId()).setTrashed(true);
          } catch(e) {}
        }
      } else {
        ss = SpreadsheetApp.create(APP_CONFIG.MASTER_SHEET_NAME);
        DriveApp.getFileById(ss.getId()).moveTo(rootFolder);
        initAllSheets(ss);
      }
      
      ssId = ss.getId();
      props.setProperty('MASTER_SS_ID', ssId);
      props.setProperty('ROOT_FOLDER_ID', rootFolder.getId());
    }
    
    return SpreadsheetApp.openById(ssId);
  } finally {
    lock.releaseLock();
  }
}

function initAllSheets(ss) {
  const schemas = {
    [APP_CONFIG.SHEETS.SETTINGS]: ["Key", "Value", "Description", "UpdatedAt"],
    [APP_CONFIG.SHEETS.ACCOUNTS]: ["UID", "Email", "Name", "Role", "PasswordHash", "PIN", "Status", "CreatedAt"],
    [APP_CONFIG.SHEETS.SURVEYS]: ["ID", "Code", "Title", "FileID", "Status", "Category", "Thumbnail", "SettingsJSON", "CreatedAt", "UpdatedAt"],
    [APP_CONFIG.SHEETS.RESPONSES]: ["ID", "SurveyID", "UserName", "UserEmail", "UserPhone", "TotalScore", "Interpretation", "GroupScores", "Status", "CreatedAt"],
    [APP_CONFIG.SHEETS.SYSTEM_LOGS]: ["Timestamp", "Level", "Action", "Detail", "User"]
  };

  for (const sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]);
      sheet.getRange(1, 1, 1, schemas[sheetName].length).setFontWeight("bold").setBackground("#f0f0f0");
      sheet.setFrozenRows(1);
    }
  }
  
  // Create first admin if empty
  const accountSheet = ss.getSheetByName(APP_CONFIG.SHEETS.ACCOUNTS);
  if (accountSheet.getLastRow() === 1) {
    accountSheet.appendRow(["ADM_" + Date.now(), APP_CONFIG.DEFAULT_ADMIN_EMAIL, "Super Admin", "admin", "admin", APP_CONFIG.DEFAULT_ADMIN_PIN, "active", new Date()]);
  }
}

// ==========================================
// AUTHENTICATION
// ==========================================

function handleAdminLogin(payload) {
  const { email, password, pin } = payload;
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.ACCOUNTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const [uid, uEmail, name, role, uPass, uPin, status] = data[i];
    if (uEmail === email && status === 'active') {
      // Check password if provided, or check PIN
      if (password && uPass === password) {
        return { success: true, user: { uid, email, name, role } };
      }
      if (pin && uPin === pin) {
        return { success: true, user: { uid, email, name, role } };
      }
    }
  }
  return { success: false, message: "Email hoặc mật khẩu/PIN không đúng." };
}

// ==========================================
// SURVEY BUILDER & DATA
// ==========================================

function saveSurvey(payload) {
  const ss = getORCreateMasterSS();
  const sSheet = ss.getSheetByName(APP_CONFIG.SHEETS.SURVEYS);
  
  const id = (!payload.id || payload.id === 'new') ? "SRV_" + Utilities.getUuid().substring(0, 8) : payload.id;
  const code = payload.code || "C_" + Utilities.getUuid().substring(0, 5).toUpperCase();
  const title = payload.name || payload.title || "Untitled Survey";
  const now = new Date().toISOString();
  
  // 1. Manage Individual File
  const surveyFileId = getOrCreateSurveyFile(id, code, title);
  const surveySS = SpreadsheetApp.openById(surveyFileId);
  
  // Update Questions in the individual file
  const qSheet = getOrCreateSheet(surveySS, "CauHoi_Schema");
  qSheet.clear();
  const qHeaders = ["ID", "Code", "Content", "Type", "Required", "Weight", "Group", "Reverse", "OptionsJSON"];
  qSheet.appendRow(qHeaders);
  qSheet.getRange(1, 1, 1, qHeaders.length).setFontWeight("bold").setBackground("#dcfce7");
  
  const blocks = payload.blocks || payload.questions || [];
  for (let idx = 0; idx < blocks.length; idx++) {
    const q = blocks[idx];
    qSheet.appendRow([
      q.id || "Q" + idx, 
      q.code || "VAR" + idx, 
      q.title || q.content || "", 
      q.type,
      q.required ? 1 : 0, 
      q.weight || 1, 
      q.scoreGroupCode || q.group || 'default', 
      (q.reverseScore || q.isReverse) ? 1 : 0,
      JSON.stringify(q.options || [])
    ]);
  }

  // Build dynamic headers based on blocks
  const dynamicHeaders = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'content' || b.type === 'contact') continue;
    if (b.type === 'matrix') {
       const rows = b.matrixRows || [];
       const cols = b.matrixCols || [];
       for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const r = rows[rIdx];
          for (let cIdx = 0; cIdx < cols.length; cIdx++) {
             const c = cols[cIdx];
             const cType = c.type || 'single_choice';
             if (cType === 'single_choice') {
                 if (!dynamicHeaders.includes(`${b.code}_${r.code}`)) dynamicHeaders.push(`${b.code}_${r.code}`);
             } else {
                 if (!dynamicHeaders.includes(`${b.code}_${r.code}_${c.value}`)) dynamicHeaders.push(`${b.code}_${r.code}_${c.value}`);
             }
          }
       }
    } else {
       if (!dynamicHeaders.includes(b.code)) dynamicHeaders.push(b.code);
    }
  }

  const respHeaders = [
     "ResponseID", "Timestamp", "Name", "Email", "Phone", "Org", 
     "TotalScore", "Interpretation", "GroupScores", ...dynamicHeaders
  ];

  // Prepare Response Sheet (Wide Format)
  const respSheet = getOrCreateSheet(surveySS, "KetQua_TongHop");
  const existingHeaders = respSheet.getLastRow() > 0 ? respSheet.getRange(1, 1, 1, respSheet.getLastColumn()).getValues()[0] : [];
  
  let mergedHeaders = [...existingHeaders];
  if (mergedHeaders.length === 0) {
     mergedHeaders = respHeaders;
     respSheet.appendRow(mergedHeaders);
     respSheet.getRange(1, 1, 1, mergedHeaders.length).setFontWeight("bold").setBackground("#fef9c3");
  } else {
     let added = false;
     for (let i = 0; i < respHeaders.length; i++) {
        const h = respHeaders[i];
        if (!mergedHeaders.includes(h)) {
           mergedHeaders.push(h);
           added = true;
        }
     }
     if (added) {
        respSheet.getRange(1, 1, 1, mergedHeaders.length).setValues([mergedHeaders]);
        respSheet.getRange(1, 1, 1, mergedHeaders.length).setFontWeight("bold").setBackground("#fef9c3");
     }
  }

  // 2. Update Master Registry
  const surveyData = findRowByValue(sSheet, 0, id);
  const row = [
    id, code, title, surveyFileId,
    payload.status || 'draft', payload.category || 'general', 
    payload.thumbnail || '', JSON.stringify({
      settings: payload.settings || {},
      branding: payload.branding || {},
      scoreGroups: payload.scoreGroups || [],
      description: payload.description || "",
      type: payload.type || "assessment",
      collectionStatus: payload.collectionStatus || 'closed',
      blocks: blocks // CRITICAL: Save blocks to registry for UI sync
    }),
    surveyData ? surveyData.rowValues[8] : now, now
  ];
  
  if (surveyData) sSheet.getRange(surveyData.rowNum, 1, 1, row.length).setValues([row]);
  else sSheet.appendRow(row);
  
  return { success: true, id, fileUrl: surveySS.getUrl() };
}

function getSurveyDetail(idOrCode) {
  const ss = getORCreateMasterSS();
  const sSheet = ss.getSheetByName(APP_CONFIG.SHEETS.SURVEYS);
  
  let surveyRow = findRowByValue(sSheet, 0, idOrCode);
  if (!surveyRow) surveyRow = findRowByValue(sSheet, 1, idOrCode);
  if (!surveyRow) throw new Error("Không tìm thấy bảng hỏi.");
  
  const sData = surveyRow.rowValues;
  const fileId = sData[3];
  
  try {
    const surveySS = SpreadsheetApp.openById(fileId);
    const qSheet = surveySS.getSheetByName("CauHoi_Schema");
    const qData = qSheet.getDataRange().getValues();
    
    const blocks = [];
    for (let i = 1; i < qData.length; i++) {
      const r = qData[i];
      blocks.push({
        id: r[0], code: r[1], title: r[2], type: r[3],
        required: r[4] == 1, weight: r[5], scoreGroupCode: r[6],
        reverseScore: r[7] == 1, options: JSON.parse(r[8] || '[]')
      });
    }
    
    const fullMeta = JSON.parse(sData[7] || '{}');
    
    return {
      success: true,
      data: {
        id: sData[0], code: sData[1], name: sData[2], fileId: sData[3],
        status: sData[4], category: sData[5], 
        description: fullMeta.description || "",
        type: fullMeta.type || "assessment",
        collectionStatus: fullMeta.collectionStatus || 'closed',
        settings: fullMeta.settings || {},
        branding: fullMeta.branding || {},
        scoreGroups: fullMeta.scoreGroups || [],
        blocks
      }
    };
  } catch (e) {
    throw new Error("Lỗi khi mở file thang đo: " + e.toString());
  }
}

function getOrCreateSurveyFile(id, code, title) {
  const props = PropertiesService.getScriptProperties();
  const parentFolderId = props.getProperty('ROOT_FOLDER_ID');
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const subFolders = parentFolder.getFoldersByName(APP_CONFIG.SURVEYS_FOLDER_NAME);
  const surveyFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(APP_CONFIG.SURVEYS_FOLDER_NAME);
  
  const fileNamePattern = `[${id}]`;
  const files = surveyFolder.searchFiles(`title contains '${fileNamePattern}' and trashed = false`);
  if (files.hasNext()) return files.next().getId();
  
  const fileName = `SURVEY_${title.replace(/[^a-zA-Z0-9]/g, '_')}_[${id}]`;
  const newSS = SpreadsheetApp.create(fileName);
  DriveApp.getFileById(newSS.getId()).moveTo(surveyFolder);
  return newSS.getId();
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function deleteSurvey(id) {
  const ss = getORCreateMasterSS();
  clearRowsByValue(ss.getSheetByName(APP_CONFIG.SHEETS.SURVEYS), 0, id);
  clearRowsByValue(ss.getSheetByName(APP_CONFIG.SHEETS.QUESTIONS), 1, id);
  return { success: true, message: "Đã xóa bảng hỏi." };
}

function publishSurvey(payload) {
  const { id, publicUrl } = payload;
  const ss = getORCreateMasterSS();
  const pubSheet = ss.getSheetByName(APP_CONFIG.SHEETS.PUBLISH_LINKS);
  
  const rowValues = [id, publicUrl, "", "", `<iframe src="${publicUrl}" width="100%" height="600"></iframe>`, new Date()];
  const existing = findRowByValue(pubSheet, 0, id);
  
  if (existing) pubSheet.getRange(existing.rowNum, 1, 1, rowValues.length).setValues([rowValues]);
  else pubSheet.appendRow(rowValues);
  
  // Update survey status to published
  const sSheet = ss.getSheetByName(APP_CONFIG.SHEETS.SURVEYS);
  const survey = findRowByValue(sSheet, 0, id);
  if (survey) {
    sSheet.getRange(survey.rowNum, 5).setValue('published');
  }
  
  return { success: true, links: { publicUrl, embed: rowValues[4] } };
}

// ==========================================
// SCORING & RESPONSES
// ==========================================

function handleSubmitResponse(payload) {
  const { surveyId, surveyCode, submission } = payload;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // Prevent concurrent overwrite
  
  try {
    const ss = getORCreateMasterSS();
    const sSheet = ss.getSheetByName(APP_CONFIG.SHEETS.SURVEYS);
    let surveyRow = null;
    
    if (surveyId) surveyRow = findRowByValue(sSheet, 0, surveyId);
    if (!surveyRow && surveyCode) surveyRow = findRowByValue(sSheet, 1, surveyCode);
    
    if (!surveyRow) throw new Error("Bảng hỏi không tồn tại.");
    
    const fullMeta = JSON.parse(surveyRow.rowValues[7] || '{}');
    if (fullMeta.collectionStatus === 'closed') {
      throw new Error("Bảng hỏi này đã đóng thu thập.");
    }
  
    const surveyFileId = surveyRow.rowValues[3];
    const surveySS = SpreadsheetApp.openById(surveyFileId);
    const wideSheet = getOrCreateSheet(surveySS, "KetQua_TongHop");
    
    if (wideSheet.getLastRow() === 0) {
      throw new Error("Lỗi cấu trúc dữ liệu. Bảng hỏi chưa được xuất bản đúng mô hình.");
    }
  
    const headers = wideSheet.getRange(1, 1, 1, Math.max(1, wideSheet.getLastColumn())).getValues()[0];
    const wideRow = new Array(headers.length).fill("");
    
    for (let idx = 0; idx < headers.length; idx++) {
      const header = headers[idx];
      switch (header) {
        case "ResponseID": wideRow[idx] = submission.submission_id || "RES_"+Utilities.getUuid().substring(0,8); break;
        case "Timestamp": wideRow[idx] = submission.timestamp ? new Date(submission.timestamp) : new Date(); break;
        case "Name": wideRow[idx] = submission.user_name || ""; break;
        case "Email": wideRow[idx] = submission.user_email || ""; break;
        case "Phone": wideRow[idx] = submission.user_phone || ""; break;
        case "Org": wideRow[idx] = submission.user_org || ""; break;
        case "TotalScore": wideRow[idx] = submission.total_score || 0; break;
        case "Interpretation": wideRow[idx] = submission.result_interpretation || ""; break;
        case "GroupScores": wideRow[idx] = JSON.stringify(submission.group_scores || {}); break;
        default:
          if (submission.responses && submission.responses.hasOwnProperty(header)) {
            const val = submission.responses[header];
            wideRow[idx] = Array.isArray(val) ? val.join(", ") : val;
          }
      }
    }

    wideSheet.appendRow(wideRow);
    
    // Log to Master RESPONSES Registry
    const logSheet = ss.getSheetByName(APP_CONFIG.SHEETS.RESPONSES);
    logSheet.appendRow([
      submission.submission_id || "RES_"+Utilities.getUuid().substring(0,8), 
      surveyId || surveyCode, 
      submission.user_name || 'Anonymous',
      submission.user_email || '', 
      submission.user_phone || '',
      submission.total_score || 0,
      submission.result_interpretation || "Complete",
      JSON.stringify(submission.group_scores || {}),
      'active',
      new Date()
    ]);
    
    // Send Email if configured
    if (fullMeta.settings && fullMeta.settings.sendEmail && submission.user_email) {
      sendResultEmail(submission.user_email, surveyRow.rowValues[2] || "Bảng hỏi", submission.total_score || 0, submission.group_scores || {});
    }

    return { 
      success: true, 
      message: "Ghi nhận phản hồi thành công.", 
      data: { submissionId: submission.submission_id } 
    };
  } finally {
    lock.releaseLock();
  }
}

function getResponses(payload) {
  const { surveyId } = payload;
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.RESPONSES);
  const data = sheet.getDataRange().getValues();
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    if (surveyId && data[i][1] !== surveyId) continue;
    
    // Safety check for old schema where column 7 was CreatedAt
    let groups = {};
    let status = 'active';
    let createdAt = data[i][9];
    
    try {
      if (typeof data[i][7] === 'string' && data[i][7].startsWith('{')) {
         groups = JSON.parse(data[i][7]);
         status = data[i][8];
      } else {
         createdAt = data[i][7]; // Fallback for old schema
      }
    } catch (e) {}

    records.push({
      id: data[i][0], surveyId: data[i][1], name: data[i][2], email: data[i][3],
      phone: data[i][4], score: data[i][5], interpretation: data[i][6], 
      groupScores: groups, status: status, createdAt: createdAt
    });
  }
  return { success: true, data: records.reverse() };
}

// ==========================================
// UTILS & HELPERS
// ==========================================

function saveSettings(payload) {
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  
  const entries = Object.entries(payload);
  for (let idx = 0; idx < entries.length; idx++) {
    const [key, value] = entries[idx];
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(stringValue);
        sheet.getRange(i + 1, 4).setValue(new Date());
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, stringValue, "", new Date()]);
    }
  }
  return { success: true };
}

function createWorkspace(payload) {
  // For now, initialization is enough as it creates the master SS
  const ss = getORCreateMasterSS();
  return { success: true, message: "Workspace ready", url: ss.getUrl() };
}

function handleFileUpload(payload) {
  const { fileName, fileType, base64Data } = payload;
  const props = PropertiesService.getScriptProperties();
  const rootId = props.getProperty('ROOT_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootId);

  // Get or create assets folder
  const assetsFolders = rootFolder.getFoldersByName(APP_CONFIG.ASSETS_FOLDER_NAME);
  const assetsFolder = assetsFolders.hasNext() ? assetsFolders.next() : rootFolder.createFolder(APP_CONFIG.ASSETS_FOLDER_NAME);

  const decoded = Utilities.base64Decode(base64Data.split(',')[1] || base64Data);
  const blob = Utilities.newBlob(decoded, fileType, fileName);
  const file = assetsFolder.createFile(blob);

  // Set sharing for public view
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    success: true,
    fileId: file.getId(),
    url: `https://lh3.googleusercontent.com/u/0/d/${file.getId()}` 
  };
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function findRowByValue(sheet, col, val) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) if (data[i][col] == val) return { rowNum: i + 1, rowValues: data[i] };
  return null;
}

function clearRowsByValue(sheet, col, val) {
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) if (data[i][col] == val) sheet.deleteRow(i + 1);
}

function sendResultEmail(email, title, score, groups) {
  try {
    let gHtml = Object.entries(groups).map(([k, v]) => `<li><b>${k}:</b> ${v}</li>`).join("");
    MailApp.sendEmail({
      to: email, 
      subject: `Kết quả: ${title}`,
      htmlBody: `<div style="font-family:sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
        <h2 style="color:#4f46e5;">Báo cáo kết quả</h2>
        <p>Tổng điểm: <b>${score}</b></p>
        ${gHtml ? `<ul>${gHtml}</ul>` : ""}
        <p>Trân trọng,<br/>Đội ngũ PROPSY</p>
      </div>`
    });
  } catch(e) {}
}

function initializeSystem() {
  const ss = getORCreateMasterSS();
  return { success: true, message: "Hệ thống ProPsy đã sẵn sàng.", url: ss.getUrl() };
}

function getSystemConfig() {
  return { success: true, version: APP_CONFIG.VERSION, sheets: APP_CONFIG.SHEETS };
}

function getSettings() {
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    const [key, value] = data[i];
    if (key) {
      try {
        // Try to parse if it's JSON (for theme, socialLinks, etc.)
        settings[key] = JSON.parse(value);
      } catch (e) {
        settings[key] = value;
      }
    }
  }
  return { success: true, data: settings };
}

function recoverPassword(email) {
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.ACCOUNTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      const tempPass = Math.random().toString(36).substring(2, 10);
      sheet.getRange(i + 1, 5).setValue(tempPass);
      
      try {
        MailApp.sendEmail({
          to: email,
          subject: "[ProPsy] Khôi phục mật khẩu",
          htmlBody: `<h3>Mật khẩu mới của bạn: ${tempPass}</h3><p>Vui lòng đổi lại mật khẩu sau khi đăng nhập.</p>`
        });
        return { success: true, message: "Mật khẩu mới đã được gửi." };
      } catch (e) {
        return { success: false, message: "Lỗi gửi mail: " + e.toString() };
      }
    }
  }
  return { success: false, message: "Email không tồn tại." };
}

function updatePassword(payload) {
  const { email, oldPassword, newPassword } = payload;
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.ACCOUNTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email && data[i][4] === oldPassword) {
      sheet.getRange(i + 1, 5).setValue(newPassword);
      return { success: true, message: "Đổi mật khẩu thành công." };
    }
  }
  return { success: false, message: "Mật khẩu cũ không đúng." };
}

function getSurveys(payload) {
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.SURVEYS);
  const data = sheet.getDataRange().getValues();
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (payload?.status && row[4] !== payload.status) continue;
    
    const fullMeta = JSON.parse(row[7] || '{}');
    records.push({
      id: row[0], 
      code: row[1], 
      name: row[2], 
      fileId: row[3],
      status: row[4], 
      category: row[5], 
      thumbnail: row[6],
      description: fullMeta.description || "",
      type: fullMeta.type || "assessment",
      collectionStatus: fullMeta.collectionStatus || 'closed',
      settings: fullMeta.settings || {},
      branding: fullMeta.branding || {},
      scoreGroups: fullMeta.scoreGroups || [],
      blocks: fullMeta.blocks || [], // Return blocks for UI
      createdAt: row[8],
      updatedAt: row[9]
    });
  }
  return { success: true, data: records };
}

function getFullResponses(surveyId) {
  try {
    const surveyDetail = getSurveyDetail(surveyId);
    if (!surveyDetail.success) throw new Error("Survey not found");
    
    const survey = surveyDetail.data;
    const surveySS = SpreadsheetApp.openById(survey.fileId);
    
    const respSheet = surveySS.getSheetByName("KetQua_TongHop");
    const qSheet = surveySS.getSheetByName("CauHoi_Schema");
    
    const responses = respSheet.getDataRange().getValues();
    const questions = qSheet.getDataRange().getValues();
    
    // Convert to a format compatible with the frontend reporter
    return { 
      success: true, 
      data: { 
        responses: responses, // Data in wide format (SPSS ready)
        questions: questions,
        surveyInfo: survey
      } 
    };
  } catch (e) {
    return { success: false, message: "Lỗi trích xuất dữ liệu: " + e.toString() };
  }
}
