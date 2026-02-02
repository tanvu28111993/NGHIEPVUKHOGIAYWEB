
import { useState, useEffect, useCallback } from 'react';
import { HistoryService } from '../services/history';
import { InventoryItem } from '../types';
import { useToast } from '../contexts/ToastContext';

const STORAGE_KEY_HISTORY_FILTER = 'HISTORY_FILTER_CONFIG_V1';

interface StoredFilterConfig {
  start: number;
  end: number;
  year: number;
  months: number[];
}

export const useHistoryLogic = () => {
  const [historyData, setHistoryData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundUpdating, setIsBackgroundUpdating] = useState(false);
  const { addToast } = useToast();

  const [filterConfig, setFilterConfig] = useState<StoredFilterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY_FILTER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.start && parsed.end && parsed.year && Array.isArray(parsed.months)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load history filter", e);
    }
    
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return {
      start: start.getTime(),
      end: end.getTime(),
      year: now.getFullYear(),
      months: [now.getMonth()]
    };
  });

  const fetchHistoryData = useCallback(async (startTs: number, endTs: number) => {
      const start = new Date(startTs);
      const end = new Date(endTs);

      setIsLoading(true);
      setHistoryData([]); 
      
      try {
          console.log(`[History] Fetching from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`);
          
          let hasCache = false;

          const handleCachedData = (cachedData: InventoryItem[]) => {
              setHistoryData(cachedData);
              setIsLoading(false); 
              setIsBackgroundUpdating(true); 
              hasCache = true;
              addToast(`Đã tải ${cachedData.length} dòng từ bộ nhớ đệm`, "info", 2000);
          };

          const freshData = await HistoryService.getHistory(start, end, handleCachedData);
          
          setHistoryData(freshData);
          
          if (hasCache) {
             addToast("Đã cập nhật dữ liệu mới nhất từ máy chủ", "success");
          } else {
             addToast(`Đã tải ${freshData.length} dòng dữ liệu lịch sử`, "success");
          }
      } catch (error) {
          console.error("Failed to load history", error);
          if (historyData.length === 0) {
              addToast("Lỗi tải lịch sử từ Google Sheets", "error");
          }
      } finally {
          setIsLoading(false);
          setIsBackgroundUpdating(false);
      }
  }, [addToast, historyData.length]);

  // Initial Fetch
  useEffect(() => {
    fetchHistoryData(filterConfig.start, filterConfig.end);
  }, []);

  const handleDateFilterChange = useCallback((start: Date, end: Date, year: number, months: number[]) => {
    const newConfig: StoredFilterConfig = {
      start: start.getTime(),
      end: end.getTime(),
      year: year,
      months: months
    };
    setFilterConfig(newConfig);
    localStorage.setItem(STORAGE_KEY_HISTORY_FILTER, JSON.stringify(newConfig));
    fetchHistoryData(newConfig.start, newConfig.end);
  }, [fetchHistoryData]);

  const handleRefresh = useCallback(() => {
    fetchHistoryData(filterConfig.start, filterConfig.end);
  }, [fetchHistoryData, filterConfig]);

  return {
    historyData,
    isLoading,
    isBackgroundUpdating,
    filterConfig,
    handleDateFilterChange,
    handleRefresh
  };
};
