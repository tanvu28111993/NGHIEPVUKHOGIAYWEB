
import React, { useRef, useMemo, useEffect } from 'react';
import { useLabelStore } from '../../../stores/labelStore';
import { DraggableElement } from './DraggableElement';
import { AVAILABLE_FIELDS, PAPER_SIZES } from '../../../utils/labelConstants';
import { Upload, Download, Type, Grid, FileImage, RotateCcw, Check, Plus, FileText, Save, FolderOpen, Trash2, Settings2 } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { Input } from '../../UI/Input';

export const LabelDesigner: React.FC = () => {
  const { 
      template, addElement, setBackgroundImage, updateElement, selectedElementId, setSelectedElement,
      resetTemplate, setTemplate, removeElement, 
      savedTemplates, saveTemplateAs, deleteSavedTemplate 
  } = useLabelStore();
  
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // Requirement 1: Luôn bỏ chọn khi mới vào màn hình thiết kế
  useEffect(() => {
      setSelectedElement(null);
  }, [setSelectedElement]);

  // Scale factor: 1mm = 2.5px (approx for screen display)
  const SCALE = 2.5; 
  const displayWidth = template.width * SCALE;
  const displayHeight = template.height * SCALE;

  // Identify used fields to style them differently
  const usedFields = useMemo(() => {
      const fields = new Set<string>();
      template.elements.forEach(el => fields.add(el.field));
      return fields;
  }, [template.elements]);

  const handleToggleField = (fieldKey: string, label: string) => {
    const existingElement = template.elements.find(el => el.field === fieldKey);
    if (existingElement) {
        removeElement(existingElement.id);
    } else {
        addElement({
          id: `el_${Date.now()}`,
          field: fieldKey as any,
          label: label,
          x: 10, y: 10,
          width: fieldKey.includes('qr') ? 50 : 100,
          height: fieldKey.includes('qr') ? 50 : 15,
          fontSize: 20, isBold: false, isVisible: true,
        });
    }
  };

  const handleAddCustomText = () => {
      addElement({
          id: `el_custom_${Date.now()}`,
          field: 'custom_text',
          label: 'Văn bản tùy chỉnh',
          x: 50, y: 50, width: 120, height: 20,
          fontSize: 20, isBold: false, isVisible: true
      });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBackgroundImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = () => {
      if (!template.name.trim()) {
          addToast("Vui lòng nhập tên mẫu", "warning");
          return;
      }
      saveTemplateAs(template.name);
      addToast(`Đã lưu mẫu "${template.name}"`, "success");
  };

  const handleLoadSavedTemplate = (name: string) => {
      const t = savedTemplates.find(x => x.name === name);
      if (t) {
          setTemplate(t);
          addToast(`Đã tải mẫu "${name}"`, "info");
      }
  };

  const handleDeleteSavedTemplate = (name: string) => {
      if (confirm(`Bạn có chắc muốn xóa mẫu "${name}" không?`)) {
          deleteSavedTemplate(name);
          addToast("Đã xóa mẫu", "info");
      }
  };

  const handleExportTemplate = () => {
      const json = JSON.stringify(template, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${template.name.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Đã tải xuống mẫu thiết kế", "success");
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              try {
                  const parsed = JSON.parse(ev.target?.result as string);
                  if (parsed.elements && parsed.width && parsed.height) {
                      setTemplate(parsed);
                      addToast("Đã tải mẫu thiết kế thành công", "success");
                  } else {
                      throw new Error("Invalid format");
                  }
              } catch (err) {
                  addToast("File mẫu không hợp lệ", "error");
              }
          };
          reader.readAsText(file);
      }
  };

  const applyPreset = (sizeKey: string) => {
      const size = PAPER_SIZES[sizeKey as keyof typeof PAPER_SIZES];
      if (size) {
          setTemplate({
              ...template,
              width: size.width,
              height: size.height,
              name: `Tem Khổ ${sizeKey}`
          });
          addToast(`Đã áp dụng khổ giấy ${sizeKey}`, "info");
      }
  };

  const selectedElement = template.elements.find(el => el.id === selectedElementId);

  return (
    <div className="flex flex-col h-full bg-slate-900">
        {/* Toolbar Top */}
        <div className="p-3 border-b border-gray-700 bg-slate-950 flex gap-4 items-center flex-wrap shadow-lg z-10">
            {/* Paper Presets */}
            <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
                <select 
                    className="bg-slate-800 text-white text-sm border border-gray-600 rounded px-3 py-2 focus:border-brand-red focus:outline-none hover:bg-slate-700 transition-colors cursor-pointer"
                    onChange={(e) => applyPreset(e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>-- Khổ Giấy --</option>
                    <option value="A3">A3 (297x420)</option>
                    <option value="A4">A4 (210x297)</option>
                    <option value="A5">A5 (148x210)</option>
                </select>
            </div>

            {/* Manual Size Inputs */}
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                 <span className="text-xs font-bold text-gray-400 uppercase ml-2 mr-1">Khổ (mm):</span>
                 <Input 
                    type="number" 
                    value={template.width} 
                    onChange={(e) => setTemplate({...template, width: Number(e.target.value)})}
                    className="w-20 h-9 text-center text-lg font-bold text-blue-400 bg-slate-900 border-slate-600 focus:border-blue-500" 
                 />
                 <span className="text-gray-500 font-bold px-1">x</span>
                 <Input 
                    type="number" 
                    value={template.height} 
                    onChange={(e) => setTemplate({...template, height: Number(e.target.value)})}
                    className="w-20 h-9 text-center text-lg font-bold text-blue-400 bg-slate-900 border-slate-600 focus:border-blue-500" 
                 />
             </div>

            <div className="h-8 w-px bg-gray-700 mx-1"></div>

            {/* Template Management */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <Input 
                    value={template.name}
                    onChange={(e) => setTemplate({...template, name: e.target.value})}
                    className="w-40 h-9 text-sm bg-transparent border-none focus:ring-0 placeholder-gray-500"
                    placeholder="Tên mẫu..."
                />
                
                <button 
                    onClick={handleSaveTemplate} 
                    className="h-9 w-9 flex items-center justify-center rounded hover:bg-slate-700 text-gray-400 hover:text-green-500 transition-colors" 
                    title="Lưu mẫu"
                >
                    <Save className="w-5 h-5" />
                </button>
                
                {/* Saved Templates Dropdown */}
                <div className="relative group">
                    <button className="h-9 w-9 flex items-center justify-center rounded hover:bg-slate-700 text-gray-400 hover:text-blue-500 transition-colors">
                        <FolderOpen className="w-5 h-5" />
                    </button>
                    {/* Dropdown Content */}
                    <div className="absolute top-full right-0 mt-2 bg-slate-900 border border-gray-700 p-1 rounded-lg shadow-2xl hidden group-hover:block min-w-[250px] z-50 animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar">
                        <div className="text-[10px] uppercase font-bold text-gray-500 px-3 py-2 border-b border-gray-800">
                            Mẫu đã lưu ({savedTemplates.length})
                        </div>
                        {savedTemplates.length === 0 && (
                            <div className="text-xs text-gray-500 p-4 text-center italic">Chưa có mẫu nào được lưu</div>
                        )}
                        {savedTemplates.map(t => (
                            <div key={t.name} className="flex justify-between items-center p-2 hover:bg-white/5 rounded cursor-pointer group/item" onClick={() => handleLoadSavedTemplate(t.name)}>
                                <span className="text-sm text-gray-300 group-hover/item:text-white truncate max-w-[180px]">{t.name}</span>
                                <Trash2 
                                    className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100" 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSavedTemplate(t.name); }} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1"></div>

            {/* File Actions */}
            <div className="flex gap-2">
                <button 
                    className="h-10 px-3 flex items-center justify-center gap-2 border border-slate-600 rounded bg-slate-800 text-gray-300 hover:text-white hover:border-gray-500 transition-colors" 
                    title="Chọn phôi ảnh" 
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileImage className="w-5 h-5" />
                    <span className="text-sm font-medium hidden xl:inline">Phôi Ảnh</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                <button 
                    className="h-10 w-10 flex items-center justify-center border border-slate-600 rounded bg-slate-800 text-gray-300 hover:text-white hover:border-gray-500 transition-colors" 
                    title="Xuất file JSON" 
                    onClick={handleExportTemplate}
                >
                    <Download className="w-5 h-5" />
                </button>
                
                <button 
                    className="h-10 w-10 flex items-center justify-center border border-slate-600 rounded bg-slate-800 text-gray-300 hover:text-white hover:border-gray-500 transition-colors" 
                    title="Nhập file JSON" 
                    onClick={() => templateInputRef.current?.click()}
                >
                    <Upload className="w-5 h-5" />
                </button>
                <input type="file" ref={templateInputRef} className="hidden" accept=".json" onChange={handleImportTemplate} />

                <div className="w-px h-10 bg-gray-700 mx-1"></div>

                <button 
                    className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors" 
                    title="Reset về mặc định" 
                    onClick={resetTemplate}
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* LEFT SIDEBAR: List Fields */}
            <div className="w-72 bg-slate-900 border-r border-gray-700 overflow-y-auto p-4 custom-scrollbar flex-shrink-0">
                <div className="mb-4">
                     <button 
                        onClick={handleAddCustomText}
                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white flex items-center justify-center gap-2 py-3 transition-colors shadow-sm"
                     >
                        <Plus className="w-5 h-5" /> Thêm Văn Bản Tùy Chỉnh
                     </button>
                </div>

                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 border-t border-gray-800 pt-4">
                    <Grid className="w-5 h-5" /> Trường Dữ Liệu Kho
                </h3>
                <div className="grid grid-cols-1 gap-2 mb-6">
                    {AVAILABLE_FIELDS.map(f => {
                        const isUsed = usedFields.has(f.key);
                        return (
                            <button 
                                key={f.key}
                                onClick={() => handleToggleField(f.key, f.label)}
                                className={`
                                    text-sm p-3 border rounded-lg transition-all text-left truncate flex items-center justify-between group
                                    ${isUsed 
                                        ? 'bg-blue-900/20 border-blue-500 text-blue-300 shadow-sm' 
                                        : 'bg-slate-800 border-gray-700 text-gray-300 hover:bg-slate-700 hover:border-gray-500 hover:text-white'}
                                `}
                            >
                                <span className="truncate font-medium">{f.label}</span>
                                {isUsed ? <Check className="w-5 h-5 text-blue-500" /> : <span className="text-xs text-gray-600 group-hover:text-gray-400">Chọn</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CENTER: Canvas Area */}
            <div className="flex-1 bg-gray-800/50 p-8 overflow-auto flex justify-center items-start relative custom-scrollbar">
                 <div 
                    className="bg-white relative shadow-2xl transition-all origin-top"
                    style={{ 
                        width: `${displayWidth}px`, 
                        height: `${displayHeight}px`,
                        backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                 >
                    <div className="absolute inset-0 pointer-events-none opacity-20" 
                         style={{ 
                             backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)', 
                             backgroundSize: '20px 20px' 
                         }} 
                    />
                    {template.elements.map(el => (
                        <DraggableElement 
                            key={el.id} 
                            element={el} 
                            containerWidth={displayWidth}
                            containerHeight={displayHeight}
                            scale={SCALE}
                        />
                    ))}
                 </div>
            </div>

            {/* RIGHT SIDEBAR: Properties */}
            <div className="w-72 bg-slate-900 border-l border-gray-700 overflow-y-auto p-4 custom-scrollbar flex-shrink-0">
                {selectedElement ? (
                    <div className="animate-fade-in">
                        <h3 className="text-xs font-bold text-brand-red uppercase mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                            <Settings2 className="w-5 h-5" /> Thuộc Tính
                        </h3>
                        
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-gray-700 mb-4">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Đối tượng</span>
                            <div className="text-white font-medium truncate mt-1">{selectedElement.label}</div>
                        </div>

                        <div className="space-y-4">
                            {selectedElement.field === 'custom_text' && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Nội dung văn bản</label>
                                    <Input 
                                        value={selectedElement.label} 
                                        onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                                        className="h-9 text-sm"
                                        placeholder="Nhập nội dung..."
                                    />
                                </div>
                            )}

                            {!selectedElement.field.includes('qr') && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Hậu tố (Suffix)</label>
                                    <Input 
                                        value={selectedElement.suffix || ''} 
                                        onChange={(e) => updateElement(selectedElement.id, { suffix: e.target.value })}
                                        className="h-9 text-sm"
                                        placeholder="Ví dụ: KG, m, ..."
                                    />
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Cỡ chữ (px)</label>
                                    <Input 
                                        type="number"
                                        value={selectedElement.fontSize} 
                                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                                        className="h-9 text-sm text-center"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer bg-slate-800 px-3 py-2 rounded-lg border border-gray-600 w-full justify-center h-9 select-none hover:bg-slate-700 hover:border-gray-500 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedElement.isBold}
                                            onChange={(e) => updateElement(selectedElement.id, { isBold: e.target.checked })}
                                            className="w-4 h-4 accent-brand-red"
                                        />
                                        In Đậm
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">X (mm)</label>
                                    <Input 
                                        type="number"
                                        value={Math.round(selectedElement.x)} 
                                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                                        className="h-8 text-xs text-center"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Y (mm)</label>
                                    <Input 
                                        type="number"
                                        value={Math.round(selectedElement.y)} 
                                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                                        className="h-8 text-xs text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
                        <Type className="w-12 h-12" />
                        <span className="text-xs text-center italic px-4">Chọn một thành phần trên bản thiết kế để chỉnh sửa thuộc tính</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
