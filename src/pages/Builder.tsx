
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useBuilderStore } from '../stores/builderStore';
import { useAuthStore } from '../stores/authStore';
import { Survey, SurveyBlock, ScoreGroup, AlertRule } from '../types';
import { 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Palette,
  Layout,
  Settings as SettingsIcon,
  Share2,
  Copy,
  Download,
  Plus
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { gasService } from '../services/gasService';

// Components
import BuilderHeader from '../components/builder/BuilderHeader';
import Toolbox from '../components/builder/Toolbox';
import Canvas from '../components/builder/Canvas';
import ConfigPanel from '../components/builder/ConfigPanel';
import ResultConfigModal from '../components/builder/ResultConfigModal';
import DraggableFloatingPanel from '../components/builder/DraggableFloatingPanel';
import LivePreview from '../components/builder/LivePreview';

const Builder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { surveys, addSurvey, updateSurvey } = useAppStore();
  const { 
    activeSurvey, 
    setActiveSurvey, 
    updateSurveyMeta,
    updateSurveySettings,
    updateBranding,
    addBlock, 
    updateBlock, 
    removeBlock, 
    reorderBlocks,
    moveBlockUp,
    moveBlockDown,
    addScoreGroup,
    updateScoreGroup,
    removeScoreGroup,
    addAlert,
    updateAlert,
    removeAlert
  } = useBuilderStore();
  
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'branding' | 'publish'>('builder');
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);

  // Auto-close toolbox on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsToolboxOpen(false);
      } else {
        setIsToolboxOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeSurvey?.id === id && id) return;

    if (id) {
      const survey = surveys.find(s => s.id === id);
      if (survey) {
        setActiveSurvey(JSON.parse(JSON.stringify(survey)));
      }
    } else if (!activeSurvey || activeSurvey.id !== 'new') {
      const newSurvey: Survey = {
        id: 'new',
        code: `SURVEY_${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        name: 'Bảng hỏi mới',
        description: 'Mô tả bảng hỏi của bạn',
        type: 'survey',
        status: 'draft',
        collectionStatus: 'closed',
        blocks: [],
        scoreGroups: [],
        settings: {
          showResults: true,
          showRadarChart: false,
          sendEmail: false,
          thankYouMessage: 'Cảm ơn bạn đã tham gia khảo sát!',
          alerts: [],
        },
        branding: {
          primaryColor: '#3b82f6',
          backgroundColor: '#f8fafc',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveSurvey(newSurvey);
    }
  }, [id, surveys, setActiveSurvey]);

  const handleSave = async (publish = false) => {
    if (!activeSurvey) return;
    
    setIsSaving(true);
    setSaveMessage(null);

    const updatedSurvey: Survey = {
      ...activeSurvey,
      status: publish ? 'published' : activeSurvey.status,
      collectionStatus: publish ? 'open' : activeSurvey.collectionStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Sync with GAS
      const response = await gasService.saveSurvey(updatedSurvey);
      
      if (response.success) {
        // Use ID from server if provided (especially for new surveys)
        const savedId = response.data?.id || response.id || updatedSurvey.id;
        const savedSurvey = { ...updatedSurvey, id: savedId };
        
        if (id) {
          updateSurvey(savedSurvey);
        } else {
          addSurvey(savedSurvey);
          navigate(`/admin/builder/${savedId}`, { replace: true });
        }
        
        setSaveMessage({ text: publish ? 'Đã xuất bản thành công!' : 'Đã lưu nháp thành công!', type: 'success' });
      } else {
        setSaveMessage({ text: response.message || 'Lỗi khi đồng bộ với máy chủ.', type: 'error' });
      }
    } catch (err) {
      setSaveMessage({ text: 'Đã có lỗi xảy ra khi lưu.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({ text: 'Kích thước file quá lớn (tối đa 2MB).', type: 'error' });
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        const response = await gasService.uploadFile({
          fileName: file.name,
          fileType: file.type,
          base64Data: base64Data
        });

        if (response.success) {
          updateBranding({ logoUrl: response.url });
          setSaveMessage({ text: 'Tải logo lên thành công.', type: 'success' });
        } else {
          setSaveMessage({ text: response.message || 'Lỗi khi tải logo lên.', type: 'error' });
        }
      } catch (error) {
        setSaveMessage({ text: 'Lỗi kết nối khi tải logo.', type: 'error' });
      } finally {
        setIsUploadingLogo(false);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddBlock = (type: SurveyBlock['type']) => {
    const newBlock: SurveyBlock = {
      id: Math.random().toString(36).substr(2, 9),
      code: `Q${(activeSurvey?.blocks.length || 0) + 1}`,
      type,
      title: type === 'content' ? 'Nội dung mới' : 'Câu hỏi mới',
      description: '',
      required: type !== 'content',
      visible: true,
      options: (type === 'single_choice' || type === 'multi_choice' || type === 'likert') ? [
        { label: 'Lựa chọn 1', value: '1', score: 0 },
        { label: 'Lựa chọn 2', value: '2', score: 0 }
      ] : undefined,
      matrixRows: type === 'matrix' ? [
        { label: 'Hàng 1', code: 'R1' },
        { label: 'Hàng 2', code: 'R2' }
      ] : undefined,
      matrixCols: type === 'matrix' ? [
        { label: 'Cột 1', value: 'C1', score: 0 },
        { label: 'Cột 2', value: 'C2', score: 0 }
      ] : undefined,
      scoreEnabled: false
    };
    addBlock(newBlock);
    setActiveBlockId(newBlock.id);
  };

  const handleDuplicateBlock = (block: SurveyBlock) => {
    const duplicated: SurveyBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: Math.random().toString(36).substr(2, 9),
      code: `${block.code}_COPY`,
    };
    addBlock(duplicated);
    setActiveBlockId(duplicated.id);
  };

  if (!activeSurvey) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const activeBlock = activeSurvey.blocks.find(b => b.id === activeBlockId) || null;

  const getPublicDomain = () => {
    // If inside AI Studio or Sandbox, force the public Vercel domain so QR/Iframes work externally
    if (window.location.hostname.includes('googleusercontent.com') || window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost')) {
      return 'https://syedu.vercel.app';
    }
    return window.location.origin;
  };

  const surveyUrl = activeSurvey ? `${getPublicDomain()}/survey/${activeSurvey.code}` : '';

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <BuilderHeader 
        survey={activeSurvey}
        isSaving={isSaving}
        onSave={handleSave}
        onUpdateMeta={updateSurveyMeta}
        onOpenResultConfig={() => setIsResultModalOpen(true)}
      />

      {saveMessage && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border animate-in slide-in-from-top-2 duration-300 ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {saveMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {saveMessage.text}
        </div>
      )}

      {/* Tabs for Builder vs Branding */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-border-main w-fit">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'builder' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-bg-main'
          }`}
        >
          <Layout size={14} />
          Xây dựng bảng hỏi
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'branding' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-bg-main'
          }`}
        >
          <Palette size={14} />
          Thương hiệu & Giao diện
        </button>
        <button
          onClick={() => setActiveTab('publish')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'publish' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-bg-main'
          }`}
        >
          <Share2 size={14} />
          Xuất bản & Chia sẻ
        </button>
      </div>

      <div className="flex gap-6 items-start relative">
        {activeTab === 'builder' ? (
          <>
            {/* Draggable Toolbox */}
            <div className="hidden lg:block">
              <DraggableFloatingPanel 
                title="Công cụ" 
                defaultPosition={{ x: 260, y: 100 }}
              >
                <Toolbox onAddBlock={handleAddBlock} />
              </DraggableFloatingPanel>
            </div>
            
            {/* Mobile Toolbox */}
            <div className={`lg:hidden transition-all duration-300 ease-in-out ${
              isToolboxOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full overflow-hidden'
            } absolute z-20 bg-bg-main h-full flex-shrink-0`}>
              <div className="w-64">
                <Toolbox onAddBlock={handleAddBlock} />
              </div>
            </div>

            {/* Center: Canvas */}
            <div className="flex-1 transition-all duration-300 ease-in-out w-full max-w-2xl mx-auto">
              <Canvas 
                blocks={activeSurvey.blocks}
                activeBlockId={activeBlockId}
                scoreGroups={activeSurvey.scoreGroups}
                onSelectBlock={setActiveBlockId}
                onRemoveBlock={removeBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onUpdateBlock={updateBlock}
                onMoveBlockUp={moveBlockUp}
                onMoveBlockDown={moveBlockDown}
              />
            </div>

            {/* Right: Preview Pane */}
            <div className="hidden xl:block w-[375px] flex-shrink-0">
              <LivePreview />
            </div>
            
            {/* Draggable Config Panel (Desktop) */}
            {activeBlockId && (
              <div className="hidden lg:block">
                <DraggableFloatingPanel 
                  title="Cấu hình Block" 
                  defaultPosition={{ x: Math.max(280, window.innerWidth - 420), y: 100 }}
                  width="w-96"
                  id={activeBlockId}
                >
                  <ConfigPanel 
                    block={activeBlock}
                    scoreGroups={activeSurvey.scoreGroups}
                    onUpdateBlock={updateBlock}
                    onClose={() => setActiveBlockId(null)}
                  />
                </DraggableFloatingPanel>
              </div>
            )}
            
            {/* Mobile Config Panel Overlay */}
            {activeBlockId && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex justify-end">
                <div className="w-full max-w-sm bg-bg-main h-full overflow-y-auto animate-slide-in-right p-4">
                  <ConfigPanel 
                    block={activeBlock}
                    scoreGroups={activeSurvey.scoreGroups}
                    onUpdateBlock={updateBlock}
                    onClose={() => setActiveBlockId(null)}
                  />
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'branding' ? (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-panel space-y-6">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Palette size={16} className="text-primary" />
                Cấu hình thương hiệu riêng
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Logo riêng cho form</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activeSurvey.branding?.logoUrl || ''}
                      onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                      className="flex-1 px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="https://..."
                    />
                    <label className={`cursor-pointer flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-all ${isUploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingLogo ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} />}
                      Tải ảnh
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-main">Màu chính (Primary)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-muted">{activeSurvey.branding?.primaryColor || '#2E97A7'}</span>
                      <input
                        type="color"
                        value={activeSurvey.branding?.primaryColor || '#2E97A7'}
                        onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                        className="h-8 w-8 p-1 border border-border-main rounded-lg cursor-pointer bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-main">Màu phụ (Secondary)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-muted">{activeSurvey.branding?.secondaryColor || '#D49320'}</span>
                      <input
                        type="color"
                        value={activeSurvey.branding?.secondaryColor || '#D49320'}
                        onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                        className="h-8 w-8 p-1 border border-border-main rounded-lg cursor-pointer bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-main">Màu nền (Background)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-muted">{activeSurvey.branding?.backgroundColor || '#F8FAFC'}</span>
                      <input
                        type="color"
                        value={activeSurvey.branding?.backgroundColor || '#F8FAFC'}
                        onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
                        className="h-8 w-8 p-1 border border-border-main rounded-lg cursor-pointer bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Font chữ</label>
                  <select
                    value={activeSurvey.branding?.fontFamily || 'Inter'}
                    onChange={(e) => updateBranding({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="Inter">Inter (Mặc định)</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-panel h-full flex flex-col items-center justify-center text-center p-12 border-dashed border-2">
                <div 
                  className="w-20 h-20 rounded-2xl mb-6 shadow-xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: activeSurvey.branding?.primaryColor || '#3b82f6' }}
                >
                  {activeSurvey.branding?.logoUrl ? (
                    <img src={activeSurvey.branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-3" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-white font-bold text-3xl">P</span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-text-main mb-2">Xem trước thương hiệu</h4>
                <p className="text-xs text-text-muted max-w-xs">
                  Giao diện bảng hỏi sẽ được áp dụng các màu sắc và logo này khi người dùng truy cập.
                </p>
              </div>
            </div>
          </div>
        ) : activeTab === 'publish' ? (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-panel space-y-6">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Share2 size={16} className="text-primary" />
                Xuất bản & Chia sẻ
              </h3>
              
              {activeSurvey.status !== 'published' ? (
                <div className="text-center py-8 text-text-muted">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Bảng hỏi này đang ở trạng thái Nháp. Vui lòng lưu và xuất bản để lấy link chia sẻ.</p>
                </div>
              ) : (
                <div className="space-y-6">
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
                        onClick={() => {
                          navigator.clipboard.writeText(surveyUrl);
                          setSaveMessage({ text: 'Đã sao chép link', type: 'success' });
                          setTimeout(() => setSaveMessage(null), 3000);
                        }}
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
                        onClick={() => {
                          navigator.clipboard.writeText(`<iframe src="${surveyUrl}?embed=true" width="100%" height="600px" frameborder="0" style="border:none;"></iframe>`);
                          setSaveMessage({ text: 'Đã sao chép mã nhúng', type: 'success' });
                          setTimeout(() => setSaveMessage(null), 3000);
                        }}
                        className="absolute top-2 right-2 p-1 bg-white border border-border-main text-text-muted rounded hover:text-primary transition-colors"
                        title="Sao chép mã nhúng"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1">Dùng mã này để nhúng bảng hỏi vào website của bạn.</p>
                  </div>
                </div>
              )}
            </div>

            {activeSurvey.status === 'published' && (
              <div className="card-panel space-y-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-sm font-bold text-text-main flex items-center gap-2 w-full justify-start">
                  <Share2 size={16} className="text-primary" />
                  Mã QR
                </h3>
                <div className="bg-bg-main border border-border-main rounded-lg p-8 flex flex-col items-center justify-center gap-6 w-full max-w-sm">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-border-main">
                    <QRCodeSVG 
                      id="builder-qr-code"
                      value={surveyUrl} 
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const svg = document.getElementById('builder-qr-code');
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
                          downloadLink.download = `QR_${activeSurvey.id}.png`;
                          downloadLink.href = `${pngFile}`;
                          downloadLink.click();
                        };
                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Download size={16} />
                    Tải xuống QR Code
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Modals */}
      {isResultModalOpen && (
        <ResultConfigModal 
          survey={activeSurvey}
          onClose={() => setIsResultModalOpen(false)}
          onUpdateSettings={updateSurveySettings}
          onUpdateScoreGroups={(groups) => updateSurveyMeta({ scoreGroups: groups })}
        />
      )}
    </div>
  );
};

export default Builder;
