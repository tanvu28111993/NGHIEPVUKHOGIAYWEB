
import React, { useState, useEffect } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { Button } from '../../UI/Button';

interface TimeFilterMatrixProps {
  // Callback trả về cả ngày tháng và metadata cấu hình (year, months)
  onFilterChange: (startDate: Date, endDate: Date, year: number, selectedMonths: number[]) => void;
  isSyncing: boolean;
  onClose: () => void;
  
  // Props khởi tạo
  initialYear: number;
  initialMonths: number[];
}

export const TimeFilterMatrix: React.FC<TimeFilterMatrixProps> = ({ 
  onFilterChange, 
  isSyncing, 
  onClose,
  initialYear,
  initialMonths
}) => {
  const currentYear = new Date().getFullYear();
  
  // Khởi tạo state từ props truyền vào thay vì mặc định
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(initialMonths);

  // Sync state if props change (optional, useful if parent updates)
  useEffect(() => {
    setSelectedYear(initialYear);
    setSelectedMonths(initialMonths);
  }, [initialYear, initialMonths]);

  // Tạo danh sách 5 năm gần nhất (Giảm dần: 2024, 2023, 2022...)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const quarters = [
    { id: 1, label: 'Quý 1', months: [0, 1, 2] },
    { id: 2, label: 'Quý 2', months: [3, 4, 5] },
    { id: 3, label: 'Quý 3', months: [6, 7, 8] },
    { id: 4, label: 'Quý 4', months: [9, 10, 11] },
  ];

  // Logic chọn/bỏ chọn tháng
  const toggleMonth = (monthIndex: number) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthIndex)) {
        return prev.filter(m => m !== monthIndex);
      } else {
        return [...prev, monthIndex];
      }
    });
  };

  // Logic chọn/bỏ chọn cả Quý
  const toggleQuarter = (qMonths: number[]) => {
    const allSelected = qMonths.every(m => selectedMonths.includes(m));
    
    if (allSelected) {
      // Nếu đã chọn hết thì bỏ chọn toàn bộ quý
      setSelectedMonths(prev => prev.filter(m => !qMonths.includes(m)));
    } else {
      // Nếu chưa chọn hết thì chọn toàn bộ quý (giữ lại các tháng cũ không thuộc quý này)
      const otherMonths = selectedMonths.filter(m => !qMonths.includes(m));
      setSelectedMonths([...otherMonths, ...qMonths]);
    }
  };

  // Xử lý nút Áp dụng
  const handleApply = () => {
    if (selectedMonths.length === 0) return;

    // Tìm khoảng thời gian bao trùm các tháng đã chọn
    const minMonth = Math.min(...selectedMonths);
    const maxMonth = Math.max(...selectedMonths);

    // Ngày bắt đầu: Mùng 1 của tháng nhỏ nhất
    const start = new Date(selectedYear, minMonth, 1, 0, 0, 0);
    // Ngày kết thúc: Ngày cuối cùng của tháng lớn nhất
    const end = new Date(selectedYear, maxMonth + 1, 0, 23, 59, 59);

    // Truyền thêm selectedYear và selectedMonths để lưu trữ
    onFilterChange(start, end, selectedYear, selectedMonths);
    onClose(); 
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl w-[400px] animate-fade-in relative z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-brand-red font-bold text-sm uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          <span>Bộ Lọc Thời Gian</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chọn Năm (Giảm dần) */}
      <div className="flex justify-between gap-1 mb-4">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`
              flex-1 py-1.5 text-xs font-bold rounded transition-all duration-200 border
              ${selectedYear === year 
                ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                : 'bg-slate-800 border-slate-700 text-gray-500 hover:text-white hover:border-gray-500'}
            `}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Grid Quý & Tháng */}
      <div className="space-y-2">
        {quarters.map((q) => {
          // Kiểm tra xem quý này có được chọn full không (để style nút Quý)
          const isQuarterFull = q.months.every(m => selectedMonths.includes(m));
          const isQuarterPartial = q.months.some(m => selectedMonths.includes(m)) && !isQuarterFull;

          return (
            <div key={q.id} className="flex gap-2">
              {/* Nút Quý */}
              <button 
                onClick={() => toggleQuarter(q.months)}
                className={`
                  w-16 flex items-center justify-center rounded text-xs font-bold border transition-all
                  ${isQuarterFull 
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-500' 
                    : isQuarterPartial 
                        ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-gray-500 hover:text-white'
                  }
                `}
              >
                {q.label}
              </button>
              
              {/* Các Tháng trong Quý */}
              <div className="flex-1 grid grid-cols-3 gap-1">
                {q.months.map((mIndex) => {
                  const isSelected = selectedMonths.includes(mIndex);
                  return (
                    <button
                      key={mIndex}
                      onClick={() => toggleMonth(mIndex)}
                      className={`
                        py-1.5 text-xs font-medium rounded border transition-all duration-200 relative
                        ${isSelected 
                          ? 'bg-brand-red text-white border-brand-red shadow-sm' 
                          : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white'}
                      `}
                    >
                      Thg {mIndex + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-3">
        <button 
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
            Hủy bỏ
        </button>
        <Button 
            onClick={handleApply}
            isLoading={isSyncing}
            disabled={selectedMonths.length === 0}
            className="py-1.5 px-4 text-xs h-8 bg-blue-600 hover:bg-blue-700 border-transparent shadow-blue-900/20"
        >
            <Check className="w-3 h-3 mr-1" /> Áp dụng
        </Button>
      </div>
      
      {selectedMonths.length === 0 && (
        <div className="absolute bottom-16 left-0 w-full text-center">
             <span className="text-[10px] text-red-500 bg-slate-900 px-2">Vui lòng chọn ít nhất 1 tháng</span>
        </div>
      )}
    </div>
  );
};
