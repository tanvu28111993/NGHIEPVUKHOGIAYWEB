export type MenuId = 'OVERVIEW' | 'LOCATIONS' | 'INVENTORY' | 'IMPORT' | 'EXPORT' | 'RE_IMPORT' | 'HISTORY';

export interface MenuItem {
  id: MenuId;
  label: string;
  icon: any; 
}

// ISP: Interface cho cấu hình cột, tách biệt logic hiển thị ra khỏi component Table
export interface ColumnConfig<T> {
  header: string;
  accessor: keyof T;
  width?: number; // Default width
  minWidth?: number;
  
  // OCP: Cho phép định nghĩa cách format dữ liệu mà không sửa code Table
  format?: (value: any) => string | number;
  
  // OCP: Cho phép định nghĩa logic style (màu sắc) dựa trên dữ liệu dòng
  getCellStyle?: (item: T, isOddLot: boolean, isPendingOut: boolean) => string;
  
  // Cột có phải dạng số không (để align phải)
  isNumeric?: boolean;
  
  // Cột cố định (ví dụ sticky)
  isFixed?: boolean;
}