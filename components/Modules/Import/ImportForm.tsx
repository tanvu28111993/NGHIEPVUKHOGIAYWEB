
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InventoryItem } from '../../../types';
import { Button } from '../../UI/Button';
import { Input } from '../../UI/Input';
import { SearchableSelect } from '../../UI/SearchableSelect';
import { Card } from '../../UI/Card';
import { Copy, PlusCircle, RotateCcw, Loader2 } from 'lucide-react';
import { parseVNToNumber, processNumberInput, formatDateTime } from '../../../utils/formatting';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useInventoryFormFields } from '../../../hooks/useInventoryFormFields';
import { inventoryItemSchema, InventoryFormValues } from '../../../utils/validation';

interface ImportFormProps {
  onAddItems: (
      item: Omit<InventoryItem, 'sku'>, 
      copies: number,
      codes: { purposeCode: string; packetCode: string }
  ) => void;
}

const INITIAL_FORM_STATE = {
  purpose: '',
  packetCode: '',
  paperType: '',
  gsm: '',
  supplier: '',
  manufacturer: '',
  importDate: new Date().toLocaleDateString('en-GB'),
  productionDate: new Date().toLocaleDateString('en-GB'),
  length: '',
  width: '',
  weight: '',
  quantity: '1', 
  orderCustomer: '',
  materialCode: '',
  location: '',
  pendingOut: '',
  importer: '',
  lastUpdated: ''
};

