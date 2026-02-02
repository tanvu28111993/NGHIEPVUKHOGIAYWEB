
import React from 'react';
import { InventoryItem } from '../../../types';
import { INVENTORY_COLUMNS } from '../../../utils/inventoryColumnConfig';
import { AlertTriangle } from 'lucide-react';

interface ImportTableProps {
  data: InventoryItem[];
  onRemoveItem: (index: number) => void;
  existingSkus: Set<string>; // Nhận danh sách SKU đã tồn tại trong kho
}

export const ImportTable: React.FC<ImportTableProps> = ({ data, onRemoveItem, existingSkus }) => {
  // Tính tổng độ rộng bảng (STT width = 50px).
  const totalWidth = INVENTORY_COLUMNS.reduce((acc, col) => acc + (col.width || 100), 0) + 50;

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden">
      <div className="relative w-full h-full flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1 custom-scrollbar relative">
          <table 
            className="text-left border-collapse" 
            style={{ minWidth: totalWidth }}
          >
            <thead className="bg-slate-950 text-white text-base uppercase font-bold sticky top-0 z-20 shadow-sm ring-1 ring-white/5">
              <tr>
                {/* Cột STT */}
                <th className="sticky left-0 z-30 px-2 py-3 text-center border-b border-r border-gray-800 bg-slate-950 w-[50px]">
                  STT
                </th>

                {/* Các cột nghiệp vụ */}
                {INVENTORY_COLUMNS.map((col, index) => (
                  <th
                    key={index}
                    style={{ width: col.width, minWidth: col.width }}
                    className="px-4 py-3 whitespace-nowrap border-b border-r border-gray-800 bg-slate-950 text-center"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-800/50">
              {data.length > 0 ? (
                data.map((item, index) => {
                  // Kiểm tra trùng lặp
                  const isDuplicate = existingSkus.has(item.sku);
                  
                  return (
                    <tr 
                        key={`${item.sku}-${index}`}
                        className={`
                            transition-colors group cursor-pointer border-l-4 
                            ${isDuplicate ? 'bg-red-900/20 border-l-red-500 hover:bg-red-900/30' : 'hover:bg-blue-900/10 border-l-transparent'}
                        `}
                        onDoubleClick={() => onRemoveItem(index)}
                        title={isDuplicate ? "CẢNH BÁO: SKU này đã tồn tại trong kho!" : "Tích đúp chuột để xóa dòng này"}
                    >
                        {/* Cột STT */}
                        <td className="sticky left-0 z-20 px-2 py-2 text-center text-sm font-bold text-gray-400 border-r border-gray-800 bg-slate-900 group-hover:bg-slate-900/90">
                        {index + 1}
                        </td>

                        {/* Dữ liệu */}
                        {INVENTORY_COLUMNS.map((col, colIndex) => {
                        let displayValue = item[col.accessor];
                        
                        // Format dữ liệu nếu có
                        if (col.format) {
                            displayValue = col.format(displayValue);
                        }

                        // Xử lý hiển thị đặc biệt cho cột SKU nếu trùng
                        if (col.accessor === 'sku' && isDuplicate) {
                            return (
                                <td 
                                    key={colIndex} 
                                    className="px-4 py-2 text-sm font-bold whitespace-nowrap border-r border-gray-800 text-red-500 flex items-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                                    {String(displayValue)}
                                </td>
                            );
                        }

                        return (
                            <td 
                            key={colIndex} 
                            className={`px-4 py-2 text-sm font-bold whitespace-nowrap border-r border-gray-800 text-gray-300 ${col.isNumeric ? 'text-right' : 'text-left'}`}
                            >
                            {displayValue !== null && displayValue !== undefined ? String(displayValue) : ''}
                            </td>
                        );
                        })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={INVENTORY_COLUMNS.length + 1} className="px-6 py-12 text-center text-gray-500 italic">
                    Chưa có dữ liệu nhập kho. Vui lòng khai báo ở form bên trái.
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
