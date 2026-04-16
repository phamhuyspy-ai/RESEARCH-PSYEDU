
import { useSettingsStore } from '../stores/settingsStore';

interface GasResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  user?: any;
}

export const gasService = {
  async request<T = any>(action: string, payload: any = {}): Promise<GasResponse<T>> {
    const gasUrl = useSettingsStore.getState().gasUrl;
    
    if (!gasUrl) {
      return { success: false, message: 'GAS URL not configured' };
    }

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS often prefers this to avoid preflight
        },
        body: JSON.stringify({ action, ...payload }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('GAS Request Error (Full):', error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // "Failed to fetch" usually indicates a CORS error or network issue with GAS
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Lỗi kết nối (CORS). Vui lòng đảm bảo Google Apps Script đã được Deploy dưới dạng Web App với quyền truy cập "Anyone" (Bất kỳ ai).';
      }

      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  async login(email: string, password: string, pin: string) {
    return this.request('login_admin', { email, password, pin });
  },

  async syncSchema(survey: any) {
    return this.request('sync_schema', { survey });
  },

  async submitData(surveyCode: string, submission: any) {
    return this.request('submit_data', { surveyCode, submission });
  },

  async sendEmailResult(email: string, result: any) {
    return this.request('send_email_result', { email, result });
  },

  async updatePassword(oldPassword: string, newPassword: string) {
    return this.request('update_password', { oldPassword, newPassword });
  },

  async recoverPassword(email: string) {
    return this.request('recover_password', { email });
  },

  async updateSystemSettings(settings: any) {
    return this.request('update_system_settings', { settings });
  },

  async deleteSurvey(surveyId: string) {
    return this.request('delete_survey', { surveyId });
  }
};
