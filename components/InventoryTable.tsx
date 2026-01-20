
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryData, UserInfo } from '../types';
import { formatNumberVN } from '../utils/formatters';
import PrintLabelModal from './PrintLabelModal';
import { useToast } from './ToastContext';
import * as ReactWindow from 'react-window';

interface InventoryTableProps {
  data: InventoryData | null;
  onRefresh: () => void;
  onUpdateRow: (rowIndex: number, newData: any[]) => Promise<void>;
  userInfo?: UserInfo;
}

const ROW_HEIGHT = 48;

const COL_IDX_SKU = 0;
const COL_IDX_WEIGHT = 11;
const QUANTITY_COL_IDX = 12;
const PENDING_COL_IDX = 16;

const InventoryTable: React.FC<InventoryTableProps> = ({ data, onRefresh, onUpdateRow, userInfo }) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchColIndex, setSearchColIndex] = useState<string>('all');
  const [filterSmallLots, setFilterSmallLots] = useState(false);
  const [filterPendingExport, setFilterPendingExport] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

  // Use a resize observer or wrapper to get dimensions for FixedSizeList
  const containerRef = useRef<HTMLDivElement>(null);
  const [listSize, setListSize] = useState({ width: 0, height: 600 });

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any[]>([]);
  
  // PRINT STATE
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<number>>(new Set<number>());
  const [lastSelectedRow, setLastSelectedRow] = useState<number | null>(null); // For Shift+Click

  const { showToast } = useToast();

  const headers: string[] = (data && data.length > 0) ? (data[0] as string[]) : [];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(inputValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue]);

  useEffect(() => {
    if (selectedRowIndex !== null && data) {
      setEditFormData([...data[selectedRowIndex]]);
      setIsEditing(false);
    }
  }, [selectedRowIndex, data]);

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

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (isEditing && selectedRowIndex !== null) {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSave();
              }
              if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsEditing(false);
                  if (data) setEditFormData([...data[selectedRowIndex]]);
              }
          }
          else if (!isEditing) {
              if (e.key === 'Escape') {
                  if (selectedRowIndex !== null) setSelectedRowIndex(null);
                  setSelectedForPrint(new Set<number>()); // Clear print selection
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, selectedRowIndex, editFormData, data]);

  const handleHeaderDoubleClick = (colIndex: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === colIndex && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: colIndex, direction });
  };

  const columnConfigs = useMemo(() => {
    if (!data || data.length === 0) {
      return headers.map(() => ({ width: 150, align: 'text-left', isNumeric: false }));
    }

    return headers.map((header, idx) => {
      const charWidth = 11;
      const padding = 30;
      const calculatedWidth = Math.max(90, (String(header).length * charWidth) + padding);
      
      let isNumericColumn = false;
      let isDateColumn = false;
      const sampleLimit = Math.min(data.length, 20);
      
      for (let i = 1; i < sampleLimit; i++) {
          const cellValue = data[i][idx];
          if (cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '') {
              const strVal = String(cellValue).trim();
              const isNumber = /^-?[\d,.]+$/.test(strVal) && /\d/.test(strVal);
              const isLikeId = strVal.startsWith('0') && strVal.length > 1 && !strVal.includes('.') && !strVal.includes(',');
              const isDate = /^\d{1,2}[/-]\d{1,2}/.test(strVal) || /^\d{1,2}:\d{2}/.test(strVal);
              
              if (isNumber && !isLikeId) isNumericColumn = true;
              if (isDate) isDateColumn = true;
              break;
          }
      }
      return { width: calculatedWidth, align: (isNumericColumn || isDateColumn) ? 'text-right' : 'text-left', isNumeric: isNumericColumn };
    });
  }, [data, headers]);

  const processedRows = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const originalRows = data.slice(1);
    const indexedRows = originalRows.map((row, idx) => ({ row, originalIndex: idx + 1 }));
    let rows = indexedRows;

    if (debouncedSearchTerm.trim()) {
      const lowerTerm = debouncedSearchTerm.toLowerCase();
      const keywords = lowerTerm.split(';').map(k => k.trim()).filter(k => k.length > 0);
      if (keywords.length > 0) {
        rows = rows.filter(({ row }) => {
          if (searchColIndex === 'all') {
            return keywords.every(keyword => row.some((cell: any) => String(cell).toLowerCase().includes(keyword)));
          } else {
            const colIdx = parseInt(searchColIndex, 10);
            return keywords.every(keyword => String((row as any[])[colIdx]).toLowerCase().includes(keyword));
          }
        });
      }
    }

    const parseWeight = (val: any) => {
      const str = String(val).replace(/,/g, ''); 
      const num = parseFloat(str);
      return isNaN(num) ? Infinity : num;
    };

    const parseValueForSort = (val: any) => {
      if (val === null || val === undefined) return '';
      const strVal = String(val).trim();
      if (/^-?[\d,.]+$/.test(strVal) && /\d/.test(strVal)) {
        const num = parseFloat(strVal.replace(/,/g, ''));
        if (!isNaN(num)) return num;
      }
      return strVal.toLowerCase();
    };

    let smallLotIndices = new Set<number>();
    let pendingExportIndices = new Set<number>();

    if (filterSmallLots && rows.length > 0) {
      const sortedByWeight = [...rows].sort((a, b) => parseWeight(a.row[COL_IDX_WEIGHT]) - parseWeight(b.row[COL_IDX_WEIGHT]));
      sortedByWeight.slice(0, 10).forEach(item => {
        if (parseWeight(item.row[COL_IDX_WEIGHT]) !== Infinity) smallLotIndices.add(item.originalIndex);
      });
    }

    if (filterPendingExport && rows.length > 0) {
      rows.forEach(item => {
        const pendingVal = item.row[PENDING_COL_IDX];
        if (pendingVal !== null && pendingVal !== undefined && String(pendingVal).trim() !== '') pendingExportIndices.add(item.originalIndex);
      });
    }

    if (sortConfig !== null) {
      rows.sort((a, b) => {
        const valA = parseValueForSort(a.row[sortConfig.key]);
        const valB = parseValueForSort(b.row[sortConfig.key]);
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      rows.sort((a, b) => {
        if (filterSmallLots) {
          const aSmall = smallLotIndices.has(a.originalIndex);
          const bSmall = smallLotIndices.has(b.originalIndex);
          if (aSmall && !bSmall) return -1; 
          if (!aSmall && bSmall) return 1;  
        }
        return 0;
      });
    }

    return rows.map(item => ({
      ...item,
      isSmall: smallLotIndices.has(item.originalIndex),
      isPending: pendingExportIndices.has(item.originalIndex)
    }));
  }, [data, debouncedSearchTerm, searchColIndex, filterSmallLots, filterPendingExport, sortConfig]);

  // Total Weight Calculation (New)
  const totalWeight = useMemo(() => {
    return processedRows.reduce((acc, { row }) => {
        const val = row[COL_IDX_WEIGHT];
        if (!val) return acc;
        // Logic parse số Việt Nam: 1.234,56 -> 1234.56
        const clean = String(val).replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);
        return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [processedRows]);

  // Print Handling
  const handleOpenPrint = () => {
    if (selectedForPrint.size === 0) {
      showToast('Vui lòng chọn ít nhất 1 dòng để in (Shift+Click để chọn nhiều)', 'warning');
      return;
    }
    setIsPrintModalOpen(true);
  };
  
  const getSelectedDataForPrint = () => {
    if (!data) return [];
    return Array.from(selectedForPrint).map((idx) => data[idx as number]);
  };

  const handleRowClick = (e: React.MouseEvent, originalIndex: number) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedRow !== null) {
       // Range select
       const start = processedRows.findIndex(r => r.originalIndex === lastSelectedRow);
       const end = processedRows.findIndex(r => r.originalIndex === originalIndex);
       if (start !== -1 && end !== -1) {
          const [min, max] = [Math.min(start, end), Math.max(start, end)];
          const newSet = new Set(selectedForPrint);
          processedRows.slice(min, max + 1).forEach(row => {
             newSet.add(row.originalIndex);
          });
          setSelectedForPrint(newSet);
       }
    } else if (e.ctrlKey || e.metaKey) {
       // Toggle
       const newSet = new Set(selectedForPrint);
       if (newSet.has(originalIndex)) newSet.delete(originalIndex);
       else newSet.add(originalIndex);
       setSelectedForPrint(newSet);
       setLastSelectedRow(originalIndex);
    } else {
       // Single select
       const newSet = new Set<number>();
       newSet.add(originalIndex);
       setSelectedForPrint(newSet);
       setLastSelectedRow(originalIndex);
    }
  };

  const handleStartEdit = () => {
    if (!data || selectedRowIndex === null) return;
    const currentData = [...data[selectedRowIndex]];
    const len = headers.length;
    const userIdx = len - 2;
    const timeIdx = len - 1;
    if (userIdx >= 0) currentData[userIdx] = userInfo?.name || userInfo?.email || 'N/A';
    if (timeIdx >= 0) currentData[timeIdx] = new Date().toLocaleString('vi-VN');
    setEditFormData(currentData);
    setIsEditing(true);
  };

  const handleInputChange = (colIndex: number, value: string) => {
    const updated = [...editFormData];
    updated[colIndex] = value;
    setEditFormData(updated);
  };

  const handleSave = () => {
    if (selectedRowIndex === null) return;
    onUpdateRow(selectedRowIndex, editFormData); 
    setIsEditing(false);
  };

  const handleExportCSV = () => {
    if (!headers || processedRows.length === 0) return;
    const separator = ";";
    const csvContent = [
      headers.join(separator),
      ...processedRows.map(({ row }) => 
        (row as any[]).map((cell, idx) => {
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
    link.download = `TonKho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CheckboxFilter = ({ label, checked, onChange, colorClass }: { label: string, checked: boolean, onChange: () => void, colorClass: string }) => (
    <div onClick={onChange} className={`cursor-pointer flex items-center gap-2 select-none px-3 py-1.5 rounded-lg border transition-all h-10 group ${checked ? 'bg-blue-600/10 border-blue-600' : 'bg-transparent border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-400 group-hover:border-gray-300'}`}>
         {checked && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
      </div>
      <span className={`text-sm font-semibold ${checked ? colorClass : 'text-gray-400 group-hover:text-gray-300'}`}>{label}</span>
    </div>
  );

  // VIRTUALIZED ROW RENDERER
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = processedRows[index];
    if (!item) return null;
    
    const { row, originalIndex, isSmall, isPending } = item;
    const actualRowIndex = index; // Used for striping logic

    let rowTextColorClass = 'text-gray-300';
    if (isSmall) rowTextColorClass = 'text-[#FF8C00] font-bold';
    if (isPending) rowTextColorClass = 'text-[#00ff66] font-bold';
    const isSelected = selectedForPrint.has(originalIndex);

    return (
      <div
        style={style}
        onClick={(e) => handleRowClick(e, originalIndex)}
        onDoubleClick={(e) => { e.stopPropagation(); setSelectedRowIndex(originalIndex); }}
        className={`flex items-center hover:bg-white/10 transition-colors duration-75 group cursor-pointer border-b border-white/5 ${isSelected ? 'bg-blue-900/40' : (actualRowIndex % 2 !== 0 ? 'bg-white/5' : '')}`}
      >
        <div className="w-[40px] px-0 py-2 border-r border-transparent flex justify-center items-center shrink-0 h-full">
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500 group-hover:border-gray-300'}`}>
                {isSelected && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
            </div>
        </div>
        {row.map((cell, cellIndex) => {
            const config = columnConfigs[cellIndex];
            let displayValue = cell;
            if (config.isNumeric) {
                const digits = (cellIndex === QUANTITY_COL_IDX) ? 0 : 1;
                displayValue = formatNumberVN(cell, digits);
            }
            return (
                <div 
                    key={cellIndex} 
                    style={{ width: config.width }} 
                    className={`px-4 py-2 text-[14px] border-r border-transparent h-full flex items-center overflow-hidden whitespace-normal break-words leading-tight shrink-0 ${config.align === 'text-right' ? 'justify-end' : 'justify-start'} ${rowTextColorClass} ${String(cellIndex) === searchColIndex ? 'bg-white/5 font-medium text-white' : ''}`}
                >
                    {displayValue}
                </div>
            );
        })}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 animate-fadeIn">
        <span className="material-symbols-outlined text-5xl opacity-20">inventory_2</span>
        <p>Không có dữ liệu tồn kho.</p>
        <button onClick={onRefresh} className="mt-2 px-4 py-2 bg-[#38761d] text-white rounded-md flex items-center gap-2 hover:bg-[#2f6318]">
          <span className="material-symbols-outlined text-[18px]">refresh</span> Tải lại
        </button>
      </div>
    );
  }

  const totalCount = processedRows.length;

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4 animate-fadeIn relative bg-[#212830]">
      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10 backdrop-blur-sm shrink-0 gap-3">
        <div className="flex items-center gap-4 order-3 xl:order-1 px-2">
          <button onClick={handleExportCSV} className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg transition-all font-bold text-sm group">
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            <span className="hidden group-hover:block whitespace-nowrap">Xuất CSV</span>
          </button>
          
          {selectedForPrint.size > 0 && (
            <button onClick={handleOpenPrint} className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg transition-all font-bold text-sm group animate-fadeIn">
                <span className="material-symbols-outlined text-[24px]">qr_code_2_add</span>
                <span className="hidden group-hover:block whitespace-nowrap">In Tem ({selectedForPrint.size})</span>
            </button>
          )}

          <div className="flex items-center border-l border-white/10 pl-4 gap-4">
             <div className="text-[14px] text-gray-300 font-medium whitespace-nowrap">
                Tổng: <span className="text-white font-bold text-lg ml-1">{totalCount.toLocaleString()}</span>
             </div>
             <div className="text-[14px] text-gray-300 font-medium whitespace-nowrap border-l border-white/10 pl-4">
                Trọng lượng: <span className="text-green-400 font-bold text-lg ml-1">{formatNumberVN(totalWeight / 1000, 2)} Tấn</span>
             </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 order-1 xl:order-2 w-full xl:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto justify-start">
             <CheckboxFilter label="Lô lẻ" checked={filterSmallLots} onChange={() => setFilterSmallLots(!filterSmallLots)} colorClass="text-[#FF8C00]"/>
             <CheckboxFilter label="Chờ Xuất" checked={filterPendingExport} onChange={() => setFilterPendingExport(!filterPendingExport)} colorClass="text-[#00ff66]"/>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a1a]/60 px-3 h-10 rounded-md border border-white/10 focus-within:border-accent-1/50 transition-colors flex-grow md:w-[260px] w-full">
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

      {/* VIRTUALIZED TABLE */}
      <div ref={containerRef} className="flex-1 border border-white/10 rounded-xl relative bg-[#2d2f35]/20 flex flex-col overflow-hidden">
         {/* CUSTOM HEADER (Sticky) */}
         <div className="flex bg-[#2d2f35] border-b border-white/20 z-20 shadow-md shrink-0">
            <div className="w-[40px] px-0 py-3.5 border-r border-transparent text-center bg-[#2d2f35] shrink-0">
                <span className="material-symbols-outlined text-[16px] text-gray-500">check_box_outline_blank</span>
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
             <ReactWindow.FixedSizeList
                height={listSize.height - 48} // Subtract approximate header height
                itemCount={processedRows.length}
                itemSize={ROW_HEIGHT}
                width={listSize.width}
                className="custom-scrollbar"
             >
                {Row}
             </ReactWindow.FixedSizeList>
             {processedRows.length === 0 && (
                 <div className="absolute inset-0 top-[48px] flex flex-col items-center justify-center text-gray-500 italic">
                    <span className="material-symbols-outlined text-4xl opacity-30">search_off</span>
                    <span>Không tìm thấy kết quả phù hợp cho "{inputValue}"</span>
                 </div>
             )}
         </div>
      </div>

      {/* EDIT MODAL */}
      {selectedRowIndex !== null && (
        <div className="absolute inset-0 z-50 flex justify-end overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => { if (!isEditing) setSelectedRowIndex(null); }}></div>
          <div className="relative w-full max-w-[50%] h-full bg-[#2d2f35] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-white/10 flex flex-col animate-slideInRight">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#212830] shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mr-auto"><span className="material-symbols-outlined text-blue-600">content_paste_go</span> Chi Tiết SKU</h3>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => { setIsEditing(false); if (data && selectedRowIndex !== null) setEditFormData(data[selectedRowIndex]); }} className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-semibold text-sm">Hủy (Esc)</button>
                    <button onClick={handleSave} className="px-4 py-1.5 rounded-lg bg-[#FF8C00] hover:bg-[#ff9d23] text-white flex items-center gap-2 shadow-lg transition-all font-bold text-sm group">
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span className="hidden group-hover:block whitespace-nowrap">Lưu (Ctrl+S)</span>
                    </button>
                  </>
                ) : (
                  <button onClick={handleStartEdit} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg transition-all font-bold text-sm group"><span className="material-symbols-outlined text-[18px]">edit</span><span className="hidden group-hover:block whitespace-nowrap">Sửa</span></button>
                )}
                <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
                <button onClick={() => setSelectedRowIndex(null)} aria-label="Đóng chi tiết" className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#e60000] hover:brightness-110 text-white shadow-md transition-all" title="Đóng (Esc)"><span className="material-symbols-outlined font-bold">close</span></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                {headers.map((header: string, idx: number) => {
                  const isReadOnlyColumn = idx >= headers.length - 2;
                  const cellValue = (editFormData as any[])[idx];
                  return (
                    <div key={idx} className="flex flex-col gap-1.5 border-b border-white/5 pb-2">
                      <label className="text-[11px] uppercase font-bold text-gray-400 tracking-wider truncate" title={String(header)}>{header}</label>
                      {isEditing ? (
                        <input type="text" value={cellValue || ''} onChange={(e) => handleInputChange(idx, e.target.value)} className={`w-full bg-[#1a1a1a] border border-white/20 rounded px-2.5 py-1.5 text-white focus:outline-none transition-colors text-sm ${isReadOnlyColumn ? 'opacity-60 cursor-not-allowed bg-white/5' : 'focus:border-accent-1'}`} disabled={isReadOnlyColumn}/>
                      ) : (
                        <span className="text-[15px] text-white font-medium break-words leading-relaxed whitespace-pre-wrap">{cellValue || <span className="italic text-gray-600 text-sm">Trống</span>}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PRINT MODAL */}
      <PrintLabelModal 
         isOpen={isPrintModalOpen} 
         onClose={() => setIsPrintModalOpen(false)} 
         data={getSelectedDataForPrint()} 
         headers={headers}
      />

      <style>{`
         @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } 
         .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default InventoryTable;
