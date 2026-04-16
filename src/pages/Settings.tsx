
import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  Save, 
  Globe, 
  Palette, 
  Link as LinkIcon, 
  Mail, 
  Lock,
  Loader2,
  CheckCircle2,
  Database,
  Bot,
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { gasService } from '../services/gasService';


const Settings: React.FC = () => {
  const settings = useSettingsStore();
  const [formData, setFormData] = useState({
    organizationName: settings.organizationName,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor,
    gasUrl: settings.gasUrl,
    language: settings.language,
    aiProvider: settings.aiProvider,
    isBotEnabled: settings.isBotEnabled
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Persist to GAS backend
      const response = await gasService.updateSystemSettings(formData);
      
      if (response.success) {
        settings.updateSettings(formData);
        setMessage({ type: 'success', text: 'Cấu hình hệ thống đã được lưu và đồng bộ thành công.' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Lỗi khi đồng bộ cấu hình với máy chủ.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Đã có lỗi xảy ra khi kết nối với máy chủ.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Branding Section */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Globe size={20} className="text-primary" />
          Branding & Identity
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Organization Name</label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Psych-Ed Research Lab"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Logo URL</label>
              <input
                type="text"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          
          <div className="bg-bg-main p-6 rounded-xl border border-border-main flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-xl border border-border-main flex items-center justify-center mb-3 shadow-sm overflow-hidden">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-primary font-bold text-2xl">P</div>
              )}
            </div>
            <p className="text-xs font-bold text-text-main">{formData.organizationName || 'PsychAdmin'}</p>
            <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">Live Preview</p>
          </div>
        </div>
      </div>

      {/* AI Chatbot Section */}
      <div className="card-panel">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            AI Chatbot Configuration
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Enable Bot</span>
            <button
              onClick={() => setFormData({ ...formData, isBotEnabled: !formData.isBotEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                formData.isBotEnabled ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isBotEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">AI Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormData({ ...formData, aiProvider: 'gemini' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    formData.aiProvider === 'gemini' 
                      ? 'border-primary bg-primary/5 text-primary font-bold' 
                      : 'border-border-main text-text-muted hover:bg-bg-main'
                  }`}
                >
                  <Sparkles size={16} />
                  Gemini AI
                </button>
                <button
                  onClick={() => setFormData({ ...formData, aiProvider: 'openai' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    formData.aiProvider === 'openai' 
                      ? 'border-primary bg-primary/5 text-primary font-bold' 
                      : 'border-border-main text-text-muted hover:bg-bg-main'
                  }`}
                >
                  <MessageSquare size={16} />
                  OpenAI GPT
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                <Lock size={12} />
                Security Note
              </h4>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                API Keys are managed securely on the Google Apps Script backend. Ensure you have configured the corresponding key in your Script Properties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GAS Configuration Section */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Database size={20} className="text-primary" />
          GAS Bridge Configuration
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Google Apps Script Web App URL</label>
            <input
              type="text"
              value={formData.gasUrl}
              onChange={(e) => setFormData({ ...formData, gasUrl: e.target.value })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            <p className="mt-2 text-[11px] text-text-muted italic">
              * Required for authentication, schema syncing, and data storage.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">System Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Primary Theme Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-9 w-12 p-1 border border-border-main rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-border-main rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        {message.text && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-100' 
              : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary ml-auto px-8"
        >
          {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save System Configuration'}
        </button>
      </div>
    </div>
  );
};


export default Settings;
