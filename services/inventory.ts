
import { InventoryItem } from '../types';
import { HttpService } from './http';
import { WorkerService } from './worker';

export const InventoryService = {
  /**
   * Fetch Inventory Data from Server
   * Supports Delta Sync if lastUpdated timestamp is provided.
   */
  fetchInventory: async (lastUpdated: number = 0): Promise<{ items: InventoryItem[], serverTimestamp: number } | null> => {
    try {
      console.log(`[Service] Fetching inventory changes since: ${new Date(lastUpdated).toLocaleString()}`);

      const params = new URLSearchParams();
      params.append('action', 'getInventory');
      params.append('lastUpdated', lastUpdated.toString());
      
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Nếu không có dữ liệu mới (data.data rỗng hoặc null)
      if (!data.data || data.data.length === 0) {
        return null; 
      }

      console.log(`[Service] Received ${data.data.length} updated rows. Processing via Worker...`);

      // Transform dữ liệu thô sang Object (sử dụng Worker)
      const newItems = await WorkerService.transformData(data.data);

      return {
          items: newItems,
          serverTimestamp: data.serverTimestamp || Date.now()
      };

    } catch (error) {
      console.error("Inventory Fetch Error:", error);
      throw error; 
    }
  },

  /**
   * Fetch Meta Data (Danh mục) from Server
   */
  fetchMetaData: async () => {
    try {
      const params = new URLSearchParams();
      params.append('action', 'getMetaData');
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch metadata');
      }
    } catch (error) {
      console.error("MetaData Fetch Error:", error);
      throw error;
    }
  },

  /**
   * Fetch Export Requests from Sheet SKUX
   * Backend trả về mảng: [SKU, Quantity]
   */
  fetchExportRequests: async (): Promise<{ sku: string, quantity: number }[]> => {
    try {
        const params = new URLSearchParams();
        params.append('action', 'getExportRequests');
        
        const response = await HttpService.get(params);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            // Map từ mảng sang object
            return data.data.map((row: any[]) => ({
                sku: row[0],
                quantity: Number(row[1]) || 0
            }));
        } else {
            throw new Error(data.message || 'Failed to fetch export requests');
        }
    } catch (error) {
        console.error("Export Requests Fetch Error:", error);
        throw error;
    }
  },

  /**
   * Fetch Re-Import Requests from Sheet SKUN
   * Backend trả về mảng: [SKU, Quantity, Weight]
   */
  fetchReImportRequests: async (): Promise<{ sku: string, quantity: number, weight: number }[]> => {
    try {
        const params = new URLSearchParams();
        params.append('action', 'getReImportRequests');
        
        const response = await HttpService.get(params);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            // Map từ mảng sang object
            return data.data.map((row: any[]) => ({
                sku: row[0],
                quantity: Number(row[1]) || 0,
                weight: Number(row[2]) || 0
            }));
        } else {
            throw new Error(data.message || 'Failed to fetch re-import requests');
        }
    } catch (error) {
        console.error("Re-Import Requests Fetch Error:", error);
        throw error;
    }
  },

  /**
   * Fetch Recent Exports (Last 3 Months) for Re-Import Validation
   * Backend trả về mảng các dòng tồn kho đầy đủ. Dùng Worker để transform.
   */
  fetchRecentExports: async (): Promise<InventoryItem[]> => {
    try {
        const params = new URLSearchParams();
        params.append('action', 'getRecentExports');
        
        const response = await HttpService.get(params);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            // Backend trả về mảng mảng (Array of Arrays) giống cấu trúc Tồn kho
            // Tận dụng Worker có sẵn để transform
            return await WorkerService.transformData(data.data);
        } else {
            throw new Error(data.message || 'Failed to fetch recent exports');
        }
    } catch (error) {
        console.error("Recent Exports Fetch Error:", error);
        throw error;
    }
  }
};
