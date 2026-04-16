
import React from 'react';
import { 
  Type, 
  UserCircle, 
  ListTodo, 
  CheckSquare, 
  BarChart, 
  AlignLeft, 
  Grid3X3 
} from 'lucide-react';
import { SurveyBlock } from '../../types';

interface ToolboxProps {
  onAddBlock: (type: SurveyBlock['type']) => void;
}

const Toolbox: React.FC<ToolboxProps> = ({ onAddBlock }) => {
  const tools: { type: SurveyBlock['type']; label: string; icon: any; description: string }[] = [
    { type: 'content', label: 'Nội dung', icon: Type, description: 'Giới thiệu, hướng dẫn' },
    { type: 'contact', label: 'Thông tin', icon: UserCircle, description: 'Họ tên, SĐT, Email...' },
    { type: 'single_choice', label: 'Trắc nghiệm', icon: ListTodo, description: 'Chọn 1 đáp án' },
    { type: 'multi_choice', label: 'Nhiều lựa chọn', icon: CheckSquare, description: 'Chọn nhiều đáp án' },
    { type: 'likert', label: 'Thang đo', icon: BarChart, description: 'Mức độ (1-5, 1-7...)' },
    { type: 'text', label: 'Văn bản', icon: AlignLeft, description: 'Câu hỏi mở' },
    { type: 'matrix', label: 'Ma trận', icon: Grid3X3, description: 'Bảng câu hỏi phức tạp' },
  ];

  return (
    <div className="card-panel sticky top-24">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Toolbox</h3>
      <div className="grid grid-cols-1 gap-2">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => onAddBlock(tool.type)}
            className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-bg-main text-text-muted group-hover:text-primary group-hover:bg-white transition-colors">
              <tool.icon size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-text-main">{tool.label}</div>
              <div className="text-[10px] text-text-muted leading-tight">{tool.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbox;
