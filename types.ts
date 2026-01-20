
export type PageId = 
  | 'module/tongquan'
  | 'vitri'
  | 'tonkho'
  | 'nhapkho'
  | 'nhaplai'
  | 'xuatkho'
  | 'lichsu';

export interface NavItemConfig {
  id: PageId;
  label: string;
  icon: string;
}

export interface UserInfo {
  email: string;
  name?: string;
}

export type InventoryData = any[][]; // 2D array from Spreadsheet

export interface OptionItem {
  label: string;
  code: string;
}

export interface ConfigData {
  MUC_DICH: OptionItem[];
  KIEN_GIAY: OptionItem[];
  NHA_CC: OptionItem[];
  NHA_SX: OptionItem[];
  LOAI_GIAY: OptionItem[];
}