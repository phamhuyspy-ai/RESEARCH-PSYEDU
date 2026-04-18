
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';
import { motion } from 'motion/react';
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
import { Chatbot } from '../components/Chatbot';

const PublicPortal: React.FC = () => {
  const { surveys } = useAppStore();
  const { orgName, logoUrl, landingPage, socialLinks } = useSettingsStore();

  const displaySurveys = surveys;

  // Fallback defaults in case older configurations exist
  const heroBadge = landingPage?.hero?.badge || 'Hệ thống lượng giá tâm lý & giáo dục';
  const heroTitle = landingPage?.hero?.title || 'Nền tảng khảo sát <span className="text-primary">chuyên sâu</span> cho nghiên cứu';
  const heroDesc = landingPage?.hero?.description || 'Cung cấp các công cụ đo lường chuẩn hóa, hỗ trợ thu thập dữ liệu và phân tích kết quả tự động cho các đơn vị giáo dục và tâm lý học.';
  const btn1Text = landingPage?.hero?.primaryButtonText || 'Bắt đầu khảo sát';
  const btn1Link = landingPage?.hero?.primaryButtonLink || '#surveys';
  const btn2Text = landingPage?.hero?.secondaryButtonText || 'Tìm hiểu thêm';
  const btn2Link = landingPage?.hero?.secondaryButtonLink || '#about';

  const navLinks = landingPage?.nav?.links || [
    { label: 'Bảng hỏi', url: '#surveys' },
    { label: 'Giới thiệu', url: '#about' }
  ];

  const footerDesc = landingPage?.footer?.description || 'Nền tảng cung cấp các công cụ lượng giá tâm lý và giáo dục chuyên sâu, hỗ trợ nghiên cứu và đánh giá chuẩn hóa.';
  const footerCopyright = landingPage?.footer?.copyright || `© ${new Date().getFullYear()} ${orgName}. Bản quyền thuộc về Viện Tâm lý Giáo dục.`;
  const footerCols = landingPage?.footer?.columns || [
    {
      title: 'Khám phá',
      links: [
        { label: 'Bảng hỏi', url: '#surveys' },
        { label: 'Quản trị', url: '/admin/login' }
      ]
    },
    {
      title: 'Hỗ trợ',
      links: [
        { label: 'Hướng dẫn sử dụng', url: '#' },
        { label: 'Chính sách bảo mật', url: '#' }
      ]
    }
  ];

  const getPublicFormStatus = (survey: any) => {
    if (survey.status !== 'published') return { label: 'Đang phát triển', style: 'bg-gray-100 text-gray-600 border-gray-200', active: false };
    if (survey.collectionStatus === 'closed') return { label: 'Chưa mở thu thập', style: 'bg-amber-50 text-amber-600 border-amber-200', active: false };
    return { label: 'Đang thu thập', style: 'bg-green-50 text-green-600 border-green-200', active: true };
  };

  const activeCount = displaySurveys.filter(s => getPublicFormStatus(s).active).length;

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-main font-sans text-text-main">
      {/* Navigation */}
      <nav className="bg-white border-b border-border-main sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">P</div>
              )}
              <span className="text-lg font-bold tracking-tight">{orgName}</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link, idx) => (
                <a key={idx} href={link.url} className="text-sm font-medium text-text-muted hover:text-primary transition-colors">{link.label}</a>
              ))}
              <Link to="/admin/login" className="btn-secondary">Admin Portal</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-white border-b border-border-main">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        >
          <div className="text-center max-w-3xl mx-auto">
            {heroBadge && (
              <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold mb-6 border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {heroBadge}
              </motion.div>
            )}
            <motion.h1 variants={fadeUpVariant} className="text-4xl md:text-5xl font-extrabold text-text-main mb-6 tracking-tight leading-tight" dangerouslySetInnerHTML={{ __html: heroTitle }} />
            <motion.p variants={fadeUpVariant} className="text-lg text-text-muted mb-10 leading-relaxed">
              {heroDesc}
            </motion.p>
            <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {btn1Text && (
                <a href={btn1Link} className="btn-primary px-8 py-3 text-base w-full sm:w-auto">
                  {btn1Text}
                </a>
              )}
              {btn2Text && (
                <a href={btn2Link} className="btn-secondary px-8 py-3 text-base w-full sm:w-auto">
                  {btn2Text}
                </a>
              )}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Surveys Section */}
      <section id="surveys" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <motion.div variants={fadeUpVariant}>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Danh sách bảng hỏi</h2>
              <p className="text-text-muted">Chọn một bảng hỏi bên dưới để bắt đầu quá trình lượng giá.</p>
            </motion.div>
            <motion.div variants={fadeUpVariant} className="flex items-center gap-2 text-sm font-medium text-text-muted">
              <div className="w-2 h-2 rounded-full bg-success-main"></div>
              {activeCount} bảng hỏi đang mở
            </motion.div>
          </div>

          {displaySurveys.length === 0 ? (
            <motion.div variants={fadeUpVariant} className="bg-white border border-border-main rounded-2xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="text-text-muted" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">Hiện chưa có bảng hỏi nào</h3>
              <p className="text-text-muted max-w-md mx-auto">Hệ thống đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ quản trị viên.</p>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displaySurveys.map((survey) => {
                const status = getPublicFormStatus(survey);
                return (
                  <motion.div variants={fadeUpVariant} key={survey.id} className="group bg-white border border-border-main rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div className="p-8 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {survey.type === 'evaluation' ? 'Lượng giá' : 'Khảo sát'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${status.style}`}>
                          {status.label}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                        {survey.name}
                      </h3>
                      <p className="text-sm text-text-muted line-clamp-3 leading-relaxed">
                        {survey.description || 'Không có mô tả cho bảng hỏi này.'}
                      </p>
                    </div>
                    <div className="px-8 py-6 bg-bg-main border-t border-border-main">
                      {status.active ? (
                        <Link
                          to={`/survey/${survey.code}`}
                          className="w-full btn-primary"
                        >
                          Bắt đầu ngay
                          <ArrowRight size={16} className="ml-2" />
                        </Link>
                      ) : (
                        <button className="w-full btn-secondary cursor-not-allowed text-gray-500 opacity-60" disabled>
                          Chưa khả dụng
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border-main py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">P</div>
                )}
                <span className="text-lg font-bold tracking-tight">{orgName}</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {footerDesc}
              </p>
            </div>
            {footerCols.map((col, idx) => (
              <div key={idx}>
                <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2 text-sm text-text-muted">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}><a href={link.url} className="hover:text-primary transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-border-main flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-text-muted">
              {footerCopyright}
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-text-muted hover:text-primary transition-colors"><Facebook size={18} /></a>
              <a href="#" className="text-text-muted hover:text-primary transition-colors"><Twitter size={18} /></a>
              <a href="#" className="text-text-muted hover:text-primary transition-colors"><Github size={18} /></a>
            </div>
          </div>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
};


export default PublicPortal;
