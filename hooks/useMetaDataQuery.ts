
import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../services/inventory';

export interface MetaData {
  loaiNhap: string[][]; // [Label, Code]
  kienGiay: string[][]; // [Label, Code]
  loaiGiay: string[][]; // [Label, Code]
  ncc: string[][];      // [Label]
  nsx: string[][];      // [Label]
}

export const useMetaDataQuery = () => {
  return useQuery<MetaData>({
    queryKey: ['metadata'],
    queryFn: () => InventoryService.fetchMetaData(),
    // Dữ liệu danh mục (NCC, NSX...) coi là tĩnh trong suốt phiên làm việc
    // Chỉ cập nhật khi đăng nhập lại (được kích hoạt ở LoginScreen)
    staleTime: Infinity, 
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ cache 24h
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
