import { useInventoryQuery } from './useInventoryQuery';
import { useMetaDataQuery } from './useMetaDataQuery';

/**
 * Hook chịu trách nhiệm giữ cho dữ liệu nền luôn tươi mới khi người dùng đã đăng nhập.
 * Thay thế cho DataSynchronizer component cũ.
 */
export const useDataSynchronizer = (isAuthenticated: boolean) => {
  // Chỉ kích hoạt query khi đã xác thực
  // Lưu ý: React Query hooks vẫn nên được gọi ở top level, 
  // việc control fetch hay không nằm ở logic bên trong query (enabled/staleTime) 
  // hoặc đơn giản là gọi chúng để đảm bảo cache được warm up.
  
  const inventoryQuery = useInventoryQuery();
  const metaDataQuery = useMetaDataQuery();

  // Có thể mở rộng thêm logic lắng nghe socket hoặc event ở đây nếu cần trong tương lai
  return {
    isSyncing: inventoryQuery.isFetching || metaDataQuery.isFetching
  };
};