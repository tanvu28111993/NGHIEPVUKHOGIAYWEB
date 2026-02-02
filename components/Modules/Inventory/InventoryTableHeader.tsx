
import React from 'react';
import { InventoryItem, ColumnConfig } from '../../../types';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface InventoryTableHeaderProps {
  columns: ColumnConfig<InventoryItem>[];
  colWidths: Record<string, number>;
  sortConfig: { key: keyof InventoryItem | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof InventoryItem) => void;
  searchColumn: string;
  onResizeMouseDown: (e: React.MouseEvent, accessor: string) => void;
  // Selection
  allSelected?: boolean;
  onSelectAll?: (isSelected: boolean) => void;
  showCheckbox?: boolean;
}

export const InventoryTableHeader: React.FC<InventoryTableHeaderProps> = React.memo(({
  columns,
  colWidths,
  sortConfig,
  onSort,
  searchColumn,
  onResizeMouseDown,
  allSelected,
  onSelectAll,
  showCheckbox
}) => {
  return (
    <thead className="bg-slate-950 text-white text-base uppercase font-bold sticky top-0 z-20 shadow-sm ring-1 ring-white/5">
      <tr>
        {/* Checkbox Column */}
        {showCheckbox && (
            <th className="px-2 py-4 border-b border-r border-gray-800 bg-slate-950 w-[40px] sticky left-0 z-30 text-center">
                <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-slate-800 cursor-pointer accent-purple-600"
                />
            </th>
        )}

        {columns.map((col, index) => {
          const accessor = col.accessor as string;
          const isSorted = sortConfig.key === accessor;
          const width = colWidths[accessor];

          return (
            <th
              key={index}
              style={{ width: width, minWidth: width }}
              className={`
                relative px-4 py-4 whitespace-nowrap border-b border-r border-gray-800 bg-slate-950 transition-colors duration-200 select-none group
                ${searchColumn === accessor ? 'text-brand-red bg-slate-900' : ''}
              `}
            >
              <div
                className="flex items-center justify-center gap-2 cursor-pointer w-full h-full"
                onDoubleClick={() => onSort(col.accessor)}
                title="Tích đúp để sắp xếp"
              >
                <span className="truncate">{col.header}</span>
                <span className="text-gray-600">
                  {isSorted ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-3 h-3 text-brand-red" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-brand-red" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  )}
                </span>
              </div>

              {!col.isFixed && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 z-30"
                  onMouseDown={(e) => onResizeMouseDown(e, accessor)}
                />
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
});
