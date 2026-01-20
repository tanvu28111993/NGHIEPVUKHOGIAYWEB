
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatNumberVN } from '../utils/formatters';
import { useToast } from './ToastContext';
import { FixedSizeList } from 'react-window';
import { useHistoryData } from '../hooks/useHistoryData';

interface HistoryPageProps {
  exportData: string[]; // Dữ liệu XUẤT
  importData: string[]; // Dữ liệu NHẬP
  defaultHeaders: string[]; // Header lấy từ Tồn kho để map
  onRefresh: () => void;
}

const ROW_HEIGHT = 48;
const COL_IDX_WEIGHT = 11;
const QUANTITY_COL_IDX = 12;

const HistoryPage: React.FC<HistoryPageProps> = ({ exportData, importData, defaultHeaders, onRefresh }) => {
  // UI State
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchColIndex, setSearchColIndex] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
  const [sourceConfig, setSourceConfig] = useState({ export: true, import: false });

  // Date Picker State
  const currentYear = new Date().getFullYear();
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(() => {
      const now = new Date();
      return new Set([`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`]);
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerViewYear, setPickerViewYear] = useState(currentYear);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Virtual List
  const containerRef = useRef<HTMLDivElement>(null);
  const [listSize, setListSize] = useState({ width: 0, height: 600 });

  const { showToast } = useToast();

  const headers = defaultHeaders && defaultHeaders.length > 0 
    ? defaultHeaders 
    : [
        "Thẻ Kho Giấy SKU", "Mục Đích", "Kiện Giấy", "Loại Giấy", "Định Lượng", 
        "Nhà Cung Cấp", "Nhà SX", "Ngày Nhập", "Ngày SX", "Lô/Dài (cm)", 
        "Rộng (cm)", "Trọng Lượng", "Số Lượng", "Đơn hàng/ Khách hàng", 
        "Mã vật tư", "Vị Trí", "Vật Tư Chờ Xuất", "Người Xuất", "Thời Gian Xuất"
      ];

  // --- USE WEB WORKER HOOK ---
  const { processedRows, isProcessing, progress } = useHistoryData(
    exportData,
    importData,
    sourceConfig,
    selectedMonths,
    debouncedSearchTerm,
    searchColIndex,
    sortConfig
  );

  // Debounce input search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(inputValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue]);

  // Click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
            setIsDatePickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resize Observer for Virtual List
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            setListSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleHeaderDoubleClick = (colIndex: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === colIndex && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: colIndex, direction });
  };

  const availableYears = Array.from({length: 5}, (_, i) => currentYear - i);

  const toggleMonth = (year: number, month: number) => {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const newSet = new Set(selectedMonths);
      if (newSet.has(key)) {
          newSet.delete(key);
      } else {
          newSet.add(key);
      }
      setSelectedMonths(newSet);
  };

  const toggleQuarter = (year: number, quarter: number) => {
      const startMonth = (quarter - 1) * 3 + 1;
      const months = [startMonth, startMonth + 1, startMonth + 2];
      const keys = months.map(m => `${year}-${String(m).padStart(2, '0')}`);
      
      const newSet = new Set(selectedMonths);
      const allSelected = keys.every(k => newSet.has(k));
      keys.forEach(k => {
          if (allSelected) newSet.delete(k);
          else newSet.add(k);
      });
      setSelectedMonths(newSet);
  };

  const isMonthSelected = (year: number, month: number) => selectedMonths.has(`${year}-${String(month).padStart(2, '0')}`);
  const isQuarterSelected = (year: number, quarter: number) => {
      const startMonth = (quarter - 1) * 3 + 1;
      return [0,1,2].every(i => selectedMonths.has(`${year}-${String(startMonth + i).padStart(2, '0')}`));
  };

  const clearDateFilter = () => setSelectedMonths(new Set());

  // Column config calculation
  const columnConfigs = useMemo(() => {
    return headers.map((header, idx) => {
      const charWidth = 11;
      const padding = 30;
      const calculatedWidth = Math.max(90, (String(header).length * charWidth) + padding);
      
      // Basic check from first few rows
      let isNumericColumn = false;
      const sampleLimit = Math.min(processedRows.length, 20);
      
      for (let i = 0; i < sampleLimit; i++) {
          const cellValue = processedRows[i].row[idx];
          if (cellValue && String(cellValue).trim() !== '') {
              const strVal = String(cellValue).trim();
              const isNumber = /^-?[\d,.]+$/.test(strVal) && /\d/.test(strVal);
              const isLikeId = strVal.startsWith('0') && strVal.length > 1 && !strVal.includes('.') && !strVal.includes(',');
              if (isNumber && !isLikeId) isNumericColumn = true;
              break;
          }
      }
      return { width: calculatedWidth, align: isNumericColumn ? 'text-right' : 'text-left', isNumeric: isNumericColumn };
    });
  }, [processedRows, headers]);

  // Total Weight Calculation (Updated to 2 decimal places in Tons)
  const totalWeight = useMemo(() => {
      return processedRows.reduce((acc, { row }) => {
          const val = row[COL_IDX_WEIGHT];
          if (!val) return acc;
          const clean = String(val).replace(/\./g, '').replace(',', '.');
          const num = parseFloat(clean);
          return acc + (isNaN(num) ? 0 : num);
      }, 0);
  }, [processedRows]);

  const handleExportCSV = () => {
    if (!headers || processedRows.length === 0) {
        showToast('Không có dữ liệu để xuất', 'warning');
        return;
    }
    const separator = ";";
    const csvContent = [
      headers.join(separator),
      ...processedRows.map(({ row }) => 
        (row as any[]).map((cell) => {
          let cellStr = String(cell || "");
          if (cellStr.includes(separator) || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(separator)
      )
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LichSu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSource = (source: 'export' | 'import') => {
      setSourceConfig(prev => ({ ...prev, [source]: !prev[source] }));
  };

  const datePickerLabel = useMemo(() => {
      if (selectedMonths.size === 0) return 'Tất cả thời gian';
      if (selectedMonths.size === 1) {
          const val = Array.from(selectedMonths)[0] as string;
          const [y, m] = val.split('-');
          return `Tháng ${m}/${y}`;
      }
      return `${selectedMonths.size} tháng được chọn`;
  }, [selectedMonths]);

  // VIRTUAL ROW RENDERER
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = processedRows[index];
    if (!item) return null;

    const { row, originalIndex, type } = item;
    const actualRowIndex = index;

    // --- CUSTOM COLOR LOGIC: Export = Orange, Import = Blue ---
    const rowTextColor = type === 'export' ? 'text-[#FF8C00]' : 'text-blue-400';
    
    return (
        <div 
           style={style}
           className={`flex items-center hover:bg-white/10 transition-colors duration-75 group border-b border-white/5 ${actualRowIndex % 2 !== 0 ? 'bg-white/5' : ''}`}
        >
          <div className="w-[50px] px-0 py-2 border-r border-transparent flex justify-center items-center shrink-0 h-full text-gray-500 font-mono text-xs">
              {actualRowIndex + 1}
          </div>
          {row.map((cell, cellIndex) => {
              const config = columnConfigs[cellIndex];
              let displayValue = cell;
              if (config.isNumeric) {
                  const digits = (cellIndex === QUANTITY_COL_IDX) ? 0 : 1;
                  displayValue = formatNumberVN(cell, digits);
              }
              
              let cellClasses = `${rowTextColor}`;
              if (cellIndex === 0) {
                  cellClasses += ' font-bold font-mono';
              }
              if (String(cellIndex) === searchColIndex) {
                  cellClasses = 'bg-white/5 font-medium text-white';
                  if (cellIndex === 0) cellClasses += ' font-bold font-mono';
              }

              return (
                  <div 
                      key={cellIndex} 
                      style={{ width: config.width }} 
                      className={`px-4 py-2 text-[14px] border-r border-transparent h-full flex items-center overflow-hidden whitespace-normal break-words leading-tight shrink-0 ${config.align === 'text-right' ? 'justify-end' : 'justify-start'} ${cellClasses}`}
                  >
                      {displayValue}
                  </div>
              );
          })}
        </div>
    );
  };

  if (!exportData && !importData) {
     return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 animate-pulse">
            <div className="w-10 h-10 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p>Đang tải dữ liệu lịch sử...</p>
        </div>
     );
  }

  const totalCount = processedRows.length;

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4 animate-fadeIn relative bg-[#212830]">
      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10 backdrop-blur-sm shrink-0 gap-3 z-30">
        <div className="flex items-center gap-4 order-3 xl:order-1 px-2">
            <button onClick={handleExportCSV} disabled={isProcessing} className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg transition-all font-bold text-sm group ml-2 disabled:bg-gray-600 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                <span className="hidden group-hover:block whitespace-nowrap">Xuất CSV</span>
            </button>

            <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                <div className="text-[14px] text-gray-300 font-medium whitespace-nowrap">
                    Tổng: <span className="text-white font-bold text-lg ml-1">{totalCount.toLocaleString()}</span>
                </div>
                <div className="text-[14px] text-gray-300 font-medium whitespace-nowrap">
                    Trọng lượng: <span className="text-green-400 font-bold text-lg ml-1">{formatNumberVN(totalWeight / 1000, 2)} Tấn</span>
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 order-1 xl:order-2 w-full xl:w-auto">
          
          <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleSource('export')}
                className={`h-10 px-3 rounded-lg flex items-center gap-2 shadow-md transition-all font-bold text-sm group ${sourceConfig.export ? 'bg-[#FF8C00] hover:bg-[#e67e00] text-white' : 'bg-[#FF8C00]/10 text-orange-400 border border-[#FF8C00]/50 hover:bg-[#FF8C00]/20'}`}
              >
                  <span className="material-symbols-outlined text-[20px]">logout</span> 
                  <span className="hidden group-hover:block md:block whitespace-nowrap">LS Xuất</span>
              </button>
              
              <button 
                onClick={() => toggleSource('import')}
                className={`h-10 px-3 rounded-lg flex items-center gap-2 shadow-md transition-all font-bold text-sm group ${sourceConfig.import ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600/10 text-blue-400 border border-blue-600/50 hover:bg-blue-600/20'}`}
              >
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span className="hidden group-hover:block md:block whitespace-nowrap">LS Nhập</span>
              </button>
          </div>

          <div className="relative" ref={datePickerRef}>
              <button 
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={`flex items-center gap-2 px-3 h-10 rounded-md border border-white/10 transition-colors ${isDatePickerOpen || selectedMonths.size > 0 ? 'bg-blue-600/20 border-blue-500/50 text-blue-100' : 'bg-[#1a1a1a]/60 text-gray-400'}`}
              >
                 <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                 <span className="text-sm font-medium whitespace-nowrap w-[130px] text-left">{datePickerLabel}</span>
                 {selectedMonths.size > 0 && (
                     <span className="material-symbols-outlined text-[16px] hover:text-white" onClick={(e) => { e.stopPropagation(); clearDateFilter(); }}>close</span>
                 )}
              </button>

              {isDatePickerOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[340px] bg-[#212830] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn flex flex-col">
                      <div className="flex bg-[#1a1a1a] p-1 border-b border-white/10">
                          {availableYears.map(year => (
                              <button 
                                key={year}
                                onClick={() => setPickerViewYear(year)}
                                className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${pickerViewYear === year ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                              >
                                  {year}
                              </button>
                          ))}
                      </div>

                      <div className="p-4 flex flex-col gap-4 bg-[#212830]">
                          <div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Chọn Quý (3 tháng)</div>
                              <div className="grid grid-cols-4 gap-2">
                                  {[1, 2, 3, 4].map(q => {
                                      const isSelected = isQuarterSelected(pickerViewYear, q);
                                      return (
                                          <button 
                                            key={q} 
                                            onClick={() => toggleQuarter(pickerViewYear, q)}
                                            className={`py-1.5 text-xs font-bold rounded border transition-all ${isSelected ? 'bg-green-600/20 text-green-400 border-green-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}
                                          >
                                              Quý {q}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>

                          <div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Chọn Tháng</div>
                              <div className="grid grid-cols-4 gap-2">
                                  {Array.from({length: 12}, (_, i) => i + 1).map(m => {
                                      const isSelected = isMonthSelected(pickerViewYear, m);
                                      return (
                                          <button 
                                            key={m}
                                            onClick={() => toggleMonth(pickerViewYear, m)}
                                            className={`py-2 text-sm font-medium rounded border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-[#1a1a1a] text-gray-300 border-white/10 hover:border-white/30'}`}
                                          >
                                              Thg {m}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                      
                      <div className="p-3 bg-[#1a1a1a] border-t border-white/10 flex justify-between items-center">
                          <button onClick={clearDateFilter} className="text-xs text-red-400 hover:text-red-300 font-medium px-2">Xóa chọn</button>
                          <button onClick={() => setIsDatePickerOpen(false)} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded">Đóng</button>
                      </div>
                  </div>
              )}
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a1a]/60 px-3 h-10 rounded-md border border-white/10 focus-within:border-accent-1/50 transition-colors flex-grow md:w-[220px] w-full">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            <input type="text" placeholder="Tìm kiếm..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500" value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
            {inputValue && <button onClick={() => setInputValue('')} aria-label="Xóa tìm kiếm" className="text-gray-500 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>}
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative h-10 shrink-0 flex-grow md:flex-grow-0">
              <select className="w-full md:w-auto h-full pl-3 pr-8 bg-[#212830] border border-white/10 rounded-md text-sm text-white outline-none focus:border-accent-1/50 appearance-none cursor-pointer" value={searchColIndex} onChange={(e) => setSearchColIndex(e.target.value)}>
                <option value="all">Tất cả cột</option>
                {headers.map((h, idx) => <option key={idx} value={idx}>{h}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 text-[18px] pointer-events-none">arrow_drop_down</span>
            </div>
            <button onClick={onRefresh} aria-label="Tải lại dữ liệu" className="h-10 w-10 flex items-center justify-center bg-[#38761d] text-white border border-transparent rounded-md hover:brightness-110 shadow-lg"><span className="material-symbols-outlined text-[22px] font-bold">refresh</span></button>
          </div>
        </div>
      </div>
      
      {/* PROCESSING BAR */}
      {isProcessing && (
        <div className="w-full h-1 bg-white/10 rounded overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {/* VIRTUALIZED TABLE */}
      <div ref={containerRef} className="flex-1 border border-white/10 rounded-xl relative bg-[#2d2f35]/20 flex flex-col overflow-hidden">
         {/* CUSTOM HEADER (Sticky) */}
         <div className="flex bg-[#2d2f35] border-b border-white/20 z-20 shadow-md shrink-0">
            <div className="w-[50px] px-0 py-3.5 border-r border-transparent text-center bg-[#2d2f35] shrink-0 text-gray-500 font-bold text-xs">
                STT
            </div>
            {headers.map((header, index) => {
                const config = columnConfigs[index];
                const isSorted = sortConfig?.key === index;
                return (
                    <div 
                        key={index} 
                        style={{ width: config.width }} 
                        onDoubleClick={() => handleHeaderDoubleClick(index)} 
                        className={`px-4 py-3.5 text-[13px] font-bold uppercase tracking-wider border-r border-transparent text-center whitespace-nowrap cursor-pointer select-none hover:bg-white/10 flex items-center justify-center shrink-0 ${String(index) === searchColIndex ? 'bg-accent-2/20 text-accent-1' : 'text-yellow-50'} ${isSorted ? 'bg-white/10 text-white' : ''}`}
                    >
                        <div className="flex items-center justify-center gap-1">
                            {header}
                            {isSorted && <span className="material-symbols-outlined text-[16px] text-accent-1">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                        </div>
                    </div>
                );
            })}
             {/* Spacing for scrollbar */}
             <div className="w-[10px] shrink-0 bg-[#2d2f35]"></div>
         </div>

         {/* LIST BODY */}
         <div className="flex-1">
             <FixedSizeList
                height={listSize.height - 48} // Subtract approximate header height
                itemCount={processedRows.length}
                itemSize={ROW_HEIGHT}
                width={listSize.width}
                className="custom-scrollbar"
             >
                {Row}
             </FixedSizeList>
             {isProcessing && processedRows.length === 0 && (
                 <div className="absolute inset-0 top-[48px] flex flex-col items-center justify-center text-white bg-black/20 backdrop-blur-[1px]">
                     <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2"></div>
                     <span className="text-sm font-medium">Đang xử lý {progress}%...</span>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default HistoryPage;
