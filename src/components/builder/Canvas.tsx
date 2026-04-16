
import React from 'react';
import { 
  Trash2, 
  Copy, 
  GripVertical,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { SurveyBlock } from '../../types';

interface CanvasProps {
  blocks: SurveyBlock[];
  activeBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (block: SurveyBlock) => void;
  onUpdateBlock: (block: SurveyBlock) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  blocks,
  activeBlockId,
  onSelectBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlock
}) => {
  if (blocks.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-border-main rounded-2xl p-20 text-center">
        <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} className="text-text-muted" />
        </div>
        <h3 className="text-lg font-bold text-text-main mb-2">Chưa có nội dung nào</h3>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          Hãy chọn một loại block từ Toolbox bên trái để bắt đầu xây dựng bảng hỏi của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          onClick={() => onSelectBlock(block.id)}
          className={`bg-white rounded-2xl border transition-all cursor-pointer group relative ${
            activeBlockId === block.id 
              ? 'border-primary shadow-lg ring-4 ring-primary/5' 
              : 'border-border-main hover:border-primary/30 shadow-sm'
          }`}
        >
          {/* Drag Handle & Index */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
            <GripVertical size={20} className="text-text-muted" />
          </div>
          
          <div className="p-6 pl-12">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">
                    {block.type}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                    #{block.code}
                  </span>
                  {block.required && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </div>
                <h4 className="text-base font-bold text-text-main">
                  {block.title || <span className="text-text-muted italic">Chưa có tiêu đề</span>}
                </h4>
                {block.description && (
                  <p className="text-xs text-text-muted mt-1">{block.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDuplicateBlock(block); }}
                  className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  title="Nhân bản"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
                  className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Block Specific Preview */}
            <div className="mt-4 pt-4 border-t border-border-main/50">
              {block.type === 'content' && (
                <div className="text-sm text-text-muted italic bg-bg-main p-3 rounded-xl">
                  Nội dung hiển thị tĩnh cho người dùng.
                </div>
              )}

              {block.type === 'contact' && (
                <div className="flex flex-wrap gap-2">
                  {['Họ tên', 'SĐT', 'Email', 'Đơn vị'].map(f => (
                    <span key={f} className="px-2 py-1 bg-bg-main rounded text-[10px] font-medium text-text-muted border border-border-main">
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {(block.type === 'single_choice' || block.type === 'multi_choice' || block.type === 'likert') && (
                <div className="space-y-2">
                  {block.options?.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded-full border border-border-main ${block.type === 'multi_choice' ? 'rounded-sm' : ''}`} />
                      <span className="text-sm text-text-main">{opt.label}</span>
                      {block.scoreEnabled && (
                        <span className="text-[10px] font-bold text-primary ml-auto">+{opt.score || 0}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {block.type === 'matrix' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr>
                        <th className="p-1"></th>
                        {block.matrixCols?.map((col, i) => (
                          <th key={i} className="p-1 border border-border-main bg-bg-main">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.matrixRows?.map((row, i) => (
                        <tr key={i}>
                          <td className="p-1 border border-border-main font-bold">{row.label}</td>
                          {block.matrixCols?.map((_, j) => (
                            <td key={j} className="p-1 border border-border-main text-center">○</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {block.type === 'text' && (
                <div className="h-10 w-full bg-bg-main rounded-xl border border-border-main border-dashed flex items-center px-4 text-xs text-text-muted">
                  {block.placeholder || 'Người dùng nhập văn bản tại đây...'}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Canvas;
