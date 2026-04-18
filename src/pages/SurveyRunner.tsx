
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Survey, Submission, SurveyBlock } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Info
} from 'lucide-react';
import { gasService } from '../services/gasService';
import { Chatbot } from '../components/Chatbot';

const SurveyRunner: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { surveys } = useAppStore();
  const globalSettings = useSettingsStore();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(-1); // -1 for intro/contact
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '', org: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const mainRef = useRef<HTMLElement>(null);

  const pages = React.useMemo(() => {
    if (!survey) return [];
    const _pages: SurveyBlock[][] = [];
    let _currentPage: SurveyBlock[] = [];
    
    survey.blocks.forEach(block => {
      if (block.type === 'contact') return; // Handled separately
      
      if (block.type === 'section') {
        if (_currentPage.length > 0) {
          _pages.push(_currentPage);
        }
        _currentPage = [block];
      } else if (block.type === 'matrix') {
        if (_currentPage.length === 1 && _currentPage[0].type === 'section') {
          _currentPage.push(block);
          _pages.push(_currentPage);
          _currentPage = [];
        } else {
          if (_currentPage.length > 0) {
            _pages.push(_currentPage);
          }
          _pages.push([block]);
          _currentPage = [];
        }
      } else {
        _currentPage.push(block);
      }
    });
    
    if (_currentPage.length > 0) {
      _pages.push(_currentPage);
    }
    
    return _pages;
  }, [survey]);

  useEffect(() => {
    const found = surveys.find(s => s.code === code && s.status === 'published');
    if (found) {
      if (found.collectionStatus === 'closed') {
        setError('Bảng hỏi này hiện đang đóng thu thập phản hồi.');
      } else {
        setSurvey(found);
        document.title = `${found.name} - ${globalSettings.orgName || 'PsyEdu'}`;
      }
    } else {
      setError('Không tìm thấy bảng hỏi hoặc bảng hỏi chưa được xuất bản.');
    }
  }, [code, surveys, globalSettings.orgName]);

  const handleNext = () => {
    if (currentPageIndex === -1) {
      const contactBlock = survey?.blocks.find(b => b.type === 'contact');
      const fields = contactBlock?.contactFields || { name: true, email: true, phone: true, org: true };
      
      if ((fields.name && !contactInfo.name) || (fields.email && !contactInfo.email)) {
        alert('Vui lòng điền đầy đủ thông tin liên hệ bắt buộc.');
        return;
      }
    } else {
      const currentBlocks = pages[currentPageIndex];
      const hasUnanswered = currentBlocks?.some(b => {
        if (!b.required || b.type === 'content' || b.type === 'section') return false;
        const ans = responses[b.id];
        if (ans === undefined || ans === null) return true;
        if (typeof ans === 'string' && ans.trim() === '') return true;
        if (Array.isArray(ans) && ans.length === 0) return true;
        if (b.type === 'matrix') {
          // Check if all rows have an answer
          const matrixAns = ans as Record<string, any>;
          return b.matrixRows?.some(r => {
            const rowAns = matrixAns[r.code];
            if (!rowAns) return true;
            if (typeof rowAns === 'object') return Object.keys(rowAns).length === 0;
            return false;
          });
        }
        return false;
      });
      if (hasUnanswered) {
        alert('Vui lòng hoàn thành các câu hỏi bắt buộc trước khi tiếp tục.');
        return;
      }
    }
    setCurrentPageIndex(prev => prev + 1);
    setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handlePrev = () => {
    setCurrentPageIndex(prev => prev - 1);
    setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
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
        Object.entries(response).forEach(([rowCode, rowData]) => {
          if (typeof rowData === 'object' && rowData !== null) {
            Object.entries(rowData).forEach(([colValue, answer]) => {
              const col = block.matrixCols?.find(c => c.value === colValue);
              if (col) {
                const colType = col.type || 'single_choice';
                if (colType === 'single_choice' || colType === 'multi_choice') {
                  if (answer) score += (col.score || 0);
                } else if (colType === 'number') {
                  if (answer !== '') score += (col.score || 0);
                } else if (colType === 'text') {
                  if (answer) score += (col.score || 0);
                }
              }
            });
          } else {
            // Legacy support
            const col = block.matrixCols?.find(c => c.value === rowData);
            if (col) score += (col.score || 0);
          }
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
          // Flatten matrix answers: { "R1": { "C1": true, "C2": "text" } } -> { "Q1_R1_C1": true, "Q1_R1_C2": "text" }
          // Legacy: { "R1": "C1" } -> { "Q1_R1": "C1" }
          Object.keys(answer).forEach(rowCode => {
            const rowData = answer[rowCode];
            if (typeof rowData === 'object' && rowData !== null) {
              Object.keys(rowData).forEach(colValue => {
                const isSingleChoiceLike = rowData[colValue] === true && !block.matrixCols?.find(c => c.value === colValue)?.type; // If type is undefined, it's single choice
                const colType = block.matrixCols?.find(c => c.value === colValue)?.type || 'single_choice';
                
                if (colType === 'single_choice') {
                   // Only the selected column will be true
                   if (rowData[colValue] === true) {
                      mappedResponses[`${block.code}_${rowCode}`] = colValue;
                   }
                } else {
                   // Multi choice, text, number
                   if (rowData[colValue]) {
                      mappedResponses[`${block.code}_${rowCode}_${colValue}`] = rowData[colValue];
                   }
                }
              });
            } else {
              mappedResponses[`${block.code}_${rowCode}`] = rowData;
            }
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
      const response = await gasService.submitResponse({ surveyId: survey.id, surveyCode: survey.code, submission });
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

  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';

  if (!survey) return null;

  const pagesCount = pages.length;
  const isLastBlock = currentPageIndex === pagesCount - 1;
  const branding = survey.branding || { primaryColor: '#3b82f6', backgroundColor: '#f8fafc' };
  const contactBlock = survey.blocks?.find(b => b.type === 'contact');
  const contactFields = contactBlock?.contactFields || { name: true, email: true, phone: true, org: true };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: branding.backgroundColor }}>
      {/* Header - hide if embedded */}
      {!isEmbed && (
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
              <span className="font-bold text-text-main tracking-tight">{globalSettings.orgName}</span>
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-main px-2 py-1 rounded">
              {currentPageIndex === -1 ? 'Thông tin' : `Phần ${currentPageIndex + 1}/${pagesCount}`}
            </div>
          </div>
        </header>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-bg-main h-1.5">
        <div 
          className="h-full transition-all duration-700 ease-out" 
          style={{ 
            width: `${((currentPageIndex + 2) / (pagesCount + 1)) * 100}%`,
            backgroundColor: branding.primaryColor
          }}
        />
      </div>

      {/* Content */}
      <main ref={mainRef} className="flex-1 p-4 md:p-12 overflow-auto scroll-smooth">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {currentPageIndex === -1 ? (
              <motion.div 
                key="contact-block" 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-10 rounded-[32px] shadow-sm border border-border-main space-y-10"
              >
              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-text-main mb-4 tracking-tight leading-tight"><span>{survey.name}</span></h1>
                <p className="text-text-muted leading-relaxed"><span>{survey.description}</span></p>
              </div>

              <div className="space-y-6 pt-6 border-t border-border-main/50">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} /> Thông tin người tham gia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contactFields.name && (
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
                  )}
                  {contactFields.email && (
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
                  )}
                  {contactFields.phone && (
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
                  )}
                  {contactFields.org && (
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
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={`page-${currentPageIndex}`} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {pages[currentPageIndex]?.map((currentBlock) => (
                <div key={`block-${currentBlock.id}`} className={`bg-white p-10 shadow-sm border border-border-main space-y-8 ${currentBlock.type === 'section' ? 'rounded-3xl border-l-8 text-center' : 'rounded-[32px]'}`} style={{ borderLeftColor: currentBlock.type === 'section' ? branding.primaryColor : undefined }}>
                  {currentBlock.type === 'section' ? (
                    <div>
                      <h2 className="text-3xl font-bold text-text-main mb-3 leading-tight">
                        <span>{currentBlock.title}</span>
                      </h2>
                      {currentBlock.description && <p className="text-text-muted text-base leading-relaxed"><span>{currentBlock.description}</span></p>}
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-2xl font-bold text-text-main mb-3 leading-tight">
                          <span>{currentBlock.title}</span>
                          {currentBlock.required && <span className="text-red-500 ml-1">*</span>}
                        </h2>
                        {currentBlock.description && <p className="text-text-muted text-sm leading-relaxed"><span>{currentBlock.description}</span></p>}
                        {currentBlock.helpText && <p className="text-text-muted/60 text-[11px] mt-2 italic"><span>💡 {currentBlock.helpText}</span></p>}
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
                                    {currentBlock.matrixCols?.map((col) => {
                                      const cellValue = responses[currentBlock.id]?.[row.code]?.[col.value] || 
                                                        (responses[currentBlock.id]?.[row.code] === col.value ? true : '');
                                      const colType = col.type || 'single_choice';

                                      return (
                                        <td key={col.value} className="p-4 text-center">
                                          {colType === 'single_choice' && (
                                            <button
                                              onClick={() => {
                                                const currentMatrix = responses[currentBlock.id] || {};
                                                const currentRowData = typeof currentMatrix[row.code] === 'object' ? { ...currentMatrix[row.code] } : {};
                                                
                                                // Clear other single_choice columns in this row
                                                currentBlock.matrixCols?.forEach(c => {
                                                  if ((c.type || 'single_choice') === 'single_choice') {
                                                    delete currentRowData[c.value];
                                                  }
                                                });
                                                
                                                currentRowData[col.value] = true;

                                                setResponses({ 
                                                  ...responses, 
                                                  [currentBlock.id]: { ...currentMatrix, [row.code]: currentRowData } 
                                                });
                                              }}
                                              className={`w-6 h-6 rounded-full border-2 mx-auto transition-all flex items-center justify-center ${
                                                cellValue === true
                                                  ? 'border-primary bg-primary'
                                                  : 'border-border-main hover:border-primary/50'
                                              }`}
                                              style={{ 
                                                borderColor: cellValue === true ? branding.primaryColor : undefined,
                                                backgroundColor: cellValue === true ? branding.primaryColor : undefined
                                              } as any}
                                            >
                                              {cellValue === true && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </button>
                                          )}
                                          {colType === 'multi_choice' && (
                                            <button
                                              onClick={() => {
                                                const currentMatrix = responses[currentBlock.id] || {};
                                                const currentRowData = typeof currentMatrix[row.code] === 'object' ? { ...currentMatrix[row.code] } : {};
                                                
                                                if (currentRowData[col.value]) {
                                                  delete currentRowData[col.value];
                                                } else {
                                                  currentRowData[col.value] = true;
                                                }

                                                setResponses({ 
                                                  ...responses, 
                                                  [currentBlock.id]: { ...currentMatrix, [row.code]: currentRowData } 
                                                });
                                              }}
                                              className={`w-6 h-6 rounded border-2 mx-auto transition-all flex items-center justify-center ${
                                                cellValue === true
                                                  ? 'border-primary bg-primary'
                                                  : 'border-border-main hover:border-primary/50'
                                              }`}
                                              style={{ 
                                                borderColor: cellValue === true ? branding.primaryColor : undefined,
                                                backgroundColor: cellValue === true ? branding.primaryColor : undefined
                                              } as any}
                                            >
                                              {cellValue === true && <CheckCircle2 size={14} className="text-white" />}
                                            </button>
                                          )}
                                          {colType === 'text' && (
                                            <input
                                              type="text"
                                              value={cellValue as string || ''}
                                              onChange={(e) => {
                                                const currentMatrix = responses[currentBlock.id] || {};
                                                const currentRowData = typeof currentMatrix[row.code] === 'object' ? { ...currentMatrix[row.code] } : {};
                                                currentRowData[col.value] = e.target.value;
                                                setResponses({ 
                                                  ...responses, 
                                                  [currentBlock.id]: { ...currentMatrix, [row.code]: currentRowData } 
                                                });
                                              }}
                                              className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm focus:border-primary outline-none"
                                              placeholder="Nhập..."
                                            />
                                          )}
                                          {colType === 'number' && (
                                            <input
                                              type="number"
                                              value={cellValue as string || ''}
                                              onChange={(e) => {
                                                const currentMatrix = responses[currentBlock.id] || {};
                                                const currentRowData = typeof currentMatrix[row.code] === 'object' ? { ...currentMatrix[row.code] } : {};
                                                currentRowData[col.value] = e.target.value;
                                                setResponses({ 
                                                  ...responses, 
                                                  [currentBlock.id]: { ...currentMatrix, [row.code]: currentRowData } 
                                                });
                                              }}
                                              className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm focus:border-primary outline-none"
                                              placeholder="0"
                                            />
                                          )}
                                        </td>
                                      );
                                    })}
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
                            <span>{currentBlock.description}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-border-main p-6 sticky bottom-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentPageIndex === -1}
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
      <Chatbot />
    </div>
  );
};

export default SurveyRunner;
