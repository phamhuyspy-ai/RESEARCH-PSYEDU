
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
  AlertCircle,
  Building,
  Phone,
  MapPin,
  Users,
  Code,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { gasService } from '../services/gasService';


const Settings: React.FC = () => {
  const settings = useSettingsStore();
  const [formData, setFormData] = useState({
    appName: settings.appName,
    orgName: settings.orgName,
    address: settings.address,
    contactEmail: settings.contactEmail,
    notifyEmail: settings.notifyEmail,
    phone: settings.phone,
    logoUrl: settings.logoUrl,
    socialLinks: { ...settings.socialLinks },
    theme: { ...settings.theme },
    aiConfig: { ...settings.aiConfig },
    publicRuntime: { ...settings.publicRuntime },
    cta: { ...settings.cta },
    users: [...settings.users],
    language: settings.language,
    gasUrl: settings.gasUrl,
    sheetUrl: settings.sheetUrl || 'https://docs.google.com/spreadsheets'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newUser, setNewUser] = useState<{ name: string, email: string, password: string, role: 'manager' | 'super_admin', workspaceType: 'shared' | 'private' }>({ name: '', email: '', password: '', role: 'manager', workspaceType: 'shared' });
  const [editingUser, setEditingUser] = useState<{ id: string, name: string, email: string, password?: string, role: 'manager' | 'super_admin', workspaceType: 'shared' | 'private' } | null>(null);

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

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin người dùng mới.' });
      return;
    }

    if (newUser.workspaceType === 'private') {
      try {
        const response = await import('../services/gasService').then(m => m.gasService.createWorkspace(newUser.email));
        if (!response.success) {
          setMessage({ type: 'error', text: 'Lỗi khi tạo không gian lưu trữ: ' + response.message });
          return;
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Lỗi kết nối khi tạo không gian lưu trữ.' });
        return;
      }
    }

    setFormData({
      ...formData,
      users: [...formData.users, { 
        id: Date.now().toString(), 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role, 
        password: newUser.password,
        workspaceType: newUser.workspaceType
      }]
    });
    setNewUser({ name: '', email: '', password: '', role: 'manager', workspaceType: 'shared' });
    setMessage({ type: 'success', text: 'Đã thêm người dùng thành công.' });
  };

  const handleUpdateUser = () => {
    if (!editingUser || !editingUser.name || !editingUser.email) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }

    setFormData({
      ...formData,
      users: formData.users.map(u => 
        u.id === editingUser.id 
          ? { 
              ...u, 
              name: editingUser.name, 
              email: editingUser.email, 
              role: editingUser.role, 
              workspaceType: editingUser.workspaceType,
              ...(editingUser.password ? { password: editingUser.password } : {})
            } 
          : u
      )
    });
    setEditingUser(null);
    setMessage({ type: 'success', text: 'Đã cập nhật thông tin người dùng.' });
  };

  const handleRemoveUser = (id: string) => {
    setFormData({
      ...formData,
      users: formData.users.filter(u => u.id !== id)
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Kích thước file quá lớn (tối đa 2MB).' });
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        const response = await gasService.uploadFile({
          fileName: file.name,
          fileType: file.type,
          base64Data: base64Data
        });

        if (response.success) {
          setFormData({ ...formData, logoUrl: response.url });
          setMessage({ type: 'success', text: 'Tải logo lên thành công.' });
        } else {
          setMessage({ type: 'error', text: response.message || 'Lỗi khi tải logo lên.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Lỗi kết nối khi tải logo.' });
      } finally {
        setIsUploadingLogo(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const embedCode = `<!-- PSYEDU RESEARCH PORTAL EMBED -->
<div style="width:100%; overflow:hidden;">
  <iframe src="${window.location.origin}/?embed=true" width="100%" height="800px" frameborder="0" style="border:none;"></iframe>
</div>`;

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* 1. App Info Section */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Building size={20} className="text-primary" />
          1. Thông tin ứng dụng
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Tên ứng dụng</label>
            <input
              type="text"
              value={formData.appName}
              onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Tên cơ quan/đơn vị</label>
            <input
              type="text"
              value={formData.orgName}
              onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Địa chỉ</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full pl-10 px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Email liên hệ</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full pl-10 px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Email gửi thông báo (Mặc định)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="email"
                value={formData.notifyEmail}
                onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
                className="w-full pl-10 px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Social Links Section */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <LinkIcon size={20} className="text-primary" />
          2. Mạng xã hội & Liên kết
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Website</label>
            <input
              type="url"
              value={formData.socialLinks.website}
              onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Facebook</label>
            <input
              type="url"
              value={formData.socialLinks.facebook}
              onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">YouTube</label>
            <input
              type="url"
              value={formData.socialLinks.youtube}
              onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">TikTok</label>
            <input
              type="url"
              value={formData.socialLinks.tiktok}
              onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, tiktok: e.target.value } })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Branding Section */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Palette size={20} className="text-primary" />
          3. Thương hiệu & Giao diện
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Logo Ứng dụng</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="https://example.com/logo.png"
                />
                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all ${isUploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploadingLogo ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  Tải ảnh
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            <div className="bg-bg-main p-4 rounded-xl border border-border-main flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl border border-border-main flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-primary font-bold text-2xl">P</div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-text-main">Logo Preview</p>
                <p className="text-[10px] text-text-muted mt-1">Khuyên dùng ảnh PNG nền trong suốt, tỉ lệ 1:1 hoặc 3:1.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Phông chữ ứng dụng</label>
              <select
                value={formData.theme.fontFamily}
                onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, fontFamily: e.target.value } })}
                className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="Inter, sans-serif">Inter (Mặc định)</option>
                <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro</option>
              </select>
            </div>

            <div className="bg-bg-main p-6 rounded-2xl border border-border-main space-y-6">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Palette size={18} className="text-primary" />
                Màu sắc giao diện
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-main">Màu chính (Primary)</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Dùng cho nút bấm, viền active, các yếu tố quan trọng.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted">{formData.theme.primaryColor}</span>
                    <input
                      type="color"
                      value={formData.theme.primaryColor}
                      onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: e.target.value, linkColor: e.target.value } })}
                      className="h-10 w-10 p-1 border border-border-main rounded-lg cursor-pointer bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-main">Màu phụ (Secondary)</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Dùng cho các điểm nhấn nhẹ, highlight, hoặc nút phụ.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted">{formData.theme.secondaryColor}</span>
                    <input
                      type="color"
                      value={formData.theme.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, secondaryColor: e.target.value } })}
                      className="h-10 w-10 p-1 border border-border-main rounded-lg cursor-pointer bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-main">Màu nền (Background)</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Màu nền tổng thể của khu vực nội dung bảng hỏi.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted">{formData.theme.backgroundColor}</span>
                    <input
                      type="color"
                      value={formData.theme.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, backgroundColor: e.target.value } })}
                      className="h-10 w-10 p-1 border border-border-main rounded-lg cursor-pointer bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI Chatbot Section */}
      <div className="card-panel">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            4. Cấu hình AI Chatbot
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Kích hoạt Bot</span>
            <button
              onClick={() => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, enabled: !formData.aiConfig.enabled } })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                formData.aiConfig.enabled ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.aiConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {formData.aiConfig.enabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">AI Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, provider: 'gemini' } })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      formData.aiConfig.provider === 'gemini' 
                        ? 'border-primary bg-primary/5 text-primary font-bold' 
                        : 'border-border-main text-text-muted hover:bg-bg-main'
                    }`}
                  >
                    <Sparkles size={16} />
                    Gemini AI
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, provider: 'openai' } })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      formData.aiConfig.provider === 'openai' 
                        ? 'border-primary bg-primary/5 text-primary font-bold' 
                        : 'border-border-main text-text-muted hover:bg-bg-main'
                    }`}
                  >
                    <MessageSquare size={16} />
                    OpenAI GPT
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">API Key</label>
                <input
                  type="password"
                  value={formData.aiConfig.apiKey}
                  onChange={(e) => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, apiKey: e.target.value } })}
                  className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Nhập API Key của bạn..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Mô hình (Model)</label>
              <select
                value={formData.aiConfig.model}
                onChange={(e) => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, model: e.target.value } })}
                className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                {formData.aiConfig.provider === 'gemini' ? (
                  <>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tối ưu Token/Tốc độ - Khuyên dùng)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Thông minh hơn - Tốn Token)</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4o-mini">GPT-4o Mini (Tối ưu Token/Tốc độ - Khuyên dùng)</option>
                    <option value="gpt-4o">GPT-4o (Thông minh hơn - Tốn Token)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Hướng dẫn đào tạo (System Prompt)</label>
              <textarea
                value={formData.aiConfig.systemPrompt || ''}
                onChange={(e) => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, systemPrompt: e.target.value } })}
                className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                rows={4}
                placeholder="Nhập hướng dẫn cho chatbot (ví dụ: Bạn là chuyên gia tâm lý...)"
              />
              <p className="text-xs text-text-muted mt-1">Hướng dẫn này sẽ định hình cách chatbot trả lời người dùng.</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Public Runtime Section */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Globe size={20} className="text-primary" />
          5. Public Runtime (Mặc định khi thu thập)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 border border-border-main rounded-lg cursor-pointer hover:bg-bg-main transition-colors">
            <input
              type="checkbox"
              checked={formData.publicRuntime.showResults}
              onChange={(e) => setFormData({ ...formData, publicRuntime: { ...formData.publicRuntime, showResults: e.target.checked } })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-main">Hiển thị kết quả sau khi nộp</span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-border-main rounded-lg cursor-pointer hover:bg-bg-main transition-colors">
            <input
              type="checkbox"
              checked={formData.publicRuntime.sendEmail}
              onChange={(e) => setFormData({ ...formData, publicRuntime: { ...formData.publicRuntime, sendEmail: e.target.checked } })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-main">Gửi email kết quả cho người dùng</span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-border-main rounded-lg cursor-pointer hover:bg-bg-main transition-colors">
            <input
              type="checkbox"
              checked={formData.publicRuntime.requirePersonalInfo}
              onChange={(e) => setFormData({ ...formData, publicRuntime: { ...formData.publicRuntime, requirePersonalInfo: e.target.checked } })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-main">Bắt buộc nhập thông tin cá nhân</span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-border-main rounded-lg cursor-pointer hover:bg-bg-main transition-colors">
            <input
              type="checkbox"
              checked={formData.publicRuntime.requireConsent}
              onChange={(e) => setFormData({ ...formData, publicRuntime: { ...formData.publicRuntime, requireConsent: e.target.checked } })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-main">Bắt buộc đồng ý điều khoản (Consent)</span>
          </label>
        </div>
      </div>

      {/* 6. CTA Settings */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <LinkIcon size={20} className="text-primary" />
          6. CTA Settings (Nút kêu gọi hành động)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Loại CTA mặc định</label>
            <select
              value={formData.cta.type}
              onChange={(e) => setFormData({ ...formData, cta: { ...formData.cta, type: e.target.value } })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              <option value="booking">Đặt lịch (Booking)</option>
              <option value="contact">Liên hệ tư vấn</option>
              <option value="course">Khóa học</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Nhãn CTA mặc định</label>
            <input
              type="text"
              value={formData.cta.label}
              onChange={(e) => setFormData({ ...formData, cta: { ...formData.cta, label: e.target.value } })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">URL Đích</label>
          <input
            type="url"
            value={formData.cta.url}
            onChange={(e) => setFormData({ ...formData, cta: { ...formData.cta, url: e.target.value } })}
            className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cta.showInResults}
              onChange={(e) => setFormData({ ...formData, cta: { ...formData.cta, showInResults: e.target.checked } })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-text-main">Hiển thị ở trang kết quả</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cta.showInPdf}
              onChange={(e) => setFormData({ ...formData, cta: { ...formData.cta, showInPdf: e.target.checked } })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-text-main">Hiển thị trong file PDF</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cta.showInEmail}
              onChange={(e) => setFormData({ ...formData, cta: { ...formData.cta, showInEmail: e.target.checked } })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-text-main">Hiển thị trong Email</span>
          </label>
        </div>
      </div>

      {/* 7. User Management */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          7. Quản lý người dùng
        </h2>
        
        <div className="bg-bg-main p-4 rounded-xl border border-border-main mb-6">
          <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
            <Plus size={16} /> Thêm người quản lý mới
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              placeholder="Họ tên"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'manager' | 'super_admin' })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              <option value="manager">Quản lý</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select
              value={newUser.workspaceType}
              onChange={(e) => setNewUser({ ...newUser, workspaceType: e.target.value as 'shared' | 'private' })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              <option value="shared">Dùng chung không gian</option>
              <option value="private">Tạo không gian mới</option>
            </select>
          </div>
          <button onClick={handleAddUser} className="btn-primary py-2 px-4 text-sm">
            Thêm người quản lý
          </button>
        </div>

        <div className="border border-border-main rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-main text-text-muted text-xs uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Không gian</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {formData.users.map((user) => (
                <tr key={user.id} className="hover:bg-bg-main/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-text-main">{user.name}</p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      {user.role === 'super_admin' ? <Lock size={10} /> : null}
                      {user.role === 'super_admin' ? 'Super Admin' : 'Quản lý'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                      {user.workspaceType === 'private' ? 'Không gian riêng' : 'Dùng chung'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== 'super_admin' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingUser({ id: user.id!, name: user.name, email: user.email, role: user.role, workspaceType: user.workspaceType || 'shared' })}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleRemoveUser(user.id!)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Embed Code */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Code size={20} className="text-primary" />
          8. Nhúng Website (Embed)
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Sử dụng mã dưới đây để nhúng danh sách bảng hỏi hoặc một bảng hỏi cụ thể lên website của bạn (Vercel, WordPress, v.v.).
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Mã nhúng Cổng thông tin (Danh sách bảng hỏi)</label>
            <textarea
              readOnly
              value={embedCode}
              className="w-full h-24 px-3 py-2 border border-border-main rounded-lg text-xs font-mono bg-bg-main focus:outline-none text-text-muted"
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 mb-2">Hướng dẫn nhúng WordPress</h4>
            <ol className="list-decimal list-inside text-xs text-blue-700 space-y-1">
              <li>Trong trình soạn thảo WordPress, thêm khối <strong>Custom HTML</strong>.</li>
              <li>Dán đoạn mã iframe ở trên vào khối đó.</li>
              <li>Điều chỉnh <code>height="800px"</code> để phù hợp với giao diện của bạn.</li>
              <li>Lưu và xem trước trang.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 9. GAS Configuration Section */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Database size={20} className="text-primary" />
          9. GAS Bridge Configuration
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

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Google Sheet URL</label>
            <input
              type="text"
              value={formData.sheetUrl}
              onChange={(e) => setFormData({ ...formData, sheetUrl: e.target.value })}
              className="w-full px-3 py-2 border border-border-main rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <p className="mt-2 text-[11px] text-text-muted italic">
              * Link để xem nhanh dữ liệu tại danh sách khảo sát.
            </p>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-border-main p-4 flex items-center justify-between z-10">
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
          className="btn-primary ml-auto px-8 py-2.5 shadow-sm"
        >
          {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Lưu cấu hình hệ thống'}
        </button>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border-main flex justify-between items-center">
              <h3 className="text-lg font-bold">Chỉnh sửa người dùng</h3>
              <button onClick={() => setEditingUser(null)} className="text-text-muted hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Họ tên</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Mật khẩu mới (để trống nếu không đổi)</label>
                <input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Vai trò</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'manager' | 'super_admin' })}
                    className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="manager">Quản lý</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Không gian</label>
                  <select
                    value={editingUser.workspaceType}
                    onChange={(e) => setEditingUser({ ...editingUser, workspaceType: e.target.value as 'shared' | 'private' })}
                    className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="shared">Dùng chung</option>
                    <option value="private">Không gian riêng</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border-main flex justify-end gap-3 bg-bg-main">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleUpdateUser}
                className="btn-primary px-6 py-2 text-sm"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Settings;

