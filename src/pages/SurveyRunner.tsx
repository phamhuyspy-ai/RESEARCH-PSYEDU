
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Survey, Submission, SurveyBlock } from '../types';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Info
} from 'lucide-react';
import { gasService } from '../services/gasService';

const SurveyRunner: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { surveys } = useAppStore();
  const globalSettings = useSettingsStore();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(-1); // -1 for intro/contact
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '', org: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const found = surveys.find(s => s.code === code && s.status === 'published');
    if (found) {
      if (found.collectionStatus === 'closed') {
        setError('Bảng hỏi này hiện đang đóng thu thập phản hồi.');
      } else {
        setSurvey(found);
      }
    } else {
      setError('Không tìm thấy bảng hỏi hoặc bảng hỏi chưa được xuất bản.');
    }
  }, [code, surveys]);

  const handleNext = () => {
    if (currentBlockIndex === -1) {
      if (!contactInfo.name || !contactInfo.email) {
        alert('Vui lòng điền đầy đủ thông tin liên hệ.');
        return;
      }
    } else {
      const currentBlock = survey?.blocks[currentBlockIndex];
      if (currentBlock?.required && !responses[currentBlock.id]) {
        alert('Vui lòng hoàn thành câu hỏi này trước khi tiếp tục.');
        return;
      }
    }
    setCurrentBlockIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentBlockIndex(prev => prev - 1);
  };

  const calculateScores = () => {
    if (!survey) return { total: 0, groups: {} };
    
    let total = 0;
    const groups: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

    survey.blocks.forEach(block => {
      if (!block.scoreEnabled) return;

      const response = responses[block.id];
      if (!response) return;

      let score = 0;
      if (block.type === 'single_choice' || block.type === 'likert') {
        const option = block.options?.find(o => o.value === response);
        if (option) score = option.score || 0;
      } else if (block.type === 'multi_choice' && Array.isArray(response)) {
        response.forEach(val => {
          const option = block.options?.find(o => o.value === val);
          if (option) score += (option.score || 0);
        });
      } else if (block.type === 'matrix' && typeof response === 'object') {
        Object.values(response).forEach(val => {
          const col = block.matrixCols?.find(c => c.value === val);
          if (col) score += (col.score || 0);
        });
      }

      // Apply weight and reverse score
      if (block.reverseScore && block.minScore !== undefined && block.maxScore !== undefined) {
        score = block.maxScore + block.minScore - score;
      }
      score = score * (block.weight || 1);

      total += score;

      if (block.scoreGroupCode) {
        groups[block.scoreGroupCode] = (groups[block.scoreGroupCode] || 0) + score;
        groupCounts[block.scoreGroupCode] = (groupCounts[block.scoreGroupCode] || 0) + 1;
      }
    });

    // Handle average calculation for groups
    survey.scoreGroups.forEach(group => {
      if (group.calculationType === 'average' && groups[group.code] !== undefined) {
        groups[group.code] = groups[group.code] / (groupCounts[group.code] || 1);
      }
    });

    return { total, groups };
  };

  const handleSubmit = async () => {
    if (!survey) return;
    setIsSubmitting(true);
    setError('');

    const { total, groups } = calculateScores();
    
    // Find matching alert
    let interpretation = survey.settings.thankYouMessage;
    const matchingAlert = survey.settings.alerts.find(alert => {
      const score = alert.scoreGroupCode ? (groups[alert.scoreGroupCode] || 0) : total;
      return score >= alert.min && score <= alert.max;
    });
    if (matchingAlert) interpretation = matchingAlert.message;

    // Map responses to use block.code instead of block.id for backend sheet columns
    const mappedResponses: Record<string, any> = {};
    survey.blocks.forEach(block => {
      const answer = responses[block.id];
      if (answer !== undefined) {
        if (block.type === 'matrix' && typeof answer === 'object') {
          // Flatten matrix answers: { "R1": "C1" } -> { "Q1_R1": "C1" }
          Object.keys(answer).forEach(rowCode => {
            mappedResponses[`${block.code}_${rowCode}`] = answer[rowCode];
          });
        } else if (block.type === 'multi_choice' && Array.isArray(answer)) {
          // Join multi-choice arrays into a comma-separated string
          mappedResponses[block.code] = answer.join(', ');
        } else {
          mappedResponses[block.code] = answer;
        }
      }
    });

    const submission: Submission = {
      submission_id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user_name: contactInfo.name,
      user_email: contactInfo.email,
      user_phone: contactInfo.phone,
      user_org: contactInfo.org,
      responses: mappedResponses,
      total_score: total,
      group_scores: groups,
      result_interpretation: interpretation,
    };

    try {
      const response = await gasService.submitData(survey.code, submission);
      if (response.success) {
        // Pass original responses for the results page UI
        navigate(`/results/${submission.submission_id}`, { state: { submission: { ...submission, responses }, survey } });
      } else {
        setError(response.message || 'Lỗi khi gửi dữ liệu.');
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra khi kết nối với máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-border-main">
          <AlertCircle className="mx-auto text-red-500 mb-6" size={64} />
          <h2 className="text-2xl font-bold text-text-main mb-3">Thông báo</h2>
          <p className="text-text-muted mb-8 leading-relaxed">{error}</p>
          <button onClick={() => navigate('/')} className="w-full btn-primary py-4">Quay lại trang chủ</button>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  const currentBlock = survey.blocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex === survey.blocks.length - 1;
  const branding = survey.branding || { primaryColor: '#3b82f6', backgroundColor: '#f8fafc' };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: branding.backgroundColor }}>
      {/* Header */}
      <header className="bg-white border-b border-border-main p-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logoUrl || globalSettings.logoUrl ? (
              <img 
                src={branding.logoUrl || globalSettings.logoUrl} 
                alt="Logo" 
                className="h-8 w-auto object-contain" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: branding.primaryColor }}>P</div>
            )}
            <span className="font-bold text-text-main tracking-tight">{globalSettings.organizationName}</span>
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-main px-2 py-1 rounded">
            {currentBlockIndex === -1 ? 'Thông tin' : `Câu ${currentBlockIndex + 1}/${survey.blocks.length}`}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-bg-main h-1.5">
        <div 
          className="h-full transition-all duration-700 ease-out" 
          style={{ 
            width: `${((currentBlockIndex + 2) / (survey.blocks.length + 1)) * 100}%`,
            backgroundColor: branding.primaryColor
          }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-12 overflow-auto">
        <div className="max-w-3xl mx-auto">
          {currentBlockIndex === -1 ? (
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-border-main space-y-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-text-main mb-4 tracking-tight leading-tight">{survey.name}</h1>
                <p className="text-text-muted leading-relaxed">{survey.description}</p>
              </div>

              <div className="space-y-6 pt-6 border-t border-border-main/50">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} /> Thông tin người tham gia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Họ và tên *</label>
                    <input
                      type="text"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                      className="w-full p-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 outline-none transition-all"
                      style={{ '--tw-ring-color': branding.primaryColor + '33' } as any}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Email *</label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="w-full p-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 outline-none transition-all"
                      style={{ '--tw-ring-color': branding.primaryColor + '33' } as any}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Số điện thoại</label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="w-full p-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 outline-none transition-all"
                      style={{ '--tw-ring-color': branding.primaryColor + '33' } as any}
                      placeholder="090..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Đơn vị / Tổ chức</label>
                    <input
                      type="text"
                      value={contactInfo.org}
                      onChange={(e) => setContactInfo({ ...contactInfo, org: e.target.value })}
                      className="w-full p-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 outline-none transition-all"
                      style={{ '--tw-ring-color': branding.primaryColor + '33' } as any}
                      placeholder="Tên trường, công ty..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-border-main space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-text-main mb-3 leading-tight">
                  {currentBlock.title}
                  {currentBlock.required && <span className="text-red-500 ml-1">*</span>}
                </h2>
                {currentBlock.description && <p className="text-text-muted text-sm leading-relaxed">{currentBlock.description}</p>}
                {currentBlock.helpText && <p className="text-text-muted/60 text-[11px] mt-2 italic">💡 {currentBlock.helpText}</p>}
              </div>

              {/* Block Types Rendering */}
              <div className="space-y-4">
                {(currentBlock.type === 'single_choice' || currentBlock.type === 'likert') && (
                  <div className="space-y-3">
                    {currentBlock.options?.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setResponses({ ...responses, [currentBlock.id]: opt.value })}
                        className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                          responses[currentBlock.id] === opt.value
                            ? 'border-primary bg-primary/5 text-primary font-bold'
                            : 'border-bg-main hover:border-border-main text-text-main'
                        }`}
                        style={{ borderColor: responses[currentBlock.id] === opt.value ? branding.primaryColor : undefined } as any}
                      >
                        <span>{opt.label}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          responses[currentBlock.id] === opt.value ? 'border-primary bg-primary' : 'border-border-main'
                        }`} style={{ borderColor: responses[currentBlock.id] === opt.value ? branding.primaryColor : undefined, backgroundColor: responses[currentBlock.id] === opt.value ? branding.primaryColor : undefined } as any}>
                          {responses[currentBlock.id] === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {currentBlock.type === 'multi_choice' && (
                  <div className="space-y-3">
                    {currentBlock.options?.map((opt) => {
                      const currentVals = Array.isArray(responses[currentBlock.id]) ? responses[currentBlock.id] : [];
                      const isSelected = currentVals.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const newVals = isSelected 
                              ? currentVals.filter((v: any) => v !== opt.value)
                              : [...currentVals, opt.value];
                            setResponses({ ...responses, [currentBlock.id]: newVals });
                          }}
                          className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-bold'
                              : 'border-bg-main hover:border-border-main text-text-main'
                          }`}
                          style={{ borderColor: isSelected ? branding.primaryColor : undefined } as any}
                        >
                          <span>{opt.label}</span>
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-primary bg-primary' : 'border-border-main'
                          }`} style={{ borderColor: isSelected ? branding.primaryColor : undefined, backgroundColor: isSelected ? branding.primaryColor : undefined } as any}>
                            {isSelected && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentBlock.type === 'matrix' && (
                  <div className="overflow-x-auto -mx-10 px-10">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-4 text-left bg-bg-main/50 rounded-tl-2xl"></th>
                          {currentBlock.matrixCols?.map((col) => (
                            <th key={col.value} className="p-4 text-center bg-bg-main/50 text-[10px] font-bold text-text-muted uppercase tracking-widest last:rounded-tr-2xl">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentBlock.matrixRows?.map((row) => (
                          <tr key={row.code} className="border-b border-border-main/50 last:border-0">
                            <td className="p-4 text-sm font-bold text-text-main">{row.label}</td>
                            {currentBlock.matrixCols?.map((col) => (
                              <td key={col.value} className="p-4 text-center">
                                <button
                                  onClick={() => {
                                    const currentMatrix = responses[currentBlock.id] || {};
                                    setResponses({ 
                                      ...responses, 
                                      [currentBlock.id]: { ...currentMatrix, [row.code]: col.value } 
                                    });
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 mx-auto transition-all flex items-center justify-center ${
                                    responses[currentBlock.id]?.[row.code] === col.value
                                      ? 'border-primary bg-primary'
                                      : 'border-border-main hover:border-primary/50'
                                  }`}
                                  style={{ 
                                    borderColor: responses[currentBlock.id]?.[row.code] === col.value ? branding.primaryColor : undefined,
                                    backgroundColor: responses[currentBlock.id]?.[row.code] === col.value ? branding.primaryColor : undefined
                                  } as any}
                                >
                                  {responses[currentBlock.id]?.[row.code] === col.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {currentBlock.type === 'text' && (
                  <textarea
                    value={responses[currentBlock.id] || ''}
                    onChange={(e) => setResponses({ ...responses, [currentBlock.id]: e.target.value })}
                    className="w-full p-5 bg-bg-main border border-border-main rounded-[24px] focus:ring-2 outline-none min-h-[180px] transition-all"
                    style={{ '--tw-ring-color': branding.primaryColor + '33' } as any}
                    placeholder={currentBlock.placeholder || 'Nhập câu trả lời của bạn...'}
                  />
                )}

                {currentBlock.type === 'content' && (
                  <div className="prose prose-blue max-w-none text-text-muted leading-relaxed bg-bg-main p-6 rounded-2xl border border-border-main border-dashed">
                    {currentBlock.description}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-border-main p-6 sticky bottom-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentBlockIndex === -1}
            className="flex items-center gap-2 px-8 py-4 text-text-muted font-bold disabled:opacity-0 hover:text-text-main transition-all"
          >
            <ChevronLeft size={20} />
            Quay lại
          </button>

          {isLastBlock ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl disabled:opacity-50"
              style={{ backgroundColor: branding.primaryColor, boxShadow: `0 10px 25px -5px ${branding.primaryColor}44` }}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              Hoàn thành
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl"
              style={{ backgroundColor: branding.primaryColor, boxShadow: `0 10px 25px -5px ${branding.primaryColor}44` }}
            >
              Tiếp theo
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default SurveyRunner;
