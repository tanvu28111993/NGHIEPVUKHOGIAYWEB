
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryData, UserInfo } from '../types';
import { useToast } from './ToastContext';
import { formatNumberVN } from '../utils/formatters';
import { api } from '../services/api';

interface ExportPageProps {
  inventoryData: InventoryData | null;
  onUpdateRow: (rowIndex: number, newData: any[]) => Promise<void>;
  onExecuteExportTransaction: (
      logDataRows: string[], 
      inventoryUpdates: {rowIndex: number, rowData: any[] | null}[]
  ) => Promise<void>;
  onRefresh: () => void;
  userInfo: UserInfo;
}

interface InputRow {
  id: string;
  sku: string;
  qty: number | string;
}

interface ExportItem {
  inputSku: string;
  inputQty: number;
  foundRowIndex: number | null; 
  currentStock: number;
  stockInfo: any[] | null; 
  status: 'valid' | 'not_found' | 'insufficient_stock' | 'duplicate_input';
}

const SKU_COL_IDX = 0;
const QTY_COL_IDX = 12;

const ExportPage: React.FC<ExportPageProps> = ({ inventoryData, onUpdateRow, onExecuteExportTransaction, onRefresh, userInfo }) => {
  const [inputRows, setInputRows] = useState<InputRow[]>([
    { id: '1', sku: '', qty: '' },
    { id: '2', sku: '', qty: '' },
    { id: '3', sku: '', qty: '' },
    { id: '4', sku: '', qty: '' },
    { id: '5', sku: '', qty: '' },
  ]);

  const [analyzedData, setAnalyzedData] = useState<ExportItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  
  const [currentTimeStr, setCurrentTimeStr] = useState('');

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
        return [...sliced, "Người Xuất", "Cập Nhật"];
    }
    return rawHeaders;
  }, [rawHeaders]);

  const addNewRow = () => {
    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setInputRows(prev => [...prev, { id: newId, sku: '', qty: '' }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...inputRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) newRows.push({ id: `${Date.now()}-reset`, sku: '', qty: '' });
    setInputRows(newRows);
  };

  const handleInputChange = (index: number, field: 'sku' | 'qty', value: string) => {
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

      if (targetIndex < newRows.length) {
        newRows[targetIndex].sku = skuVal;
        if (qtyVal) newRows[targetIndex].qty = qtyVal;
      } else {
        newRows.push({ 
          id: `${Date.now()}-${i}-${Math.random()}`, 
          sku: skuVal, 
          qty: qtyVal 
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
      const data = await api.getExportScanData();
      setIsScanning(false);
      setProcessStatus('');

      if (Array.isArray(data) && data.length > 0) {
          const scannedRows: InputRow[] = [];
          data.forEach((row, i) => {
              const sku = String(row[0] || '').trim();
              if (sku) {
                  const qty = row[1] ? row[1] : '';
                  scannedRows.push({
                      id: `scan-${Date.now()}-${i}-${Math.random()}`,
                      sku: sku,
                      qty: qty
                  });
              }
          });

          if (scannedRows.length > 0) {
                setInputRows(scannedRows);
                showToast(`Đã tải ${scannedRows.length} mã quét`, 'success');
          } else {
                showToast('Không có dữ liệu quét', 'info');
          }
      } else {
          showToast('Không có dữ liệu quét', 'info');
      }
    } catch (err) {
      setIsScanning(false);
      setProcessStatus('');
      console.error('Lỗi tải mã quét: ', err);
      showToast("Lỗi tải mã quét: " + err, 'error');
    }
  };

  const handleAnalyze = () => {
    if (!inventoryData || inventoryData.length <= 1) {
        showToast("Chưa có dữ liệu tồn kho để đối chiếu", 'warning');
        return;
    }

    const validInputs = inputRows.filter(r => r.sku.trim() !== '');
    if (validInputs.length === 0) {
      showToast("Vui lòng nhập mã SKU", 'warning');
      return;
    }

    const results: ExportItem[] = [];
    const usedSkusInInput = new Set<string>();

    const inventoryMap = new Map<string, { index: number; row: any[] }>();
    inventoryData.slice(1).forEach((row, idx) => {
      const sku = String(row[SKU_COL_IDX] || '').trim();
      if (sku) {
        inventoryMap.set(sku, { index: idx + 1, row });
      }
    });

    validInputs.forEach((row) => {
      const skuRaw = row.sku.trim();
      const skuKey = skuRaw; 
      const qtyStr = String(row.qty).replace(/,/g, '');
      const qty = parseFloat(qtyStr) || 0;

      let status: ExportItem['status'] = 'not_found';
      let foundRowIndex: number | null = null;
      let currentStock = 0;
      let stockInfo: any[] | null = null;

      if (usedSkusInInput.has(skuKey)) {
        status = 'duplicate_input';
      } else {
        usedSkusInInput.add(skuKey);
        const found = inventoryMap.get(skuKey);
        
        if (found) {
          stockInfo = found.row;
          foundRowIndex = found.index;
          const rawStock = String(found.row[QTY_COL_IDX] || 0).replace(/,/g, '');
          currentStock = parseFloat(rawStock) || 0;
          
          if (qty > currentStock) {
            status = 'insufficient_stock';
          } else {
            status = 'valid';
          }
        }
      }

      results.push({
        inputSku: skuRaw,
        inputQty: qty,
        foundRowIndex,
        currentStock,
        stockInfo,
        status
      });
    });

    setAnalyzedData(results);
    showToast("Đã kiểm tra xong!", 'info');
  };

  const handleClear = () => {
    const timestamp = Date.now();
    setInputRows([
        { id: `reset-${timestamp}-1`, sku: '', qty: '' },
        { id: `reset-${timestamp}-2`, sku: '', qty: '' },
        { id: `reset-${timestamp}-3`, sku: '', qty: '' },
        { id: `reset-${timestamp}-4`, sku: '', qty: '' },
        { id: `reset-${timestamp}-5`, sku: '', qty: '' },
    ]);
    
    setAnalyzedData([]);
    setProcessStatus('');
  };

  const handleExportCSV = () => {
    if (analyzedData.length === 0) {
        showToast("Chưa có dữ liệu để xuất", 'warning');
        return;
    }

    // 1. Define Headers
    const csvHeaders = [
        "Trạng Thái", "Mã Nhập", "SL Xuất", "Còn Lại", ...displayHeaders
    ];

    // 2. Map Rows
    const csvRows = analyzedData.map(item => {
        const remaining = item.currentStock - item.inputQty;
        let statusText = '';
        switch(item.status) {
            case 'valid': statusText = 'Hợp lệ'; break;
            case 'insufficient_stock': statusText = 'Thiếu hàng'; break;
            case 'not_found': statusText = 'Không tồn tại'; break;
            case 'duplicate_input': statusText = 'Trùng lặp'; break;
            default: statusText = item.status;
        }

        // Map dynamic columns based on table render logic
        const dynamicCols = displayHeaders.map((_, colIdx) => {
             const isUserCol = colIdx === displayHeaders.length - 2;
             const isTimeCol = colIdx === displayHeaders.length - 1;

             if (isUserCol) return userInfo.name || userInfo.email || 'Admin';
             if (isTimeCol) return currentTimeStr;
             
             const cellData = item.stockInfo ? item.stockInfo[colIdx] : '';
             return cellData;
        });

        return [
            statusText,
            item.inputSku,
            item.inputQty,
            item.foundRowIndex ? remaining : '-',
            ...dynamicCols
        ];
    });

    // 3. Generate CSV String
    const separator = ";";
    const csvContent = [
      csvHeaders.join(separator),
      ...csvRows.map(row => 
        row.map(cell => {
          let cellStr = String(cell || "");
          // Escape quotes and wrap if necessary
          if (cellStr.includes(separator) || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(separator)
      )
    ].join("\n");

    // 4. Download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `XuatKho_Check_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteExport = async () => {
    const validItems = analyzedData.filter(item => item.status === 'valid');
    
    // Check for any blocking errors: Insufficient Stock, Not Found, Duplicate
    const hasErrors = analyzedData.some(item => 
        item.status === 'insufficient_stock' || 
        item.status === 'not_found' || 
        item.status === 'duplicate_input'
    );

    if (validItems.length === 0 || hasErrors) {
      showToast("Vui lòng xử lý các mã Lỗi/Thiếu hàng/Trùng trước khi xác nhận!", 'error');
      return;
    }

    setIsProcessing(true);
    setProcessStatus('Đang xử lý giao dịch...');
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const currentUser = userInfo.name || userInfo.email || 'Admin';
      const currentTimestamp = new Date().toLocaleString('vi-VN');

      const logDataRows: string[] = validItems.map(item => {
        if (!item.stockInfo) return "";
        
        const trimmedRow = item.stockInfo.length > 2 
            ? item.stockInfo.slice(0, item.stockInfo.length - 2) 
            : [...item.stockInfo];

        if (trimmedRow.length > QTY_COL_IDX) {
            trimmedRow[QTY_COL_IDX] = item.inputQty;
        }

        trimmedRow.push(currentUser);
        trimmedRow.push(currentTimestamp);
        
        return trimmedRow.map(cell => String(cell || "")).join("|");
      });

      const headersLength = rawHeaders.length;
      const targetTimeIdx = headersLength > 0 ? headersLength - 1 : 18;
      const targetUserIdx = headersLength > 0 ? headersLength - 2 : 17;

      const inventoryUpdates = validItems.map(item => {
        if (!item.stockInfo || item.foundRowIndex === null) return null;
        
        const remaining = item.currentStock - item.inputQty;
        
        if (remaining <= 0) {
            return { rowIndex: item.foundRowIndex, rowData: null };
        } else {
            const newRow = [...item.stockInfo];
            newRow[QTY_COL_IDX] = remaining;
            
            newRow[targetUserIdx] = currentUser;
            newRow[targetTimeIdx] = currentTimestamp;
            
            for (let i = 0; i <= targetTimeIdx; i++) {
                if (newRow[i] === undefined || newRow[i] === null) {
                    newRow[i] = "";
                }
            }

            return { rowIndex: item.foundRowIndex, rowData: newRow };
        }
      }).filter(u => u !== null) as {rowIndex: number, rowData: any[] | null}[];

      setProcessStatus('Đang đồng bộ Server...');
      
      await onExecuteExportTransaction(logDataRows, inventoryUpdates);
      
      onRefresh(); 
      handleClear();

    } catch (e) {
      console.error("Export Error:", e);
      showToast("Lỗi xuất kho: " + e, 'error');
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  const stats = useMemo(() => {
    const total = analyzedData.length;
    const valid = analyzedData.filter(i => i.status === 'valid').length;
    const insufficient = analyzedData.filter(i => i.status === 'insufficient_stock').length;
    const notFound = analyzedData.filter(i => i.status === 'not_found').length;
    const duplicate = analyzedData.filter(i => i.status === 'duplicate_input').length;
    return { total, valid, insufficient, notFound, duplicate };
  }, [analyzedData]);

  const canExecute = useMemo(() => {
      // Condition: Must have valid items AND NO blocking errors (insufficient/not_found/duplicate)
      const hasErrors = stats.insufficient > 0 || stats.notFound > 0 || stats.duplicate > 0;
      return stats.valid > 0 && !hasErrors && !isProcessing;
  }, [stats, isProcessing]);

  const renderStatusBadge = (status: ExportItem['status']) => {
      switch (status) {
        case 'valid':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 w-full">Hợp lệ</span>;
        case 'insufficient_stock':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 w-full">Thiếu</span>;
        case 'not_found':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-gray-600/30 text-gray-400 border border-gray-600/50 w-full">K.Tồn</span>;
        case 'duplicate_input':
            return <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 w-full">Trùng</span>;
        default:
            return null;
      }
  };

  const COL_WIDTHS = { STATUS: 90, SKU: 140, QTY_EXPORT: 80, QTY_REMAIN: 90 };
  const COL_LEFTS = { STATUS: 0, SKU: 90, QTY_EXPORT: 230, QTY_REMAIN: 310 };

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
                <div className="w-[50px] py-2 text-center border-r border-white/10">STT</div>
                <div className="flex-1 py-2 text-center border-r border-white/10">SKU</div>
                <div className="w-[80px] py-2 text-center border-r border-white/10">SL</div>
                <div className="w-[40px] py-2 text-center">Xóa</div>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#1a1a1a]/50 p-0 custom-scrollbar">
                {inputRows.map((row, idx) => (
                    <div key={row.id} className="flex items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <div className="w-[50px] py-2 text-center text-gray-500 text-sm font-mono border-r border-transparent group-hover:border-white/10">{idx + 1}</div>
                        <div className="flex-1 h-full border-r border-transparent group-hover:border-white/10">
                            <input 
                                type="text"
                                value={row.sku}
                                onChange={(e) => handleInputChange(idx, 'sku', e.target.value)}
                                onPaste={(e) => handlePasteSku(e, idx)}
                                placeholder="Nhập/Paste mã..."
                                className="w-full h-full bg-transparent px-3 py-2 text-[#FF8C00] font-bold text-sm outline-none placeholder-gray-700 font-mono"
                            />
                        </div>
                        <div className="w-[80px] h-full border-r border-transparent group-hover:border-white/10">
                            <input 
                                type="number"
                                value={row.qty}
                                onChange={(e) => handleInputChange(idx, 'qty', e.target.value)}
                                placeholder="0"
                                className="w-full h-full bg-transparent px-2 py-2 text-right text-yellow-400 font-bold text-sm outline-none placeholder-gray-700"
                            />
                        </div>
                        <div className="w-[40px] flex justify-center">
                            <button 
                                onClick={() => removeRow(idx)}
                                aria-label="Xóa dòng"
                                className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
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
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">Đạt: <b>{stats.valid}</b></span>
                {(stats.insufficient > 0) && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">Thiếu: <b>{stats.insufficient}</b></span>}
                {(stats.notFound > 0) && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-500/20 border border-gray-500/30 text-gray-400">K.Tồn: <b>{stats.notFound}</b></span>}
                {(stats.duplicate > 0) && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">Trùng: <b>{stats.duplicate}</b></span>}
              </div>

              {/* Title Center */}
              <span className="font-bold text-gray-200 flex items-center gap-2 text-lg">
                  <span className="material-symbols-outlined text-green-500">fact_check</span>
                  Bảng Đối Chiếu
              </span>

              {/* Button Right */}
              <div className="absolute right-3 flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg transition-all font-bold text-sm group"
                >
                    <span className="material-symbols-outlined text-[20px]">file_download</span>
                    <span className="hidden xl:inline whitespace-nowrap">Xuất CSV</span>
                </button>
                
                <button
                  onClick={handleExecuteExport}
                  disabled={!canExecute}
                  className={`
                    px-5 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all h-9
                    ${canExecute ? 'bg-accent-2 hover:bg-[#ff1f1f] text-white hover:scale-105' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-[20px]">output</span>}
                  {isProcessing ? 'Đang lưu...' : 'Xác nhận Xuất'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#1a1a1a]/50 custom-scrollbar">
              <table className="min-w-full text-left border-collapse border-spacing-0 relative">
                <thead className="sticky top-0 z-40 bg-[#212830]">
                  <tr>
                    <th style={{left: COL_LEFTS.STATUS, width: COL_WIDTHS.STATUS, minWidth: COL_WIDTHS.STATUS}} className="sticky top-0 bg-[#212830] px-2 py-3 border-b border-r border-white/10 text-center text-xs uppercase font-bold text-gray-400 z-50">Trạng Thái</th>
                    <th style={{left: COL_LEFTS.SKU, width: COL_WIDTHS.SKU, minWidth: COL_WIDTHS.SKU}} className="sticky top-0 bg-[#212830] px-4 py-3 border-b border-r border-white/10 text-center text-xs uppercase font-bold text-gray-400 z-50">Mã Nhập</th>
                    <th style={{left: COL_LEFTS.QTY_EXPORT, width: COL_WIDTHS.QTY_EXPORT, minWidth: COL_WIDTHS.QTY_EXPORT}} className="sticky top-0 bg-[#212830] px-4 py-3 border-b border-r border-white/10 text-center text-xs uppercase font-bold text-white z-50">SL Xuất</th>
                    <th style={{left: COL_LEFTS.QTY_REMAIN, width: COL_WIDTHS.QTY_REMAIN, minWidth: COL_WIDTHS.QTY_REMAIN}} className="sticky top-0 bg-[#212830] px-4 py-3 border-b border-white/10 text-center text-xs uppercase font-bold text-white z-50 border-r border-white/20 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">Còn Lại</th>
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
                      const remaining = item.currentStock - item.inputQty;
                      let rowClass = 'hover:bg-white/5 transition-colors';
                      if (item.status === 'insufficient_stock') rowClass = 'bg-red-900/10 hover:bg-red-900/20';

                      return (
                        <tr key={idx} className={rowClass}>
                          <td style={{left: COL_LEFTS.STATUS, width: COL_WIDTHS.STATUS, minWidth: COL_WIDTHS.STATUS}} className="sticky bg-[#212830] px-2 py-2 border-r border-white/5 z-30">
                              {renderStatusBadge(item.status)}
                          </td>
                          <td style={{left: COL_LEFTS.SKU, width: COL_WIDTHS.SKU, minWidth: COL_WIDTHS.SKU}} className="sticky bg-[#212830] px-4 py-2 font-mono text-[#FF8C00] font-bold border-r border-white/5 z-30">
                              {item.inputSku}
                          </td>
                          <td style={{left: COL_LEFTS.QTY_EXPORT, width: COL_WIDTHS.QTY_EXPORT, minWidth: COL_WIDTHS.QTY_EXPORT}} className="sticky bg-[#212830] px-4 py-2 text-right font-bold text-yellow-400 border-r border-white/5 z-30">
                              {item.inputQty.toLocaleString('vi-VN')}
                          </td>
                          <td style={{left: COL_LEFTS.QTY_REMAIN, width: COL_WIDTHS.QTY_REMAIN, minWidth: COL_WIDTHS.QTY_REMAIN}} className={`sticky bg-[#212830] px-4 py-2 text-right font-mono font-bold z-30 border-r border-white/20 shadow-[4px_0_10px_rgba(0,0,0,0.5)] ${(remaining < 0) ? 'text-red-500' : 'text-green-400'}`}>
                            {item.foundRowIndex ? remaining.toLocaleString('vi-VN') : '-'}
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

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}</style>
    </div>
  );
};

export default ExportPage;
