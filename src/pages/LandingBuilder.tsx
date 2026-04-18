import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { Save, Plus, Trash2, ArrowLeft, Loader2, GripVertical, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gasService } from '../services/gasService';

const LandingBuilder: React.FC = () => {
  const settings = useSettingsStore();
  const [formData, setFormData] = useState(
    settings.landingPage || {
      hero: {
        badge: '',
        title: '',
        description: '',
        primaryButtonText: '',
        primaryButtonLink: '',
        secondaryButtonText: '',
        secondaryButtonLink: ''
      },
      nav: { links: [] },
      footer: { description: '', columns: [], copyright: '' }
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // Create full payload combining existing settings and updated landingPage
      const fullSettings = { ...settings, landingPage: formData };
      const response = await gasService.updateSystemSettings(fullSettings);
      
      if (response.success) {
        settings.updateSettings({ landingPage: formData });
        setMessage({ type: 'success', text: 'Cấu hình giao diện đã được lưu thành công!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Lỗi khi lưu cấu hình.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleHeroChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      hero: { ...formData.hero, [field]: value }
    });
  };

  const addNavLink = () => {
    setFormData({
      ...formData,
      nav: { links: [...formData.nav.links, { label: 'Link mới', url: '#' }] }
    });
  };

  const updateNavLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...formData.nav.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, nav: { links: newLinks } });
  };

  const removeNavLink = (index: number) => {
    const newLinks = [...formData.nav.links];
    newLinks.splice(index, 1);
    setFormData({ ...formData, nav: { links: newLinks } });
  };

  const addFooterColumn = () => {
    setFormData({
      ...formData,
      footer: {
        ...formData.footer,
        columns: [...formData.footer.columns, { title: 'Cột mới', links: [] }]
      }
    });
  };

  const removeFooterColumn = (index: number) => {
    const newCols = [...formData.footer.columns];
    newCols.splice(index, 1);
    setFormData({ ...formData, footer: { ...formData.footer, columns: newCols } });
  };

  const updateFooterColumnTitle = (index: number, title: string) => {
    const newCols = [...formData.footer.columns];
    newCols[index].title = title;
    setFormData({ ...formData, footer: { ...formData.footer, columns: newCols } });
  };

  const addFooterLink = (colIndex: number) => {
    const newCols = [...formData.footer.columns];
    newCols[colIndex].links.push({ label: 'Link mới', url: '#' });
    setFormData({ ...formData, footer: { ...formData.footer, columns: newCols } });
  };

  const updateFooterLink = (colIndex: number, linkIndex: number, field: 'label' | 'url', value: string) => {
    const newCols = [...formData.footer.columns];
    newCols[colIndex].links[linkIndex] = { ...newCols[colIndex].links[linkIndex], [field]: value };
    setFormData({ ...formData, footer: { ...formData.footer, columns: newCols } });
  };

  const removeFooterLink = (colIndex: number, linkIndex: number) => {
    const newCols = [...formData.footer.columns];
    newCols[colIndex].links.splice(linkIndex, 1);
    setFormData({ ...formData, footer: { ...formData.footer, columns: newCols } });
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">Cấu hình Cổng thông tin</h1>
            <p className="text-sm text-text-muted">Tùy chỉnh các khối nội dung hiển thị tại trang chủ công cộng.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Link to="/" target="_blank" className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-2">
             Xem trang chủ <ArrowLeft size={16} className="rotate-180" />
           </Link>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-2 border-green-100' : 'bg-red-50 text-red-700 border-2 border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Editor */}
        <div className="xl:col-span-8 space-y-6">
          {/* Nav Config */}
          <div className="bg-white rounded-[28px] border border-border-main p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-text-main">Thanh điều hướng</h2>
                <p className="text-xs text-text-muted mt-1">Quản lý các liên kết trên Menu chính của website.</p>
              </div>
              <button onClick={addNavLink} className="group flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-primary/20">
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                Thêm Menu Link
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.nav.links.length === 0 ? (
                <div className="text-center py-8 bg-bg-main/50 rounded-2xl border-2 border-dashed border-border-main text-text-muted text-xs font-medium">
                  Chưa có liên kết nào. Hãy thêm liên kết đầu tiên.
                </div>
              ) : (
                formData.nav.links.map((link, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-bg-main/30 p-4 rounded-2xl border border-border-main hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-8 h-8 rounded-lg bg-white border border-border-main flex items-center justify-center text-text-muted shrink-0 shadow-sm">
                        <GripVertical size={14} />
                      </div>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateNavLink(idx, 'label', e.target.value)}
                        placeholder="Tên hiển thị (VD: Giới thiệu)"
                        className="w-full sm:w-40 px-4 py-2 bg-white border border-border-main rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full flex-1">
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateNavLink(idx, 'url', e.target.value)}
                        placeholder="Link liên kết (VD: #about hoặc https://...)"
                        className="flex-1 px-4 py-2 bg-white border border-border-main rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-text-muted font-mono"
                      />
                      <button onClick={() => removeNavLink(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hero Config */}
          <div className="bg-white rounded-[28px] border border-border-main p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-text-main">Khối Giới thiệu (Hero)</h2>
              <p className="text-xs text-text-muted mt-1">Nội dung chính đập vào mắt người dùng khi vừa truy cập.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                    Nhãn nhỏ (Badge text)
                  </label>
                  <input
                    type="text"
                    value={formData.hero.badge}
                    onChange={(e) => handleHeroChange('badge', e.target.value)}
                    placeholder="VD: Hệ thống lượng giá 2024"
                    className="w-full px-4 py-3 bg-bg-main border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Tiêu đề chính (H1)</label>
                  <input
                    type="text"
                    value={formData.hero.title}
                    onChange={(e) => handleHeroChange('title', e.target.value)}
                    placeholder="Sử dụng <span class='text-primary'>để đổi màu</span>"
                    className="w-full px-4 py-3 bg-bg-main border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Đoạn mô tả chi tiết</label>
                <textarea
                  value={formData.hero.description}
                  onChange={(e) => handleHeroChange('description', e.target.value)}
                  placeholder="Giới thiệu ngắn về tổ chức hoặc nhiệm vụ của portal..."
                  className="w-full px-4 py-3 bg-bg-main border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all min-h-[100px] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-bg-main/50 rounded-[24px] border border-border-main">
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Nút hành động chính
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.hero.primaryButtonText}
                      onChange={(e) => handleHeroChange('primaryButtonText', e.target.value)}
                      placeholder="Chữ trên nút (VD: Bắt đầu)"
                      className="w-full px-4 py-2.5 bg-white border border-border-main rounded-xl text-sm focus:border-primary outline-none transition-all font-bold"
                    />
                    <input
                      type="text"
                      value={formData.hero.primaryButtonLink}
                      onChange={(e) => handleHeroChange('primaryButtonLink', e.target.value)}
                      placeholder="Đường dẫn (VD: #surveys)"
                      className="w-full px-4 py-2.5 bg-white border border-border-main rounded-xl text-xs focus:border-primary outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                    Nút hành động phụ
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.hero.secondaryButtonText}
                      onChange={(e) => handleHeroChange('secondaryButtonText', e.target.value)}
                      placeholder="Chữ trên nút (VD: Xem thêm)"
                      className="w-full px-4 py-2.5 bg-white border border-border-main rounded-xl text-sm focus:border-primary outline-none transition-all font-bold"
                    />
                    <input
                      type="text"
                      value={formData.hero.secondaryButtonLink}
                      onChange={(e) => handleHeroChange('secondaryButtonLink', e.target.value)}
                      placeholder="Đường dẫn (VD: #about)"
                      className="w-full px-4 py-2.5 bg-white border border-border-main rounded-xl text-xs focus:border-primary outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Config */}
          <div className="bg-white rounded-[28px] border border-border-main p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-text-main">Chân trang (Footer)</h2>
                <p className="text-xs text-text-muted mt-1">Thông tin bản quyền và các liên kết hỗ trợ cuối website.</p>
              </div>
              <button onClick={addFooterColumn} className="btn-secondary px-3 py-2 text-xs flex items-center gap-2 bg-white border-2 border-border-main hover:border-primary transition-all font-bold">
                <Plus size={14} /> Thêm Cột Mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Mô tả ngắn ở Footer</label>
                <textarea
                  value={formData.footer.description}
                  onChange={(e) => setFormData({ ...formData, footer: { ...formData.footer, description: e.target.value } })}
                  placeholder="Mô tả tóm tắt về đơn vị..."
                  className="w-full px-4 py-3 bg-bg-main border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Bản quyền (Copyright text)</label>
                <input
                  type="text"
                  value={formData.footer.copyright}
                  onChange={(e) => setFormData({ ...formData, footer: { ...formData.footer, copyright: e.target.value } })}
                  placeholder="VD: © 2024 PSYEDU. All rights reserved."
                  className="w-full px-4 py-3 bg-bg-main border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.footer.columns.map((col, colIdx) => (
                <div key={colIdx} className="bg-bg-main/30 border-2 border-border-main rounded-[24px] p-6 relative group/col">
                  <button 
                    onClick={() => removeFooterColumn(colIdx)}
                    className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/col:opacity-100"
                    title="Xóa cột này"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="mb-6 pr-10">
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) => updateFooterColumnTitle(colIdx, e.target.value)}
                      placeholder="Tiêu đề Cột (VD: Hỗ trợ)"
                      className="text-sm font-bold bg-transparent border-b-2 border-border-main/50 px-0 py-2 w-full outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                    />
                  </div>

                  <div className="space-y-3">
                    {col.links.map((link, linkIdx) => (
                      <div key={linkIdx} className="flex gap-2 items-center bg-white/50 p-2 rounded-xl border border-border-main/50">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateFooterLink(colIdx, linkIdx, 'label', e.target.value)}
                          placeholder="Chữ"
                          className="w-1/3 px-2 py-1.5 bg-transparent border-r border-border-main/30 text-xs font-bold outline-none focus:text-primary transition-colors"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateFooterLink(colIdx, linkIdx, 'url', e.target.value)}
                          placeholder="Link"
                          className="flex-1 px-2 py-1.5 bg-transparent text-xs text-text-muted outline-none focus:text-primary transition-colors"
                        />
                        <button onClick={() => removeFooterLink(colIdx, linkIdx)} className="text-red-400 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addFooterLink(colIdx)} className="group flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest mt-4 hover:opacity-80 transition-opacity">
                      <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Plus size={12} />
                      </div>
                      Thêm liên kết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Info/Tips */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-[28px] border border-border-main p-8 shadow-sm">
            <h3 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              Mẹo tùy chỉnh
            </h3>
            <div className="space-y-4">
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-2xl">
                <p className="text-xs text-text-main font-medium leading-relaxed">
                  Bạn có thể sử dụng các thẻ HTML cơ bản như <code className="bg-white px-1 py-0.5 rounded text-primary">{"<span className='text-primary'>"}</code> để tạo điểm nhấn màu sắc cho tiêu đề Hero.
                </p>
              </div>
              <ul className="space-y-3 text-xs text-text-muted list-disc pl-4 leading-relaxed font-medium">
                <li>Menu links giúp người dùng điều hướng nhanh tới các khu vực trong trang.</li>
                <li>Hãy giữ đoạn mô tả Hero ngắn gọn (dưới 200 ký tự) để tăng tỷ lệ chuyển đổi.</li>
                <li>Footer nên chứa các liên kết về chính sách bảo mật và điều khoản sử dụng.</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-[28px] p-8 shadow-lg shadow-primary/20">
            <h3 className="text-base font-bold mb-2">Trạng thái công khai</h3>
            <p className="text-xs opacity-90 leading-relaxed mb-6 font-medium">
              Mọi thay đổi bạn thực hiện ở đây sẽ được áp dụng trực tiếp lên trang chủ của Portal ngay khi nhấn "Lưu".
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 border border-white/20">
               <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Trực tuyến (Live)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-50">
        <button 
          className="group relative flex items-center gap-3 bg-text-main text-white px-8 py-4 rounded-[20px] font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
          onClick={handleSave}
          disabled={isSaving}
        >
          <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Đang cập nhật hệ thống...</span>
            </>
          ) : (
            <>
              <Save size={20} className="text-primary" />
              <span>Lưu và cập nhật Portal</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LandingBuilder;
