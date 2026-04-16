
import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Submission, Survey } from '../types';
import { 
  CheckCircle2, 
  Download, 
  Share2, 
  Home,
  BarChart3,
  Trophy,
  ArrowRight,
  Gift,
  ExternalLink,
  Info
} from 'lucide-react';

interface SurveyResultsProps {
  adminView?: boolean;
}

const SurveyResults: React.FC<SurveyResultsProps> = ({ adminView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { submissionId } = useParams();
  
  const submission = location.state?.submission as Submission;
  const survey = location.state?.survey as Survey;

  if (!submission || !survey) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-border-main">
          <h2 className="text-2xl font-bold text-text-main mb-3">Không tìm thấy kết quả</h2>
          <p className="text-text-muted mb-8">Vui lòng quay lại trang chủ hoặc liên hệ quản trị viên.</p>
          <button onClick={() => navigate('/')} className="w-full btn-primary py-4">Quay lại</button>
        </div>
      </div>
    );
  }

  const branding = survey.branding || { primaryColor: '#3b82f6', backgroundColor: '#f8fafc' };

  return (
    <div className="min-h-screen py-12 px-4 font-sans" style={{ backgroundColor: branding.backgroundColor }}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Main Success Card */}
        <div className="bg-white p-10 rounded-[32px] shadow-sm border border-border-main text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full animate-bounce" style={{ backgroundColor: branding.primaryColor + '15', color: branding.primaryColor }}>
            <CheckCircle2 size={56} />
          </div>
          
          <div>
            <h1 className="text-4xl font-extrabold text-text-main tracking-tight">Hoàn thành!</h1>
            <p className="text-text-muted mt-3 leading-relaxed max-w-md mx-auto">{survey.settings.thankYouMessage}</p>
          </div>

          {survey.settings.showResults && (
            <div className="p-8 rounded-3xl border animate-in slide-in-from-top-4 duration-700" style={{ backgroundColor: branding.primaryColor + '08', borderColor: branding.primaryColor + '20' }}>
              <div className="flex items-center justify-center gap-2 mb-3" style={{ color: branding.primaryColor }}>
                <Trophy size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Kết quả lượng giá</span>
              </div>
              <div className="text-6xl font-black mb-6 tracking-tighter" style={{ color: branding.primaryColor }}>{submission.total_score}</div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-main/50 text-text-main font-medium leading-relaxed">
                {submission.result_interpretation}
              </div>
            </div>
          )}

          {/* CTA & Rewards */}
          {(survey.settings.reward || survey.settings.cta?.text) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {survey.settings.reward && (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                    <Gift size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Phần thưởng</div>
                    <div className="text-sm font-bold text-orange-900">{survey.settings.reward}</div>
                  </div>
                </div>
              )}
              {survey.settings.cta?.text && (
                <a 
                  href={survey.settings.cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-primary text-white flex items-center gap-4 text-left hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <ExternalLink size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Tiếp theo</div>
                    <div className="text-sm font-bold">{survey.settings.cta.text}</div>
                  </div>
                </a>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <button className="flex items-center gap-2 px-8 py-4 bg-text-main text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl">
              <Download size={18} />
              Tải báo cáo (PDF)
            </button>
            <button className="flex items-center gap-2 px-8 py-4 bg-white border border-border-main text-text-main rounded-2xl font-bold hover:bg-bg-main transition-all">
              <Share2 size={18} />
              Chia sẻ
            </button>
          </div>
        </div>

        {/* Score Groups Breakdown */}
        {survey.settings.showResults && survey.scoreGroups.length > 0 && (
          <div className="bg-white p-10 rounded-[32px] shadow-sm border border-border-main animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h3 className="text-lg font-bold text-text-main mb-8 flex items-center gap-3">
              <BarChart3 size={24} style={{ color: branding.primaryColor }} />
              Phân tích chi tiết theo nhóm
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {survey.scoreGroups.map((group) => {
                const score = submission.group_scores?.[group.code] || 0;
                return (
                  <div key={group.code} className="p-6 rounded-2xl bg-bg-main border border-border-main">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{group.code}</div>
                        <div className="text-sm font-bold text-text-main">{group.name}</div>
                      </div>
                      <div className="text-2xl font-black" style={{ color: branding.primaryColor }}>{score}</div>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-border-main">
                      <div 
                        className="h-full transition-all duration-1000" 
                        style={{ 
                          width: `${Math.min(100, (score / 100) * 100)}%`,
                          backgroundColor: branding.primaryColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Response Summary */}
        <div className="bg-white p-10 rounded-[32px] shadow-sm border border-border-main animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <h3 className="text-lg font-bold text-text-main mb-8 flex items-center gap-3">
            <Info size={24} style={{ color: branding.primaryColor }} />
            Tóm tắt phản hồi
          </h3>
          
          <div className="space-y-8">
            {survey.blocks.filter(b => b.type !== 'content' && b.type !== 'contact').map((block, idx) => {
              // The responses passed from SurveyRunner are the unmapped ones (using block.id)
              // so we can still use block.id here to access the raw response.
              const response = submission.responses[block.id];
              return (
              <div key={block.id} className="pb-8 border-b border-border-main/50 last:border-0 last:pb-0">
                <p className="text-sm font-bold text-text-main mb-4 leading-relaxed">
                  <span className="text-text-muted mr-2">#{idx + 1}</span>
                  {block.title}
                </p>
                <div className="p-5 bg-bg-main rounded-2xl text-sm text-text-main border border-border-main/50">
                  {block.type === 'single_choice' || block.type === 'multi_choice' || block.type === 'likert' ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-success-main" />
                      <span className="font-medium">
                        {Array.isArray(response) 
                          ? response.map((v: any) => block.options?.find(o => o.value === v)?.label).join(', ')
                          : block.options?.find(o => o.value === response)?.label || 'Không trả lời'}
                      </span>
                    </div>
                  ) : block.type === 'matrix' ? (
                    <div className="space-y-2">
                      {Object.entries(response || {}).map(([rowCode, rowData]) => {
                        const rowLabel = block.matrixRows?.find(r => r.code === rowCode)?.label;
                        if (typeof rowData === 'object' && rowData !== null) {
                          return (
                            <div key={rowCode} className="flex flex-col gap-1 text-xs border-b border-border-main/30 pb-2 last:border-0">
                              <span className="text-text-muted font-medium">{rowLabel}</span>
                              <div className="pl-4 space-y-1">
                                {Object.entries(rowData).map(([colValue, answer]) => {
                                  const colLabel = block.matrixCols?.find(c => c.value === colValue)?.label;
                                  if (answer === true) {
                                    return <div key={colValue} className="font-bold text-primary flex items-center gap-1"><CheckCircle2 size={12}/> {colLabel}</div>;
                                  } else if (answer) {
                                    return <div key={colValue} className="text-text-main"><span className="text-text-muted mr-1">{colLabel}:</span> {String(answer)}</div>;
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          );
                        } else {
                          // Legacy support
                          return (
                            <div key={rowCode} className="flex justify-between items-center text-xs border-b border-border-main/30 pb-2 last:border-0">
                              <span className="text-text-muted">{rowLabel}</span>
                              <span className="font-bold text-primary">{block.matrixCols?.find(c => c.value === rowData)?.label}</span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  ) : (
                    <p className="italic">{response || 'Không trả lời'}</p>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-text-muted font-bold hover:text-primary transition-all group"
          >
            <Home size={20} className="group-hover:-translate-y-0.5 transition-transform" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyResults;
