import React, { useState, useRef, useCallback, useEffect } from 'react';

export const useColumnResize = (initialWidths: Record<string, number>) => {
  const [colWidths, setColWidths] = useState(initialWidths);
  const resizingRef = useRef<{ accessor: string; startX: number; startWidth: number } | null>(null);

  // 1. Define handleMouseMove first (no dependencies)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { accessor, startX, startWidth } = resizingRef.current;
    
    // Tính toán độ rộng mới, giới hạn min-width là 50px
    const newWidth = Math.max(50, startWidth + (e.clientX - startX));
    setColWidths(prev => ({ ...prev, [accessor]: newWidth }));
  }, []);

  // 2. Define handleMouseUp depending on handleMouseMove
  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    // Remove self from dependency array to avoid "Cannot access before initialization"
    // document.removeEventListener requires the exact function reference, which is available in the scope when executed
    // We access 'handleMouseUp' from the outer scope variable.
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // 3. Define handleMouseDown depending on the above
  const handleMouseDown = useCallback((e: React.MouseEvent, accessor: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    // Lưu trạng thái bắt đầu kéo
    resizingRef.current = { accessor, startX: e.clientX, startWidth: colWidths[accessor] || 100 };
    
    // Attach event listeners vào document để kéo mượt ra ngoài phạm vi header
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [colWidths, handleMouseMove, handleMouseUp]);

  // Cleanup listeners khi component unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return { colWidths, handleMouseDown };
};