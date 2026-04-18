import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { Save, Plus, Trash2, ArrowLeft, Loader2, GripVertical } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="p-2 hover:bg-white rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Cấu hình Cổng thông tin (Landing Page)</h1>
          <p className="text-sm text-text-muted">Tùy chỉnh khối giao diện hiển thị cho người xem ở ngoài trang chủ.</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Nav Config */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-4">Thanh điều hướng (Header)</h2>
        <div className="space-y-3">
          {formData.nav.links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-bg-main p-3 rounded-xl border border-border-main">
              <GripVertical size={16} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateNavLink(idx, 'label', e.target.value)}
                placeholder="Tên hiển thị"
                className="input-field py-2"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => updateNavLink(idx, 'url', e.target.value)}
                placeholder="Đường dẫn liên kết (#id hoặc https://)"
                className="input-field py-2"
              />
              <button onClick={() => removeNavLink(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button onClick={addNavLink} className="btn-secondary text-xs mt-2">
            <Plus size={14} className="mr-1" /> Thêm Menu Link
          </button>
        </div>
      </div>

      {/* Hero Config */}
      <div className="card-panel">
        <h2 className="text-lg font-bold mb-4">Khu vực Giới thiệu (Hero Block)</h2>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-bold text-text-muted mb-2">Thẻ nhỏ (Badge)</label>
            <input
              type="text"
              value={formData.hero.badge}
              onChange={(e) => handleHeroChange('badge', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-2">Tiêu đề chính (H1) - <span className="font-normal italic">Hỗ trợ thẻ HTML</span></label>
            <textarea
              value={formData.hero.title}
              onChange={(e) => handleHeroChange('title', e.target.value)}
              className="input-field min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-2">Mô tả ngắn</label>
            <textarea
              value={formData.hero.description}
              onChange={(e) => handleHeroChange('description', e.target.value)}
              className="input-field min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2">Nút Chính - Text</label>
              <input
                type="text"
                value={formData.hero.primaryButtonText}
                onChange={(e) => handleHeroChange('primaryButtonText', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2">Nút Chính - Link</label>
              <input
                type="text"
                value={formData.hero.primaryButtonLink}
                onChange={(e) => handleHeroChange('primaryButtonLink', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2">Nút Phụ - Text</label>
              <input
                type="text"
                value={formData.hero.secondaryButtonText}
                onChange={(e) => handleHeroChange('secondaryButtonText', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2">Nút Phụ - Link</label>
              <input
                type="text"
                value={formData.hero.secondaryButtonLink}
                onChange={(e) => handleHeroChange('secondaryButtonLink', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Config */}
      <div className="card-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Cuối trang (Footer)</h2>
          <button onClick={addFooterColumn} className="btn-secondary text-xs">
            <Plus size={14} className="mr-1" /> Thêm Cột Mới
          </button>
        </div>

        <div className="space-y-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-text-muted mb-2">Mô tả cột logo</label>
            <textarea
              value={formData.footer.description}
              onChange={(e) => setFormData({ ...formData, footer: { ...formData.footer, description: e.target.value } })}
              className="input-field min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-2">Bản quyền (Copyright)</label>
            <input
              type="text"
              value={formData.footer.copyright}
              onChange={(e) => setFormData({ ...formData, footer: { ...formData.footer, copyright: e.target.value } })}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formData.footer.columns.map((col, colIdx) => (
            <div key={colIdx} className="border border-border-main rounded-xl p-4 bg-bg-main relative">
              <button 
                onClick={() => removeFooterColumn(colIdx)}
                className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa cột này"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="mb-4 pr-8">
                <input
                  type="text"
                  value={col.title}
                  onChange={(e) => updateFooterColumnTitle(colIdx, e.target.value)}
                  placeholder="Tiêu đề Cột"
                  className="font-bold bg-transparent border-b border-border-main px-0 py-1 w-full outline-none focus:border-primary focus:text-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                {col.links.map((link, linkIdx) => (
                  <div key={linkIdx} className="flex gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateFooterLink(colIdx, linkIdx, 'label', e.target.value)}
                      placeholder="Tên"
                      className="input-field py-1 px-2 text-xs w-1/3"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateFooterLink(colIdx, linkIdx, 'url', e.target.value)}
                      placeholder="Link"
                      className="input-field py-1 px-2 text-xs flex-1"
                    />
                    <button onClick={() => removeFooterLink(colIdx, linkIdx)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addFooterLink(colIdx)} className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center mt-2 hover:underline">
                  <Plus size={12} className="mr-1" /> Thêm link
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Save */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className="btn-primary shadow-lg shadow-primary/30 px-6 py-3 rounded-full flex items-center gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Đang cập nhật...
            </>
          ) : (
            <>
              <Save size={20} /> Lưu khối giao diện
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LandingBuilder;
