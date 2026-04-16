
import React from 'react';
import { 
  Save, 
  Send, 
  ChevronLeft, 
  Settings, 
  Loader2,
  Play,
  Square
} from 'lucide-react';
import { Survey } from '../../types';
import { useNavigate } from 'react-router-dom';

interface BuilderHeaderProps {
  survey: Survey;
  isSaving: boolean;
  onSave: (publish?: boolean) => void;
  onUpdateMeta: (meta: Partial<Survey>) => void;
  onOpenResultConfig: () => void;
  onToggleToolbox?: () => void;
}

const BuilderHeader: React.FC<BuilderHeaderProps> = ({ 
  survey, 
  isSaving, 
  onSave, 
  onUpdateMeta,
  onOpenResultConfig,
  onToggleToolbox
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-border-main shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {onToggleToolbox && (
          <button 
            onClick={onToggleToolbox}
            className="p-2 hover:bg-bg-main rounded-lg text-text-muted transition-colors lg:hidden"
          >
            <Settings size={20} />
          </button>
        )}
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-bg-main rounded-lg text-text-muted transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="h-8 w-[1px] bg-border-main" />
        <div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={survey.name}
              onChange={(e) => onUpdateMeta({ name: e.target.value })}
              className="text-lg font-bold text-text-main border-none focus:ring-0 p-0 bg-transparent min-w-[200px]"
              placeholder="Tên bảng hỏi..."
            />
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              survey.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {survey.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              survey.collectionStatus === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
            }`}>
              {survey.collectionStatus === 'open' ? 'Đang mở' : 'Đã đóng'}
            </span>
          </div>
          <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-0.5">
            Code: {survey.code}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenResultConfig}
          className="btn-secondary text-xs"
        >
          <Settings size={14} className="mr-2" />
          Cấu hình kết quả
        </button>
        
        <div className="h-8 w-[1px] bg-border-main mx-1" />

        <button
          onClick={() => onSave(false)}
          disabled={isSaving}
          className="btn-secondary text-xs"
        >
          {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} className="mr-2" />}
          Lưu nháp
        </button>

        <button
          onClick={() => onSave(true)}
          disabled={isSaving}
          className="btn-primary text-xs"
        >
          <Send size={14} className="mr-2" />
          Xuất bản
        </button>

        <button
          onClick={() => onUpdateMeta({ collectionStatus: survey.collectionStatus === 'open' ? 'closed' : 'open' })}
          className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
            survey.collectionStatus === 'open' 
              ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' 
              : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          title={survey.collectionStatus === 'open' ? 'Đóng thu thập' : 'Mở thu thập'}
        >
          {survey.collectionStatus === 'open' ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>
    </div>
  );
};

export default BuilderHeader;
