import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryItem, ColumnConfig } from '../../../types';
import { useVirtualScroll } from '../../../hooks/useVirtualScroll';
import { useColumnResize } from '../../../hooks/useColumnResize';
import { TableSkeleton } from './TableSkeleton';
import { InventoryRow } from './InventoryRow';
import { InventoryTableHeader } from './InventoryTableHeader';
import { UI_CONFIG } from '../../../utils/constants';

interface InventoryTableProps {
  data: InventoryItem[];
  isLoading: boolean;
  isSyncing: boolean;
  columns: ColumnConfig<InventoryItem>[];
  sortConfig: { key: keyof InventoryItem | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof InventoryItem) => void;
  
  // Grouped Filter Props
  filterState: {
    searchColumn: string;
    showOddLots: boolean;
    showPendingOut: boolean;
  };

  hideFooter?: boolean;
  onRowDoubleClick?: (item: InventoryItem) => void;
  variant?: 'default' | 'embedded';
  getDefaultStyle?: (isOdd: boolean, isPending: boolean) => string;
  
  // Selection Props
  selectedSkus?: Set<string>;
  onSelectRow?: (sku: string) => void;
  onSelectAll?: (isSelected: boolean) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  data,
  isLoading,
  isSyncing,
  columns,
  sortConfig,
  onSort,
  filterState, // Received as object
  hideFooter = false,
  onRowDoubleClick,
  variant = 'default',
  getDefaultStyle,
  selectedSkus,
  onSelectRow,
  onSelectAll
}) => {
  const ROW_HEIGHT = UI_CONFIG.TABLE_ROW_HEIGHT; 
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);

  // 1. Virtual Scroll Hook
  const { 
    containerRef, 
    handleScroll, 
    startIndex, 
    endIndex, 
    paddingTop, 
    paddingBottom 
  } = useVirtualScroll(data.length, ROW_HEIGHT);

  // 2. Column Resize Hook
  const initialWidths = useState(() => {
    const widths: Record<string, number> = {};
    columns.forEach(col => widths[col.accessor as string] = col.width || 100);
    return widths;
  })[0];
  
  const { colWidths, handleMouseDown } = useColumnResize(initialWidths);

  useEffect(() => {
      setSelectedRowIndex(-1);
  }, [data.length, sortConfig]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (data.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedRowIndex(prev => {
            const next = Math.min(prev + 1, data.length - 1);
            scrollToRow(next);
            return next;
        });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedRowIndex(prev => {
            const next = Math.max(prev - 1, 0);
            scrollToRow(next);
            return next;
        });
    } else if (e.key === 'Enter') {
        if (selectedRowIndex !== -1 && onRowDoubleClick) {
            e.preventDefault();
            onRowDoubleClick(data[selectedRowIndex]);
        }
    } else if (e.key === ' ') { // Space to toggle select
        if (selectedRowIndex !== -1 && onSelectRow) {
            e.preventDefault();
            onSelectRow(data[selectedRowIndex].sku);
        }
    }
  };

  const scrollToRow = (index: number) => {
      if (containerRef.current) {
          const rowTop = index * ROW_HEIGHT;
          const rowBottom = rowTop + ROW_HEIGHT;
          const container = containerRef.current;
          const viewTop = container.scrollTop;
          const viewBottom = viewTop + container.clientHeight;

          if (rowTop < viewTop) {
              container.scrollTop = rowTop;
          } else if (rowBottom > viewBottom) {
              container.scrollTop = rowBottom - container.clientHeight;
          }
      }
  };

  // Optimization: Memoize Table Width Calculation (+40px for Checkbox)
  const totalTableWidth = useMemo(() => {
      return columns.reduce((acc, col) => acc + (colWidths[col.accessor as string] || 100), 0) + 40;
  }, [columns, colWidths]);

  const visibleRows = data.slice(startIndex, endIndex);
  const showSkeleton = isLoading && data.length === 0;
  const showBackgroundUpdate = (isLoading || isSyncing) && data.length > 0;
  const containerClasses = variant === 'default'
    ? "bg-slate-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden"
    : "bg-transparent overflow-hidden"; 

  return (
    <div 
        className={`flex-1 w-full flex flex-col relative focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${containerClasses}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="grid"
        aria-rowcount={data.length}
        aria-busy={isLoading || isSyncing}
    >
      {showBackgroundUpdate && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-900/30 z-50">
              <div className="h-full bg-blue-500 animate-progress-indeterminate shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>
      )}

      {showSkeleton ? (
        <TableSkeleton />
      ) : (
        <div className="relative w-full h-full flex flex-col flex-1 min-h-0">
          <div 
              ref={containerRef}
              onScroll={handleScroll}
              className={`overflow-auto flex-1 custom-scrollbar relative will-change-scroll ${showBackgroundUpdate ? 'opacity-70 transition-opacity duration-200' : 'opacity-100'}`}
          >
              <table 
                className="text-left border-collapse" 
                style={{ tableLayout: 'fixed', width: totalTableWidth }}
                role="presentation"
              >
                <InventoryTableHeader 
                  columns={columns}
                  colWidths={colWidths}
                  sortConfig={sortConfig}
                  onSort={onSort}
                  searchColumn={filterState.searchColumn}
                  onResizeMouseDown={handleMouseDown}
                  // Selection Props
                  allSelected={data.length > 0 && selectedSkus?.size === data.length}
                  onSelectAll={onSelectAll}
                  showCheckbox={!!onSelectRow}
                />
                
                <tbody className="divide-y divide-gray-800/50" role="rowgroup">
                    {paddingTop > 0 && <tr><td colSpan={columns.length + 1} style={{ height: paddingTop }} /></tr>}

                    {visibleRows.length > 0 ? (
                    visibleRows.map((item, index) => {
                        const actualIndex = startIndex + index;
                        const isActive = actualIndex === selectedRowIndex;
                        return (
                          <InventoryRow 
                            key={item.sku ? `${item.sku}_${actualIndex}` : actualIndex}
                            item={item}
                            index={actualIndex}
                            columns={columns}
                            colWidths={colWidths}
                            searchColumn={filterState.searchColumn}
                            showOddLots={filterState.showOddLots}
                            showPendingOut={filterState.showPendingOut}
                            rowHeight={ROW_HEIGHT}
                            isActive={isActive}
                            onRowDoubleClick={onRowDoubleClick}
                            getDefaultStyle={getDefaultStyle}
                            // Selection
                            isSelected={selectedSkus?.has(item.sku)}
                            onSelectRow={onSelectRow}
                          />
                        );
                    })
                    ) : (
                    <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                        Không tìm thấy dữ liệu phù hợp.
                        </td>
                    </tr>
                    )}

                    {paddingBottom > 0 && <tr><td colSpan={columns.length + 1} style={{ height: paddingBottom }} /></tr>}
                </tbody>
              </table>
          </div>
        </div>
      )}
    </div>
  );
};