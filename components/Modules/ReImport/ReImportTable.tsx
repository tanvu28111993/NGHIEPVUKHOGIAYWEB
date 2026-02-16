import React from 'react';
import { ReImportStagingItem } from '../../../types';
import { INVENTORY_COLUMNS } from '../../../utils/inventoryColumnConfig';
import { formatNumberToVN } from '../../../utils/formatting';
import { ColumnConfig } from '../../../types';

interface ReImportTableProps {
  data: ReImportStagingItem[];
  onRemove: (sku: string) => void;
}

export const ReImportTable: React.FC<ReImportTableProps> = ({ data, onRemove }) => {
  // Define custom columns for Re-Import
  const reImportColumns: ColumnConfig<ReImportStagingItem>[] = [
      { header: 'TL Nhập (KG)', width: 120, accessor: 'reImportWeight', isNumeric: true },
      { header: 'SL Nhập', width: 100, accessor: 'reImportQty', isNumeric: true }
  ];

  // Merge with standard columns safe casting
  const columns: ColumnConfig<ReImportStagingItem>[] = [
      ...reImportColumns, 
      ...(INVENTORY_COLUMNS as unknown as ColumnConfig<ReImportStagingItem>[])
  ];

  const totalWidth = columns.reduce((acc, col) => acc + (col.width || 100), 0) + 50; // +50 STT

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
                {columns.map((col, index) => (
                    <th 
                        key={index}
                        style={{ width: col.width, minWidth: col.width }}
                        className={`px-4 py-3 whitespace-nowrap border-b border-r border-gray-800 bg-slate-950 text-center ${
                             // Highlight Re-Import Columns (Cyan)
                             index < 2 ? 'text-cyan-500' : ''
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
                        return (
                            <tr 
                                key={item.sku} 
                                className="transition-colors group cursor-pointer border-l-4 hover:bg-cyan-900/10 border-l-transparent"
                                onDoubleClick={() => onRemove(item.sku)}
                                title="Tích đúp để xóa dòng này"
                            >
                                <td className="sticky left-0 z-20 px-2 py-2 text-center text-sm font-bold text-gray-400 border-r border-gray-800 bg-slate-900 group-hover:bg-slate-900/90">
                                    {index + 1}
                                </td>
                                {columns.map((col, colIndex) => {
                                    let val = item[col.accessor];
                                    
                                    if (col.accessor === 'reImportWeight') {
                                        const num = Number(val);
                                        val = !isNaN(num) ? weightFormatter.format(num) : val;
                                    } else if (colIndex < 2) {
                                        val = formatNumberToVN(val);
                                    } else if (col.format) {
                                        val = col.format(val);
                                    }

                                    const isReImportCol = colIndex < 2;

                                    return (
                                        <td 
                                            key={colIndex}
                                            className={`
                                                px-4 py-2 text-sm font-bold whitespace-nowrap border-r border-gray-800 
                                                ${col.isNumeric ? 'text-right' : 'text-left'}
                                                ${isReImportCol ? 'text-cyan-500' : 'text-gray-300'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2 justify-end">
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
                        <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 italic">
                            Chưa có dữ liệu nhập lại. Vui lòng thêm mã ở bảng bên trái.
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