
import React, { useRef, useEffect } from 'react';
import { Card } from '../../UI/Card';
import { Button } from '../../UI/Button';
import { ScanLine, ArrowRightLeft, X, Plus, Eraser, CloudDownload, Loader2 } from 'lucide-react';
import { ReImportInputItem } from '../../../types';

interface ReImportInputPanelProps {
  inputList: ReImportInputItem[];
  onRemove: (id: string) => void;
  onCheck: () => void;
  onAddRow: () => void;
  onUpdateRow: (id: string, field: keyof ReImportInputItem, value: string) => void;
  onClear: () => void;
  onFetchFromSheet?: () => void;
  isLoadingSheet?: boolean;
}

export const ReImportInputPanel: React.FC<ReImportInputPanelProps> = ({ 
  inputList, onRemove, onCheck,
  onAddRow, onUpdateRow, onClear,
  onFetchFromSheet, isLoadingSheet
}) => {
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listEndRef.current) {
        listEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inputList.length]);

  return (
    <Card className="w-[350px] flex-shrink-0 h-full flex flex-col bg-slate-900 border-r border-gray-800 rounded-none md:rounded-l-xl p-0 overflow-hidden z-20 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-slate-950">
         <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm font-bold text-white uppercase">NHẬP LIỆU NHẬP LẠI</h2>
         </div>
         <div className="flex gap-1">
             <button onClick={onClear} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Xóa hết">
                 <Eraser className="w-4 h-4" />
             </button>
         </div>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-800 bg-slate-900">
          <Button 
            onClick={onFetchFromSheet} 
            disabled={isLoadingSheet}
            variant="outline" 
            className="h-8 text-xs border-dashed border-gray-600 text-gray-300 hover:text-white hover:border-blue-500 hover:bg-blue-500/10"
          >
              {isLoadingSheet ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5 mr-1.5" />}
              {isLoadingSheet ? 'Đang lấy...' : 'Lấy Mã Nhập'}
          </Button>
          <Button onClick={onAddRow} variant="outline" className="h-8 text-xs border-dashed border-gray-600 text-gray-300 hover:text-white hover:border-green-500 hover:bg-green-500/10 justify-center">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Thêm dòng
          </Button>
      </div>

      {/* Table Header */}
      <div className="flex items-center px-2 py-2 bg-slate-950/50 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          <div className="w-8 text-center">#</div>
          <div className="flex-1 pl-2">MÃ SKU</div>
          <div className="w-20 text-center border-l border-gray-800/50">SL</div>
          <div className="w-16 text-center border-l border-gray-800/50">TL</div>
          <div className="w-8"></div>
      </div>

      {/* Flat Editable List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {inputList.length === 0 && (
              <div className="text-center text-gray-600 text-xs py-10 italic flex flex-col items-center gap-2">
                  <ScanLine className="w-8 h-8 opacity-20" />
                  <span>Danh sách trống.<br/>Bấm "Lấy Mã Nhập" hoặc thêm dòng.</span>
              </div>
          )}
          
          {inputList.map((item, index) => (
              <div key={item.id} className="flex items-center px-2 py-2 border-b border-gray-800/40 hover:bg-white/5 transition-colors group">
                  <div className="w-8 text-center text-xs text-gray-600 font-mono group-hover:text-gray-400">
                      {index + 1}
                  </div>
                  
                  {/* SKU Input */}
                  <div className="flex-1 px-2">
                      <input 
                          value={item.sku}
                          onChange={(e) => onUpdateRow(item.id, 'sku', e.target.value)}
                          placeholder="NHẬP SKU..."
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-mono font-bold uppercase text-white placeholder-gray-700 focus:text-cyan-400 transition-colors focus:outline-none"
                          autoFocus={index === inputList.length - 1 && item.sku === ''}
                      />
                  </div>

                  {/* Qty Input */}
                  <div className="w-20 px-1 border-l border-gray-800/30">
                      <input 
                          value={item.reImportQty}
                          onChange={(e) => onUpdateRow(item.id, 'reImportQty', e.target.value)}
                          placeholder="1"
                          type="number"
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-cyan-500 text-center placeholder-gray-700 focus:outline-none"
                      />
                  </div>

                  {/* Weight Input */}
                  <div className="w-16 px-1 border-l border-gray-800/30">
                      <input 
                          value={item.reImportWeight}
                          onChange={(e) => onUpdateRow(item.id, 'reImportWeight', e.target.value)}
                          placeholder="0"
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-gray-300 text-center placeholder-gray-700 focus:outline-none"
                      />
                  </div>

                  <button 
                      onClick={() => onRemove(item.id)}
                      className="w-8 flex justify-center text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      tabIndex={-1}
                      title="Xóa dòng"
                  >
                      <X className="w-4 h-4" />
                  </button>
              </div>
          ))}
          <div ref={listEndRef} />
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-gray-800 bg-slate-950">
          <Button 
            fullWidth 
            onClick={onCheck}
            disabled={inputList.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-12 shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
          >
              <ArrowRightLeft className="w-5 h-5" />
              KIỂM TRA & NHẬP
          </Button>
          <div className="text-[10px] text-gray-600 text-center mt-2">
              Lưu ý: Trọng lượng sẽ lấy trực tiếp từ bảng nhập liệu này.
          </div>
      </div>
    </Card>
  );
};
