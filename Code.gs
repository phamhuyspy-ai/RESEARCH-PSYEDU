/**
 * PROPSY BACKEND - PSYCHOMETRIC & SPSS SYSTEM
 * Google Apps Script Backend (Production Ready)
 * 
 * Features:
 * - Automatic Folder and Spreadsheet Provisioning
 * - Centralized Schema Management
 * - Robust Scoring Engine (Reverse, Weight, Groups)
 * - SPSS Order Management
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
    const { action, payload } = request;
    
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
        
      // --- SPSS SERVICE ---
      case 'submit_spss_order':
        result = handleSPSSOrder(payload);
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
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('MASTER_SS_ID');
  
  if (!ssId) {
    const rootFolders = DriveApp.getFoldersByName(APP_CONFIG.ROOT_FOLDER_NAME);
    let rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(APP_CONFIG.ROOT_FOLDER_NAME);
    
    const files = rootFolder.getFilesByName(APP_CONFIG.MASTER_SHEET_NAME);
    let ss;
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
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
}

function initAllSheets(ss) {
  const schemas = {
    [APP_CONFIG.SHEETS.SETTINGS]: ["Key", "Value", "Description", "UpdatedAt"],
    [APP_CONFIG.SHEETS.ACCOUNTS]: ["UID", "Email", "Name", "Role", "PasswordHash", "PIN", "Status", "CreatedAt"],
    [APP_CONFIG.SHEETS.SURVEYS]: ["ID", "Code", "Title", "FileID", "Status", "Category", "Thumbnail", "SettingsJSON", "CreatedAt", "UpdatedAt"],
    [APP_CONFIG.SHEETS.RESPONSES]: ["ID", "SurveyID", "UserName", "UserEmail", "UserPhone", "TotalScore", "Interpretation", "CreatedAt"],
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
  
  const id = payload.id || "SRV_" + Utilities.getUuid().substring(0, 8);
  const code = payload.code || "C" + id.substring(4);
  const now = new Date();
  
  // 1. Manage Individual File
  const surveyFileId = getOrCreateSurveyFile(id, code, payload.title);
  const surveySS = SpreadsheetApp.openById(surveyFileId);
  
  // Update Questions in the individual file
  const qSheet = getOrCreateSheet(surveySS, "CauHoi_Schema");
  qSheet.clear();
  const qHeaders = ["ID", "Code", "Content", "Type", "Required", "Weight", "Group", "Reverse", "OptionsJSON"];
  qSheet.appendRow(qHeaders);
  qSheet.getRange(1, 1, 1, qHeaders.length).setFontWeight("bold").setBackground("#dcfce7");
  
  payload.questions.forEach((q, idx) => {
    qSheet.appendRow([
      q.id || "Q" + idx, q.code || "VAR" + idx, q.content, q.type,
      q.required ? 1 : 0, q.weight || 1, q.group || 'default', q.isReverse ? 1 : 0,
      JSON.stringify(q.options || [])
    ]);
  });

  // Prepare SPSS Response Sheet (Wide Format)
  const respSheet = getOrCreateSheet(surveySS, "KetQua_SPSS");
  if (respSheet.getLastRow() === 0) {
    const respHeaders = ["ResponseID", "Timestamp", "Name", "Email", "Phone", "TotalScore", ...payload.questions.map(q => q.code || q.id)];
    respSheet.appendRow(respHeaders);
    respSheet.getRange(1, 1, 1, respHeaders.length).setFontWeight("bold").setBackground("#fef9c3");
  }

  // 2. Update Master Registry
  const surveyData = findRowByValue(sSheet, 0, id);
  const row = [
    id, code, payload.title, surveyFileId,
    payload.status || 'draft', payload.category || 'general', 
    payload.thumbnail || '', JSON.stringify(payload.settings || {}),
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
    
    const questions = [];
    for (let i = 1; i < qData.length; i++) {
      const r = qData[i];
      questions.push({
        id: r[0], code: r[1], content: r[2], type: r[3],
        required: r[4] == 1, weight: r[5], group: r[6],
        isReverse: r[7] == 1, options: JSON.parse(r[8] || '[]')
      });
    }
    
    return {
      success: true,
      data: {
        id: sData[0], code: sData[1], title: sData[2], fileId: sData[3],
        status: sData[4], category: sData[5], settings: JSON.parse(sData[7] || '{}'),
        questions
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
  
  // Subfolder for Surveys
  const subFolders = parentFolder.getFoldersByName(APP_CONFIG.SURVEYS_FOLDER_NAME);
  const surveyFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(APP_CONFIG.SURVEYS_FOLDER_NAME);
  
  const fileName = `SURVEY_${code}_[${id}]`;
  const files = surveyFolder.getFilesByName(fileName);
  
  if (files.hasNext()) return files.next().getId();
  
  const newSS = SpreadsheetApp.create(fileName);
  const file = DriveApp.getFileById(newSS.getId());
  file.moveTo(surveyFolder);
  
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
  const { surveyId, userInfo, responses } = payload;
  const ss = getORCreateMasterSS();
  const surveyResult = getSurveyDetail(surveyId);
  if (!surveyResult.success) throw new Error("Bảng hỏi không tồn tại.");
  
  const survey = surveyResult.data;
  let totalScore = 0;
  const groupScores = {};
  const responseId = "RES_" + Utilities.getUuid().substring(0, 8);
  const timestamp = new Date();
  
  const surveySS = SpreadsheetApp.openById(survey.fileId);
  const wideSheet = surveySS.getSheetByName("KetQua_SPSS");
  const headers = wideSheet.getRange(1, 1, 1, wideSheet.getLastColumn()).getValues()[0];
  
  const wideRow = new Array(headers.length).fill("");
  wideRow[0] = responseId;
  wideRow[1] = timestamp;
  wideRow[2] = userInfo.name;
  wideRow[3] = userInfo.email;
  wideRow[4] = userInfo.phone;

  survey.questions.forEach(q => {
    const val = responses[q.id];
    let pts = 0;
    
    // Scoring logic
    if (q.type === 'single_choice' || q.type === 'likert' || q.type === 'scale') {
      const opt = q.options.find(o => o.value == val || o.label == val);
      if (opt) {
        pts = Number(opt.score || opt.points || 0);
        if (q.isReverse) {
          const allScores = q.options.map(o => Number(o.score || o.points || 0));
          pts = (Math.max(...allScores) + Math.min(...allScores)) - pts;
        }
        pts *= (q.weight || 1);
      }
    }
    
    totalScore += pts;
    if (q.group) groupScores[q.group] = (groupScores[q.group] || 0) + pts;
    
    // Fill Wide Row for SPSS
    const colIdx = headers.indexOf(q.code || q.id);
    if (colIdx !== -1) wideRow[colIdx] = val;
  });

  wideRow[5] = totalScore;
  wideSheet.appendRow(wideRow);

  // Central Registry Log
  ss.getSheetByName(APP_CONFIG.SHEETS.RESPONSES).appendRow([
    responseId, surveyId, userInfo.name, userInfo.email, userInfo.phone,
    totalScore, "Hoàn thành", timestamp
  ]);
  
  if (survey.settings.sendEmail && userInfo.email) sendResultEmail(userInfo.email, survey.title, totalScore, groupScores);
  
  return { success: true, data: { responseId, totalScore, groupScores } };
}

function getResponses(payload) {
  const { surveyId } = payload;
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.RESPONSES);
  const data = sheet.getDataRange().getValues();
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    if (surveyId && data[i][1] !== surveyId) continue;
    records.push({
      id: data[i][0], surveyId: data[i][1], name: data[i][2], email: data[i][3],
      phone: data[i][4], score: data[i][5], interpretation: data[i][6], 
      groupScores: JSON.parse(data[i][7] || '{}'), status: data[i][8], createdAt: data[i][9]
    });
  }
  return { success: true, data: records.reverse() };
}

// ==========================================
// SPSS & UTILS
// ==========================================

function handleSPSSOrder(payload) {
  const ss = getORCreateMasterSS();
  const id = "SPSS_" + Utilities.getUuid().substring(0, 6);
  ss.getSheetByName(APP_CONFIG.SHEETS.SPSS_ORDERS).appendRow([
    id, payload.name, payload.email, payload.phone, payload.serviceType,
    payload.requirements, payload.files?.length || 0, "pending", payload.totalPrice || 0, new Date()
  ]);
  return { success: true, orderId: id };
}

function saveSettings(payload) {
  const ss = getORCreateMasterSS();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  
  Object.entries(payload).forEach(([key, value]) => {
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
  });
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
    if (payload.status && row[4] !== payload.status) continue;
    records.push({
      id: row[0], code: row[1], title: row[2], fileId: row[3],
      status: row[4], category: row[5], updatedAt: row[9]
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
    
    const respSheet = surveySS.getSheetByName("KetQua_SPSS");
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
