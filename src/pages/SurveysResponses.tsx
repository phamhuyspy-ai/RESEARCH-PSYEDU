import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gasService } from '../services/gasService';
import { Survey, Submission } from '../types';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Calendar,
  User,
  Hash,
  ArrowUpDown,
  FileSpreadsheet,
  FileDown,
  ExternalLink
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const SurveysResponses: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [responses, setResponses] = useState<any[]>([]);
  const [rawResponses, setRawResponses] = useState<any[][]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [surveySearchTerm, setSurveySearchTerm] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (selectedSurveyId) {
      fetchResponses();
    }
  }, [selectedSurveyId]);

  const fetchSurveys = async () => {
    setIsLoading(true);
    try {
      const response = await gasService.getSurveys();
      if (response.success && Array.isArray(response.data)) {
        setSurveys(response.data);
        if (response.data.length > 0) {
          setSelectedSurveyId(response.data[0].id);
        }
      } else {
        setError(response.message || 'Không thể tải danh sách bảng hỏi.');
      }
    } catch (err) {
      setError('Kết nối máy chủ thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResponses = async () => {
    if (!selectedSurveyId) return;
    setIsLoading(true);
    setResponses([]);
    try {
      const survey = surveys.find(s => s.id === selectedSurveyId);
      const sheetName = survey?.name || 'KetQua_TongHop';
      
      // Try new endpoint first, which searches by sheetName automatically
      let response = await gasService.request('get_sheet_data', { sheetName });
      
      if (!response.success || !response.data) {
        // Fallback to get_full_responses
        response = await gasService.request('get_full_responses', { surveyId: selectedSurveyId, sheetName });
      }

      if (response.success && response.data) {
        // If data is returned directly as a 2D array (e.g. from get_sheet_data), wrap it in expected structure
        let data = Array.isArray(response.data) ? { responses: response.data, questions: [] } : response.data;
        
        setQuestions(data.questions || []);
        
        // Merge details into responses if they exist, otherwise assume wide format
        if (data.details) {
          const merged = (data.responses || []).map((resp: any) => {
            const respDetails = (data.details || []).filter((d: any) => d.PhanHoiID === resp.ID);
            const answers: Record<string, any> = {};
            respDetails.forEach((d: any) => {
              answers[d.CauHoiID] = d.GiaTri;
            });
            return { ...resp, answers };
          });
          setResponses(merged);
        } else {
          // New architecture: data.responses is already in suitable format (Wide)
          // We might need to map it if it's raw sheet data (array of arrays)
          if (Array.isArray(data.responses) && data.responses.length > 0) {
            
            // Check if it's a 2D array (e.g. from Google Sheets getValues())
            if (Array.isArray(data.responses[0])) {
              setRawResponses(data.responses); // Save raw data for Excel export
              const [headers, ...rows] = data.responses;
              const mapped = rows.map((row: any[]) => {
                const obj: any = { answers: {} };
                for (let idx = 0; idx < headers.length; idx++) {
                  const header = headers[idx];
                  if (['ResponseID', 'Timestamp', 'Name', 'Email', 'Phone', 'Org', 'TotalScore', 'Interpretation', 'GroupScores'].includes(header)) {
                    const map: any = { 
                      'ResponseID': 'ID', 
                      'Timestamp': 'NgayTao', 
                      'Name': 'HoTen', 
                      'Email': 'Email', 
                      'Phone': 'SoDienThoai', 
                      'TotalScore': 'TongDiem',
                      'Interpretation': 'PhanLoai',
                      'Org': 'ToChuc',
                      'GroupScores': 'DiemThanhPhan'
                    };
                    obj[map[header] || header] = row[idx];
                  } else {
                    obj.answers[header] = row[idx];
                  }
                }
                return obj;
              });
              setResponses(mapped);
            } else {
              // It is an array of objects (Legacy fallback)
              // Just pass it directly but ensure the format is safe
              const mapped = data.responses.map((resp: any) => ({
                ...resp,
                answers: resp.answers || {}
              }));
              setResponses(mapped);
              // For export, we don't have raw 2d array, so it will fallback to manual mapping in exportToExcel
              setRawResponses([]); 
            }
          } else {
            setResponses([]);
          }
        }
      } else {
        setError(response.message || 'Không thể tải dữ liệu phản hồi.');
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải phản hồi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    exportToExcel(surveys, selectedSurveyId, responses, rawResponses, questions);
    setIsExporting(false);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    exportToPDF(surveys, selectedSurveyId, responses);
    setIsExporting(false);
  };

  const filteredResponses = [...responses]
    .sort((a, b) => new Date(b.NgayTao).getTime() - new Date(a.NgayTao).getTime())
    .filter(r => {
      const search = searchTerm.toLowerCase();
      const nameStr = String(r.HoTen || '').toLowerCase();
      const emailStr = String(r.Email || '').toLowerCase();
      const phoneStr = String(r.SoDienThoai || '').toLowerCase();
      return nameStr.includes(search) || emailStr.includes(search) || phoneStr.includes(search);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">Kết quả khảo sát</h1>
            <p className="text-sm text-text-muted">Quản lý và xuất dữ liệu phản hồi từ người dùng</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportExcel}
            disabled={isExporting || responses.length === 0}
            className="btn-secondary px-4 py-2.5 flex items-center gap-2 text-sm bg-white border-2 border-border-main hover:border-primary transition-all"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Xuất Excel
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting || responses.length === 0}
            className="btn-secondary px-4 py-2.5 flex items-center gap-2 text-sm bg-white border-2 border-border-main hover:border-primary transition-all"
          >
             {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            Báo cáo PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Survey Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[24px] border border-border-main shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
              <Filter size={14} />
              Chọn bảng hỏi
            </h3>
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Tìm bảng hỏi..."
                value={surveySearchTerm}
                onChange={(e) => setSurveySearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-bg-main border border-border-main rounded-xl text-xs focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {Array.isArray(surveys) && surveys.filter(s => {
                const term = surveySearchTerm.toLowerCase();
                const sName = String(s.name || '').toLowerCase();
                const sCode = String(s.code || '').toLowerCase();
                return sName.includes(term) || sCode.includes(term);
              }).map(survey => (
                <button
                  key={survey.id}
                  onClick={() => setSelectedSurveyId(survey.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    selectedSurveyId === survey.id 
                    ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' 
                    : 'border-transparent hover:bg-bg-main text-text-main'
                  }`}
                >
                  <div className="text-sm font-bold truncate">{survey.name}</div>
                  <div className="text-[10px] mt-1 opacity-60 uppercase font-bold tracking-wider">{survey.code}</div>
                </button>
              ))}
              {surveys.length === 0 && !isLoading && (
                <div className="text-center py-10">
                  <p className="text-xs text-text-muted">Chưa có bảng hỏi nào</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Response Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[24px] border border-border-main shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-border-main flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-bg-main border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted bg-bg-main px-4 py-2 rounded-xl">
                <Hash size={14} />
                Tổng cộng: <span className="text-text-main ml-1">{filteredResponses.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-main">
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Người nộp</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Thông tin liên hệ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Kết quả</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Thời gian</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="animate-spin text-primary" size={32} />
                          <p className="text-sm text-text-muted font-bold animate-pulse">Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredResponses.length > 0 ? (
                    filteredResponses.map((r) => (
                      <tr key={r.ID} className="hover:bg-bg-main/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">
                              {String(r.HoTen || '').charAt(0) || <User size={18} />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-text-main leading-tight">{r.HoTen || 'Ẩn danh'}</div>
                              <div className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-tight">ID: {r.ID}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2 text-text-main font-medium">
                              <span className="opacity-40">@</span> {r.Email || 'No Email'}
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                              <span className="opacity-40">#</span> {r.SoDienThoai || 'No Phone'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="text-lg font-black text-primary">{r.TongDiem}</div>
                            <div className="px-2.5 py-1 bg-primary/5 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest rounded-lg">
                              {r.PhanLoai}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Calendar size={14} className="opacity-40" />
                            {new Date(r.NgayTao).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/survey/${selectedSurveyId}/results/${r.ID}`, { state: { submission: r, survey: surveys.find(s => s.id === selectedSurveyId) } })}
                            className="p-2 text-text-muted hover:text-primary hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                          <AlertCircle size={48} />
                          <p className="text-sm font-bold">Không tìm thấy phản hồi nào</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveysResponses;
