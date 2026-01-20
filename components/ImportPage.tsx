import React, { useState, useRef, useMemo } from 'react';
import { UserInfo, InventoryData, ConfigData } from '../types';
import { formatVN, formatNumberVN } from '../utils/formatters';
import { useToast } from './ToastContext';
import PrintLabelModal from './PrintLabelModal';

interface ImportPageProps {
  onExecuteImport: (newRows: any[][]) => Promise<void>;
  userInfo: UserInfo;
  inventoryData: InventoryData | null;
  optionData: ConfigData; // New prop for dynamic options
}

// Cấu hình index chuẩn của hệ thống
const COL_IDX = {
  SKU: 0,
  MUC_DICH: 1,
  KIEN_GIAY: 2,
  LOAI_GIAY: 3,
  DINH_LUONG: 4,
  NHA_CC: 5,
  NHA_SX: 6,
  NGAY_NHAP: 7,
  NGAY_SX: 8,
  LO_DAI: 9,
  RONG: 10,
  TRONG_LUONG: 11,
  SO_LUONG: 12,
  DON_HANG: 13,
  MA_VT: 14,
  VI_TRI: 15,
  CHO_XUAT: 16,
  NGUOI_NHAP: 17,
  CAP_NHAT: 18,
};

// Cấu hình Form nhập liệu (Bên Trái)
const MASTER_FORM_FIELDS = [
  { idx: COL_IDX.MUC_DICH, label: 'Mục Đích', type: 'text', listKey: 'MUC_DICH', defaultValue: 'Nội Địa' },
  { idx: COL_IDX.KIEN_GIAY, label: 'Kiện Giấy', type: 'text', listKey: 'KIEN_GIAY', placeholder: 'Chọn...' },
  { idx: COL_IDX.NHA_CC, label: 'Nhà Cung Cấp', type: 'text', listKey: 'NHA_CC' },
  { idx: COL_IDX.NHA_SX, label: 'Nhà SX', type: 'text', listKey: 'NHA_SX' },
  { idx: COL_IDX.LOAI_GIAY, label: 'Loại Giấy', type: 'text', listKey: 'LOAI_GIAY', placeholder: 'Chọn...' },
  { idx: COL_IDX.NGAY_NHAP, label: 'Ngày Nhập', type: 'date', defaultValue: new Date().toLocaleDateString('en-CA') },
  { idx: COL_IDX.NGAY_SX, label: 'Ngày SX', type: 'date' },
  { idx: COL_IDX.DINH_LUONG, label: 'GM (Định Lượng)', type: 'text', placeholder: 'GSM' }, 
  { idx: COL_IDX.LO_DAI, label: 'Lô/Dài (cm)', type: 'text' },
  { idx: COL_IDX.RONG, label: 'Rộng (cm)', type: 'number' },
  { idx: COL_IDX.TRONG_LUONG, label: 'Trọng Lượng (Kg)', type: 'number' },
  { idx: COL_IDX.SO_LUONG, label: 'Số Lượng', type: 'number', defaultValue: '1' },
  { idx: COL_IDX.DON_HANG, label: 'Đơn Hàng/KH', type: 'text' },
  { idx: COL_IDX.MA_VT, label: 'Mã Vật Tư', type: 'text' },
  { idx: COL_IDX.VI_TRI, label: 'Vị Trí', type: 'text' },
  { idx: COL_IDX.CHO_XUAT, label: 'Vật Tư Chờ Xuất', type: 'text', placeholder: '...' },
];

