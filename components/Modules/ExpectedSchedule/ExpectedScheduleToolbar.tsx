import React, { useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Search, Download, Trash2, ArrowDownToLine } from 'lucide-react';
import { ExpectedScheduleItem, ColumnConfig } from '../../../types';
import { Card } from '../../UI/Card';
import { Input } from '../../UI/Input';
import { Select } from '../../UI/Select';
import { GLOBAL_EVENTS } from '../../../hooks/useGlobalShortcuts';
import { formatNumberToVN, formatTotalToVN } from '../../../utils/formatting';

interface ExpectedScheduleToolbarProps {
  totalWeight: number;
  totalRows: number;
  isPending: boolean;
  isSyncing: boolean;
  
  filterState: any;
  onUpdateFilter: (key: string, value: any) => void;
  
  onRefresh: () => void;
  onExportCSV: () => void;
  onDeleteRows: () => void;
  onImportToWarehouse: () => void;
  selectedCount: number;
  
  columns: ColumnConfig<ExpectedScheduleItem>[];
}

export const ExpectedScheduleToolbar: React.FC<ExpectedScheduleToolbarProps> = ({
  totalWeight,
  totalRows,
  isPending,
  isSyncing,
  filterState,
  onUpdateFilter,
  onRefresh,
  onExportCSV,
  onDeleteRows,
  onImportToWarehouse,
  selectedCount,
  columns
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocus = () => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
    };
    window.addEventListener(GLOBAL_EVENTS.FOCUS_SEARCH, handleFocus);
    return () => window.removeEventListener(GLOBAL_EVENTS.FOCUS_SEARCH, handleFocus);
  }, []);
  
  const columnOptions = [
    { value: 'all', label: 'Tất cả thông tin' },
    ...columns.map(col => ({ value: col.accessor as string, label: col.header }))
  ];

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center w-full">
          <div className="flex items-center gap-2 mr-auto border-r border-gray-800 pr-4">
              <span className="text-sm font-medium text-gray-400">Tổng:</span>
              <span className="text-xl font-bold text-purple-500">
                  {formatTotalToVN(totalWeight)} Tấn
              </span>
              <span className="text-xs text-gray-500 ml-2">({totalRows} Dòng)</span>
              {(isPending || isSyncing) && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
              
              <button 
                onClick={onImportToWarehouse}
                disabled={selectedCount === 0}
                className={`h-10 px-4 flex items-center gap-2 rounded-lg border transition-all text-sm font-bold shadow-lg whitespace-nowrap active:scale-95 ${
                  selectedCount > 0 
                    ? 'bg-orange-600 border-orange-500 text-white hover:bg-orange-700 shadow-orange-900/20' 
                    : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Nhập kho {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
              </button>

              <button onClick={onExportCSV} className="h-10 px-3 flex items-center gap-2 bg-blue-600/80 hover:bg-blue-700 border border-blue-500/50 text-white rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap">
                  <Download className="w-4 h-4" /><span className="hidden md:inline">CSV</span>
              </button>

              <button 
                onClick={onDeleteRows}
                disabled={selectedCount === 0}
                className={`h-10 px-4 flex items-center gap-2 rounded-lg border transition-all text-sm font-bold shadow-lg whitespace-nowrap active:scale-95 ${
                  selectedCount > 0 
                    ? 'bg-red-600 border-red-500 text-white hover:bg-red-700 shadow-red-900/20' 
                    : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa dòng {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
              </button>

              <div className="h-8 w-px bg-gray-700 hidden md:block mx-1"></div>
              
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
                onClick={onRefresh} 
                className="h-10 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap" 
                disabled={isSyncing}
                title="Làm mới dữ liệu (Ctrl + S)"
              >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /><span className="hidden md:inline">Làm Mới</span>
              </button>
          </div>
      </div>
    </Card>
  );
};
