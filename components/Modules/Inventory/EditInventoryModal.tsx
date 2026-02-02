
import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InventoryItem } from '../../../types';
import { Card } from '../../UI/Card';
import { Button } from '../../UI/Button';
import { Input } from '../../UI/Input';
import { SearchableSelect } from '../../UI/SearchableSelect';
import { X, Save } from 'lucide-react';
import { formatNumberToVN, parseVNToNumber, processNumberInput } from '../../../utils/formatting';
import { useInventoryFormFields } from '../../../hooks/useInventoryFormFields';
import { inventoryItemSchema, InventoryFormValues } from '../../../utils/validation';

interface EditInventoryModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({ item, isOpen, onClose, onSave }) => {
  const { fieldGroups } = useInventoryFormFields('edit');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { errors, isSubmitting } 
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: { ...item } as any // Type cast safe here due to formatting logic below
  });

  useEffect(() => {
    if (item && isOpen) {
        reset({
          ...item,
          length: formatNumberToVN(item.length),
          width: formatNumberToVN(item.width),
          weight: formatNumberToVN(item.weight),
          quantity: formatNumberToVN(item.quantity),
        });
    }
  }, [item, isOpen, reset]);

  // --- Global Keyboard Event Handler (Escape) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // --- Input Navigation Logic ---
  const handleInputKeyDown = (e: React.KeyboardEvent<any>, currentIndex: number) => {
      const isNextKey = e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Enter';
      const isPrevKey = e.key === 'ArrowLeft' || e.key === 'ArrowUp';

      if (e.key === 'Enter' && e.currentTarget.type === 'submit') return;

      if (isNextKey) {
          if (e.key === 'Enter') {
             // Let component handle Enter selection first
          }
          e.preventDefault();
          const nextInput = inputRefs.current[currentIndex + 1];
          if (nextInput) {
              nextInput.focus();
              if (nextInput instanceof HTMLInputElement) nextInput.select(); 
          } 
      } else if (isPrevKey) {
          e.preventDefault();
          const prevInput = inputRefs.current[currentIndex - 1];
          if (prevInput) {
              prevInput.focus();
              if (prevInput instanceof HTMLInputElement) prevInput.select();
          }
      }
  };

  const onSubmit = (data: InventoryFormValues) => {
    const submissionData = {
        ...item, // Keep original non-form fields (like transactionType)
        ...data,
        length: parseVNToNumber(data.length),
        width: parseVNToNumber(data.width),
        weight: parseVNToNumber(data.weight),
        quantity: parseVNToNumber(data.quantity),
    } as InventoryItem;

    onSave(submissionData);
  };

  if (!isOpen) return null;

  let globalInputIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-900 border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-white">Chỉnh sửa thông tin cuộn giấy</h2>
            <p className="text-sm text-gray-400">Cập nhật thông tin chi tiết cho SKU: <span className="text-brand-red font-mono font-bold">{item.sku}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Đóng (Esc)">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="edit-inventory-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {fieldGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider border-b border-gray-800 pb-1 mb-3">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.fields.map((field) => {
                    const currentInputIdx = globalInputIndex++;
                    const hasError = !!errors[field.key as keyof InventoryFormValues];

                    return (
                      <div key={field.key} className="space-y-1">
                        <label className={`text-xs ml-1 ${hasError ? 'text-red-500' : 'text-gray-400'}`}>
                            {field.label} {hasError && '*'}
                        </label>
                        
                        <Controller
                            name={field.key as keyof InventoryFormValues}
                            control={control}
                            render={({ field: { onChange, value, ref } }) => {
                                // Merge internal ref with navigation ref
                                const handleRef = (e: HTMLInputElement | null) => {
                                    ref(e);
                                    inputRefs.current[currentInputIdx] = e;
                                };

                                if (field.type === 'search-select') {
                                    return (
                                        <SearchableSelect 
                                            ref={handleRef}
                                            options={field.options || []}
                                            value={value as string}
                                            onChange={onChange}
                                            placeholder={`-- Chọn --`}
                                            containerClassName="w-full"
                                            className={`text-sm ${field.disabled ? 'opacity-60 cursor-not-allowed bg-slate-950' : ''} ${hasError ? 'border-red-500' : ''}`}
                                            onKeyDown={(e) => handleInputKeyDown(e, currentInputIdx)}
                                            autoFocus={field.autoFocus}
                                        />
                                    );
                                }

                                return (
                                    <Input
                                        ref={handleRef}
                                        onKeyDown={(e) => handleInputKeyDown(e, currentInputIdx)}
                                        icon={field.icon}
                                        value={value as string}
                                        onChange={(e) => {
                                            if (field.isNumeric) {
                                                onChange(processNumberInput(e.target.value));
                                            } else {
                                                onChange(e.target.value);
                                            }
                                        }}
                                        disabled={field.disabled}
                                        className={`${field.disabled ? 'opacity-60 cursor-not-allowed bg-slate-950' : ''} ${hasError ? '!border-red-500 !ring-red-500/30' : ''}`}
                                    />
                                );
                            }}
                        />
                        {hasError && (
                            <p className="text-[10px] text-red-500 ml-1 truncate">
                                {errors[field.key as keyof InventoryFormValues]?.message}
                            </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-blue-900/10 rounded border border-blue-900/30 text-xs text-blue-300 text-center">
              Cập nhật lần cuối bởi <strong>{item.importer}</strong> vào lúc {item.lastUpdated}
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 bg-slate-950 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ (Esc)
          </Button>
          <Button type="submit" form="edit-inventory-form" isLoading={isSubmitting} className="px-6 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Lưu thay đổi (Enter)
          </Button>
        </div>
      </Card>
    </div>
  );
};
