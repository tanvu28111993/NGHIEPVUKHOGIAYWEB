import { ExpectedScheduleItem } from '../types';
import { HttpService } from './http';

export const ExpectedScheduleService = {
  fetchExpectedSchedule: async (): Promise<ExpectedScheduleItem[]> => {
    try {
      const params = new URLSearchParams();
      params.append('action', 'getExpectedSchedule');
      
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // Chỉ lấy các bản ghi có Loại Vật tư là "GIẤY"
        return data.data.filter((item: ExpectedScheduleItem) => 
          item.materialType && item.materialType.trim().toUpperCase() === 'GIẤY'
        );
      } else {
        throw new Error(data.message || data.error || 'Failed to fetch expected schedule');
      }
    } catch (error) {
      console.error("Expected Schedule Fetch Error:", error);
      throw error;
    }
  }
};
