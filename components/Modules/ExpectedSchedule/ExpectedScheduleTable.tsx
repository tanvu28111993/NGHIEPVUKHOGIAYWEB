import React, { useState, useEffect, useMemo } from 'react';
import { ExpectedScheduleItem, ColumnConfig } from '../../../types';
import { useVirtualScroll } from '../../../hooks/useVirtualScroll';
import { useColumnResize } from '../../../hooks/useColumnResize';
import { TableSkeleton } from './TableSkeleton';
import { ExpectedScheduleRow } from './ExpectedScheduleRow';
import { ExpectedScheduleTableHeader } from './ExpectedScheduleTableHeader';
import { UI_CONFIG } from '../../../utils/constants';

interface ExpectedScheduleTableProps {
  data: ExpectedScheduleItem[];
  isLoading: boolean;
  isSyncing: boolean;
  columns: ColumnConfig<ExpectedScheduleItem>[];
  sortConfig: { key: keyof ExpectedScheduleItem | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof ExpectedScheduleItem) => void;
  
  filterState: {
    searchColumn: string;
  };

  hideFooter?: boolean;
  onRowDoubleClick?: (item: ExpectedScheduleItem) => void;
  variant?: 'default' | 'embedded';
  getDefaultStyle?: (item: ExpectedScheduleItem) => string;
  
  selectedIds?: Set<string>;
  onSelectRow?: (id: string) => void;
  onSelectAll?: (isSelected: boolean) => void;
}

export const ExpectedScheduleTable: React.FC<ExpectedScheduleTableProps> = ({
  data,
  isLoading,
  isSyncing,
  columns,
  sortConfig,
  onSort,
  filterState,
  hideFooter = false,
  onRowDoubleClick,
  variant = 'default',
  getDefaultStyle,
  selectedIds,
  onSelectRow,
  onSelectAll
}) => {
  const ROW_HEIGHT = UI_CONFIG.TABLE_ROW_HEIGHT; 
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);

  const { 
    containerRef, 
    handleScroll, 
    startIndex, 
    endIndex, 
    paddingTop, 
    paddingBottom 
  } = useVirtualScroll(data.length, ROW_HEIGHT);

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
    } else if (e.key === ' ') { 
        if (selectedRowIndex !== -1 && onSelectRow) {
            e.preventDefault();
            onSelectRow(data[selectedRowIndex].id);
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
                <ExpectedScheduleTableHeader 
                  columns={columns}
                  colWidths={colWidths}
                  sortConfig={sortConfig}
                  onSort={onSort}
                  searchColumn={filterState.searchColumn}
                  onResizeMouseDown={handleMouseDown}
                  allSelected={data.length > 0 && selectedIds?.size === data.length}
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
                          <ExpectedScheduleRow 
                            key={item.id ? `${item.id}_${actualIndex}` : actualIndex}
                            item={item}
                            index={actualIndex}
                            columns={columns}
                            colWidths={colWidths}
                            searchColumn={filterState.searchColumn}
                            rowHeight={ROW_HEIGHT}
                            isActive={isActive}
                            onRowDoubleClick={onRowDoubleClick}
                            getDefaultStyle={getDefaultStyle}
                            isSelected={selectedIds?.has(item.id)}
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
