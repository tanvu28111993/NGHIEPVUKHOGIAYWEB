
import React, { useState, useRef, useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { createPortal } from 'react-dom';
import { useToast } from './ToastContext';

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[][];
  headers: string[]; // Header names to map to data
}

interface LabelElement {
  id: string; // Header name or 'QR_CODE'
  label: string; // Display name
  x: number; // Percentage X relative to label width
  y: number; // Percentage Y relative to label height
  fontSize: number;
  fontWeight: string; // 'normal' | 'bold'
  isVisible: boolean;
  type: 'text' | 'qr';
  width?: number; // For QR
  dataSource?: string; // Field name to get data from (for QR)
  rotation: number; // Rotation in degrees
}

interface SavedConfig {
  paperSize: 'A3' | 'A4' | 'A5' | 'ROLL';
  labelWidth: number;
  labelHeight: number;
  labelsPerRow: number;
  elements: LabelElement[];
  backgroundImage: string | null;
  bgOpacity: number;
}

const CACHE_KEY_PRINT_CONFIG = 'print_label_config_v3'; // Incremented version

// Default config with generic positions, will be mapped to actual headers
const DEFAULT_CONFIG_BASE: Partial<LabelElement>[] = [
  { id: 'QR_CODE', label: 'Mã QR 1', x: 5, y: 15, fontSize: 0, fontWeight: 'normal', isVisible: true, type: 'qr', width: 25, dataSource: 'Thẻ Kho Giấy SKU', rotation: 0 },
  { id: 'QR_CODE_2', label: 'Mã QR 2', x: 70, y: 15, fontSize: 0, fontWeight: 'normal', isVisible: false, type: 'qr', width: 20, dataSource: 'Thẻ Kho Giấy SKU', rotation: 0 },
];

