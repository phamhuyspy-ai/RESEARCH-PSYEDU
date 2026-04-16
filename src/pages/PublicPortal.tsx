
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  Search, 
  ArrowRight, 
  ClipboardList, 
  ShieldCheck, 
  Zap,
  Globe,
  Facebook,
  Twitter,
  Github
} from 'lucide-react';


const PublicPortal: React.FC = () => {
  const { surveys } = useAppStore();
  const { organizationName } = useSettingsStore();

  const activeSurveys = surveys.filter(s => s.status === 'published' && s.collectionStatus === 'open');

  return (
    <div className="min-h-screen bg-bg-main font-sans text-text-main">
      {/* Navigation */}
      <nav className="bg-white border-b border-border-main sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">P</div>
              <span className="text-lg font-bold tracking-tight">{organizationName}</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#surveys" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">Bảng hỏi</a>
              <a href="#about" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">Giới thiệu</a>
              <Link to="/admin/login" className="btn-secondary">Admin Portal</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-white border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold mb-6 border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Hệ thống lượng giá tâm lý & giáo dục
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-main mb-6 tracking-tight leading-tight">
              Nền tảng khảo sát <span className="text-primary">chuyên sâu</span> cho nghiên cứu
            </h1>
            <p className="text-lg text-text-muted mb-10 leading-relaxed">
              Cung cấp các công cụ đo lường chuẩn hóa, hỗ trợ thu thập dữ liệu và phân tích kết quả tự động cho các đơn vị giáo dục và tâm lý học.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#surveys" className="btn-primary px-8 py-3 text-base w-full sm:w-auto">
                Bắt đầu khảo sát
              </a>
              <button className="btn-secondary px-8 py-3 text-base w-full sm:w-auto">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Surveys Section */}
      <section id="surveys" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Danh sách bảng hỏi</h2>
            <p className="text-text-muted">Chọn một bảng hỏi bên dưới để bắt đầu quá trình lượng giá.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <div className="w-2 h-2 rounded-full bg-success-main"></div>
            {activeSurveys.length} bảng hỏi đang mở
          </div>
        </div>

        {activeSurveys.length === 0 ? (
          <div className="bg-white border border-border-main rounded-2xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="text-text-muted" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Hiện chưa có bảng hỏi nào</h3>
            <p className="text-text-muted max-w-md mx-auto">Hệ thống đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ quản trị viên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeSurveys.map((survey) => (
              <div key={survey.id} className="group bg-white border border-border-main rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="p-8 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-blue-50 px-2 py-1 rounded border border-blue-100">
                      {survey.type === 'evaluation' ? 'Lượng giá' : 'Khảo sát'}
                    </span>
                    <span className="text-[10px] font-medium text-text-muted">#{survey.code}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                    {survey.name}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-3 leading-relaxed">
                    {survey.description || 'Không có mô tả cho bảng hỏi này.'}
                  </p>
                </div>
                <div className="px-8 py-6 bg-bg-main border-t border-border-main">
                  <Link
                    to={`/survey/${survey.code}`}
                    className="w-full btn-primary"
                  >
                    Bắt đầu ngay
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border-main py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">P</div>
                <span className="text-lg font-bold tracking-tight">{organizationName}</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Nền tảng chuyên nghiệp cho các hoạt động nghiên cứu và lượng giá trong lĩnh vực tâm lý giáo dục.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Liên kết</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Trang chủ</a></li>
                <li><a href="#surveys" className="hover:text-primary transition-colors">Bảng hỏi</a></li>
                <li><a href="/admin/login" className="hover:text-primary transition-colors">Quản trị</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border-main flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} {organizationName}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-text-muted hover:text-primary transition-colors"><Facebook size={18} /></a>
              <a href="#" className="text-text-muted hover:text-primary transition-colors"><Twitter size={18} /></a>
              <a href="#" className="text-text-muted hover:text-primary transition-colors"><Github size={18} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default PublicPortal;