// Cấu hình hiển thị Bảng (Bên Phải)
const TABLE_COLUMNS_DISPLAY = [
  { idx: COL_IDX.MUC_DICH, label: 'Mục Đích', width: 100 },
  { idx: COL_IDX.KIEN_GIAY, label: 'Kiện Giấy', width: 100 },
  { idx: COL_IDX.LOAI_GIAY, label: 'Loại Giấy', width: 100 },
  { idx: COL_IDX.DINH_LUONG, label: 'Định Lượng', width: 90 },
  { idx: COL_IDX.NHA_CC, label: 'Nhà Cung Cấp', width: 130 },
  { idx: COL_IDX.NHA_SX, label: 'Nhà SX', width: 130 },
  { idx: COL_IDX.NGAY_NHAP, label: 'Ngày Nhập', width: 100 },
  { idx: COL_IDX.NGAY_SX, label: 'Ngày SX', width: 100 },
  { idx: COL_IDX.LO_DAI, label: 'Lô/Dài', width: 90 },
  { idx: COL_IDX.RONG, label: 'Rộng', width: 80 },
  { idx: COL_IDX.TRONG_LUONG, label: 'Trọng Lượng', width: 110 },
  { idx: COL_IDX.SO_LUONG, label: 'Số Lượng', width: 80 },
  { idx: COL_IDX.DON_HANG, label: 'Đơn Hàng/KH', width: 130 },
  { idx: COL_IDX.MA_VT, label: 'Mã Vật Tư', width: 110 },
  { idx: COL_IDX.VI_TRI, label: 'Vị Trí', width: 100 },
  { idx: COL_IDX.CHO_XUAT, label: 'Chờ Xuất', width: 100 },
  { idx: COL_IDX.NGUOI_NHAP, label: 'Người Nhập', width: 110 },
  { idx: COL_IDX.CAP_NHAT, label: 'Cập Nhật', width: 140 },
];

const FORMAT_VN_COLS = [COL_IDX.LO_DAI, COL_IDX.RONG, COL_IDX.TRONG_LUONG];

const HEADERS_MAP = [
  "Thẻ Kho Giấy SKU", "Mục Đích", "Kiện Giấy", "Loại Giấy", "Định Lượng", 
  "Nhà Cung Cấp", "Nhà SX", "Ngày Nhập", "Ngày SX", "Lô/Dài (cm)", 
  "Rộng (cm)", "Trọng Lượng", "Số Lượng", "Đơn hàng/ Khách hàng", 
  "Mã vật tư", "Vị Trí", "Vật Tư Chờ Xuất", "Người Nhập", "Cập Nhật"
];

