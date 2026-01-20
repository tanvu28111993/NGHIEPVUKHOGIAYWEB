
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryData, UserInfo } from '../types';
import { useToast } from './ToastContext';
import PrintLabelModal from './PrintLabelModal';
import { api } from '../services/api';

interface ReImportPageProps {
  inventoryData: InventoryData | null;
  exportHistory: string[]; // Data from Sheet 'XUAT'
  onExecuteTransaction: (
      logDataRows: string[], 
      inventoryUpdates: {rowIndex: number, rowData: any[] | null}[]
  ) => Promise<void>;
  onRefresh: () => void;
  userInfo: UserInfo;
  scanSpreadsheetId: string;
  scanSheetName: string;
}

interface InputRow {
  id: string;
  sku: string;
  qty: number | string;
  weight: string;
}

interface ExportItem {
  inputSku: string;
  inputQty: number;
  inputWeight: string;
  foundRowIndex: number | null; 
  currentStock: number;
  stockInfo: any[] | null; 
  status: 'valid_pass' | 'warning_exists' | 'error_not_found' | 'duplicate_input';
}

const SKU_COL_IDX = 0;
const WEIGHT_COL_IDX = 11;
const QTY_COL_IDX = 12;

const formatWeightVN = (value: string | number) => {
  if (value === '' || value === null || value === undefined) return '';
  const str = String(value).trim();
  const num = parseFloat(str.replace(/,/g, '.'));
  if (!isNaN(num)) {
      return num.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return str;
};

const ReImportPage: React.FC<ReImportPageProps> = ({ inventoryData, exportHistory, onExecuteTransaction, onRefresh, userInfo }) => {
  const [inputRows, setInputRows] = useState<InputRow[]>([
    { id: '1', sku: '', qty: '', weight: '' },
    { id: '2', sku: '', qty: '', weight: '' },
    { id: '3', sku: '', qty: '', weight: '' },
    { id: '4', sku: '', qty: '', weight: '' },
    { id: '5', sku: '', qty: '', weight: '' },
  ]);

  const [analyzedData, setAnalyzedData] = useState<ExportItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentTimeStr(new Date().toLocaleString('vi-VN'));
    }, 1000);
    setCurrentTimeStr(new Date().toLocaleString('vi-VN'));
    return () => clearInterval(interval);
  }, []);

  const rawHeaders = useMemo(() => {
    if (inventoryData && inventoryData.length > 0) {
      return inventoryData[0];
    }
    return [];
  }, [inventoryData]);

  const displayHeaders = useMemo(() => {
    if (rawHeaders.length > 2) {
        const sliced = rawHeaders.slice(0, rawHeaders.length - 2);
        return [...sliced, "Người Nhập", "Cập Nhật"];
    }
    return rawHeaders;
  }, [rawHeaders]);

  const addNewRow = () => {
    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setInputRows(prev => [...prev, { id: newId, sku: '', qty: '', weight: '' }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...inputRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) newRows.push({ id: `${Date.now()}-reset`, sku: '', qty: '', weight: '' });
    setInputRows(newRows);
  };

  const handleInputChange = (index: number, field: 'sku' | 'qty' | 'weight', value: string) => {
    const newRows = [...inputRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setInputRows(newRows);
  };

  const handlePasteSku = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const lines = pasteData.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const newRows = [...inputRows];
    lines.forEach((line, i) => {
      const targetIndex = startIndex + i;
      const parts = line.split('\t');
      const skuVal = parts[0].trim();
      const qtyVal = parts[1] ? parts[1].trim() : '';
      const weightVal = parts[2] ? parts[2].trim() : '';

      if (targetIndex < newRows.length) {
        newRows[targetIndex].sku = skuVal;
        if (qtyVal) newRows[targetIndex].qty = qtyVal;
        if (weightVal) newRows[targetIndex].weight = weightVal;
      } else {
        newRows.push({ 
          id: `${Date.now()}-${i}-${Math.random()}`, 
          sku: skuVal, 
          qty: qtyVal,
          weight: weightVal
        });
      }
    });
    setInputRows(newRows);
  };

  const handleGetScannedData = async () => {
    if (isScanning || isProcessing) return;
    setIsScanning(true);
    setProcessStatus('Đang tải dữ liệu quét...');

    try {
      const data = await api.getReImportScanData();
      setIsScanning(false);
      setProcessStatus('');

      if (Array.isArray(data) && data.length > 0) {
          const scannedRows: InputRow[] = [];
          data.forEach((row, i) => {
              const sku = String(row[0] || '').trim();
              if (sku) {
                  const qty = row[1] ? row[1] : '';
                  const weight = row[2] ? String(row[2]) : ''; 
                  scannedRows.push({
                      id: `scan-${Date.now()}-${i}-${Math.random()}`,
                      sku: sku,
                      qty: qty,
                      weight: weight
                  });
              }
          });

          if (scannedRows.length > 0) {
                setInputRows(scannedRows);
                showToast(`Đã tải ${scannedRows.length} mã quét`, 'success');
          } else {
                showToast('Không có dữ liệu quét mới', 'info');
          }
      } else {
            showToast('Không có dữ liệu quét mới', 'info');
      }
    } catch (err) {
      setIsScanning(false);
      setProcessStatus('');
      console.error('Lỗi tải mã quét: ', err);
      showToast("Lỗi tải mã quét: " + err, 'error');
    }
  };

  const handleAnalyze = () => {
    if (!exportHistory || exportHistory.length === 0) {
        console.warn("Chưa có dữ liệu lịch sử xuất");
    }

    const validInputs = inputRows.filter(r => r.sku.trim() !== '');
    if (validInputs.length === 0) {
      showToast("Vui lòng nhập mã SKU", 'warning');
      return;
    }

    const results: ExportItem[] = [];
    const usedSkusInInput = new Set<string>();

    // Map Export History (Kho Xuất)
    const historyMap = new Map<string, { row: any[] }>();
    exportHistory.forEach((line) => {
       if (!line) return;
       const parts = line.split('|');
       if (parts.length > 0) {
           const sku = String(parts[SKU_COL_IDX] || '').trim();
           if (sku) {
               historyMap.set(sku, { row: parts });
           }
       }
    });

    // Map Current Inventory (Tồn kho)
    const inventoryMap = new Map<string, number>();
    if (inventoryData) {
        inventoryData.forEach((row, idx) => {
            if (idx === 0) return; // Skip header
            const sku = String(row[SKU_COL_IDX] || '').trim();
            if (sku) {
                inventoryMap.set(sku, idx);
            }
        });
    }

    validInputs.forEach((row) => {
      const skuRaw = row.sku.trim();
      const skuKey = skuRaw; 
      const qtyStr = String(row.qty).replace(/,/g, '');
      const qty = parseFloat(qtyStr) || 0;
      const weightRaw = row.weight;

      let status: ExportItem['status'] = 'error_not_found';
      let foundRowIndex: number | null = null;
      let currentStock = 0;
      let stockInfo: any[] | null = null;

      if (usedSkusInInput.has(skuKey)) {
        status = 'duplicate_input';
      } else {
        usedSkusInInput.add(skuKey);
        
        // Check 1: Must exist in Export History
        const historyItem = historyMap.get(skuKey);
        
        if (historyItem) {
          stockInfo = historyItem.row;
          
          // Check 2: Check existence in Current Inventory
          if (inventoryMap.has(skuKey)) {
             status = 'warning_exists';
             foundRowIndex = inventoryMap.get(skuKey)!;
             if (inventoryData && foundRowIndex < inventoryData.length) {
                const rawStock = String(inventoryData[foundRowIndex][QTY_COL_IDX] || 0).replace(/,/g, '');
                currentStock = parseFloat(rawStock) || 0;
             }
          } else {
             status = 'valid_pass';
             foundRowIndex = -1; // Flag for Append
             currentStock = 0;
          }
        } else {
            status = 'error_not_found';
        }
      }

      results.push({
        inputSku: skuRaw,
        inputQty: qty,
        inputWeight: weightRaw,
        foundRowIndex,
        currentStock,
        stockInfo, 
        status
      });
    });

    setAnalyzedData(results);
    showToast('Đã kiểm tra xong', 'info');
  };

  const handleClear = () => {
    const timestamp = Date.now();
    setInputRows([
        { id: `reset-${timestamp}-1`, sku: '', qty: '', weight: '' },
        { id: `reset-${timestamp}-2`, sku: '', qty: '', weight: '' },
        { id: `reset-${timestamp}-3`, sku: '', qty: '', weight: '' },
        { id: `reset-${timestamp}-4`, sku: '', qty: '', weight: '' },
        { id: `reset-${timestamp}-5`, sku: '', qty: '', weight: '' },
    ]);
    
    setAnalyzedData([]);
    setProcessStatus('');
  };

  const handleExecute = async () => {
    const validItems = analyzedData.filter(item => 
        item.status === 'valid_pass' || item.status === 'warning_exists'
    );
    
    const hasErrors = analyzedData.some(item => 
        item.status === 'error_not_found' || item.status === 'duplicate_input'
    );

    if (validItems.length === 0 || hasErrors) {
      showToast("Vui lòng xử lý các mã Lỗi/Trùng trước khi xác nhận!", 'error');
      return;
    }

    setIsProcessing(true);
    setProcessStatus('Đang xử lý nhập lại...');
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const currentUser = userInfo.name || userInfo.email || 'Admin';
      const currentTimestamp = new Date().toLocaleString('vi-VN');

      const logDataRows: string[] = validItems.map(item => {
        if (!item.stockInfo) return "";
        
        const trimmedRow = item.stockInfo.length > 2 
            ? item.stockInfo.slice(0, item.stockInfo.length - 2) 
            : [...item.stockInfo];

        // Ensure Qty is the input qty
        if (trimmedRow.length > QTY_COL_IDX) {
            trimmedRow[QTY_COL_IDX] = item.inputQty;
        }

        trimmedRow.push(`Trọng Lượng Mới: ${item.inputWeight}`);
        trimmedRow.push(currentUser);
        trimmedRow.push(currentTimestamp);
        
        return trimmedRow.map(cell => String(cell || "")).join("|");
      });

      const headersLength = rawHeaders.length;
      const targetTimeIdx = headersLength > 0 ? headersLength - 1 : 18;
      const targetUserIdx = headersLength > 0 ? headersLength - 2 : 17;

      const inventoryUpdates = validItems.map(item => {
        if (!item.stockInfo) return null;
        
        const newQty = item.inputQty;
        const newRow = [...item.stockInfo];
        newRow[QTY_COL_IDX] = newQty;
        newRow[WEIGHT_COL_IDX] = item.inputWeight; 
        
        newRow[targetUserIdx] = currentUser;
        newRow[targetTimeIdx] = currentTimestamp;
        
        for (let i = 0; i <= targetTimeIdx; i++) {
            if (newRow[i] === undefined || newRow[i] === null) {
                newRow[i] = "";
            }
        }

        return { rowIndex: item.foundRowIndex, rowData: newRow };
      }).filter(u => u !== null) as {rowIndex: number, rowData: any[] | null}[];

      setProcessStatus('Đang đồng bộ Server...');
      
      await onExecuteTransaction(logDataRows, inventoryUpdates);
      
      onRefresh(); 
      handleClear();

    } catch (e) {
      console.error("ReImport Error:", e);
      showToast("Lỗi nhập lại: " + e, 'error'); 
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  const getSelectedDataForPrint = () => {
    return analyzedData
       .filter(item => item.status === 'valid_pass' || item.status === 'warning_exists')
       .map(item => {
           if (!item.stockInfo) return [];
           const row = [...item.stockInfo];
           if (row.length > QTY_COL_IDX) row[QTY_COL_IDX] = item.inputQty;
           if (row.length > WEIGHT_COL_IDX) row[WEIGHT_COL_IDX] = item.inputWeight;
           return row;
       });
  };

  const handleOpenPrint = () => {
    const dataToPrint = getSelectedDataForPrint();
    if (dataToPrint.length === 0) {
       showToast('Chưa có mã hợp lệ để in (Cần kiểm tra trước)', 'warning');
       return;
    }
    setIsPrintModalOpen(true);
  };

  const stats = useMemo(() => {
    const total = analyzedData.length;
    const pass = analyzedData.filter(i => i.status === 'valid_pass').length;
    const exists = analyzedData.filter(i => i.status === 'warning_exists').length;
    const error = analyzedData.filter(i => i.status === 'error_not_found').length;
    const duplicate = analyzedData.filter(i => i.status === 'duplicate_input').length;
    return { total, pass, exists, error, duplicate };
  }, [analyzedData]);

  const canExecute = useMemo(() => {
      const hasValidItems = (stats.pass > 0 || stats.exists > 0);
      const hasErrors = (stats.error > 0 || stats.duplicate > 0);
      return hasValidItems && !hasErrors && !isProcessing;
  }, [stats, isProcessing]);
  
  const canPrint = stats.pass > 0 || stats.exists > 0;

  const renderStatusBadge = (status: ExportItem['status']) => {
      switch (status) {
        case 'valid_pass':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 w-full">Đạt</span>;
        case 'warning_exists':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 w-full">Còn</span>;
        case 'error_not_found':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 w-full">Lỗi</span>;
        case 'duplicate_input':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 w-full">Trùng</span>;
        default:
            return null;
      }
  };

  const COL_WIDTHS = { STATUS: 70, SKU: 130, QTY_IMPORT: 80, WEIGHT: 80 };
  const COL_LEFTS = { STATUS: 0, SKU: 70, QTY_IMPORT: 200, WEIGHT: 280 };

  return (
    <div className="w-full h-full p-4 flex gap-4 animate-fadeIn relative bg-[#212830] text-gray-200 overflow-hidden">
        {/* INPUT TABLE */}
        <div className="w-[400px] flex flex-col gap-3 min-w-[350px] shrink-0">
          <div className="bg-[#2d2f35] border border-white/10 rounded-xl flex flex-col h-full shadow-lg overflow-hidden">
            <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-center relative">
                <span className="font-bold text-gray-200 flex items-center gap-2 text-lg">
                    <span className="material-symbols-outlined text-blue-500">edit_note</span>
                    Bảng Nhập Liệu
                </span>
                <div className="absolute right-3">
                  <button
                      onClick={handleGetScannedData}
                      disabled={isScanning || isProcessing}
                      className="group flex items-center justify-center gap-2 h-8 px-2 bg-blue-600 hover:bg-blue-500 rounded text-white transition-all shadow-md overflow-hidden"
                  >
                      {isScanning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[18px]">display_external_input</span>}
                      <span className="w-0 group-hover:w-auto overflow-hidden whitespace-nowrap transition-all duration-300 text-xs font-bold">
                          Nhập Mã Quét
                      </span>
                  </button>
                </div>
            </div>
            <div className="flex items-center bg-[#1a1a1a] text-xs font-bold text-gray-400 border-b border-white/10">
                <div className="w-[40px] py-2 text-center border-r border-white/10">STT</div>
                <div className="flex-1 py-2 text-center border-r border-white/10">SKU</div>
                <div className="w-[60px] py-2 text-center border-r border-white/10">SL</div>
                <div className="w-[70px] py-2 text-center border-r border-white/10">Trọng lượng</div>
                <div className="w-[30px] py-2 text-center">Xóa</div>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#1a1a1a]/50 p-0 custom-scrollbar">
                {inputRows.map((row, idx) => (
                    <div key={row.id} className="flex items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <div className="w-[40px] py-2 text-center text-gray-500 text-sm font-mono border-r border-transparent group-hover:border-white/10">{idx + 1}</div>
                        <div className="flex-1 h-full border-r border-transparent group-hover:border-white/10">
                            <input 
                                type="text"
                                value={row.sku}
                                onChange={(e) => handleInputChange(idx, 'sku', e.target.value)}
                                onPaste={(e) => handlePasteSku(e, idx)}
                                placeholder="Nhập/Paste..."
                                className="w-full h-full bg-transparent px-2 py-2 text-[#FF8C00] font-bold text-sm outline-none placeholder-gray-700 font-mono"
                            />
                        </div>
                        <div className="w-[60px] h-full border-r border-transparent group-hover:border-white/10">
                            <input 
                                type="number"
                                value={row.qty}
                                onChange={(e) => handleInputChange(idx, 'qty', e.target.value)}
                                placeholder="0"
                                className="w-full h-full bg-transparent px-2 py-2 text-right text-yellow-400 font-bold text-sm outline-none placeholder-gray-700"
                            />
                        </div>
                        <div className="w-[70px] h-full border-r border-transparent group-hover:border-white/10">
                            <input 
                                type="text"
                                value={row.weight}
                                onChange={(e) => handleInputChange(idx, 'weight', e.target.value)}
                                placeholder="0"
                                className="w-full h-full bg-transparent px-2 py-2 text-right text-blue-400 font-bold text-sm outline-none placeholder-gray-700"
                            />
                        </div>
                        <div className="w-[30px] flex justify-center">
                            <button 
                                onClick={() => removeRow(idx)}
                                aria-label="Xóa dòng"
                                className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    </div>
                ))}
                <button onClick={addNewRow} className="w-full py-2 flex items-center justify-center gap-1 text-gray-500 hover:text-white hover:bg-white/5 transition-colors text-sm border-t border-transparent">
                    <span className="material-symbols-outlined text-[16px]">add</span> Thêm dòng
                </button>
            </div>
            <div className="p-3 border-t border-white/10 bg-[#212830]">
                <button
                    onClick={handleAnalyze}
                    disabled={isProcessing || isScanning}
                    className="w-full py-3 bg-[#FF8C00] hover:bg-[#e67e00] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">fact_check</span>
                    Kiểm Tra
                </button>
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="bg-[#2d2f35] border border-white/10 rounded-xl flex flex-col h-full shadow-lg overflow-hidden relative">
            <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-center relative shrink-0">
              {/* Stats on Left */}
              <div className="absolute left-3 flex items-center gap-3 text-sm hidden xl:flex">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">Tổng: <b>{stats.total}</b></span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">Đạt: <b>{stats.pass}</b></span>
                {(stats.exists > 0) && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">Còn: <b>{stats.exists}</b></span>}
                {(stats.error > 0) && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">Lỗi: <b>{stats.error}</b></span>}
              </div>

              {/* Title Center WITH TOOLTIP */}
              <div className="flex items-center gap-2 group relative cursor-help">
                <span className="font-bold text-gray-200 flex items-center gap-2 text-lg">
                    <span className="material-symbols-outlined text-green-500">fact_check</span>
                    Bảng Đối Chiếu
                </span>
                <span className="material-symbols-outlined text-gray-500 text-[16px] hover:text-white transition-colors">info</span>
                
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-800 text-xs text-gray-300 rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="font-bold text-white mb-2 border-b border-white/10 pb-1">Giải thích trạng thái:</div>
                    <ul className="space-y-1.5">
                        <li className="flex gap-2"><span className="text-red-400 font-bold">Lỗi (K.Tồn):</span> Không tìm thấy trong Lịch sử Xuất (Sheet XUAT).</li>
                        <li className="flex gap-2"><span className="text-yellow-400 font-bold">Còn:</span> Đã có trong Tồn kho hiện tại (Sheet KHO).</li>
                        <li className="flex gap-2"><span className="text-green-400 font-bold">Đạt:</span> Có trong Lịch sử Xuất và chưa có trong Tồn kho.</li>
                    </ul>
                </div>
              </div>

              {/* Button Right */}
              <div className="absolute right-3 flex items-center gap-2">
                {canPrint && (
                  <button
                    onClick={handleOpenPrint}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all h-9 animate-fadeIn"
                  >
                    <span className="material-symbols-outlined text-[24px]">qr_code_2_add</span>
                    In Tem
                  </button>
                )}
                
                <button
                  onClick={handleExecute}
                  disabled={!canExecute}
                  className={`
                    px-5 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all h-9
                    ${canExecute ? 'bg-accent-2 hover:bg-[#ff1f1f] text-white hover:scale-105' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-[20px]">download</span>}
                  {isProcessing ? 'Đang lưu...' : 'Nhập Lại'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#1a1a1a]/50 custom-scrollbar">
              <table className="min-w-full text-left border-collapse border-spacing-0 relative">
                <thead className="sticky top-0 z-40 bg-[#212830]">
                  <tr>
                    <th style={{left: COL_LEFTS.STATUS, width: COL_WIDTHS.STATUS, minWidth: COL_WIDTHS.STATUS}} className="sticky top-0 bg-[#212830] px-2 py-3 border-b border-r border-white/10 text-center text-xs uppercase font-bold text-gray-400 z-50">Trạng Thái</th>
                    <th style={{left: COL_LEFTS.SKU, width: COL_WIDTHS.SKU, minWidth: COL_WIDTHS.SKU}} className="sticky top-0 bg-[#212830] px-4 py-3 border-b border-r border-white/10 text-center text-xs uppercase font-bold text-gray-400 z-50">Mã Nhập</th>
                    <th style={{left: COL_LEFTS.QTY_IMPORT, width: COL_WIDTHS.QTY_IMPORT, minWidth: COL_WIDTHS.QTY_IMPORT}} className="sticky top-0 bg-[#212830] px-4 py-3 border-b border-r border-white/10 text-center text-xs uppercase font-bold text-white z-50">SL Nhập</th>
                    <th style={{left: COL_LEFTS.WEIGHT, width: COL_WIDTHS.WEIGHT, minWidth: COL_WIDTHS.WEIGHT}} className="sticky top-0 bg-[#212830] px-4 py-3 border-b border-white/10 text-center text-xs uppercase font-bold text-white z-50 border-r border-white/20 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">Trọng Lượng</th>
                    {displayHeaders.map((h, i) => (
                        <th key={i} className="px-4 py-3 border-b border-white/10 text-xs uppercase font-bold text-gray-400 whitespace-nowrap bg-[#212830] z-40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {analyzedData.length === 0 ? (
                    <tr>
                      <td colSpan={displayHeaders.length + 5} className="px-4 py-12 text-center text-gray-500 italic">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                            <span>Nhập mã bên trái rồi bấm "Kiểm Tra"</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    analyzedData.map((item, idx) => {
                      let rowClass = 'hover:bg-white/5 transition-colors';
                      if (item.status === 'error_not_found') rowClass = 'bg-red-900/10 hover:bg-red-900/20';
                      
                      return (
                        <tr key={idx} className={rowClass}>
                          <td style={{left: COL_LEFTS.STATUS, width: COL_WIDTHS.STATUS, minWidth: COL_WIDTHS.STATUS}} className="sticky bg-[#212830] px-2 py-2 border-r border-white/5 z-30">
                              {renderStatusBadge(item.status)}
                          </td>
                          <td style={{left: COL_LEFTS.SKU, width: COL_WIDTHS.SKU, minWidth: COL_WIDTHS.SKU}} className="sticky bg-[#212830] px-4 py-2 font-mono text-[#FF8C00] font-bold border-r border-white/5 z-30">
                              {item.inputSku}
                          </td>
                          <td style={{left: COL_LEFTS.QTY_IMPORT, width: COL_WIDTHS.QTY_IMPORT, minWidth: COL_WIDTHS.QTY_IMPORT}} className="sticky bg-[#212830] px-4 py-2 text-right font-bold text-yellow-400 border-r border-white/5 z-30">
                              {item.inputQty.toLocaleString('vi-VN')}
                          </td>
                          <td style={{left: COL_LEFTS.WEIGHT, width: COL_WIDTHS.WEIGHT, minWidth: COL_WIDTHS.WEIGHT}} className="sticky bg-[#212830] px-4 py-2 text-right font-mono font-bold z-30 border-r border-white/20 shadow-[4px_0_10px_rgba(0,0,0,0.5)] text-blue-400">
                            {formatWeightVN(item.inputWeight)}
                          </td>
                          {displayHeaders.map((_, colIdx) => {
                             const isUserCol = colIdx === displayHeaders.length - 2;
                             const isTimeCol = colIdx === displayHeaders.length - 1;

                             let displayData: string | number = '';
                             
                             if (isUserCol) {
                                displayData = userInfo.name || userInfo.email || 'Admin';
                             } else if (isTimeCol) {
                                displayData = currentTimeStr;
                             } else {
                                const cellData = item.stockInfo ? item.stockInfo[colIdx] : '';
                                displayData = cellData;
                                if (typeof cellData === 'number') displayData = cellData.toLocaleString('vi-VN');
                             }

                             const cellStyle = (isUserCol || isTimeCol) ? "text-blue-300 font-medium" : "text-gray-300";
                             
                             return <td key={colIdx} className={`px-4 py-2 whitespace-nowrap border-r border-white/5 last:border-none ${cellStyle}`}>{displayData}</td>;
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* PRINT MODAL INSTANCE */}
        <PrintLabelModal 
           isOpen={isPrintModalOpen} 
           onClose={() => setIsPrintModalOpen(false)} 
           data={getSelectedDataForPrint()} 
           headers={rawHeaders}
        />

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}</style>
    </div>
  );
};

export default ReImportPage;
