import React, { useState, useEffect, useRef, useCallback } from 'react';

export const useVirtualScroll = (totalRows: number, rowHeight: number, buffer: number = 5) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State chỉ lưu các giá trị ảnh hưởng đến việc render nội dung
  const [range, setRange] = useState({
    startIndex: 0,
    endIndex: 20, // Giá trị khởi tạo ước lượng
    paddingTop: 0,
    paddingBottom: 0
  });

  const calculateRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;

    // Tính toán index dựa trên vị trí scroll hiện tại
    let start = Math.floor(scrollTop / rowHeight) - buffer;
    start = Math.max(0, start);

    let end = Math.ceil((scrollTop + containerHeight) / rowHeight) + buffer;
    end = Math.min(totalRows, end);

    const paddingTop = start * rowHeight;
    const paddingBottom = (totalRows - end) * rowHeight;

    // CHỈ cập nhật state nếu index thay đổi để tránh re-render thừa
    setRange(prev => {
      if (prev.startIndex === start && prev.endIndex === end) return prev;
      return { startIndex: start, endIndex: end, paddingTop, paddingBottom };
    });
  }, [totalRows, rowHeight, buffer]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Sử dụng requestAnimationFrame để throttle event scroll
    requestAnimationFrame(() => {
      calculateRange();
    });
  }, [calculateRange]);

  // Tính toán lại khi dữ liệu thay đổi hoặc resize
  useEffect(() => {
    calculateRange();
  }, [totalRows, calculateRange]);

  // Reset scroll về 0 nếu dữ liệu thay đổi đột ngột (ví dụ đang ở row 1000 mà filter còn 10 row)
  useEffect(() => {
    if (containerRef.current && totalRows < 50 && range.startIndex > 0) {
      containerRef.current.scrollTop = 0;
      calculateRange();
    }
  }, [totalRows]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    containerRef,
    scrollTop: containerRef.current?.scrollTop || 0,
    handleScroll,
    startIndex: range.startIndex,
    endIndex: range.endIndex,
    paddingTop: range.paddingTop,
    paddingBottom: range.paddingBottom
  };
};