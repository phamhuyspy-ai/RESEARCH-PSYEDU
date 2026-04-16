
/**
 * Google Apps Script Backend for Survey System
 * Deploy as Web App (Execute as: Me, Access: Anyone)
 */

const CONFIG = {
  ADMIN_EMAIL: "psyedu.research@gmail.com", // Default admin
  ADMIN_PASSWORD: "admin", // Default password (should be changed)
  ADMIN_PIN: "123456", // Default PIN
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

function getAdminWorkspace() {
  const props = PropertiesService.getScriptProperties();
  let adminWs = props.getProperty('admin_workspace_id');
  if (!adminWs) {
    const ss = SpreadsheetApp.create('PsyAdmin Master Workspace');
    adminWs = ss.getId();
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
    const ss = SpreadsheetApp.create('PsyAdmin Workspace - ' + email);
    const props = PropertiesService.getScriptProperties();
    props.setProperty('user_workspace_' + email, ss.getId());
    return { success: true, message: 'Workspace created successfully', workspaceId: ss.getId() };
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
    const ss = SpreadsheetApp.openById(workspaceId);
    let sheet = ss.getSheetByName(survey.code);
    
    if (!sheet) {
      sheet = ss.insertSheet(survey.code);
    }
    
    // Save survey to workspace mapping
    const props = PropertiesService.getScriptProperties();
    props.setProperty('survey_workspace_' + survey.code, workspaceId);
    
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
    
    const ss = SpreadsheetApp.openById(workspaceId);
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
    
    return { success: true, message: 'Data submitted successfully' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function sendEmailResult(email, result) {
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Kết quả khảo sát của bạn',
      htmlBody: `
        <h2>Cảm ơn bạn đã tham gia khảo sát</h2>
        <p>Kết quả của bạn: <strong>${result.total_score}</strong></p>
        <p>Nhận xét: ${result.result_interpretation}</p>
      `
    });
    return { success: true, message: 'Email sent successfully' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
