
import React, { useRef } from 'react';
import { LabelElement } from '../../../types/label';
import { useLabelStore } from '../../../stores/labelStore';
import { AVAILABLE_FIELDS } from '../../../utils/labelConstants';
import { Trash2 } from 'lucide-react';

interface Props {
  element: LabelElement;
  containerWidth: number; // px
  containerHeight: number; // px
  scale: number; // pixel per mm
}

export const DraggableElement: React.FC<Props> = ({ element, containerWidth, containerHeight, scale }) => {
  const { updateElement, setSelectedElement, selectedElementId, removeElement } = useLabelStore();
  const isSelected = selectedElementId === element.id;
  const ref = useRef<HTMLDivElement>(null);

  // Convert mm to px for display
  const left = element.x * scale;
  const top = element.y * scale;
  const width = element.width * scale;
  const height = element.height * scale;

  // Get Example Content
  const fieldInfo = AVAILABLE_FIELDS.find(f => f.key === element.field);
  const displayContent = fieldInfo ? fieldInfo.example : element.label;

  // Simple Drag Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(element.id);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = element.x;
    const startTop = element.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      updateElement(element.id, {
        x: Math.max(0, startLeft + dx),
        y: Math.max(0, startTop + dy)
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Resize Logic (Bottom Right Corner)
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      updateElement(element.id, {
        width: Math.max(5, startWidth + dx),
        height: Math.max(5, startHeight + dy)
      });
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        fontSize: `${element.fontSize}px`,
        fontWeight: element.isBold ? 'bold' : 'normal',
        zIndex: isSelected ? 10 : 1,
        color: '#000000', // FORCE BLACK TEXT for visibility on white canvas
        lineHeight: 1.2
      }}
      className={`
        cursor-move flex flex-col group overflow-hidden select-none
        ${isSelected ? 'ring-2 ring-brand-red bg-blue-500/10' : 'hover:ring-1 hover:ring-blue-400 border border-dashed border-gray-400/50'}
      `}
    >
        {/* Helper Toolbar only visible when selected */}
        {isSelected && (
            <div className="absolute -top-6 left-0 bg-brand-red text-white text-[10px] px-1 rounded-t flex items-center gap-2 pointer-events-auto z-50">
                <span>{element.width.toFixed(0)}x{element.height.toFixed(0)}</span>
                <button onClick={(e) => { e.stopPropagation(); removeElement(element.id); }} className="hover:text-black p-0.5">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        )}

        {/* Content Centered */}
        <div className="flex-1 w-full h-full p-1 overflow-hidden break-words flex items-center justify-center text-center" style={{ pointerEvents: 'none' }}>
           {element.field.includes('qr') ? (
               <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=0&data=SAMPLE_QR_DATA_123456`}
                    alt="QR Preview"
                    loading="lazy"
                    className="w-full h-full object-contain grayscale"
               />
           ) : (
               <span className="leading-tight">
                {displayContent}{element.suffix}
               </span>
           )}
        </div>

        {/* Resize Handle */}
        {isSelected && (
            <div 
                onMouseDown={handleResizeMouseDown}
                className="absolute bottom-0 right-0 w-3 h-3 bg-brand-red cursor-nwse-resize z-20"
            />
        )}
    </div>
  );
};