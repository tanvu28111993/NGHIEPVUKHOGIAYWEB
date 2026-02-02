import { IDBService } from './idb';
import { HttpService } from './http';
import { SYNC_CONFIG } from '../utils/constants';

export const SyncService = {
  /**
   * Lấy danh sách lệnh đang chờ từ IDB
   */
  getQueue: async () => {
    return await IDBService.get(SYNC_CONFIG.QUEUE_STORAGE_KEY, IDBService.STORES.QUEUE) || [];
  },

  /**
   * Thêm lệnh vào hàng đợi
   */
  addToQueue: async (command: any) => {
    const currentQueue = await SyncService.getQueue();
    const newQueue = [...currentQueue, command];
    await IDBService.put(SYNC_CONFIG.QUEUE_STORAGE_KEY, newQueue, IDBService.STORES.QUEUE);
    return newQueue;
  },

  /**
   * Xóa hàng đợi sau khi sync thành công
   */
  clearQueue: async () => {
    await IDBService.put(SYNC_CONFIG.QUEUE_STORAGE_KEY, [], IDBService.STORES.QUEUE);
  },

  /**
   * Xử lý gửi batch lên Server
   * Hàm này được gọi bởi cả Service Worker (Background) và UI (Foreground)
   */
  processQueue: async () => {
    try {
      const queue = await SyncService.getQueue();
      
      if (!queue || queue.length === 0) {
        return { success: true, count: 0 };
      }

      console.log(`[SyncService] Processing ${queue.length} commands...`);

      // Gửi Batch Request
      const response = await HttpService.post({
        action: 'batch',
        commands: queue
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Batch sync failed");
      }

      // Sync thành công -> Xóa queue
      await SyncService.clearQueue();

      // Thông báo cho UI cập nhật trạng thái
      const channel = new BroadcastChannel(SYNC_CONFIG.BROADCAST_CHANNEL);
      channel.postMessage({ type: 'SYNC_COMPLETE', count: queue.length });
      channel.close();

      return { success: true, count: queue.length };

    } catch (error) {
      console.error("[SyncService] Sync failed:", error);
      throw error; // Throw để SW biết là job failed và schedule retry
    }
  },

  // Constants (Mapping từ config chung để giữ tương thích ngược nếu cần)
  CONSTANTS: {
    SYNC_TAG: SYNC_CONFIG.TAG,
    BROADCAST_CHANNEL: SYNC_CONFIG.BROADCAST_CHANNEL
  }
};