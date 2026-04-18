
import React from 'react';
import { 
  Settings, 
  Trash2, 
  Plus, 
  Info, 
  CheckCircle2,
  AlertCircle,
  Hash,
  Type,
  Eye,
  EyeOff,
  UserCircle,
  X
} from 'lucide-react';
import { SurveyBlock, ScoreGroup } from '../../types';

interface ConfigPanelProps {
  block: SurveyBlock | null;
  scoreGroups: ScoreGroup[];
  onUpdateBlock: (block: SurveyBlock) => void;
  onClose?: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  block,
  scoreGroups,
  onUpdateBlock,
  onClose
}) => {
  if (!block) return null;

  const handleUpdate = (updates: Partial<SurveyBlock>) => {
    onUpdateBlock({ ...block, ...updates });
  };

  return (
    <div className="card-panel sticky top-24 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between border-b border-border-main pb-4">
        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
          <Settings size={16} className="text-primary" />
          Cấu hình Block
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-main rounded-lg hover:bg-bg-main transition-all">
            <X size={16} />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          ID: {block.id}
        </span>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Hash size={10} /> Mã Block (Duy nhất)
          </label>
          <input
            type="text"
            value={block.code}
            onChange={(e) => handleUpdate({ code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
            className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Q1, DASS_1..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Type size={10} /> Tiêu đề
          </label>
          <textarea
            value={block.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            rows={3}
            placeholder="Nhập câu hỏi..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Mô tả / Hướng dẫn</label>
          <textarea
            value={block.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            rows={2}
            placeholder="Mô tả thêm cho người dùng..."
          />
        </div>
      </div>

      {/* Validation & Visibility */}
      {block.type !== 'section' && block.type !== 'content' && (
        <div className="pt-4 border-t border-border-main space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-text-muted" />
              <span className="text-xs font-medium text-text-main">Bắt buộc trả lời</span>
            </div>
            <button
              onClick={() => handleUpdate({ required: !block.required })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                block.required ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                block.required ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {block.visible !== false ? <Eye size={14} className="text-text-muted" /> : <EyeOff size={14} className="text-text-muted" />}
              <span className="text-xs font-medium text-text-main">Hiển thị</span>
            </div>
            <button
              onClick={() => handleUpdate({ visible: block.visible === false ? true : false })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                block.visible !== false ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                block.visible !== false ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* Contact Fields Configuration */}
      {block.type === 'contact' && (
        <div className="pt-4 border-t border-border-main space-y-4">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
            <UserCircle size={12} /> Cấu hình trường thông tin
          </h4>
          
          <div className="space-y-3">
            {['name', 'email', 'phone', 'org'].map((field) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-main">
                  {field === 'name' ? 'Họ và tên' : 
                   field === 'email' ? 'Email' : 
                   field === 'phone' ? 'Số điện thoại' : 'Cơ quan/Tổ chức'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={block.contactFields?.[field as keyof typeof block.contactFields] ?? true}
                    onChange={(e) => {
                      const currentFields = block.contactFields || { name: true, email: true, phone: true, org: true };
                      handleUpdate({ 
                        contactFields: { ...currentFields, [field]: e.target.checked } 
                      });
                    }}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Options Configuration */}
      {(block.type === 'single_choice' || block.type === 'multi_choice' || block.type === 'likert') && (
        <div className="pt-4 border-t border-border-main space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Danh sách đáp án</label>
            <button
              onClick={() => {
                const newOpts = [...(block.options || []), { label: 'Lựa chọn mới', value: Date.now().toString(), score: 0 }];
                handleUpdate({ options: newOpts });
              }}
              className="p-1 text-primary hover:bg-primary/5 rounded transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-2">
            {block.options?.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 group/opt">
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => {
                    const newOpts = [...(block.options || [])];
                    newOpts[idx].label = e.target.value;
                    handleUpdate({ options: newOpts });
                  }}
                  className="flex-1 px-2 py-1.5 bg-bg-main border border-border-main rounded text-[11px] focus:border-primary outline-none"
                />
                <input
                  type="number"
                  value={opt.score || 0}
                  onChange={(e) => {
                    const newOpts = [...(block.options || [])];
                    newOpts[idx].score = parseInt(e.target.value);
                    handleUpdate({ options: newOpts });
                  }}
                  className="w-10 px-1 py-1.5 bg-bg-main border border-border-main rounded text-[11px] text-center focus:border-primary outline-none"
                  title="Điểm"
                />
                <button
                  onClick={() => {
                    const newOpts = block.options?.filter((_, i) => i !== idx);
                    handleUpdate({ options: newOpts });
                  }}
                  className="p-1.5 text-text-muted hover:text-red-600 opacity-0 group-hover/opt:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Configuration */}
      {block.type === 'matrix' && (
        <div className="pt-4 border-t border-border-main space-y-6">
          {/* Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Danh sách Hàng (Rows)</label>
              <button
                onClick={() => {
                  const newRows = [...(block.matrixRows || []), { label: 'Hàng mới', code: `R${(block.matrixRows?.length || 0) + 1}` }];
                  handleUpdate({ matrixRows: newRows });
                }}
                className="p-1 text-primary hover:bg-primary/5 rounded transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {block.matrixRows?.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 group/row">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => {
                      const newRows = [...(block.matrixRows || [])];
                      newRows[idx].label = e.target.value;
                      handleUpdate({ matrixRows: newRows });
                    }}
                    className="flex-1 px-2 py-1.5 bg-bg-main border border-border-main rounded text-[11px] focus:border-primary outline-none"
                    placeholder="Nhãn hàng"
                  />
                  <input
                    type="text"
                    value={row.code}
                    onChange={(e) => {
                      const newRows = [...(block.matrixRows || [])];
                      newRows[idx].code = e.target.value.toUpperCase();
                      handleUpdate({ matrixRows: newRows });
                    }}
                    className="w-12 px-1 py-1.5 bg-bg-main border border-border-main rounded text-[11px] text-center font-mono focus:border-primary outline-none"
                    placeholder="Mã"
                  />
                  <button
                    onClick={() => {
                      const newRows = block.matrixRows?.filter((_, i) => i !== idx);
                      handleUpdate({ matrixRows: newRows });
                    }}
                    className="p-1.5 text-text-muted hover:text-red-600 opacity-0 group-hover/row:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Danh sách Cột (Cols)</label>
              <button
                onClick={() => {
                  const newCols = [...(block.matrixCols || []), { label: 'Cột mới', value: Date.now().toString(), score: 0 }];
                  handleUpdate({ matrixCols: newCols });
                }}
                className="p-1 text-primary hover:bg-primary/5 rounded transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {block.matrixCols?.map((col, idx) => (
                <div key={idx} className="flex items-center gap-2 group/col">
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => {
                      const newCols = [...(block.matrixCols || [])];
                      newCols[idx].label = e.target.value;
                      handleUpdate({ matrixCols: newCols });
                    }}
                    className="flex-1 px-2 py-1.5 bg-bg-main border border-border-main rounded text-[11px] focus:border-primary outline-none"
                    placeholder="Nhãn cột"
                  />
                  <select
                    value={col.type || 'single_choice'}
                    onChange={(e) => {
                      const newCols = [...(block.matrixCols || [])];
                      newCols[idx].type = e.target.value as any;
                      handleUpdate({ matrixCols: newCols });
                    }}
                    className="px-2 py-1.5 bg-bg-main border border-border-main rounded text-[11px] focus:border-primary outline-none w-24"
                  >
                    <option value="single_choice">Chọn 1</option>
                    <option value="multi_choice">Chọn nhiều</option>
                    <option value="text">Văn bản</option>
                    <option value="number">Số</option>
                  </select>
                  <input
                    type="number"
                    value={col.score || 0}
                    onChange={(e) => {
                      const newCols = [...(block.matrixCols || [])];
                      newCols[idx].score = parseInt(e.target.value);
                      handleUpdate({ matrixCols: newCols });
                    }}
                    className="w-10 px-1 py-1.5 bg-bg-main border border-border-main rounded text-[11px] text-center focus:border-primary outline-none"
                  />
                  <button
                    onClick={() => {
                      const newCols = block.matrixCols?.filter((_, i) => i !== idx);
                      handleUpdate({ matrixCols: newCols });
                    }}
                    className="p-1.5 text-text-muted hover:text-red-600 opacity-0 group-hover/col:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scoring Configuration */}
      {block.type !== 'content' && block.type !== 'contact' && block.type !== 'section' && (
        <div className="pt-4 border-t border-border-main space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-text-muted" />
              <span className="text-xs font-bold text-text-main">Tính điểm cho câu này</span>
            </div>
            <button
              onClick={() => handleUpdate({ scoreEnabled: !block.scoreEnabled })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                block.scoreEnabled ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                block.scoreEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {block.scoreEnabled && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Nhóm tính điểm</label>
                <select
                  value={block.scoreGroupCode || ''}
                  onChange={(e) => handleUpdate({ scoreGroupCode: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="">-- Chọn nhóm --</option>
                  {scoreGroups.map(g => (
                    <option key={g.code} value={g.code}>{g.name} ({g.code})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Trọng số (Weight)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={block.weight || 1}
                    onChange={(e) => handleUpdate({ weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={block.reverseScore || false}
                      onChange={(e) => handleUpdate({ reverseScore: e.target.checked })}
                      className="h-3.5 w-3.5 text-primary rounded border-border-main focus:ring-primary"
                    />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Đảo ngược điểm</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-6">
        <div className="bg-bg-main p-4 rounded-xl border border-border-main">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
            <Info size={12} /> Tip
          </h4>
          <p className="text-[10px] text-text-muted leading-relaxed">
            Mã Block sẽ được dùng làm tên cột trong Google Sheets. Hãy đặt mã gợi nhớ và không trùng lặp.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
