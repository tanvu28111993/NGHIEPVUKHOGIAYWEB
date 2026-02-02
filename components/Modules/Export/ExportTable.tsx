import React from 'react';
import { ExportStagingItem } from '../../../hooks/useExportManager';
import { INVENTORY_COLUMNS } from '../../../utils/inventoryColumnConfig';
import { X, AlertTriangle } from 'lucide-react';
import { formatNumberToVN } from '../../../utils/formatting';
import { ColumnConfig } from '../../../types';

interface ExportTableProps {
  data: ExportStagingItem[];
  onRemove: (sku: string) => void;
}

export const ExportTable: React.FC<ExportTableProps> = ({ data, onRemove }) => {
  // Define custom columns for Export with explicit type to ensure 'format' property is recognized
  const exportColumns: ColumnConfig<any>[] = [
      { header: 'TL Xuất (KG)', width: 120, accessor: 'exportWeight', isNumeric: true },
      { header: 'SL Xuất', width: 100, accessor: 'exportQty', isNumeric: true }
  ];

  // Merge with standard columns
  // Cast INVENTORY_COLUMNS to any to allow merging if strict types complain about accessor compatibility
  const columns = [...exportColumns, ...INVENTORY_COLUMNS as ColumnConfig<any>[]];

  const totalWidth = columns.reduce((acc, col) => acc + (col.width || 100), 0) + 100; // +50 STT + 50 Action

  // Formatter riêng cho trọng lượng xuất (1 số lẻ)
  const weightFormatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-slate-900/50">
      <div className="relative w-full h-full flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1 custom-scrollbar relative">
          <table className="text-left border-collapse" style={{ minWidth: totalWidth }}>
            <thead className="bg-slate-950 text-white text-base uppercase font-bold sticky top-0 z-20 shadow-sm ring-1 ring-white/5">
              <tr>
                <th className="sticky left-0 z-30 px-2 py-3 text-center border-b border-r border-gray-800 bg-slate-950 w-[50px]">
                    STT
                </th>
                <th className="sticky left-[50px] z-30 px-2 py-3 text-center border-b border-r border-gray-800 bg-slate-950 w-[50px]">
                    Xóa
                </th>
                {columns.map((col, index) => (
                    <th 
                        key={index}
                        style={{ width: col.width, minWidth: col.width }}
                        className={`px-4 py-3 whitespace-nowrap border-b border-r border-gray-800 bg-slate-950 text-center ${
                             // Highlight Export Columns (Blue)
                             index < 2 ? 'text-blue-500' : ''
                        }`}
                    >
                        {col.header}
                    </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
                {data.length > 0 ? (
                    data.map((item, index) => {
                        // Check logic: Warning if Export Qty > Inventory Qty
                        const isOverStock = item.exportQty > item.quantity;

                        return (
                            <tr 
                                key={item.sku} 
                                className={`
                                    transition-colors group cursor-pointer border-l-4
                                    ${isOverStock 
                                        ? 'bg-red-900/20 border-l-red-500 hover:bg-red-900/30' 
                                        : 'hover:bg-blue-900/10 border-l-transparent'}
                                `}
                                title={isOverStock ? `CẢNH BÁO: Số lượng xuất (${item.exportQty}) lớn hơn tồn kho (${item.quantity})` : ''}
                            >
                                <td className="sticky left-0 z-20 px-2 py-2 text-center text-sm font-bold text-gray-400 border-r border-gray-800 bg-slate-900 group-hover:bg-slate-900/90">
                                    {index + 1}
                                </td>
                                <td className="sticky left-[50px] z-20 px-2 py-2 text-center border-r border-gray-800 bg-slate-900 group-hover:bg-slate-900/90">
                                    <button 
                                        onClick={() => onRemove(item.sku)}
                                        className="text-red-500 hover:text-red-400 transition-colors flex items-center justify-center w-full"
                                        title="Xóa dòng này"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </td>
                                {columns.map((col, colIndex) => {
                                    // @ts-ignore
                                    let val = item[col.accessor];
                                    
                                    // Formatting
                                    if (col.accessor === 'exportWeight') {
                                        // Định dạng TL Xuất: 1 số lẻ
                                        const num = Number(val);
                                        val = !isNaN(num) ? weightFormatter.format(num) : val;
                                    } else if (colIndex < 2) {
                                        // Custom Export Columns (Qty)
                                        val = formatNumberToVN(val);
                                    } else if (col.format) {
                                        // Standard Columns
                                        val = col.format(val);
                                    }

                                    const isExportCol = colIndex < 2;

                                    return (
                                        <td 
                                            key={colIndex}
                                            className={`
                                                px-4 py-2 text-sm font-bold whitespace-nowrap border-r border-gray-800 
                                                ${col.isNumeric ? 'text-right' : 'text-left'}
                                                ${isExportCol ? 'text-blue-500' : 'text-gray-300'}
                                                ${isOverStock && !isExportCol ? 'text-red-300' : ''}
                                            `}
                                        >
                                            <div className="flex items-center gap-2 justify-end">
                                                {/* Show warning icon in the Export Qty column if overstock */}
                                                {isOverStock && col.accessor === 'exportQty' && (
                                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                                )}
                                                {val !== null && val !== undefined ? String(val) : ''}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500 italic">
                            Chưa có dữ liệu xuất. Vui lòng thêm mã ở bảng bên trái và kiểm tra.
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};