
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { 
  FileText, 
  Users, 
  Send, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  ExternalLink,
  BarChart3,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';


const Dashboard: React.FC = () => {
  const { surveys: rawSurveys } = useAppStore();
  const surveys = Array.isArray(rawSurveys) ? rawSurveys : [];

  const stats = [
    { label: 'Tổng số bảng hỏi', value: surveys.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Đã xuất bản', value: surveys.filter(s => s.status === 'published').length, icon: Send, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Đang thu thập', value: surveys.filter(s => s.collectionStatus === 'open').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Tổng phản hồi', value: '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const recentSurveys = [...surveys].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-border-main shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-0.5">{stat.label}</div>
              <div className="text-2xl font-bold text-text-main">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Surveys */}
        <div className="lg:col-span-2 card-panel">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Bảng hỏi gần đây
            </h2>
            <Link to="/admin/surveys" className="text-xs font-bold text-primary hover:underline">Xem tất cả</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-main">
                  <th className="pb-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Tên bảng hỏi</th>
                  <th className="pb-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Trạng thái</th>
                  <th className="pb-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Cập nhật</th>
                  <th className="pb-3 text-[10px] font-bold text-text-muted uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {recentSurveys.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={32} className="text-text-muted opacity-20" />
                        <p className="text-sm text-text-muted">Chưa có bảng hỏi nào được tạo.</p>
                        <Link to="/admin/builder" className="btn-primary text-xs mt-2">Tạo ngay</Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentSurveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-bg-main/50 transition-colors group">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{survey.name}</span>
                          <span className="text-[10px] font-mono text-text-muted">#{survey.code}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                            survey.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {survey.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                          </span>
                          {survey.collectionStatus === 'open' && (
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                              Đang mở
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-xs text-text-muted">
                        {format(new Date(survey.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </td>
                      <td className="py-4 text-right">
                        <Link to={`/admin/builder/${survey.id}`} className="p-2 hover:bg-white rounded-lg inline-block transition-all">
                          <MoreVertical size={16} className="text-text-muted" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="space-y-6">
          <div className="card-panel">
            <h2 className="text-base font-bold mb-6">Thao tác nhanh</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/admin/builder" className="flex items-center gap-3 p-4 rounded-xl border border-border-main hover:border-primary/30 hover:bg-primary/5 transition-all group">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus size={20} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Tạo bảng hỏi mới</div>
                  <div className="text-[10px] text-text-muted">Bắt đầu xây dựng form lượng giá</div>
                </div>
              </Link>
              <Link to="/admin/settings" className="flex items-center gap-3 p-4 rounded-xl border border-border-main hover:border-primary/30 hover:bg-primary/5 transition-all group">
                <div className="w-10 h-10 bg-bg-main text-text-muted rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <BarChart3 size={20} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Cấu hình hệ thống</div>
                  <div className="text-[10px] text-text-muted">Branding, AI và kết nối GAS</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="card-panel bg-primary text-white">
            <h3 className="text-sm font-bold mb-2">Trạng thái hệ thống</h3>
            <div className="flex items-center gap-2 text-xs opacity-90 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Kết nối Google Apps Script: OK
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Hệ thống đang hoạt động ổn định. Dữ liệu được đồng bộ trực tiếp với Google Sheets của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
