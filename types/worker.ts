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
export type WorkerAction<T = InventoryItem> =
  | { action: 'TRANSFORM'; rawData: any[][] }
  | { action: 'MERGE_DATA'; currentData: T[]; newItems: T[] }
  | { action: 'SET_DATA'; inventory?: T[]; data?: T[] }
  | { action: 'FILTER_SORT'; filterConfig: any; sortConfig: any }
  | { action: 'EXPORT_CSV'; columns: ColumnConfig<T>[]; fileName: string };

// Discriminated Unions cho các kết quả trả về TỪ Worker
export type WorkerResponse<T = InventoryItem> =
  | { action: 'TRANSFORM_RESULT'; result?: T[]; resultBuffer?: ArrayBuffer; error?: string }
  | { action: 'MERGE_RESULT'; result?: T[]; resultBuffer?: ArrayBuffer; error?: string }
  | { action: 'FILTER_RESULT'; result?: T[]; resultBuffer?: ArrayBuffer; totalWeight: number }
  | { action: 'EXPORT_RESULT'; blob?: Blob; fileName: string; error?: string };
