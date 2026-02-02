import { InventoryItem } from './inventory';
import { ColumnConfig } from './ui';

export interface WorkerFilterConfig {
  searchTerm: string;
  searchColumn: string;
  showOddLots: boolean;
  rangeFilters?: {
    widthMin: string;
    widthMax: string;
    lengthMin: string;
    lengthMax: string;
  };
}

export interface WorkerSortConfig {
  key: keyof InventoryItem | null;
  direction: 'asc' | 'desc';
}

// Discriminated Unions cho các hành động gửi ĐẾN Worker
export type WorkerAction =
  | { action: 'TRANSFORM'; rawData: any[][] }
  | { action: 'MERGE_DATA'; currentData: InventoryItem[]; newItems: InventoryItem[] }
  | { action: 'SET_DATA'; inventory: InventoryItem[] }
  | { action: 'FILTER_SORT'; filterConfig: WorkerFilterConfig; sortConfig: WorkerSortConfig }
  | { action: 'EXPORT_CSV'; columns: ColumnConfig<InventoryItem>[]; fileName: string };

// Discriminated Unions cho các kết quả trả về TỪ Worker
export type WorkerResponse =
  | { action: 'TRANSFORM_RESULT'; result?: InventoryItem[]; resultBuffer?: ArrayBuffer; error?: string }
  | { action: 'MERGE_RESULT'; result?: InventoryItem[]; resultBuffer?: ArrayBuffer; error?: string }
  | { action: 'FILTER_RESULT'; result?: InventoryItem[]; resultBuffer?: ArrayBuffer; totalWeight: number }
  | { action: 'EXPORT_RESULT'; blob?: Blob; fileName: string; error?: string };