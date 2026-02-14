
// Cấu hình API
// Ưu tiên sử dụng biến môi trường VITE_API_URL.
// Đảm bảo bạn đã thêm Environment Variable "VITE_API_URL" trong phần Settings của Vercel nếu muốn dùng URL khác mặc định.
export const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbwndvg64fdQe2gUqm4c-KZdWR-KfstIcpi0Y3QY0P6mKHCn0VtF_CpjJB_WA2Rye6uYgQ/exec';

// Cấu hình UI
export const FULL_WIDTH_MENUS = ['INVENTORY', 'HISTORY', 'IMPORT', 'EXPORT', 'RE_IMPORT'];

export const UI_CONFIG = {
  TABLE_ROW_HEIGHT: 36,
  SIDEBAR_WIDTH_COLLAPSED: 80, // w-20 equivalent
  SIDEBAR_WIDTH_EXPANDED: 256, // w-64 equivalent
};

// Cấu hình React Query Keys
export const QUERY_KEYS = {
  INVENTORY: ['inventory'],
};

// Cấu hình IndexedDB
export const DB_CONFIG = {
  NAME: 'KhoGiayDB',
  VERSION: 3,
  STORES: {
    INVENTORY: 'inventoryStore',
    HISTORY: 'historyStore',
    QUEUE: 'commandQueueStore',
  }
};

// Cấu hình Background Sync
export const SYNC_CONFIG = {
  TAG: 'sync-queue',
  BROADCAST_CHANNEL: 'command_sync_channel',
  QUEUE_STORAGE_KEY: 'pendingCommands',
};

// Cấu hình Cache
export const CACHE_CONFIG = {
  STALE_TIME: 1000 * 60 * 5, // 5 phút
  GC_TIME: 1000 * 60 * 60 * 24, // 24 giờ
};
