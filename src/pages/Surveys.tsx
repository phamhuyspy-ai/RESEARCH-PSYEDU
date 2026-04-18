
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  ExternalLink,
  BarChart2,
  AlertCircle,
  Share2,
  Copy,
  Code,
  Download,
  Play,
  Square,
  Database
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { gasService } from '../services/gasService';

import { useSettingsStore } from '../stores/settingsStore';

const Surveys: React.FC = () => {
  const { surveys, deleteSurvey, updateSurvey } = useAppStore();
  const { sheetUrl } = useSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedSurveyForShare, setSelectedSurveyForShare] = useState<string | null>(null);

  const filteredSurveys = (Array.isArray(surveys) ? surveys : []).filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bảng hỏi này? Dữ liệu liên quan có thể bị ảnh hưởng.')) {
      try {
        const response = await gasService.deleteSurvey(id);
        if (response.success) {
          deleteSurvey(id);
        } else {
          alert(response.message || 'Lỗi khi xóa bảng hỏi.');
        }
      } catch (err) {
        alert('Đã có lỗi xảy ra khi kết nối với máy chủ.');
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép vào clipboard!');
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('survey-qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${selectedSurvey?.code || 'survey'}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleToggleCollection = async () => {
    if (!selectedSurvey) return;
    const newStatus: "open" | "closed" = selectedSurvey.collectionStatus === 'open' ? 'closed' : 'open';
    const updated = { ...selectedSurvey, collectionStatus: newStatus };
    
    try {
      const response = await gasService.saveSurvey(updated);
      if (response.success) {
        updateSurvey(updated);
      } else {
        alert(response.message || 'Không thể thay đổi trạng thái thu thập.');
      }
    } catch (err) {
      alert('Đã có lỗi xảy ra khi kết nối máy chủ.');
    }
  };

  const selectedSurvey = Array.isArray(surveys) ? surveys.find(s => s.id === selectedSurveyForShare) : undefined;
  
  const getPublicDomain = () => {
    // If inside AI Studio or Sandbox, force the public Vercel domain so QR/Iframes work externally
    if (window.location.hostname.includes('googleusercontent.com') || window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost')) {
      return 'https://syedu.vercel.app';
    }
    return window.location.origin;
  };
  
  const surveyUrl = selectedSurvey ? `${getPublicDomain()}/survey/${selectedSurvey.code}` : '';

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Danh sách bảng hỏi</h1>
            <p className="text-sm text-text-muted mt-1">Quản lý tất cả các biểu mẫu khảo sát và lượng giá của bạn.</p>
          </div>
          <Link to="/admin/builder" className="btn-primary">
            <Plus size={18} className="mr-2" />
            Tạo bảng hỏi mới
          </Link>
        </div>

        {/* Filters */}
        <div className="card-panel py-4 shrink-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-main border border-border-main rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-bg-main border border-border-main rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card-panel p-0 flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-bg-main/50 border-b border-border-main">
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Thông tin bảng hỏi</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Loại</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Thu thập</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center">
                        <FileText size={32} className="text-text-muted opacity-20" />
                      </div>
                      <p className="text-sm text-text-muted">Không tìm thấy bảng hỏi nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id} className={`hover:bg-bg-main/30 transition-colors group cursor-pointer ${selectedSurveyForShare === survey.id ? 'bg-primary/5' : ''}`} onClick={() => setSelectedSurveyForShare(survey.id)}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{survey.name}</span>
                        <span className="text-[10px] font-mono text-text-muted">#{survey.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        {survey.type === 'evaluation' ? 'Lượng giá' : 'Khảo sát'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                        survey.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {survey.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${survey.collectionStatus === 'open' ? 'bg-success-main animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-xs font-medium">
                          {survey.collectionStatus === 'open' ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <a 
                          href={survey.fileId ? `https://docs.google.com/spreadsheets/d/${survey.fileId}/edit` : (sheetUrl || 'https://docs.google.com/spreadsheets')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-text-muted hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Mở Google Sheet"
                        >
                          <Database size={16} />
                        </a>
                        <Link 
                          to={`/admin/builder/${survey.id}`}
                          className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <Link 
                          to={`/admin/results/${survey.id}`}
                          className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Kết quả"
                        >
                          <BarChart2 size={16} />
                        </Link>
                        <button 
                          onClick={() => setSelectedSurveyForShare(survey.id)}
                          className={`p-2 rounded-lg transition-all ${selectedSurveyForShare === survey.id ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-primary/5'}`}
                          title="Chia sẻ & Nhúng"
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(survey.id)}
                          className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sidebar: Publish & Embed */}
      <div className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="card-panel sticky top-0">
          <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
            <Share2 size={18} className="text-primary" />
            Xuất bản & Chia sẻ
          </h3>
          
          {!selectedSurvey ? (
            <div className="text-center py-8 text-text-muted">
              <p className="text-xs">Chọn một bảng hỏi từ danh sách để xem các tùy chọn chia sẻ.</p>
            </div>
          ) : selectedSurvey.status !== 'published' ? (
            <div className="text-center py-8 text-text-muted">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">Bảng hỏi này đang ở trạng thái Nháp. Vui lòng xuất bản để lấy link chia sẻ.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-bg-main rounded-xl border border-border-main">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-main">Trạng thái thu thập</span>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedSurvey.collectionStatus === 'open' ? 'bg-success-main text-white' : 'bg-gray-300 text-gray-700'}`}>
                    {selectedSurvey.collectionStatus === 'open' ? 'Đang mở' : 'Đã đóng'}
                  </div>
                </div>
                <p className="text-[10px] text-text-muted mb-3">
                  {selectedSurvey.collectionStatus === 'open' 
                    ? 'Người dùng có thể truy cập link để thực hiện khảo sát.' 
                    : 'Người dùng sẽ không thể truy cập khảo sát hiện tại.'}
                </p>
                <button
                  onClick={handleToggleCollection}
                  className={`w-full py-1.5 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                    selectedSurvey.collectionStatus === 'open' 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                      : 'bg-success-main text-white hover:bg-green-600'
                  }`}
                >
                  {selectedSurvey.collectionStatus === 'open' ? (
                    <><Square size={14} /> Dừng thu thập</>
                  ) : (
                    <><Play size={14} /> Mở thu thập</>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Link trực tiếp</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={surveyUrl}
                    className="flex-1 px-2 py-1.5 bg-bg-main border border-border-main rounded text-xs text-text-muted"
                  />
                  <button 
                    onClick={() => handleCopy(surveyUrl)}
                    className="p-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    title="Sao chép link"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Mã nhúng (Iframe)</label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={`<iframe src="${surveyUrl}?embed=true" width="100%" height="600px" frameborder="0" style="border:none;"></iframe>`}
                    className="w-full h-24 px-2 py-1.5 bg-bg-main border border-border-main rounded text-[10px] font-mono text-text-muted resize-none"
                  />
                  <button 
                    onClick={() => handleCopy(`<iframe src="${surveyUrl}?embed=true" width="100%" height="600px" frameborder="0" style="border:none;"></iframe>`)}
                    className="absolute top-2 right-2 p-1 bg-white border border-border-main text-text-muted rounded hover:text-primary transition-colors"
                    title="Sao chép mã nhúng"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted mt-1">Dùng mã này để nhúng bảng hỏi vào website của bạn.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Mã QR</label>
                <div className="bg-bg-main border border-border-main rounded-lg p-4 flex flex-col items-center justify-center gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-border-main">
                    <QRCodeSVG 
                      id="survey-qr-code"
                      value={surveyUrl} 
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <button 
                    onClick={handleDownloadQR}
                    className="flex items-center gap-2 text-xs text-primary font-medium hover:underline"
                  >
                    <Download size={14} />
                    Tải xuống QR Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Surveys;
