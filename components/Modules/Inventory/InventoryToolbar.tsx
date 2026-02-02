import React, { useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Search, Download, SlidersHorizontal, Puzzle, Hourglass, QrCode } from 'lucide-react';
import { InventoryItem, ColumnConfig } from '../../../types';
import { Card } from '../../UI/Card';
import { Input } from '../../UI/Input';
import { Select } from '../../UI/Select';
import { Badge } from '../../UI/Badge';
import { GLOBAL_EVENTS } from '../../../hooks/useGlobalShortcuts';
import { FilterState } from '../../../hooks/useInventoryFilter';

interface InventoryToolbarProps {
  totalWeight: number;
  totalRows: number;
  isPending: boolean;
  isSyncing: boolean;
  
  // Grouped Filter Props
  filterState: FilterState;
  onUpdateFilter: (key: keyof FilterState, value: any) => void;
  onClearRangeFilters: () => void;
  
  onRefresh: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  selectedCount: number;
  
  columns: ColumnConfig<InventoryItem>[];
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  totalWeight,
  totalRows,
  isPending,
  isSyncing,
  filterState,
  onUpdateFilter,
  onClearRangeFilters,
  onRefresh,
  onExportCSV,
  onPrint,
  selectedCount,
  columns
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for global shortcut Ctrl+F
  useEffect(() => {
    const handleFocus = () => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
    };
    window.addEventListener(GLOBAL_EVENTS.FOCUS_SEARCH, handleFocus);
    return () => window.removeEventListener(GLOBAL_EVENTS.FOCUS_SEARCH, handleFocus);
  }, []);
  
  // Transform columns for Select component
  const columnOptions = [
    { value: 'all', label: 'Tất cả thông tin' },
    ...columns.map(col => ({ value: col.accessor as string, label: col.header }))
  ];

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center w-full">
          {/* Stats Section */}
          <div className="flex items-center gap-2 mr-auto border-r border-gray-800 pr-4">
              <span className="text-sm font-medium text-gray-400">Tổng:</span>
              <span className="text-xl font-bold text-green-500">
                  {totalWeight.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tấn
              </span>
              <span className="text-xs text-gray-500 ml-2">({totalRows} Dòng)</span>
              {(isPending || isSyncing) && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
          </div>

          {/* Actions & Filters Section */}
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
              
              {/* PRINT BUTTON - Purple & QR Icon */}
              <button 
                onClick={onPrint}
                disabled={selectedCount === 0}
                className={`
                    h-10 px-4 flex items-center gap-2 rounded-lg border transition-all text-sm font-bold shadow-lg whitespace-nowrap
                    ${selectedCount > 0 
                        ? 'bg-purple-600 border-purple-500 text-white hover:bg-purple-700 shadow-purple-900/20' 
                        : 'bg-slate-800 border-slate-600 text-gray-500 cursor-not-allowed'}
                `}
                title={`In ${selectedCount} tem đã chọn (Ctrl + P)`}
              >
                  <QrCode className="w-4 h-4" />
                  <span>In Tem ({selectedCount})</span>
              </button>

              <div className="h-8 w-px bg-gray-700 hidden md:block mx-1"></div>

              <button onClick={onExportCSV} className="h-10 px-3 flex items-center gap-2 bg-blue-600/80 hover:bg-blue-700 border border-blue-500/50 text-white rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap">
                  <Download className="w-4 h-4" /><span className="hidden md:inline">CSV</span>
              </button>
              
              <button 
                onClick={() => onUpdateFilter('showOddLots', !filterState.showOddLots)} 
                className={`h-10 px-3 flex items-center gap-2 rounded-lg border transition-all text-sm font-medium whitespace-nowrap ${filterState.showOddLots ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-slate-800 border-slate-600 text-gray-400 hover:text-white hover:border-gray-500'}`}
              >
                  <Puzzle className="w-4 h-4" /><span className="hidden md:inline">Lô Lẻ</span>
                  {filterState.showOddLots && <Badge variant="warning" size="sm" className="ml-1 text-black bg-orange-500">10</Badge>}
              </button>
              
              <button 
                onClick={() => onUpdateFilter('showPendingOut', !filterState.showPendingOut)} 
                className={`h-10 px-3 flex items-center gap-2 rounded-lg border transition-all text-sm font-medium whitespace-nowrap ${filterState.showPendingOut ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-slate-800 border-slate-600 text-gray-400 hover:text-white hover:border-gray-500'}`}
              >
                  <Hourglass className="w-4 h-4" /><span className="hidden md:inline">Chờ Xuất</span>
              </button>
              
              <Input 
                ref={searchInputRef}
                icon={Search}
                placeholder="Tìm kiếm... (Ctrl+F)"
                value={filterState.searchTerm}
                onChange={(e) => onUpdateFilter('searchTerm', e.target.value)}
                containerClassName="w-full md:w-[250px]"
              />
              
              <Select 
                options={columnOptions}
                value={filterState.searchColumn}
                onChange={(e) => onUpdateFilter('searchColumn', e.target.value)}
                containerClassName="w-full md:w-[180px]"
              />
              
              <button 
                onClick={() => onUpdateFilter('showAdvancedFilters', !filterState.showAdvancedFilters)} 
                className={`h-10 px-3 flex items-center gap-2 rounded-lg border transition-all text-sm font-medium whitespace-nowrap ${filterState.showAdvancedFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-600 text-gray-400 hover:text-white hover:border-gray-500'}`}
              >
                  <SlidersHorizontal className="w-4 h-4" /><span className="hidden md:inline">Bộ lọc</span>
              </button>
              
              <button 
                onClick={onRefresh} 
                className="h-10 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap" 
                disabled={isSyncing}
                title="Làm mới dữ liệu (Ctrl + S)"
              >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /><span className="hidden md:inline">Làm Mới</span>
              </button>
          </div>
      </div>

      {filterState.showAdvancedFilters && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 animate-fade-in">
              <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Khổ (Rộng cm)</label>
                  <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Từ" 
                        value={filterState.rangeFilters.widthMin} 
                        onChange={(e) => onUpdateFilter('rangeFilters', { ...filterState.rangeFilters, widthMin: e.target.value })} 
                        className="h-8 py-1" 
                      />
                      <span className="text-gray-500">-</span>
                      <Input 
                        placeholder="Đến" 
                        value={filterState.rangeFilters.widthMax} 
                        onChange={(e) => onUpdateFilter('rangeFilters', { ...filterState.rangeFilters, widthMax: e.target.value })} 
                        className="h-8 py-1" 
                      />
                  </div>
              </div>
              <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-400 uppercase">Lô/Dài (cm)</label>
                       <button onClick={onClearRangeFilters} className="text-[10px] text-red-400 hover:text-red-300 underline">Xóa bộ lọc</button>
                  </div>
                  <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Từ" 
                        value={filterState.rangeFilters.lengthMin} 
                        onChange={(e) => onUpdateFilter('rangeFilters', { ...filterState.rangeFilters, lengthMin: e.target.value })} 
                        className="h-8 py-1" 
                      />
                      <span className="text-gray-500">-</span>
                      <Input 
                        placeholder="Đến" 
                        value={filterState.rangeFilters.lengthMax} 
                        onChange={(e) => onUpdateFilter('rangeFilters', { ...filterState.rangeFilters, lengthMax: e.target.value })} 
                        className="h-8 py-1" 
                      />
                  </div>
              </div>
          </div>
      )}
    </Card>
  );
};