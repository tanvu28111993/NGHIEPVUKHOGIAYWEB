import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { InventoryService } from '../services/inventory';
import { WorkerService } from '../services/worker';
import { InventoryItem } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useCallback } from 'react';
import { QUERY_KEYS } from '../utils/constants';

// Export hàm fetch logic để dùng cho prefetchQuery
export const fetchInventoryData = async (queryClient: QueryClient): Promise<InventoryItem[]> => {
    const currentData = queryClient.getQueryData<InventoryItem[]>(QUERY_KEYS.INVENTORY) || [];
    
    let lastUpdated = 0;
    if (currentData.length > 0) {
        currentData.forEach(item => {
            const ts = new Date(item.lastUpdated).getTime();
            if (!isNaN(ts) && ts > lastUpdated) lastUpdated = ts;
        });
    }

    const result = await InventoryService.fetchInventory(lastUpdated);

    if (!result) {
        return currentData;
    }

    const { items: newItems } = result;
    
    if (currentData.length === 0) return newItems;

    // Offload merge logic to Web Worker to prevent UI blocking
    console.log(`[Query] Merging ${newItems.length} items with ${currentData.length} existing items via Worker...`);
    return await WorkerService.mergeData(currentData, newItems);
};

export const useInventoryQuery = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const query = useQuery<InventoryItem[]>({
    queryKey: QUERY_KEYS.INVENTORY,
    queryFn: () => fetchInventoryData(queryClient),
    staleTime: 1000 * 60 * 5, 
  });

  const refresh = useCallback(async () => {
      const oldData = query.data;
      const res = await query.refetch();
      if (res.isSuccess) {
          if (res.data === oldData) {
              addToast("Dữ liệu đã mới nhất", "info");
          } else {
              addToast("Cập nhật dữ liệu thành công", "success");
          }
      } else if (res.isError) {
          addToast("Lỗi kết nối máy chủ", "error");
      }
  }, [query, addToast]);

  return {
    inventory: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh
  };
};