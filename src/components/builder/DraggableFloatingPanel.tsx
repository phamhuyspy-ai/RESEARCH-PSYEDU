import React, { useState, useRef, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';

interface DraggableFloatingPanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number, y: number };
  width?: string;
  id?: string;
}

const DraggableFloatingPanel: React.FC<DraggableFloatingPanelProps> = ({ 
  title, 
  children, 
  defaultPosition = { x: 20, y: 100 },
  width = 'w-64',
  id
}) => {
  const [pos, setPos] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    // Ignore if clicking on a button or interactive element inside the header
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    setPos({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className={`fixed z-[40] bg-white rounded-2xl shadow-2xl border border-border-main flex flex-col overflow-hidden animate-fade-in ${width}`}
      style={{ left: pos.x, top: pos.y, maxHeight: 'min(80vh, 800px)' }}
    >
      <div 
        className="px-4 py-2 bg-bg-main border-b border-border-main cursor-move flex items-center justify-between select-none touch-none hover:bg-gray-100 transition-colors"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{title}</span>
        <GripHorizontal size={14} className="text-text-muted opacity-50" />
      </div>
      <div className="overflow-y-auto overflow-x-hidden custom-scrollbar flex-1">
        {children}
      </div>
    </div>
  );
};

export default DraggableFloatingPanel;
