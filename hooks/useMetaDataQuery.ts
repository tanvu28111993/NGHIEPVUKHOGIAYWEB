
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
    staleTime: 1000 * 60 * 5, // 5 phút
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ cache 24h
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
