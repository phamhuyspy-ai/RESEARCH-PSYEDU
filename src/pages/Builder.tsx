
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useBuilderStore } from '../stores/builderStore';
import { Survey, SurveyBlock, ScoreGroup, AlertRule } from '../types';
import { 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Palette,
  Layout,
  Settings as SettingsIcon
} from 'lucide-react';
import { gasService } from '../services/gasService';

// Components
import BuilderHeader from '../components/builder/BuilderHeader';
import Toolbox from '../components/builder/Toolbox';
import Canvas from '../components/builder/Canvas';
import ConfigPanel from '../components/builder/ConfigPanel';
import ResultConfigModal from '../components/builder/ResultConfigModal';

const Builder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    addScoreGroup,
    updateScoreGroup,
    removeScoreGroup,
    addAlert,
    updateAlert,
    removeAlert
  } = useBuilderStore();
  
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'branding'>('builder');

  useEffect(() => {
    if (id) {
      const survey = surveys.find(s => s.id === id);
      if (survey) {
        setActiveSurvey(JSON.parse(JSON.stringify(survey)));
      }
    } else {
      const newSurvey: Survey = {
        id: Math.random().toString(36).substr(2, 9),
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
      updatedAt: new Date().toISOString(),
    };

    try {
      // Sync with GAS
      const response = await gasService.syncSchema(updatedSurvey);
      
      if (response.success) {
        if (id) {
          updateSurvey(updatedSurvey);
        } else {
          addSurvey(updatedSurvey);
          navigate(`/admin/builder/${updatedSurvey.id}`, { replace: true });
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {activeTab === 'builder' ? (
          <>
            {/* Left: Toolbox */}
            <div className="lg:col-span-2">
              <Toolbox onAddBlock={handleAddBlock} />
            </div>

            {/* Center: Canvas */}
            <div className="lg:col-span-6">
              <Canvas 
                blocks={activeSurvey.blocks}
                activeBlockId={activeBlockId}
                onSelectBlock={setActiveBlockId}
                onRemoveBlock={removeBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onUpdateBlock={updateBlock}
              />
            </div>

            {/* Right: ConfigPanel */}
            <div className="lg:col-span-4">
              <ConfigPanel 
                block={activeBlock}
                scoreGroups={activeSurvey.scoreGroups}
                onUpdateBlock={updateBlock}
              />
            </div>
          </>
        ) : (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-panel space-y-6">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Palette size={16} className="text-primary" />
                Cấu hình thương hiệu riêng
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Logo URL riêng cho form này</label>
                  <input
                    type="text"
                    value={activeSurvey.branding?.logoUrl || ''}
                    onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Màu chủ đạo</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeSurvey.branding?.primaryColor || '#3b82f6'}
                        onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                        className="h-9 w-12 p-1 border border-border-main rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={activeSurvey.branding?.primaryColor || '#3b82f6'}
                        onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Màu nền</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeSurvey.branding?.backgroundColor || '#f8fafc'}
                        onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
                        className="h-9 w-12 p-1 border border-border-main rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={activeSurvey.branding?.backgroundColor || '#f8fafc'}
                        onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs font-mono"
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
        )}
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