const ImportPage: React.FC<ImportPageProps> = ({ onExecuteImport, userInfo, inventoryData, optionData }) => {
  const [formData, setFormData] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    MASTER_FORM_FIELDS.forEach(field => {
      initial[field.idx] = field.defaultValue || '';
    });
    return initial;
  });

  const [copyCount, setCopyCount] = useState<number>(1);
  const [startSeq, setStartSeq] = useState<number>(1); 
  const [tableRows, setTableRows] = useState<any[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { showToast } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const existingSkuSet = useMemo(() => {
      const set = new Set<string>();
      if (inventoryData && inventoryData.length > 1) {
          for (let i = 1; i < inventoryData.length; i++) {
              const sku = String(inventoryData[i][COL_IDX.SKU] || '').trim();
              if (sku) {
                  set.add(sku);
              }
          }
      }
      return set;
  }, [inventoryData]);

  const updateDinhLuongField = (currentGsm: string, paperTypeLabel: string, isFsc: boolean, isEudr: boolean) => {
    const match = currentGsm.match(/(\d+(?:[.,]\d+)?)/);
    if (!match) return currentGsm; 

    const numberPart = match[0];
    const paperOpt = optionData.LOAI_GIAY.find(o => o.label === paperTypeLabel);
    const code = paperOpt ? paperOpt.code : '';

    let result = numberPart;
    if (code) {
        result = `${code}/${numberPart}`;
    }
    
    if (isEudr) {
        result = `${result} EUDR`;
    }
    if (isFsc) {
        result = `${result} FSC`;
    }
    
    return result;
  };

  const handleFormChange = (idx: number, value: string) => {
    setFormData(prev => ({ ...prev, [idx]: value }));
  };

  const handleFormBlur = (field: typeof MASTER_FORM_FIELDS[0], value: string) => {
    if (field.listKey) {
        const key = field.listKey as keyof ConfigData;
        const options = optionData[key] || [];
        const isValid = options.some(opt => opt.label === value);
        if (value && !isValid) {
            handleFormChange(field.idx, '');
            if (field.idx === COL_IDX.LOAI_GIAY) {
                const currentGsm = formData[COL_IDX.DINH_LUONG] || '';
                const isFsc = currentGsm.includes(' FSC');
                const isEudr = currentGsm.includes(' EUDR');
                const newGsm = updateDinhLuongField(currentGsm, '', isFsc, isEudr);
                handleFormChange(COL_IDX.DINH_LUONG, newGsm);
            }
            return;
        }
    }

    if (field.idx === COL_IDX.LOAI_GIAY) {
        const currentGsm = formData[COL_IDX.DINH_LUONG] || '';
        const isFsc = currentGsm.includes(' FSC');
        const isEudr = currentGsm.includes(' EUDR');
        const newGsm = updateDinhLuongField(currentGsm, value, isFsc, isEudr); 
        handleFormChange(COL_IDX.DINH_LUONG, newGsm);
    } 
    else if (field.idx === COL_IDX.DINH_LUONG) {
        const currentType = formData[COL_IDX.LOAI_GIAY] || '';
        const isFsc = value.includes(' FSC'); 
        const isEudr = value.includes(' EUDR');
        const newGsm = updateDinhLuongField(value, currentType, isFsc, isEudr);
        handleFormChange(COL_IDX.DINH_LUONG, newGsm);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        inputRefs.current[index]?.blur();
      }
    }
  };

  const handleTableChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...tableRows];
    newRows[rowIndex][colIndex] = value;
    setTableRows(newRows);
  };
  
  const handleTableBlur = (rowIndex: number, colIndex: number, value: string) => {
    if (FORMAT_VN_COLS.includes(colIndex)) {
        const formatted = formatVN(value);
        if (formatted !== value) {
            const newRows = [...tableRows];
            newRows[rowIndex][colIndex] = formatted;
            setTableRows(newRows);
        }
    }
  };

  const formatToVNDate = (val: string) => {
      if(!val) return '';
      const parts = val.split('-');
      if(parts.length === 3 && parts[0].length === 4) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return val;
  };

  const handleResetForm = () => {
    const initial: Record<number, string> = {};
    MASTER_FORM_FIELDS.forEach(field => {
      initial[field.idx] = field.defaultValue || '';
    });
    setFormData(initial);
    setCopyCount(1);
    showToast('Đã làm mới thông tin form!', 'info');
  };

  const handleAddRows = () => {
    if (copyCount <= 0) {
        showToast("Số lượng bản sao phải lớn hơn 0", 'warning');
        return;
    }

    const prefix = "TB";
    const mucDichLabel = formData[COL_IDX.MUC_DICH] || '';
    const mucDichOpt = optionData.MUC_DICH.find(o => o.label === mucDichLabel);
    const mucDichCode = mucDichOpt ? mucDichOpt.code : 'XX';

    const kienGiayLabel = formData[COL_IDX.KIEN_GIAY] || '';
    const kienGiayOpt = optionData.KIEN_GIAY.find(o => o.label === kienGiayLabel);
    const kienGiayCode = kienGiayOpt ? kienGiayOpt.code : 'XX';

    const dinhLuong = formData[COL_IDX.DINH_LUONG] || '000';

    const rawDate = formData[COL_IDX.NGAY_NHAP];
    let dateStr = '000000';
    if(rawDate) {
       const [y, m, d] = rawDate.split('-');
       if(y && m && d) {
           dateStr = `${d}${m}${y.slice(2)}`;
       }
    }

    const newRowsToAdd = [];
    for (let i = 0; i < copyCount; i++) {
        const row = Array(19).fill('');
        
        const currentSeq = startSeq + i;
        const seqStr = String(currentSeq).padStart(4, '0');

        const generatedSku = `${prefix}${mucDichCode}${kienGiayCode}_${dinhLuong}_${dateStr}_${seqStr}`;
        row[COL_IDX.SKU] = generatedSku; 
        
        Object.keys(formData).forEach(key => {
            const colIdx = parseInt(key);
            let val = formData[colIdx];
            if (colIdx === COL_IDX.NGAY_NHAP || colIdx === COL_IDX.NGAY_SX) {
                val = formatToVNDate(val);
            }
            if (FORMAT_VN_COLS.includes(colIdx)) {
                val = formatVN(val);
            }
            row[colIdx] = val;
        });
        
        row[COL_IDX.NGUOI_NHAP] = userInfo.name || userInfo.email || 'Admin';
        
        newRowsToAdd.push(row);
    }

    setTableRows(prev => [...prev, ...newRowsToAdd]);
    setStartSeq(prev => prev + copyCount);
  };

  const removeRow = (index: number) => {
      const newRows = [...tableRows];
      newRows.splice(index, 1);
      setTableRows(newRows);
  };

  const handleSave = async () => {
      const validRows = tableRows.filter(r => r[COL_IDX.SKU] && String(r[COL_IDX.SKU]).trim() !== '');
      if (validRows.length === 0) {
          showToast("Danh sách trống hoặc chưa nhập SKU.", 'warning');
          return;
      }

      const duplicateSkus: string[] = [];
      validRows.forEach(row => {
          const sku = String(row[COL_IDX.SKU]).trim();
          if (existingSkuSet.has(sku)) {
              duplicateSkus.push(sku);
          }
      });

      if (duplicateSkus.length > 0) {
          showToast(`Phát hiện ${duplicateSkus.length} mã SKU đã tồn tại!`, 'error');
          return;
      }
      
      if (validRows.length < tableRows.length) {
          if (!window.confirm(`Có ${tableRows.length - validRows.length} dòng chưa có SKU sẽ bị bỏ qua. Tiếp tục?`)) return;
      }

      setIsProcessing(true);

      try {
          const currentUser = userInfo.name || userInfo.email || 'Admin';
          const currentTimestamp = new Date().toLocaleString('vi-VN');

          const payload = validRows.map(row => {
              const fullRow = [...row];
              fullRow[17] = currentUser;
              fullRow[18] = currentTimestamp;
              return fullRow;
          });

          await onExecuteImport(payload);
          setTableRows([]);
      } catch (e) {
          console.error(e);
          showToast("Lỗi nhập kho: " + e, 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const totalWeight = tableRows.reduce((acc, r) => {
      const val = String(r[COL_IDX.TRONG_LUONG] || '0');
      const clean = val.replace(/\./g, '').replace(/,/g, '.');
      const w = parseFloat(clean);
      return acc + (isNaN(w) ? 0 : w);
  }, 0);

  return (
    <div className="w-full h-full p-4 flex flex-col lg:flex-row gap-4 animate-fadeIn relative bg-[#212830] text-gray-200 overflow-hidden">
        
        {Object.keys(optionData).map(key => {
             const k = key as keyof ConfigData;
             return (
                 <datalist key={key} id={`list_${key}`}>
                     {optionData[k].map(opt => (
                         <option key={opt.code} value={opt.label}>{opt.code}</option>
                     ))}
                 </datalist>
             );
        })}

        {/* 1. LEFT PANEL */}
        <div className="w-full lg:w-[260px] bg-[#2d2f35] rounded-xl border border-white/10 shadow-lg flex flex-col shrink-0 h-full overflow-hidden transition-all">
            <div className="p-3 border-b border-white/10 bg-[#212830] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">app_registration</span>
                    <h3 className="text-base font-bold text-white uppercase tracking-wide">Thông Tin Chung</h3>
                </div>
                <button onClick={handleResetForm} aria-label="Làm mới form" className="w-7 h-7 flex items-center justify-center rounded bg-[#FF8C00] hover:bg-[#e67e00] text-white shadow-lg transition-all hover:scale-110" title="Làm mới">
                    <span className="material-symbols-outlined text-[18px] font-bold">refresh</span>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <div className="flex flex-col gap-3">
                    {MASTER_FORM_FIELDS.map((field, index) => {
                        const isFsc = field.idx === COL_IDX.DINH_LUONG && formData[field.idx]?.toString().includes(' FSC');
                        const isEudr = field.idx === COL_IDX.DINH_LUONG && formData[field.idx]?.toString().includes(' EUDR');
                        const listKey = field.listKey as keyof ConfigData | undefined;
                        const listOptions = listKey ? optionData[listKey] : undefined;
                        const selectedVal = formData[field.idx];
                        const matchedOption = listOptions?.find(opt => opt.label === selectedVal);
                        const displayCode = matchedOption ? matchedOption.code : '';

                        return (
                            <div key={field.idx} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{field.label}</label>
                                    {field.idx === COL_IDX.DINH_LUONG && (
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1 cursor-pointer select-none group">
                                                <input type="checkbox" checked={!!isEudr} onChange={(e) => {
                                                        const currentGsm = formData[COL_IDX.DINH_LUONG] || '';
                                                        const currentType = formData[COL_IDX.LOAI_GIAY] || '';
                                                        handleFormChange(field.idx, updateDinhLuongField(currentGsm, currentType, currentGsm.includes(' FSC'), e.target.checked));
                                                    }} className="w-3.5 h-3.5 rounded border-gray-500 text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"/>
                                                <span className="text-[10px] font-bold text-blue-500 group-hover:text-blue-400">EUDR</span>
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer select-none group">
                                                <input type="checkbox" checked={!!isFsc} onChange={(e) => {
                                                        const currentGsm = formData[COL_IDX.DINH_LUONG] || '';
                                                        const currentType = formData[COL_IDX.LOAI_GIAY] || '';
                                                        handleFormChange(field.idx, updateDinhLuongField(currentGsm, currentType, e.target.checked, currentGsm.includes(' EUDR')));
                                                    }} className="w-3.5 h-3.5 rounded border-gray-500 text-green-500 focus:ring-0 cursor-pointer accent-green-500"/>
                                                <span className="text-[10px] font-bold text-green-500 group-hover:text-green-400">FSC</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        ref={el => { inputRefs.current[index] = el }}
                                        type={field.type}
                                        list={field.listKey ? `list_${field.listKey}` : undefined}
                                        value={formData[field.idx]}
                                        onChange={(e) => handleFormChange(field.idx, e.target.value)}
                                        onBlur={(e) => handleFormBlur(field, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        placeholder={field.placeholder}
                                        className={`w-full bg-[#1a1a1a] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:bg-[#252525] outline-none transition-all shadow-inner ${displayCode ? 'pr-12' : ''}`}
                                    />
                                    {displayCode && <div className="absolute top-1 bottom-1 right-1 min-w-[32px] px-1 bg-blue-600/90 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm pointer-events-none border border-white/10">{displayCode}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-3 border-t border-white/10 bg-[#212830] flex flex-col gap-3">
                 <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-yellow-400 font-bold uppercase">Số Lượng Bản</label>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCopyCount(Math.max(1, copyCount - 1))} aria-label="Giảm số lượng" className="w-8 h-9 rounded bg-[#1a1a1a] border border-white/20 hover:bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined text-sm">remove</span></button>
                        <input type="number" min="1" value={copyCount} onChange={(e) => setCopyCount(parseInt(e.target.value) || 0)} className="flex-1 bg-[#1a1a1a] border border-yellow-500/50 rounded h-9 text-white font-bold text-center focus:border-yellow-500 outline-none text-base"/>
                         <button onClick={() => setCopyCount(copyCount + 1)} aria-label="Tăng số lượng" className="w-8 h-9 rounded bg-[#1a1a1a] border border-white/20 hover:bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                 </div>
                 <button onClick={handleAddRows} className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm">
                    <span className="material-symbols-outlined text-[18px]">queue</span>
                    Thêm Vào Danh Sách
                 </button>
            </div>
        </div>

        {/* 2. RIGHT PANEL */}
        <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]/50 relative flex flex-col shadow-lg">
             <div className="bg-[#2d2f35] p-3 flex items-center justify-between border-b border-white/10 shrink-0 relative">
                <div className="flex flex-col justify-center z-10 gap-1">
                    <span className="text-sm font-bold text-gray-400">Số dòng: <b className="text-white ml-2">{tableRows.length}</b></span>
                    <span className="text-sm font-bold text-gray-400">Tổng trọng lượng: <b className="text-green-400 ml-2">{totalWeight.toLocaleString('vi-VN')} kg</b></span>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <span className="font-bold text-white flex items-center gap-2 text-lg uppercase tracking-wide">
                        <span className="material-symbols-outlined text-green-500">list_alt</span>
                        Danh Sách Chi Tiết
                    </span>
                </div>
                <div className="flex items-center gap-2 z-10">
                    {tableRows.length > 0 && (
                        <button 
                             onClick={() => setIsPrintModalOpen(true)}
                             className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all animate-fadeIn"
                        >
                             <span className="material-symbols-outlined text-[24px]">qr_code_2_add</span>
                             In Tem
                        </button>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={isProcessing || tableRows.length === 0}
                        className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 transition-all h-10 ${(isProcessing || tableRows.length === 0) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#FF8C00] hover:bg-[#e67e00] hover:scale-105'}`}
                    >
                         {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">save</span>}
                         {isProcessing ? 'Đang lưu...' : 'Lưu Kho'}
                    </button>
                </div>
             </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-[#1e1e1e]">
                <table className="border-collapse border-spacing-0" style={{ minWidth: 'max-content' }}>
                    <thead className="sticky top-0 z-10 bg-[#212830] shadow-md">
                        <tr className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                            <th className="w-[50px] px-2 py-3 border-b border-r border-white/10 text-center bg-[#212830]">STT</th>
                            <th className="w-[270px] px-2 py-3 border-b border-r border-white/10 text-left bg-[#212830] text-[#FF8C00] sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Mã SKU</th>
                            {TABLE_COLUMNS_DISPLAY.map((col) => (
                                <th key={col.idx} style={{ width: col.width }} className="px-2 py-3 border-b border-r border-white/10 text-left bg-[#212830] truncate" title={col.label}>{col.label}</th>
                            ))}
                            <th className="w-[50px] px-2 py-3 border-b border-white/10 text-center bg-[#212830]">#</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tableRows.map((row, rIdx) => {
                            const rowSku = String(row[COL_IDX.SKU] || '').trim();
                            const isDuplicate = existingSkuSet.has(rowSku);
                            return (
                            <tr key={rIdx} className="hover:bg-white/5 transition-colors group">
                                <td className="text-center text-gray-500 font-mono text-sm border-r border-white/5">{rIdx + 1}</td>
                                <td className="p-0 border-r border-white/5 sticky left-0 z-10 bg-[#1e1e1e] group-hover:bg-[#2a2a2a] shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                    <input type="text" value={row[COL_IDX.SKU] || ''} onChange={(e) => handleTableChange(rIdx, COL_IDX.SKU, e.target.value)} placeholder="Quét mã..." className={`w-full h-full bg-transparent px-3 py-2 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-colors placeholder-gray-600 ${isDuplicate ? 'text-red-500 animate-pulse' : 'text-[#FF8C00]'}`} title={isDuplicate ? "Mã này đã tồn tại trong kho!" : ""} autoFocus={rIdx === tableRows.length - 1 && !row[COL_IDX.SKU]}/>
                                    {isDuplicate && <span className="material-symbols-outlined text-red-500 text-[14px] absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">warning</span>}
                                </td>
                                {TABLE_COLUMNS_DISPLAY.map((col) => (
                                    <td key={`${rIdx}-${col.idx}`} className="p-0 border-r border-white/5 relative">
                                        <input type="text" value={row[col.idx] || ''} onChange={(e) => handleTableChange(rIdx, col.idx, e.target.value)} onBlur={(e) => handleTableBlur(rIdx, col.idx, e.target.value)} readOnly={col.idx === COL_IDX.CAP_NHAT} className={`w-full h-full bg-transparent px-2 py-2 text-sm outline-none text-gray-300 focus:text-white focus:bg-white/10 transition-colors text-left ${col.idx === COL_IDX.CAP_NHAT ? 'opacity-50 cursor-not-allowed' : ''} ${FORMAT_VN_COLS.includes(col.idx) ? 'font-mono text-blue-300' : ''}`}/>
                                    </td>
                                ))}
                                <td className="text-center">
                                    <button onClick={() => removeRow(rIdx)} aria-label="Xóa dòng" className="w-full h-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors hover:bg-white/5"><span className="material-symbols-outlined text-[18px]">close</span></button>
                                </td>
                            </tr>
                        )})}
                        {tableRows.length === 0 && (
                            <tr><td colSpan={TABLE_COLUMNS_DISPLAY.length + 3} className="py-20 text-center text-gray-500 italic"><div className="flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-3xl opacity-50">post_add</span></div><span>Điền thông tin bên trái và bấm "Thêm Vào Danh Sách"</span></div></td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Removed the absolute blocking overlay, rely on button state */}
        </div>
        
        {/* PRINT MODAL INSTANCE */}
        <PrintLabelModal 
           isOpen={isPrintModalOpen}
           onClose={() => setIsPrintModalOpen(false)}
           data={tableRows}
           headers={HEADERS_MAP}
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

export default ImportPage;