const PrintLabelModal: React.FC<PrintLabelModalProps> = ({ isOpen, onClose, data, headers }) => {
  const { showToast } = useToast();
  
  // -- State Initialization with Lazy Loading from LocalStorage --
  const loadSavedConfig = (): SavedConfig | null => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_PRINT_CONFIG);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const savedConfig = loadSavedConfig();

  // Page Settings
  const [paperSize, setPaperSize] = useState<'A3' | 'A4' | 'A5' | 'ROLL'>(savedConfig?.paperSize || 'A4');
  const [labelWidth, setLabelWidth] = useState(savedConfig?.labelWidth || 100); // mm
  const [labelHeight, setLabelHeight] = useState(savedConfig?.labelHeight || 60); // mm
  const [labelsPerRow, setLabelsPerRow] = useState(savedConfig?.labelsPerRow || 2);
  
  // Background Image Template (Phôi)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(savedConfig?.backgroundImage || null);
  const [bgOpacity, setBgOpacity] = useState(savedConfig?.bgOpacity || 0.5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Config Import Ref
  const configInputRef = useRef<HTMLInputElement>(null);

  // Zoom State for Edit Mode
  const [zoomLevel, setZoomLevel] = useState<number>(3.5); // Default zoom

  // View Mode: 'edit' for single label design, 'preview' for full sheet layout
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // Element Configuration
  const [elements, setElements] = useState<LabelElement[]>(() => {
    // 1. If we have a saved config, try to use it
    if (savedConfig?.elements) {
        // Fix missing rotation property for old configs
        return savedConfig.elements.map(e => ({...e, rotation: e.rotation || 0}));
    }

    // 2. Otherwise, build from current headers + Defaults
    const initialElements: LabelElement[] = [];

    // Add Special QR Elements
    DEFAULT_CONFIG_BASE.forEach(def => {
        initialElements.push(def as LabelElement);
    });

    // Add Text Elements based on Headers
    headers.forEach((h, index) => {
        // Smart positioning logic for first few items to look like a label
        let defaultX = 5;
        let defaultY = 90;
        let defaultSize = 10;
        let defaultBold = 'normal';
        let defaultVisible = false;

        // Simple heuristic layout for demo if no config exists
        if (h.includes('SKU')) { defaultX = 35; defaultY = 10; defaultSize = 16; defaultBold = 'bold'; defaultVisible = true; }
        else if (h.includes('Loại')) { defaultX = 35; defaultY = 30; defaultSize = 12; defaultBold = 'bold'; defaultVisible = true; }
        else if (h.includes('Định Lượng') || h.includes('GM')) { defaultX = 65; defaultY = 30; defaultSize = 12; defaultBold = 'bold'; defaultVisible = true; }
        else if (h.includes('Rộng')) { defaultX = 35; defaultY = 50; defaultSize = 12; defaultVisible = true; }
        else if (h.includes('Trọng Lượng')) { defaultX = 65; defaultY = 50; defaultSize = 14; defaultBold = 'bold'; defaultVisible = true; }
        else if (h.includes('Lô')) { defaultX = 35; defaultY = 70; defaultSize = 11; defaultVisible = true; }
        else if (h.includes('Ngày')) { defaultX = 35; defaultY = 85; defaultSize = 10; defaultVisible = true; }

        initialElements.push({
            id: h,
            label: h,
            x: defaultX, 
            y: defaultY,
            fontSize: defaultSize,
            fontWeight: defaultBold,
            isVisible: defaultVisible,
            type: 'text',
            rotation: 0
        });
    });

    return initialElements;
  });

  // Effect to sync elements with headers if they change dynamically (e.g. data reloaded)
  // This ensures "Trường Thông Tin" always matches the input columns
  useEffect(() => {
     setElements(prev => {
        const newElements = [...prev];
        let hasChanged = false;

        // 1. Add missing headers
        headers.forEach(h => {
            if (!newElements.some(e => e.id === h)) {
                newElements.push({
                    id: h,
                    label: h,
                    x: 5, y: 90, 
                    fontSize: 10, fontWeight: 'normal', 
                    isVisible: false, 
                    type: 'text',
                    rotation: 0
                });
                hasChanged = true;
            }
        });

        // 2. (Optional) We generally keep old IDs even if header missing to preserve config, 
        // unless you strictly want to remove them. For safety, we keep them but they just won't print data.

        return hasChanged ? newElements : prev;
     });
  }, [headers]);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Helper to find data index by header name
  const getColIndex = (headerName: string) => headers.indexOf(headerName);

  // --- Handlers ---

  // Export Config to File
  const handleExportConfig = () => {
    const configToSave: SavedConfig = {
      paperSize,
      labelWidth,
      labelHeight,
      labelsPerRow,
      elements,
      backgroundImage,
      bgOpacity
    };
    
    try {
      const jsonString = JSON.stringify(configToSave, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `tem-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      
      // Also save to local storage as fallback
      localStorage.setItem(CACHE_KEY_PRINT_CONFIG, JSON.stringify(configToSave));
      
      showToast('Đã tải xuống file cấu hình!', 'success');
    } catch (e) {
      showToast('Lỗi khi xuất file', 'error');
    }
  };

  // Import Config from File
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedConfig = JSON.parse(event.target?.result as string) as SavedConfig;
            
            // Validate basic structure
            if (!importedConfig.elements || !Array.isArray(importedConfig.elements)) {
                throw new Error("File cấu hình không hợp lệ");
            }

            // Apply settings
            if (importedConfig.paperSize) setPaperSize(importedConfig.paperSize);
            if (importedConfig.labelWidth) setLabelWidth(importedConfig.labelWidth);
            if (importedConfig.labelHeight) setLabelHeight(importedConfig.labelHeight);
            if (importedConfig.labelsPerRow) setLabelsPerRow(importedConfig.labelsPerRow);
            if (importedConfig.backgroundImage) setBackgroundImage(importedConfig.backgroundImage);
            if (importedConfig.bgOpacity) setBgOpacity(importedConfig.bgOpacity);

            // Merge imported elements with current headers logic
            // We want to keep the positions from import, but ensure all current headers exist
            const importedElements = importedConfig.elements.map(e => ({
                ...e,
                rotation: e.rotation || 0 // Ensure rotation exists
            }));

            const mergedElements = [...importedElements];
            headers.forEach(h => {
                const exists = mergedElements.some(e => e.id === h);
                if (!exists) {
                    mergedElements.push({
                        id: h,
                        label: h,
                        x: 5, y: 90, 
                        fontSize: 10, fontWeight: 'normal', 
                        isVisible: false, 
                        type: 'text',
                        rotation: 0
                    });
                }
            });
            setElements(mergedElements);
            
            // Save to local storage
            localStorage.setItem(CACHE_KEY_PRINT_CONFIG, JSON.stringify(importedConfig));
            
            showToast('Đã tải cấu hình lên thành công!', 'success');
        } catch (err) {
            console.error(err);
            showToast('File lỗi hoặc không đúng định dạng', 'error');
        } finally {
            if (configInputRef.current) configInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit 2MB for localStorage safety
          showToast('Ảnh quá lớn (>2MB). Vui lòng chọn ảnh nhỏ hơn để lưu.', 'warning');
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBackgroundImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (viewMode !== 'edit') return; // Only allow drag in edit mode
    e.stopPropagation();
    setSelectedElementId(id);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !selectedElementId || !previewRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const previewRect = previewRef.current.getBoundingClientRect();
    
    const percentX = (deltaX / previewRect.width) * 100;
    const percentY = (deltaY / previewRect.height) * 100;

    setElements(prev => prev.map(el => {
      if (el.id === selectedElementId) {
        return {
          ...el,
          x: Math.min(100, Math.max(0, el.x + percentX)),
          y: Math.min(100, Math.max(0, el.y + percentY))
        };
      }
      return el;
    }));

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handlePrint = () => {
    window.print();
  };

  const selectedElement = elements.find(e => e.id === selectedElementId);
  const sampleRow = data.length > 0 ? data[0] : [];
  const printPortalTarget = document.getElementById('print-area');

  // Helper to render label content
  const renderLabelContent = (row: any[], scale: number = 1) => {
    return elements.filter(e => e.isVisible).map(el => {
        let content = '';
        if (el.type === 'qr') {
           // For QR, use the configured dataSource (header name) or default to SKU
           const sourceHeader = el.dataSource || 'Thẻ Kho Giấy SKU';
           // Try to find index by exact header name match
           const idx = headers.indexOf(sourceHeader);
           content = (idx !== -1 && row && row[idx]) ? String(row[idx]) : 'N/A';
        } else {
           // For text, id is the header name
           const idx = headers.indexOf(el.id);
           const val = (idx !== -1 && row && row[idx]) ? String(row[idx]) : '';
           content = val;
           if (el.id.includes('Trọng Lượng')) content = `${val} Kg`;
           if (el.id.includes('Rộng')) content = `x ${val}`;
           if (el.id.includes('Định Lượng')) content = `GM: ${val}`;
        }
        
        if (el.type === 'qr') {
            return (
               <div
                 key={el.id}
                 style={{
                   position: 'absolute',
                   left: `${el.x}%`,
                   top: `${el.y}%`,
                   width: `${(el.width || 25) * scale}mm`, // Scale for sheet view
                   height: `${(el.width || 25) * scale}mm`,
                   backgroundColor: 'white', // Ensure white background for QR readability
                   padding: `${1.5 * scale}mm`, // Quiet zone padding
                   transform: `rotate(${el.rotation || 0}deg)`,
                   transformOrigin: 'center center'
                 }}
               >
                 <QRCode 
                    value={content} 
                    size={256} 
                    level="M" 
                    bgColor="#FFFFFF" // Explicit White Background
                    fgColor="#000000" // Explicit Black Foreground
                    style={{ height: "100%", maxWidth: "100%", width: "100%" }} 
                 />
               </div>
            );
        }

        return (
            <div
               key={el.id}
               style={{
                 position: 'absolute',
                 left: `${el.x}%`,
                 top: `${el.y}%`,
                 fontSize: `${el.fontSize * scale}pt`, // Scale font
                 fontWeight: el.fontWeight,
                 whiteSpace: 'nowrap',
                 lineHeight: 1,
                 fontFamily: 'Arial, sans-serif',
                 transform: `rotate(${el.rotation || 0}deg)`,
                 transformOrigin: 'center center'
               }}
            >
               {content}
            </div>
        );
     });
  };

  const getPageWidth = () => {
      switch(paperSize) {
          case 'A3': return '297mm';
          case 'A5': return '148mm';
          case 'ROLL': return `${labelWidth + 10}mm`;
          case 'A4': default: return '210mm';
      }
  };

  const getPageHeight = () => {
      switch(paperSize) {
          case 'A3': return '420mm';
          case 'A5': return '210mm';
          case 'ROLL': return '100mm';
          case 'A4': default: return '297mm';
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
      {/* 1. Modal UI */}
      <div className="bg-[#212830] w-full max-w-[1200px] h-[90vh] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="h-[60px] bg-[#2d2f35] border-b border-white/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600/20 rounded-lg">
                <span className="material-symbols-outlined text-blue-500">print</span>
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-tight">Thiết Kế Tem In</h2>
                <p className="text-xs text-gray-400">Tùy chỉnh bố cục và in hàng loạt {data.length} tem</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-semibold text-sm">Đóng</button>
             <button onClick={handlePrint} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 font-bold text-sm flex items-center gap-2">
               <span className="material-symbols-outlined text-[20px]">print</span> In Ngay
             </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: CONTROLS */}
          <div className="w-[320px] bg-[#1a1a1a] border-r border-white/10 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            
            {/* SECTION 1: Paper & Size */}
            <div className="p-4 border-b border-white/10">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <span className="material-symbols-outlined text-[16px]">settings_overscan</span> Khổ Giấy & Tem
               </h3>
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Khổ giấy</label>
                    <select value={paperSize} onChange={(e) => setPaperSize(e.target.value as any)} className="w-full bg-[#2d2f35] border border-white/20 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500">
                       <option value="A4">A4 (210x297)</option>
                       <option value="A3">A3 (297x420)</option>
                       <option value="A5">A5 (148x210)</option>
                       <option value="ROLL">Cuộn/Decal</option>
                    </select>
                 </div>
                 <div>
                     <label className="text-[11px] text-gray-500 block mb-1">Tem/Hàng</label>
                     <input type="number" value={labelsPerRow} onChange={(e) => setLabelsPerRow(parseInt(e.target.value))} className="w-full bg-[#2d2f35] border border-white/20 rounded px-2 py-1.5 text-sm text-white outline-none"/>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Rộng (mm)</label>
                    <input type="number" value={labelWidth} onChange={(e) => setLabelWidth(parseInt(e.target.value))} className="w-full bg-[#2d2f35] border border-white/20 rounded px-2 py-1.5 text-sm text-white outline-none"/>
                 </div>
                 <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Cao (mm)</label>
                    <input type="number" value={labelHeight} onChange={(e) => setLabelHeight(parseInt(e.target.value))} className="w-full bg-[#2d2f35] border border-white/20 rounded px-2 py-1.5 text-sm text-white outline-none"/>
                 </div>
               </div>
            </div>

            {/* SECTION 1.5: Background Image (Template/Phôi) */}
            <div className="p-4 border-b border-white/10">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">image</span> Ảnh Phôi (Nền)
                  </h3>
                  {backgroundImage && <button onClick={() => setBackgroundImage(null)} className="text-[10px] text-red-400 hover:text-red-300">Xóa</button>}
               </div>
               
               {!backgroundImage ? (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 border border-dashed border-white/30 rounded text-gray-400 text-xs hover:text-white hover:border-white/60 transition-colors">
                     + Tải ảnh phôi lên
                  </button>
               ) : (
                  <div className="flex flex-col gap-2">
                     <div className="relative w-full h-20 bg-black/40 rounded overflow-hidden border border-white/10">
                        <img src={backgroundImage} alt="Preview" className="w-full h-full object-contain" />
                     </div>
                     <div>
                         <label className="text-[11px] text-gray-500 block mb-1 flex justify-between">
                            <span>Độ mờ: {Math.round(bgOpacity * 100)}%</span>
                         </label>
                         <input type="range" min="0" max="1" step="0.1" value={bgOpacity} onChange={(e) => setBgOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                     </div>
                  </div>
               )}
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
               <p className="text-[10px] text-gray-500 mt-2 italic">*Ảnh chỉ dùng để căn chỉnh, không được in ra.</p>
            </div>

            {/* SECTION 2: Fields List */}
            <div className="p-4 border-b border-white/10 flex-1">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <span className="material-symbols-outlined text-[16px]">list</span> Trường Thông Tin
               </h3>
               <div className="grid grid-cols-2 gap-2">
                  {elements.map((el) => (
                    <div key={el.id} className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${selectedElementId === el.id ? 'bg-blue-600/20 border-blue-500' : 'bg-[#2d2f35] border-transparent hover:border-white/10'}`} onClick={() => setSelectedElementId(el.id)}>
                       <div className="flex items-center gap-2 overflow-hidden">
                          <input 
                            type="checkbox" 
                            checked={el.isVisible} 
                            onChange={(e) => {
                               e.stopPropagation();
                               setElements(elements.map(item => item.id === el.id ? {...item, isVisible: e.target.checked} : item));
                            }}
                            className="w-4 h-4 rounded border-gray-500 text-blue-600 bg-transparent focus:ring-0 cursor-pointer shrink-0"
                          />
                          <span className="text-xs text-white font-medium truncate" title={el.label}>{el.label}</span>
                       </div>
                       {el.type === 'qr' && <span className="text-[9px] bg-white/10 px-1 py-0.5 rounded text-gray-300 shrink-0">QR</span>}
                    </div>
                  ))}
               </div>
            </div>

            {/* SECTION 3: Selected Item Properties */}
            {selectedElement && (
               <div className="p-4 bg-[#252a33]">
                   <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Tùy chỉnh: {selectedElement.label}</h3>
                   
                   {selectedElement.type === 'text' && (
                       <div className="grid grid-cols-2 gap-3 mb-3">
                           <div>
                               <label className="text-[11px] text-gray-500 block mb-1">Cỡ chữ (pt)</label>
                               <div className="flex items-center gap-1">
                                   <button 
                                      onClick={() => setElements(elements.map(el => el.id === selectedElement.id ? {...el, fontSize: Math.max(6, el.fontSize - 1)} : el))}
                                      className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] border border-white/20 rounded hover:bg-white/10 text-white transition-colors"
                                   >
                                      <span className="material-symbols-outlined text-[16px]">remove</span>
                                   </button>
                                   <input 
                                      type="number" 
                                      value={selectedElement.fontSize} 
                                      onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          setElements(elements.map(el => el.id === selectedElement.id ? {...el, fontSize: isNaN(val) ? 0 : val} : el));
                                      }} 
                                      className="flex-1 bg-[#1a1a1a] border border-white/20 rounded px-1 py-1 text-sm text-white text-center h-8 focus:border-blue-500 outline-none"
                                   />
                                   <button 
                                      onClick={() => setElements(elements.map(el => el.id === selectedElement.id ? {...el, fontSize: el.fontSize + 1} : el))}
                                      className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] border border-white/20 rounded hover:bg-white/10 text-white transition-colors"
                                   >
                                      <span className="material-symbols-outlined text-[16px]">add</span>
                                   </button>
                               </div>
                           </div>
                           <div>
                               <label className="text-[11px] text-gray-500 block mb-1">Kiểu chữ</label>
                               <button
                                  onClick={() => setElements(elements.map(el => el.id === selectedElement.id ? {...el, fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold'} : el))}
                                  className={`w-full h-8 rounded border flex items-center justify-center gap-2 font-bold transition-all text-sm ${selectedElement.fontWeight === 'bold' ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-[#1a1a1a] text-gray-400 border-white/20 hover:text-white hover:border-white/40'}`}
                               >
                                  <span className="material-symbols-outlined text-[18px]">format_bold</span>
                                  {selectedElement.fontWeight === 'bold' ? 'In Đậm' : 'Thường'}
                               </button>
                           </div>
                       </div>
                   )}
                   {selectedElement.type === 'qr' && (
                       <>
                         <div className="mb-3">
                             <label className="text-[11px] text-gray-500 block mb-1">Kích thước (mm)</label>
                             <input type="number" value={selectedElement.width} onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? {...el, width: parseInt(e.target.value)} : el))} className="w-full bg-[#1a1a1a] border border-white/20 rounded px-2 py-1 text-sm text-white"/>
                         </div>
                         <div className="mb-3">
                             <label className="text-[11px] text-gray-500 block mb-1">Nguồn dữ liệu</label>
                             <select 
                                value={selectedElement.dataSource || ''}
                                onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? {...el, dataSource: e.target.value} : el))}
                                className="w-full bg-[#1a1a1a] border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none"
                             >
                                 <option value="" disabled>-- Chọn cột dữ liệu --</option>
                                 {headers.map(h => (
                                     <option key={h} value={h}>{h}</option>
                                 ))}
                             </select>
                         </div>
                       </>
                   )}
                   
                   {/* ROTATION CONTROL */}
                   <div className="mb-3">
                       <label className="text-[11px] text-gray-500 block mb-1 flex justify-between">
                           <span>Xoay (độ)</span>
                           <span>{selectedElement.rotation || 0}°</span>
                       </label>
                       <input 
                           type="range" 
                           min="0" 
                           max="360" 
                           step="90" 
                           value={selectedElement.rotation || 0} 
                           onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? {...el, rotation: parseInt(e.target.value)} : el))} 
                           className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                       />
                       <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                           <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>360°</span>
                       </div>
                   </div>

                   {/* Removed X/Y manual inputs */}
               </div>
            )}

            {/* ACTION BUTTONS (IMPORT/EXPORT) */}
            <div className="p-4 bg-[#15171a] border-t border-white/10 flex flex-col gap-2">
                <input type="file" accept=".json" ref={configInputRef} onChange={handleImportConfig} className="hidden" />
                
                <button onClick={() => configInputRef.current?.click()} className="w-full py-2.5 text-xs font-bold text-gray-300 bg-white/5 rounded border border-white/10 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">upload</span> Tải Cấu Hình Lên
                </button>
                
                <button onClick={handleExportConfig} className="w-full py-2.5 text-xs font-bold text-white bg-[#FF8C00] rounded hover:bg-[#e67e00] transition-colors shadow-lg flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">download</span> Tải Cấu Hình Xuống
                </button>
            </div>

          </div>

          {/* RIGHT CENTER: PREVIEW */}
          <div className="flex-1 bg-[#0f1115] flex flex-col relative overflow-hidden">
             
             {/* VIEW MODE TOGGLE & ZOOM */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                 <div className="bg-[#2d2f35] p-1 rounded-full border border-white/10 flex gap-1 shadow-xl">
                    <button onClick={() => setViewMode('edit')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'edit' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                       <span className="material-symbols-outlined text-[16px]">design_services</span> Thiết Kế
                    </button>
                    <button onClick={() => setViewMode('preview')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                       <span className="material-symbols-outlined text-[16px]">visibility</span> Xem Trang In
                    </button>
                 </div>
                 
                 {viewMode === 'edit' && (
                     <div className="bg-[#2d2f35] h-9 px-3 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                         <span className="material-symbols-outlined text-gray-400 text-[16px]">zoom_out</span>
                         <input 
                            type="range" 
                            min="1" 
                            max="6" 
                            step="0.1" 
                            value={zoomLevel} 
                            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                         />
                         <span className="material-symbols-outlined text-gray-400 text-[16px]">zoom_in</span>
                         <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round(zoomLevel * 100 / 3.5)}%</span>
                     </div>
                 )}
             </div>

             {/* Grid Background */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             
             {viewMode === 'edit' ? (
                 /* --- EDIT MODE: SINGLE LABEL --- */
                 <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
                     <div className="mb-4 text-gray-400 text-sm font-medium z-10 select-none">Kéo thả để di chuyển vị trí</div>
                     <div 
                        ref={previewRef}
                        className="bg-white relative shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all ring-1 ring-white/20 overflow-hidden"
                        style={{
                            width: `${labelWidth * zoomLevel}px`, 
                            height: `${labelHeight * zoomLevel}px`,
                            transformOrigin: 'center center'
                        }}
                     >
                         {/* BACKGROUND IMAGE TEMPLATE (ONLY VISIBLE IN EDIT MODE) */}
                         {backgroundImage && (
                             <img 
                                src={backgroundImage} 
                                style={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    left: 0, 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover', 
                                    opacity: bgOpacity,
                                    zIndex: 0,
                                    pointerEvents: 'none'
                                }}
                             />
                         )}

                         {elements.filter(e => e.isVisible).map(el => {
                             const idx = getColIndex(el.id);
                             let displayVal = el.label;
                             if (el.type !== 'qr' && idx !== -1 && sampleRow) {
                                 // Mock data display
                                 displayVal = (sampleRow && sampleRow[idx]) ? String(sampleRow[idx]) : `[${el.label}]`;
                                 if (el.id.includes('Trọng Lượng')) displayVal = `${displayVal} Kg`;
                                 if (el.id.includes('Định Lượng')) displayVal = `GM: ${displayVal}`;
                                 if (el.id.includes('Rộng')) displayVal = `x ${displayVal}`;
                             }
                             
                             if (el.type === 'qr') {
                                return (
                                   <div
                                     key={el.id}
                                     onMouseDown={(e) => handleMouseDown(e, el.id)}
                                     className={`absolute cursor-move border-2 ${selectedElementId === el.id ? 'border-blue-500 z-50' : 'border-transparent hover:border-blue-300'}`}
                                     style={{
                                        left: `${el.x}%`,
                                        top: `${el.y}%`,
                                        width: `${(el.width || 20) * zoomLevel}px`, 
                                        height: `${(el.width || 20) * zoomLevel}px`,
                                        backgroundColor: 'white',
                                        padding: `${1.5 * zoomLevel}px`, // Scaled quiet zone
                                        zIndex: 10,
                                        transform: `rotate(${el.rotation || 0}deg)`,
                                        transformOrigin: 'center center'
                                     }}
                                   >
                                      <QRCode 
                                          value="DEMO-SKU" 
                                          size={256} 
                                          level="M" 
                                          bgColor="#FFFFFF"
                                          fgColor="#000000"
                                          style={{ height: "100%", maxWidth: "100%", width: "100%" }} 
                                      />
                                   </div>
                                )
                             }

                             return (
                                 <div
                                    key={el.id}
                                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                                    className={`absolute cursor-move border-2 whitespace-nowrap leading-none select-none ${selectedElementId === el.id ? 'border-blue-500 z-50' : 'border-transparent hover:border-blue-300'}`}
                                    style={{
                                        left: `${el.x}%`,
                                        top: `${el.y}%`,
                                        color: 'black',
                                        fontSize: `${el.fontSize * (zoomLevel / 3.5 * 1.3)}px`, // Approximate font scaling relative to zoom
                                        fontWeight: el.fontWeight,
                                        fontFamily: 'Arial, sans-serif',
                                        zIndex: 10,
                                        transform: `rotate(${el.rotation || 0}deg)`,
                                        transformOrigin: 'center center'
                                    }}
                                 >
                                    {displayVal}
                                 </div>
                             )
                         })}
                     </div>
                     <div className="mt-8 text-xs text-gray-500 z-10 max-w-[400px] text-center">
                         *Chế độ Thiết Kế: Hiển thị phóng to để dễ chỉnh sửa. Khi in sẽ tuân thủ kích thước mm chính xác.
                     </div>
                 </div>
             ) : (
                 /* --- PREVIEW MODE: SHEET LAYOUT --- */
                 <div className="flex-1 overflow-auto flex items-start justify-center p-8 pt-20 custom-scrollbar">
                     <div 
                        className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] relative transition-all"
                        style={{
                            width: getPageWidth(),
                            minHeight: getPageHeight(),
                            padding: '5mm',
                            transform: 'scale(0.8)', // Scale down to fit viewport nicely
                            transformOrigin: 'top center'
                        }}
                     >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm', alignContent: 'flex-start' }}>
                          {data.slice(0, 20).map((row, rowIndex) => ( // Show first 20 for preview performance
                            <div 
                              key={rowIndex} 
                              style={{
                                width: `${labelWidth}mm`,
                                height: `${labelHeight}mm`,
                                border: '1px dashed #ccc',
                                position: 'relative',
                                overflow: 'hidden',
                                color: 'black',
                                marginBottom: '2mm'
                              }}
                            >
                               {renderLabelContent(row, 1)}
                            </div>
                          ))}
                        </div>
                        {data.length > 20 && (
                            <div className="absolute bottom-2 left-0 w-full text-center text-xs text-gray-400">
                                ...và {data.length - 20} tem khác...
                            </div>
                        )}
                     </div>
                 </div>
             )}
          </div>
        </div>
      </div>
      
      {/* 2. PRINT PORTAL CONTENT (Invisible, used for actual printing) */}
      {printPortalTarget && createPortal(
          <div style={{ width: getPageWidth() === `${labelWidth + 10}mm` ? 'auto' : getPageWidth(), padding: '5mm', boxSizing: 'border-box' }}>
            <style>{`
               @page { size: ${paperSize === 'ROLL' ? 'auto' : paperSize} portrait; margin: 0; }
               .print-label { page-break-inside: avoid; border: 1px dashed #ccc; overflow: hidden; position: relative; background: white; color: black; }
               * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            `}</style>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm', alignContent: 'flex-start' }}>
              {data.map((row, rowIndex) => (
                <div 
                  key={rowIndex} 
                  className="print-label"
                  style={{
                    width: `${labelWidth}mm`,
                    height: `${labelHeight}mm`,
                    marginBottom: '2mm'
                  }}
                >
                  {renderLabelContent(row, 1)}
                </div>
              ))}
            </div>
          </div>,
          printPortalTarget
       )}

      <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
};

export default PrintLabelModal;
