
import { InventoryItem } from '../types';
import { IDBService } from './idb';
import { HttpService } from './http';
import { WorkerService } from './worker';

export const HistoryService = {
  /**
   * Lấy dữ liệu Lịch sử (Xuất/Nhập)
   */
  getHistory: async (startDate: Date, endDate: Date, onCachedDataLoaded?: (data: InventoryItem[]) => void): Promise<InventoryItem[]> => {
    // Tạo Key cache dựa trên khoảng thời gian
    const cacheKey = `HISTORY_${startDate.getTime()}_${endDate.getTime()}`;

    // 1. Cố gắng lấy từ Cache trước
    try {
        const cachedHistory = await IDBService.get(cacheKey, IDBService.STORES.HISTORY);
        if (cachedHistory && cachedHistory.length > 0 && onCachedDataLoaded) {
            console.log("Found history in cache, loading immediately...");
            onCachedDataLoaded(cachedHistory);
        }
    } catch (e) {
        console.warn("History Cache miss/error", e);
    }

    try {
      // 2. Fetch dữ liệu mới từ Server
      const params = new URLSearchParams();
      params.append('action', 'getHistory');
      params.append('startDate', startDate.getTime().toString());
      params.append('endDate', endDate.getTime().toString());

      console.log("Fetching history...");
      const response = await HttpService.get(params);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      if (!data.data) return [];

      // 3. Transform dữ liệu (Adapter Pattern via Worker)
      const items = await WorkerService.transformData(data.data);

      // 4. Lưu vào Cache cho lần sau
      if (items.length > 0) {
          await IDBService.put(cacheKey, items, IDBService.STORES.HISTORY);
          console.log(`Updated cache for key: ${cacheKey}`);
      }

      return items;
    } catch (error) {
      console.error("Get History Error:", error);
      throw error;
    }
  }
};
