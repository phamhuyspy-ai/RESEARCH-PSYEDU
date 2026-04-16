
/**
 * Google Apps Script Backend for Survey System
 * Deploy as Web App (Execute as: Me, Access: Anyone)
 */

const CONFIG = {
  ADMIN_EMAIL: "psyedu.research@gmail.com", // Default admin
  ADMIN_PASSWORD: "admin", // Default password (should be changed)
  ADMIN_PIN: "123456", // Default PIN
  FOLDER_ID: "1S6j3NmGS5ZDktGNhVZEqtubGKlaXnLX3" // ID thư mục lưu trữ
};

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    let result;
    switch (action) {
      case 'login_admin':
        result = loginAdmin(requestData.email, requestData.password, requestData.pin);
        break;
      case 'create_workspace':
        result = createWorkspace(requestData.email);
        break;
      case 'sync_schema':
        result = syncSchema(requestData.survey, requestData.userEmail);
        break;
      case 'submit_data':
        result = submitData(requestData.surveyCode, requestData.submission);
        break;
      case 'save_db':
        result = saveDb(requestData.type, requestData.data);
        break;
      case 'get_db':
        result = getDb(requestData.type);
        break;
      case 'send_email_result':
        result = sendEmailResult(requestData.email, requestData.result);
        break;
      case 'update_password':
        result = updatePassword(requestData.oldPassword, requestData.newPassword);
        break;
      case 'recover_password':
        result = recoverPassword(requestData.email);
        break;
      default:
        result = { success: false, message: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function moveFileToFolder(fileId, folderId) {
  try {
    if (!folderId) return;
    const file = DriveApp.getFileById(fileId);
    const folder = DriveApp.getFolderById(folderId);
    file.moveTo(folder);
  } catch (e) {
    console.error("Could not move file to folder: " + e.toString());
  }
}

function getAdminWorkspace() {
  const props = PropertiesService.getScriptProperties();
  let adminWs = props.getProperty('admin_workspace_id');
  if (!adminWs) {
    const ss = SpreadsheetApp.create('PsyAdmin Master Workspace');
    adminWs = ss.getId();
    moveFileToFolder(adminWs, CONFIG.FOLDER_ID);
    props.setProperty('admin_workspace_id', adminWs);
  }
  return adminWs;
}

function getUserWorkspace(email) {
  if (!email) return getAdminWorkspace();
  const props = PropertiesService.getScriptProperties();
  const userWs = props.getProperty('user_workspace_' + email);
  return userWs ? userWs : getAdminWorkspace();
}

function createWorkspace(email) {
  try {
    const parentFolder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const newFolder = parentFolder.createFolder('PsyAdmin Workspace - ' + email);
    
    const ss = SpreadsheetApp.create('Data - ' + email);
    const file = DriveApp.getFileById(ss.getId());
    file.moveTo(newFolder);
    
    const props = PropertiesService.getScriptProperties();
    props.setProperty('user_workspace_' + email, ss.getId());
    return { success: true, message: 'Workspace created successfully', workspaceId: ss.getId(), folderId: newFolder.getId() };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function saveDb(type, data) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const fileName = type === 'surveys' ? 'psyadmin_surveys.json' : 'psyadmin_settings.json';
    const files = folder.getFilesByName(fileName);
    
    if (files.hasNext()) {
      const file = files.next();
      file.setContent(JSON.stringify(data));
    } else {
      folder.createFile(fileName, JSON.stringify(data), MimeType.PLAIN_TEXT);
    }
    return { success: true, message: 'Saved successfully' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function getDb(type) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const fileName = type === 'surveys' ? 'psyadmin_surveys.json' : 'psyadmin_settings.json';
    const files = folder.getFilesByName(fileName);
    
    if (files.hasNext()) {
      const file = files.next();
      const content = file.getBlob().getDataAsString();
      return { success: true, data: JSON.parse(content) };
    } else {
      return { success: true, data: type === 'surveys' ? [] : null };
    }
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function loginAdmin(email, password, pin) {
  // In a real app, you'd check a "Users" sheet
  if (email === CONFIG.ADMIN_EMAIL && password === CONFIG.ADMIN_PASSWORD && pin === CONFIG.ADMIN_PIN) {
    return {
      success: true,
      message: 'Login successful',
      user: {
        email: email,
        name: 'Administrator',
        role: 'super_admin'
      }
    };
  }
  return { success: false, message: 'Invalid credentials' };
}

function recoverPassword(email) {
  if (email === CONFIG.ADMIN_EMAIL) {
    return { success: true, message: 'Password recovery email sent' };
  }
  return { success: false, message: 'Email not found' };
}

function updatePassword(oldPassword, newPassword) {
  if (oldPassword === CONFIG.ADMIN_PASSWORD) {
    return { success: true, message: 'Password updated' };
  }
  return { success: false, message: 'Invalid old password' };
}

function syncSchema(survey, userEmail) {
  try {
    const workspaceId = getUserWorkspace(userEmail);
    if (!workspaceId) {
      return { success: false, message: 'Workspace ID not found' };
    }
    const ss = SpreadsheetApp.openById(workspaceId);
    if (!ss) {
      return { success: false, message: 'Could not open spreadsheet with ID: ' + workspaceId };
    }
    let sheet = ss.getSheetByName(survey.code);
    
    if (!sheet) {
      sheet = ss.insertSheet(survey.code);
    }
    
    // Save survey to workspace mapping
    const props = PropertiesService.getScriptProperties();
    props.setProperty('survey_workspace_' + survey.code, workspaceId);
    if (userEmail) {
      props.setProperty('survey_owner_' + survey.code, userEmail);
    }
    // Store settings for email logic
    props.setProperty('survey_settings_' + survey.code, JSON.stringify(survey.settings));
    
    // Create header row based on blocks
    const headers = [
      'submission_id', 
      'timestamp', 
      'user_name', 
      'user_email', 
      'user_phone', 
      'user_org'
    ];
    
    survey.blocks.forEach(block => {
      if (block.type !== 'content') {
        headers.push(block.id); // Use ID as column header for stability
      }
    });
    
    headers.push('total_score');
    headers.push('result_interpretation');
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    
    return { success: true, message: 'Schema synced successfully' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function submitData(surveyCode, submission) {
  try {
    const props = PropertiesService.getScriptProperties();
    let workspaceId = props.getProperty('survey_workspace_' + surveyCode);
    if (!workspaceId) {
      workspaceId = getAdminWorkspace();
    }
    if (!workspaceId) {
      return { success: false, message: 'Workspace ID not found' };
    }
    
    const ss = SpreadsheetApp.openById(workspaceId);
    if (!ss) {
      return { success: false, message: 'Could not open spreadsheet with ID: ' + workspaceId };
    }
    let sheet = ss.getSheetByName(surveyCode);
    
    if (!sheet) {
      return { success: false, message: 'Survey sheet not found' };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => {
      if (header === 'submission_id') return submission.submission_id;
      if (header === 'timestamp') return submission.timestamp;
      if (header === 'user_name') return submission.user_name;
      if (header === 'user_email') return submission.user_email;
      if (header === 'user_phone') return submission.user_phone;
      if (header === 'user_org') return submission.user_org;
      if (header === 'total_score') return submission.total_score;
      if (header === 'result_interpretation') return submission.result_interpretation;
      
      // Check if it's a block ID
      return submission.responses[header] || '';
    });
    
    sheet.appendRow(rowData);
    
    // Handle Automatic Email Notifications
    const settingsStr = props.getProperty('survey_settings_' + surveyCode);
    const ownerEmail = props.getProperty('survey_owner_' + surveyCode);
    
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      
      // 1. Send to respondent if enabled in survey settings
      if (settings.sendEmail && submission.user_email) {
        sendEmailResult(submission.user_email, submission);
      }
      
      // 2. Send notification to survey owner
      if (ownerEmail) {
        sendOwnerNotification(ownerEmail, surveyCode, submission);
      }
    }
    
    return { success: true, message: 'Data submitted successfully' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function sendEmailResult(email, submission) {
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Kết quả khảo sát của bạn',
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Cảm ơn bạn đã tham gia khảo sát</h2>
          <p>Chào <strong>${submission.user_name}</strong>,</p>
          <p>Hệ thống đã ghi nhận kết quả khảo sát của bạn vào lúc ${submission.timestamp}.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">Tổng điểm: <strong style="color: #4f46e5;">${submission.total_score}</strong></p>
            <p style="margin: 10px 0 0 0;"><strong>Nhận xét:</strong> ${submission.result_interpretation}</p>
          </div>
          <p>Trân trọng,<br>Đội ngũ PsyAdmin</p>
        </div>
      `
    });
    return { success: true, message: 'Email sent successfully' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function sendOwnerNotification(ownerEmail, surveyCode, submission) {
  try {
    MailApp.sendEmail({
      to: ownerEmail,
      subject: `[PsyAdmin] Có lượt phản hồi mới: ${surveyCode}`,
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Thông báo phản hồi mới</h2>
          <p>Hệ thống vừa ghi nhận một lượt tham gia khảo sát mới cho mã: <strong>${surveyCode}</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Người tham gia:</strong> ${submission.user_name}</li>
            <li><strong>Email:</strong> ${submission.user_email}</li>
            <li><strong>Tổng điểm:</strong> ${submission.total_score}</li>
          </ul>
          <p>Bạn có thể xem chi tiết trong Google Sheet của mình.</p>
          <p>Trân trọng,<br>Hệ thống PsyAdmin</p>
        </div>
      `
    });
  } catch (e) {
    console.error('Error sending owner notification: ' + e.toString());
  }
}
