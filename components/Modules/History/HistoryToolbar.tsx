
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw, Search, Download, ArrowDownToLine, ArrowUpFromLine, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import { InventoryItem, ColumnConfig } from '../../../types';
import { TimeFilterMatrix } from './TimeFilterMatrix';
import { Card } from '../../UI/Card';
import { Input } from '../../UI/Input';
import { Select } from '../../UI/Select';

interface HistoryToolbarProps {
  totalRows: number;
  totalWeight: number;
  isSyncing: boolean;
  
  searchTerm: string;
  onSearchChange: (val: string) => void;
  searchColumn: string;
  onSearchColumnChange: (val: string) => void;
  
  activeTabs: ('IMPORT' | 'EXPORT')[];
  onToggleTab: (tab: 'IMPORT' | 'EXPORT') => void;

  onRefresh: () => void;
  onExportCSV: () => void;
  
  onDateFilterChange: (startDate: Date, endDate: Date, year: number, months: number[]) => void;
  initialYear: number;
  initialMonths: number[];
  
  columns: ColumnConfig<InventoryItem>[];
}

export const HistoryToolbar: React.FC<HistoryToolbarProps> = ({
  totalRows,
  totalWeight,
  isSyncing,
  searchTerm,
  onSearchChange,
  searchColumn,
  onSearchColumnChange,
  activeTabs,
  onToggleTab,
  onRefresh,
  onExportCSV,
  onDateFilterChange,
  initialYear,
  initialMonths,
  columns
}) => {
  const [showTimeMatrix, setShowTimeMatrix] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTimeMatrix(false);
      }
    };

    if (showTimeMatrix) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimeMatrix]);

  const columnOptions = [
    { value: 'all', label: 'Tất cả' },
    ...columns.map(col => ({ value: col.accessor as string, label: col.header }))
  ];

  return (
    <div className="mb-4 flex flex-col gap-4">
      <Card className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
             
             {/* LEFT SECTION: Stats Only */}
             <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full xl:w-auto">
                 {/* 1. Stats */}
                 <div className="flex items-center gap-2 border-r border-gray-800 pr-4 min-w-[200px]">
                    <span className="text-sm font-medium text-gray-400">Tổng:</span>
                    <span className="text-xl font-bold text-green-500">
                        {totalWeight.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tấn
                    </span>
                    <span className="text-xs text-gray-500 ml-2">({totalRows} cuộn)</span>
                    {isSyncing && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
                 </div>
             </div>

             {/* RIGHT SECTION: Actions & Filters */}
             <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center justify-end">
                  
                  {/* CSV Export */}
                  <button onClick={onExportCSV} title="Xuất Excel" className="h-10 w-full md:w-auto px-3 flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-700 border border-blue-500/50 text-white rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap">
                      <Download className="w-4 h-4" /><span className="hidden xl:inline">CSV</span>
                  </button>

                  {/* IMPORT / EXPORT TOGGLES */}
                  <button
                        onClick={() => onToggleTab('IMPORT')}
                        className={`
                            h-10 px-3 flex items-center gap-2 rounded-lg border transition-all text-sm font-medium whitespace-nowrap
                            ${activeTabs.includes('IMPORT')
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                                : 'bg-slate-800 border-slate-600 text-gray-400 hover:text-white hover:border-gray-500'}
                        `}
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                        <span>NHẬP KHO</span>
                  </button>

                  <button
                        onClick={() => onToggleTab('EXPORT')}
                        className={`
                            h-10 px-3 flex items-center gap-2 rounded-lg border transition-all text-sm font-medium whitespace-nowrap
                            ${activeTabs.includes('EXPORT')
                                ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                                : 'bg-slate-800 border-slate-600 text-gray-400 hover:text-white hover:border-gray-500'}
                        `}
                    >
                        <ArrowUpFromLine className="w-4 h-4" />
                        <span>XUẤT KHO</span>
                  </button>

                  {/* Search Components */}
                  <Input 
                    icon={Search}
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    containerClassName="w-full md:w-96"
                  />
                  
                  <Select 
                    options={columnOptions}
                    value={searchColumn}
                    onChange={(e) => onSearchColumnChange(e.target.value)}
                    containerClassName="w-full md:w-[150px]"
                  />

                  {/* Time Matrix Toggle Button */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowTimeMatrix(!showTimeMatrix)}
                        className={`
                        h-10 px-3 flex items-center gap-2 rounded-lg border transition-all text-sm font-medium whitespace-nowrap
                        ${showTimeMatrix 
                            ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-red-900/20' 
                            : 'bg-slate-800 border-slate-600 text-gray-300 hover:text-white hover:border-gray-400'}
                        `}
                    >
                        <CalendarClock className="w-4 h-4" />
                        <span className="hidden xl:inline">Thời gian</span>
                        {showTimeMatrix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* POPUP DROPDOWN */}
                    {showTimeMatrix && (
                        <div className="absolute top-12 right-0 z-50">
                            <TimeFilterMatrix 
                                isSyncing={isSyncing} 
                                onFilterChange={onDateFilterChange} 
                                onClose={() => setShowTimeMatrix(false)}
                                initialYear={initialYear}
                                initialMonths={initialMonths}
                            />
                        </div>
                    )}
                  </div>
                  
                  {/* Refresh */}
                  <button onClick={onRefresh} title="Tải lại dữ liệu" className="h-10 w-full md:w-auto px-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap" disabled={isSyncing}>
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /><span className="hidden xl:inline">Tải lại</span>
                  </button>
             </div>
      </Card>
    </div>
  );
};