export const ImportForm: React.FC<ImportFormProps> = ({ onAddItems }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { fieldGroups, options, isLoading: isMetaLoading } = useInventoryFormFields('create');
  
  const [copies, setCopies] = useState<string>('1');
  const [isEUDR, setIsEUDR] = useState(false);
  const [isFSC, setIsFSC] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { 
    control, 
    handleSubmit, 
    reset, 
    setValue,
    formState: { errors } 
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: INITIAL_FORM_STATE
  });

  // --- Auto-Calculate Weight Logic ---
  const watchedValues = useWatch({
      control,
      name: ['gsm', 'length', 'width', 'quantity', 'weight']
  });
  const [gsm, length, width, quantity, weight] = watchedValues;

  // Calculate specific codes based on selection
  const selectedPaperType = useWatch({ control, name: 'paperType' });
  const selectedPaperCode = useMemo(() => {
     const selected = options.paper.find(opt => opt.value === selectedPaperType);
     return selected?.code || '';
  }, [selectedPaperType, options.paper]);

  // Effect to calculate weight if empty
  useEffect(() => {
      // Only calculate if weight is empty (user hasn't manually entered it)
      if (!weight) {
          const gsmVal = parseVNToNumber(gsm);
          const lenVal = parseVNToNumber(length);
          const widVal = parseVNToNumber(width);
          const qtyVal = parseVNToNumber(quantity);

          if (gsmVal > 0 && lenVal > 0 && widVal > 0 && qtyVal > 0) {
              // Formula: (GSM * L * W * Q) / 10,000,000 (Adjust constant as per logic)
              // Assuming GSM is grams/m2, Length cm, Width cm. 
              // Weight (kg) = (gsm * (L/100) * (W/100) * Q) / 1000 = (gsm * L * W * Q) / 10,000,000
              let calculatedWeight = (gsmVal * lenVal * widVal * qtyVal) / 10000000;
              calculatedWeight = Math.round(calculatedWeight * 100) / 100;
              // Don't set value directly as string with format to allow user override seamlessly
              // But here we need to display it.
              // Let's NOT auto-fill the input to avoid interfering with user typing.
              // We will just calculate it on submit if empty.
          }
      }
  }, [gsm, length, width, quantity, weight]);

  const handleDateChange = (onChange: (val: string) => void, value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    onChange(v);
  };

  const onSubmit = (data: InventoryFormValues) => {
    let calculatedWeight = parseVNToNumber(data.weight);
    
    // Auto-calculate if weight is 0 or empty
    if (calculatedWeight === 0) {
        const gsmVal = parseVNToNumber(data.gsm);
        const lenVal = parseVNToNumber(data.length);
        const widVal = parseVNToNumber(data.width);
        const qtyVal = parseVNToNumber(data.quantity);

        if (gsmVal > 0 && lenVal > 0 && widVal > 0 && qtyVal > 0) {
            calculatedWeight = (gsmVal * lenVal * widVal * qtyVal) / 10000000;
            calculatedWeight = Math.round(calculatedWeight * 100) / 100;
        }
    }

    let finalGsm = selectedPaperCode && data.gsm 
        ? `${selectedPaperCode}/${data.gsm}` 
        : data.gsm;

    if (data.gsm) { 
        if (isEUDR) finalGsm += '_EUDR';
        if (isFSC) finalGsm += '_FSC';
    }

    const selectedPurposeCode = options.purpose.find(o => o.value === data.purpose)?.code || '';
    const selectedPacketCode = options.packet.find(o => o.value === data.packetCode)?.code || '';

    const itemData: Omit<InventoryItem, 'sku'> = {
      ...data,
      gsm: finalGsm, 
      length: parseVNToNumber(data.length),
      width: parseVNToNumber(data.width),
      weight: calculatedWeight,
      quantity: parseVNToNumber(data.quantity),
      importer: user?.username || 'Unknown',
      lastUpdated: formatDateTime(new Date())
    } as any;

    const numCopies = Math.max(1, parseInt(copies) || 1);
    
    onAddItems(itemData, numCopies, {
        purposeCode: selectedPurposeCode,
        packetCode: selectedPacketCode
    });
  };

  const handleReset = () => {
      reset(INITIAL_FORM_STATE);
      setCopies('1');
      setIsEUDR(false);
      setIsFSC(false);
      if (inputRefs.current[0]) inputRefs.current[0]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (['Enter', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
          e.preventDefault(); 
          const next = inputRefs.current[index + 1];
          if (next) {
              next.focus();
              if (next instanceof HTMLInputElement) next.select();
          } else if (e.key === 'Enter') {
              handleSubmit(onSubmit)(e as any);
          }
      } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
          e.preventDefault();
          const prev = inputRefs.current[index - 1];
          if (prev) {
              prev.focus();
              if (prev instanceof HTMLInputElement) prev.select();
          }
      }
  };

  let inputIndex = 0;

  return (
    <Card className="h-full flex flex-col bg-slate-900 border-r border-gray-800 rounded-none md:rounded-l-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-brand-red" />
          KHAI BÁO
        </h2>
        <div className="flex gap-3">
            {isMetaLoading && <span className="text-xs text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Data</span>}
            <button onClick={handleReset} className="text-xs text-gray-500 hover:text-white flex items-center gap-1" title="Làm mới form">
                <RotateCcw className="w-3 h-3" /> Reset
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
        <form id="import-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {fieldGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{group.title}</h3>
              <div className="grid grid-cols-1 gap-3">
                {group.fields.map((field) => {
                  const currentIndex = inputIndex++;
                  const hasError = !!errors[field.key as keyof InventoryFormValues];
                  
                  // Custom rendering for GSM to include checkboxes
                  if (field.key === 'gsm') {
                      let prefixText = selectedPaperCode ? `${selectedPaperCode}/` : '';
                      return (
                        <div key={field.key}>
                            <label className={`text-[10px] mb-0.5 block flex justify-between ${hasError ? 'text-red-500' : 'text-gray-400'}`}>
                                {field.label}
                                <span className="text-[9px] text-gray-500 italic">Tùy chọn chứng chỉ</span>
                            </label>
                            <div className="flex gap-1.5 items-stretch">
                                <div className="flex-1">
                                    <Controller
                                        name="gsm"
                                        control={control}
                                        render={({ field: { onChange, value, ref } }) => {
                                            const handleRef = (e: HTMLInputElement | null) => {
                                                ref(e);
                                                inputRefs.current[currentIndex] = e;
                                            };
                                            return (
                                                <Input
                                                    ref={handleRef}
                                                    onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                                                    icon={field.icon}
                                                    value={value as string}
                                                    onChange={onChange}
                                                    className={`h-8 text-sm ${hasError ? '!border-red-500' : ''}`}
                                                    placeholder="..."
                                                    prefixText={prefixText}
                                                />
                                            );
                                        }}
                                    />
                                </div>
                                <button type="button" onClick={() => setIsEUDR(!isEUDR)} className={`px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center min-w-[40px] ${isEUDR ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-600 text-gray-500'}`}>EUDR</button>
                                <button type="button" onClick={() => setIsFSC(!isFSC)} className={`px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center min-w-[40px] ${isFSC ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-600 text-gray-500'}`}>FSC</button>
                            </div>
                            {hasError && <p className="text-[10px] text-red-500">{errors.gsm?.message}</p>}
                        </div>
                      );
                  }

                  return (
                    <div key={field.key}>
                      <label className={`text-[10px] mb-0.5 block ${hasError ? 'text-red-500' : 'text-gray-400'}`}>{field.label}</label>
                      <Controller
                        name={field.key as keyof InventoryFormValues}
                        control={control}
                        render={({ field: { onChange, value, ref } }) => {
                            const handleRef = (e: HTMLInputElement | null) => {
                                ref(e);
                                inputRefs.current[currentIndex] = e;
                            };

                            if (field.type === 'search-select') {
                                return (
                                    <SearchableSelect
                                        ref={handleRef}
                                        options={field.options || []}
                                        value={value as string}
                                        onChange={onChange}
                                        placeholder={`-- Chọn ${field.label} --`}
                                        containerClassName="h-8"
                                        className={`h-8 py-0 text-sm ${hasError ? 'border-red-500' : ''}`}
                                        onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                                    />
                                );
                            }

                            return (
                                <Input
                                    ref={handleRef}
                                    onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                                    icon={field.icon}
                                    value={value as string}
                                    onChange={(e) => {
                                        if (field.type === 'date') {
                                            handleDateChange(onChange, e.target.value);
                                        } else if (field.isNumeric) {
                                            onChange(processNumberInput(e.target.value));
                                        } else {
                                            onChange(e.target.value);
                                        }
                                    }}
                                    className={`h-8 text-sm ${hasError ? '!border-red-500' : ''}`}
                                    placeholder={field.key === 'weight' ? "Trống = Tự tính" : (field.type === 'date' ? "dd/mm/yyyy" : "...")}
                                    maxLength={field.type === 'date' ? 10 : undefined}
                                />
                            );
                        }}
                      />
                      {hasError && <p className="text-[10px] text-red-500">{errors[field.key as keyof InventoryFormValues]?.message}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </form>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-end gap-3">
            <div className="w-1/3">
                 <label className="text-[10px] font-bold text-orange-500 mb-1 block flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Bản sao
                 </label>
                 <Input 
                    ref={el => { inputRefs.current[inputIndex] = el }}
                    type="number"
                    min="1"
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                    className="font-bold text-2xl text-orange-500 text-center h-10 border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
                 />
            </div>
            <div className="w-2/3">
                <Button 
                    type="submit" 
                    form="import-form" 
                    fullWidth 
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 shadow-lg shadow-orange-900/20"
                >
                    KHAI BÁO
                </Button>
            </div>
        </div>
      </div>
    </Card>
  );
};
