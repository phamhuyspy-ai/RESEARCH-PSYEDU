
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

  async login(email: string, password?: string, pin?: string) {
    return this.request('admin_login', { email, password, pin });
  },

  async recoverPassword(email: string) {
    return this.request('recover_password', { email });
  },

  async updatePassword(payload: { email: string, oldPassword: string, newPassword: string }) {
    return this.request('update_password', payload);
  },

  async getSurveys(payload: any = {}) {
    return this.request('get_surveys', payload);
  },

  async getSurveyDetail(id: string) {
    return this.request('get_survey_detail', { id });
  },

  async saveSurvey(survey: any) {
    return this.request('save_survey', survey);
  },

  async deleteSurvey(id: string) {
    return this.request('delete_survey', { id });
  },

  async publishSurvey(id: string, publicUrl: string) {
    return this.request('publish_survey', { id, publicUrl });
  },

  async submitResponse(payload: any) {
    return this.request('submit_response', payload);
  },

  async getResponses(surveyId?: string) {
    return this.request('get_responses', { surveyId });
  },

  async getFullResponses(surveyId?: string) {
    return this.request('get_full_responses', { surveyId });
  },

  async submitSPSSOrder(order: any) {
    return this.request('submit_spss_order', order);
  },

  async updateSystemSettings(settings: any) {
    return this.request('save_settings', settings);
  },

  async createWorkspace(email: string) {
    return this.request('create_workspace', { email });
  },

  async uploadFile(fileData: { fileName: string, fileType: string, base64Data: string }) {
    return this.request('upload_file', fileData);
  },

  async initialize() {
    return this.request('initialize');
  }
};
