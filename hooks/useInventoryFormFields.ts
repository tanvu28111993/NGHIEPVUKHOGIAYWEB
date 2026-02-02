import { useMemo } from 'react';
import { useMetaDataQuery } from './useMetaDataQuery';
import { SearchableOption } from '../components/UI/SearchableSelect';
import { Box, Ruler, FileText, Factory, Calendar, MapPin, User, Scale } from 'lucide-react';

export type FieldType = 'text' | 'number' | 'date' | 'search-select';

export interface FormFieldConfig {
  key: string;
  label: string;
  icon: any;
  type: FieldType;
  options?: SearchableOption[];
  disabled?: boolean;
  autoFocus?: boolean;
  isNumeric?: boolean;
}

export interface FieldGroup {
  title: string;
  fields: FormFieldConfig[];
}

export const useInventoryFormFields = (mode: 'create' | 'edit') => {
  const { data: metaData, isLoading } = useMetaDataQuery();

  // --- 1. Transform Metadata to Options ---
  const options = useMemo(() => {
    const transform = (data: string[][] | undefined, hasCode = false): SearchableOption[] => {
        if (!data) return [];
        return data.map(row => ({
            value: row[0],
            label: row[0],
            code: hasCode ? (row[1] || '') : ''
        }));
    };

    return {
        purpose: transform(metaData?.loaiNhap, true),
        packet: transform(metaData?.kienGiay, true),
        paper: transform(metaData?.loaiGiay, true),
        supplier: transform(metaData?.ncc, false),
        manufacturer: transform(metaData?.nsx, false),
    };
  }, [metaData]);

  // --- 2. Define Field Structure ---
  const fieldGroups = useMemo<FieldGroup[]>(() => {
    const groups: FieldGroup[] = [
      {
        title: "Thông tin cơ bản",
        fields: [
          // Edit mode has SKU field
          ...(mode === 'edit' ? [{ 
              key: 'sku', label: 'SKU (Không được sửa)', icon: Box, type: 'text' as FieldType, disabled: true 
          }] : []),
          { key: 'purpose', label: 'Mục đích', icon: FileText, type: 'search-select', options: options.purpose, autoFocus: mode === 'edit' }, 
          { key: 'packetCode', label: 'Mã kiện', icon: Box, type: 'search-select', options: options.packet },
          { key: 'paperType', label: 'Loại giấy', icon: FileText, type: 'search-select', options: options.paper },
          // Create mode puts GSM here (custom render in component), Edit mode puts it in specs
          ...(mode === 'create' ? [{ 
              key: 'gsm', label: 'Định lượng', icon: Scale, type: 'text' as FieldType 
          }] : []),
        ]
      },
      {
        title: "Thông số kỹ thuật",
        fields: [
          // Edit mode standard GSM field
          ...(mode === 'edit' ? [{ 
              key: 'gsm', label: 'Định lượng (GSM)', icon: Scale, type: 'text' as FieldType 
          }] : []),
          { key: 'length', label: 'Dài/Lô (cm)', icon: Ruler, type: 'number', isNumeric: true }, 
          { key: 'width', label: 'Rộng (cm)', icon: Ruler, type: 'number', isNumeric: true },    
          { key: 'weight', label: 'Trọng lượng (kg)', icon: Scale, type: 'number', isNumeric: true }, 
          { key: 'quantity', label: 'Số lượng', icon: Box, type: 'number', isNumeric: true },     
        ]
      },
      {
        title: "Nguồn gốc & Thời gian",
        fields: [
          { key: 'supplier', label: 'Nhà cung cấp', icon: Factory, type: 'search-select', options: options.supplier },
          { key: 'manufacturer', label: 'Nhà sản xuất', icon: Factory, type: 'search-select', options: options.manufacturer },
          // Unified date type
          { key: 'importDate', label: 'Ngày nhập', icon: Calendar, type: 'date' },
          { key: 'productionDate', label: 'Ngày sản xuất', icon: Calendar, type: 'date' }, 
        ]
      },
      {
        title: "Quản lý & Vị trí",
        fields: [
          { key: 'location', label: 'Vị trí', icon: MapPin, type: 'text' },
          { key: 'orderCustomer', label: 'Đơn hàng / KH', icon: User, type: 'text' },
          { key: 'materialCode', label: 'Mã vật tư', icon: Box, type: 'text' },
          { key: 'pendingOut', label: 'Chờ xuất', icon: Calendar, type: 'text' },
        ]
      }
    ];
    return groups;
  }, [options, mode]);

  return {
    fieldGroups,
    options,
    isLoading
  };
};