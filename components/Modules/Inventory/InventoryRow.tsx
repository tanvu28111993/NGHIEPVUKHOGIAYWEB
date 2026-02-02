
import React from 'react';
import { InventoryItem, ColumnConfig } from '../../../types';
import { getTransactionStyle } from '../../../utils/inventoryColumnConfig';

export interface InventoryRowProps {
    item: InventoryItem;
    index: number;
    columns: ColumnConfig<InventoryItem>[];
    colWidths: Record<string, number>;
    searchColumn: string;
    showOddLots: boolean;
    showPendingOut: boolean;
    rowHeight: number;
    isActive?: boolean;
    onRowDoubleClick?: (item: InventoryItem) => void;
    getDefaultStyle?: (isOddLot: boolean, isPendingOut: boolean) => string;
    // Selection
    isSelected?: boolean;
    onSelectRow?: (sku: string) => void;
}

export const InventoryRow = React.memo(({ 
    item, index, columns, colWidths, searchColumn, showOddLots, showPendingOut, rowHeight, isActive = false, onRowDoubleClick, getDefaultStyle,
    isSelected, onSelectRow
}: InventoryRowProps) => {
    const isOddLotRow = showOddLots && index < 10;
    const hasPendingOut = item.pendingOut && String(item.pendingOut).trim() !== '';
    const isPendingOutRow = showPendingOut && hasPendingOut;

    const transactionStyle = getTransactionStyle(item);

    return (
        <tr 
            style={{ 
                height: rowHeight,
                // CSS Optimization: Giúp trình duyệt không tính toán layout cho row bị ẩn
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
                    ? 'bg-purple-900/30 border-l-purple-500' // Highlight selected row
                    : `border-transparent hover:bg-blue-600/20 hover:border-l-blue-500 ${index % 2 === 0 ? '' : 'bg-slate-800/30'}`
            }
            `}
        >
            {/* Checkbox Cell */}
            {onSelectRow && (
                <td className="px-2 py-0 border-r border-gray-800 sticky left-0 z-10 bg-inherit text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(item.sku)}
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-slate-800 cursor-pointer accent-purple-600"
                    />
                </td>
            )}

            {columns.map((col, colIndex) => {
                const accessor = col.accessor as string;
                const value = item[col.accessor];
                const isSelectedColumn = searchColumn === accessor;

                let cellClass = '';
                if (transactionStyle) {
                    cellClass = transactionStyle;
                } else if (col.getCellStyle) {
                    cellClass = col.getCellStyle(item, isOddLotRow, isPendingOutRow);
                } else if (getDefaultStyle) {
                    cellClass = getDefaultStyle(isOddLotRow, isPendingOutRow);
                } else {
                    cellClass = 'text-gray-300 font-bold';
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
                        px-4 py-0 text-sm whitespace-nowrap border-r border-gray-800 group-hover:border-gray-700 overflow-hidden
                        ${cellClass}
                        ${isSelectedColumn && !isActive ? 'bg-brand-red/10' : ''}
                        ${col.isNumeric ? 'text-right' : 'text-left'}
                    `}
                    >
                    <div className="flex items-center h-full w-full">
                        <span className={`w-full truncate ${col.isNumeric ? 'text-right' : 'text-left'}`}>
                        {displayValue}
                        </span>
                    </div>
                    </td>
                );
            })}
        </tr>
    );
});
