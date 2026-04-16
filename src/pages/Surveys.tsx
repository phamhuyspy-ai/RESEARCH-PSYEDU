
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
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const Surveys: React.FC = () => {
  const { surveys, deleteSurvey } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bảng hỏi này? Dữ liệu liên quan có thể bị ảnh hưởng.')) {
      deleteSurvey(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
      <div className="card-panel py-4">
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
      <div className="card-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg-main/50 border-b border-border-main">
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Thông tin bảng hỏi</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Loại</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Thu thập</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Cập nhật</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
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
                  <tr key={survey.id} className="hover:bg-bg-main/30 transition-colors group">
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
                    <td className="px-6 py-4 text-xs text-text-muted">
                      {format(new Date(survey.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                        {survey.status === 'published' && (
                          <a 
                            href={`/survey/${survey.code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="Xem trực tiếp"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
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
    </div>
  );
};

export default Surveys;
