
import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Mail, 
  BarChart2, 
  Bell, 
  Gift, 
  ExternalLink,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Survey, ScoreGroup, AlertRule } from '../../types';

interface ResultConfigModalProps {
  survey: Survey;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<Survey['settings']>) => void;
  onUpdateScoreGroups: (groups: ScoreGroup[]) => void;
}

const ResultConfigModal: React.FC<ResultConfigModalProps> = ({
  survey,
  onClose,
  onUpdateSettings,
  onUpdateScoreGroups
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'scoring' | 'alerts'>('general');

  const handleUpdateSettings = (updates: Partial<Survey['settings']>) => {
    onUpdateSettings(updates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-main/50">
          <div>
            <h2 className="text-xl font-bold text-text-main">Cấu hình kết quả & Logic</h2>
            <p className="text-xs text-text-muted mt-1">Thiết lập cách hệ thống xử lý dữ liệu sau khi người dùng hoàn thành.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-main px-6 bg-white">
          {[
            { id: 'general', label: 'Cấu hình chung', icon: CheckCircle2 },
            { id: 'scoring', label: 'Nhóm tính điểm', icon: BarChart2 },
            { id: 'alerts', label: 'Cảnh báo & Phản hồi', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <BarChart2 size={14} /> Hiển thị kết quả
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-2xl border border-border-main hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-main">Cho người dùng xem kết quả</span>
                        <span className="text-[10px] text-text-muted">Hiển thị điểm tổng và nhận xét sau submit.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={survey.settings.showResults}
                        onChange={(e) => handleUpdateSettings({ showResults: e.target.checked })}
                        className="h-5 w-5 text-primary rounded border-border-main focus:ring-primary"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-2xl border border-border-main hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-main">Hiển thị biểu đồ Radar</span>
                        <span className="text-[10px] text-text-muted">Phân tích đa chiều theo các nhóm tính điểm.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={survey.settings.showRadarChart}
                        onChange={(e) => handleUpdateSettings({ showRadarChart: e.target.checked })}
                        className="h-5 w-5 text-primary rounded border-border-main focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} /> Thông báo & Email
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-2xl border border-border-main hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-main">Gửi email kết quả</span>
                        <span className="text-[10px] text-text-muted">Tự động gửi báo cáo về email người dùng.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={survey.settings.sendEmail}
                        onChange={(e) => handleUpdateSettings({ sendEmail: e.target.checked })}
                        className="h-5 w-5 text-primary rounded border-border-main focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border-main space-y-4">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest">Lời cảm ơn (Thank you message)</label>
                <textarea
                  value={survey.settings.thankYouMessage}
                  onChange={(e) => handleUpdateSettings({ thankYouMessage: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-main border border-border-main rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Cảm ơn bạn đã hoàn thành khảo sát..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Gift size={14} /> Phần thưởng (Reward)
                  </label>
                  <input
                    type="text"
                    value={survey.settings.reward || ''}
                    onChange={(e) => handleUpdateSettings({ reward: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Voucher, tài liệu, quà tặng..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <ExternalLink size={14} /> Nút CTA sau hoàn thành
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={survey.settings.cta?.text || ''}
                      onChange={(e) => handleUpdateSettings({ cta: { ...survey.settings.cta!, text: e.target.value, url: survey.settings.cta?.url || '' } })}
                      className="flex-1 px-4 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Nhãn nút"
                    />
                    <input
                      type="text"
                      value={survey.settings.cta?.url || ''}
                      onChange={(e) => handleUpdateSettings({ cta: { ...survey.settings.cta!, url: e.target.value, text: survey.settings.cta?.text || '' } })}
                      className="flex-[2] px-4 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-main">Danh sách nhóm tính điểm</h3>
                <button
                  onClick={() => {
                    const newGroup: ScoreGroup = {
                      code: `GRP_${survey.scoreGroups.length + 1}`,
                      name: 'Nhóm mới',
                      calculationType: 'sum'
                    };
                    onUpdateScoreGroups([...survey.scoreGroups, newGroup]);
                  }}
                  className="btn-primary text-xs"
                >
                  <Plus size={14} className="mr-2" /> Thêm nhóm
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {survey.scoreGroups.map((group, idx) => (
                  <div key={idx} className="p-6 rounded-2xl border border-border-main bg-bg-main/30 flex items-start gap-6 group/grp">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Mã nhóm</label>
                        <input
                          type="text"
                          value={group.code}
                          onChange={(e) => {
                            const newGroups = [...survey.scoreGroups];
                            newGroups[idx].code = e.target.value.toUpperCase();
                            onUpdateScoreGroups(newGroups);
                          }}
                          className="w-full px-3 py-2 bg-white border border-border-main rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Tên nhóm</label>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => {
                            const newGroups = [...survey.scoreGroups];
                            newGroups[idx].name = e.target.value;
                            onUpdateScoreGroups(newGroups);
                          }}
                          className="w-full px-3 py-2 bg-white border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Cách tính</label>
                        <select
                          value={group.calculationType}
                          onChange={(e) => {
                            const newGroups = [...survey.scoreGroups];
                            newGroups[idx].calculationType = e.target.value as any;
                            onUpdateScoreGroups(newGroups);
                          }}
                          className="w-full px-3 py-2 bg-white border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                          <option value="sum">Tổng điểm (Sum)</option>
                          <option value="average">Trung bình (Average)</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newGroups = survey.scoreGroups.filter((_, i) => i !== idx);
                        onUpdateScoreGroups(newGroups);
                      }}
                      className="p-2 text-text-muted hover:text-red-600 opacity-0 group-hover/grp:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-main">Quy tắc cảnh báo & Phản hồi</h3>
                <button
                  onClick={() => {
                    const newAlert: AlertRule = {
                      id: Math.random().toString(36).substr(2, 9),
                      scoreGroupCode: survey.scoreGroups[0]?.code || '',
                      min: 0,
                      max: 100,
                      message: 'Phản hồi mặc định...',
                      level: 'info'
                    };
                    handleUpdateSettings({ alerts: [...survey.settings.alerts, newAlert] });
                  }}
                  className="btn-primary text-xs"
                >
                  <Plus size={14} className="mr-2" /> Thêm quy tắc
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {survey.settings.alerts.map((alert, idx) => (
                  <div key={alert.id} className="p-6 rounded-2xl border border-border-main bg-bg-main/30 space-y-4 group/alert">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <select
                          value={alert.scoreGroupCode}
                          onChange={(e) => {
                            const newAlerts = [...survey.settings.alerts];
                            newAlerts[idx].scoreGroupCode = e.target.value;
                            handleUpdateSettings({ alerts: newAlerts });
                          }}
                          className="px-3 py-1.5 bg-white border border-border-main rounded-lg text-xs font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="">-- Chọn nhóm --</option>
                          {survey.scoreGroups.map(g => (
                            <option key={g.code} value={g.code}>{g.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Từ</span>
                          <input
                            type="number"
                            value={alert.min}
                            onChange={(e) => {
                              const newAlerts = [...survey.settings.alerts];
                              newAlerts[idx].min = parseInt(e.target.value);
                              handleUpdateSettings({ alerts: newAlerts });
                            }}
                            className="w-16 px-2 py-1.5 bg-white border border-border-main rounded-lg text-xs text-center focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Đến</span>
                          <input
                            type="number"
                            value={alert.max}
                            onChange={(e) => {
                              const newAlerts = [...survey.settings.alerts];
                              newAlerts[idx].max = parseInt(e.target.value);
                              handleUpdateSettings({ alerts: newAlerts });
                            }}
                            className="w-16 px-2 py-1.5 bg-white border border-border-main rounded-lg text-xs text-center focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <select
                          value={alert.level}
                          onChange={(e) => {
                            const newAlerts = [...survey.settings.alerts];
                            newAlerts[idx].level = e.target.value as any;
                            handleUpdateSettings({ alerts: newAlerts });
                          }}
                          className="px-3 py-1.5 bg-white border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="info">Thông tin (Info)</option>
                          <option value="success">Thành công (Success)</option>
                          <option value="warning">Cảnh báo (Warning)</option>
                          <option value="error">Nguy hiểm (Error)</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const newAlerts = survey.settings.alerts.filter(a => a.id !== alert.id);
                          handleUpdateSettings({ alerts: newAlerts });
                        }}
                        className="p-2 text-text-muted hover:text-red-600 opacity-0 group-hover/alert:opacity-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <textarea
                      value={alert.message}
                      onChange={(e) => {
                        const newAlerts = [...survey.settings.alerts];
                        newAlerts[idx].message = e.target.value;
                        handleUpdateSettings({ alerts: newAlerts });
                      }}
                      className="w-full px-4 py-3 bg-white border border-border-main rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                      rows={2}
                      placeholder="Nhập nội dung phản hồi cho ngưỡng điểm này..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-main bg-bg-main/50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-8">Đóng</button>
          <button onClick={onClose} className="btn-primary px-8">
            <Save size={16} className="mr-2" /> Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultConfigModal;
