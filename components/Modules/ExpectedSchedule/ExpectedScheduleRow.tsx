import React from 'react';
import { ExpectedScheduleItem, ColumnConfig } from '../../../types';

export interface ExpectedScheduleRowProps {
    item: ExpectedScheduleItem;
    index: number;
    columns: ColumnConfig<ExpectedScheduleItem>[];
    colWidths: Record<string, number>;
    searchColumn: string;
    rowHeight: number;
    isActive?: boolean;
    onRowDoubleClick?: (item: ExpectedScheduleItem) => void;
    getDefaultStyle?: (item: ExpectedScheduleItem) => string;
    isSelected?: boolean;
    onSelectRow?: (id: string) => void;
}

export const ExpectedScheduleRow = React.memo(({ 
    item, index, columns, colWidths, searchColumn, rowHeight, isActive = false, onRowDoubleClick, getDefaultStyle,
    isSelected, onSelectRow
}: ExpectedScheduleRowProps) => {

    return (
        <tr 
            style={{ 
                height: rowHeight,
                contentVisibility: 'auto', 
                containIntrinsicSize: `${rowHeight}px` 
            }}
            role="row"
            aria-rowindex={index + 1}
            aria-selected={isActive}
            onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(item)}
            className={`
            transition-all duration-75 group border-l-4 cursor-pointer
            ${isActive 
                ? 'bg-blue-600/30 border-l-blue-400 ring-1 ring-inset ring-blue-500/50 z-10 relative' 
                : isSelected
                    ? 'bg-purple-900/30 border-l-purple-500' 
                    : `border-transparent hover:bg-blue-600/20 hover:border-l-blue-500 ${index % 2 === 0 ? '' : 'bg-slate-800/30'}`
            }
            `}
        >
            {onSelectRow && (
                <td className="px-2 py-0 border-r border-gray-800 sticky left-0 z-10 bg-inherit text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(item.id)}
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-slate-800 cursor-pointer accent-purple-600"
                    />
                </td>
            )}

            {columns.map((col, colIndex) => {
                const accessor = col.accessor as string;
                const value = item[col.accessor as keyof ExpectedScheduleItem];
                const isSelectedColumn = searchColumn === accessor;

                let cellClass = '';
                if (item.id && item.id.startsWith('LVTS-')) {
                    cellClass = 'text-[#DA291C] font-black';
                } else if (item.status === 'Quá hạn') {
                    cellClass = 'text-[#FF8C00] font-black';
                } else if (item.status === 'Sắp về') {
                    cellClass = 'text-[#bf00ff] font-black';
                } else if (item.status === 'Đang về') {
                    cellClass = 'text-[#00FF00] font-black';
                } else if (item.statusColor) {
                    cellClass = item.statusColor.replace(/font-bold/g, 'font-black');
                } else if (getDefaultStyle) {
                    cellClass = getDefaultStyle(item).replace(/font-bold/g, 'font-black');
                } else {
                    cellClass = 'text-gray-300 font-black';
                }

                // Override specific color for status column if it has a status
                if (accessor === 'status') {
                    if (item.status === 'Quá hạn') {
                        cellClass = 'text-[#FF8C00] font-black';
                    } else if (item.status === 'Sắp về') {
                        cellClass = 'text-[#bf00ff] font-black';
                    } else if (item.status === 'Đang về') {
                        cellClass = 'text-[#00FF00] font-black';
                    }
                }

                let displayValue = value !== null && value !== undefined ? String(value) : "";
                if (col.format) {
                    displayValue = String(col.format(value));
                }

                return (
                    <td 
                    key={colIndex} 
                    role="gridcell"
                    style={{ width: colWidths[accessor], minWidth: colWidths[accessor] }}
                    className={`
                        px-4 py-0 text-sm whitespace-nowrap border-r border-gray-800 group-hover:border-gray-700 overflow-hidden font-black font-sans
                        ${cellClass}
                        ${isSelectedColumn && !isActive ? 'bg-brand-red/10' : ''}
                        ${col.isNumeric ? 'text-right' : 'text-left'}
                    `}
                    >
                    <div className="flex items-center h-full w-full">
                        <span className={`w-full truncate font-black font-sans ${col.isNumeric ? 'text-right' : 'text-left'}`}>
                        {displayValue}
                        </span>
                    </div>
                    </td>
                );
            })}
        </tr>
    );
});
