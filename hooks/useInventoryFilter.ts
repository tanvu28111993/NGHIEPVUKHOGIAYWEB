import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { InventoryItem, ColumnConfig } from '../types';
import { WorkerService } from '../services/worker';
import { useToast } from '../contexts/ToastContext';

export interface FilterState {
  searchTerm: string;
  searchColumn: string;
  showOddLots: boolean;
  showPendingOut: boolean;
  showAdvancedFilters: boolean;
  rangeFilters: {
    widthMin: string;
    widthMax: string;
    lengthMin: string;
    lengthMax: string;
  };
}

export const useInventoryFilter = (inventory: InventoryItem[], initialState?: Partial<FilterState>) => {
  const [displayInventory, setDisplayInventory] = useState<InventoryItem[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [isFiltering, startTransition] = useTransition();
  const { addToast } = useToast();

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: initialState?.searchTerm || '',
    searchColumn: initialState?.searchColumn || 'all',
    showOddLots: initialState?.showOddLots || false,
    showPendingOut: initialState?.showPendingOut || false,
    showAdvancedFilters: initialState?.showAdvancedFilters || false,
    rangeFilters: initialState?.rangeFilters || { widthMin: '', widthMax: '', lengthMin: '', lengthMax: '' }
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  const workerRef = useRef<Worker | null>(null);
  const decoderRef = useRef<TextDecoder | null>(null);

  // Initialize Worker using Service Factory
  useEffect(() => {
    try {
      // Use the centralized factory
      workerRef.current = WorkerService.createWorker();
      decoderRef.current = new TextDecoder();

      workerRef.current.onmessage = (e) => {
        if (e.data.action === 'FILTER_RESULT') {
            startTransition(() => {
              let result = e.data.result;
              
              // Handle Transferable Object (ArrayBuffer)
              if (e.data.resultBuffer && decoderRef.current) {
                  try {
                      const jsonString = decoderRef.current.decode(e.data.resultBuffer);
                      result = JSON.parse(jsonString);
                  } catch (err) {
                      console.error("Filter decode error", err);
                      result = [];
                  }
              }

              setDisplayInventory(result);
              setTotalWeight(e.data.totalWeight);
            });
        } else if (e.data.action === 'EXPORT_RESULT') {
            const { blob, fileName } = e.data;
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                link.href = url;
                link.download = `${fileName}_${timestamp}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                addToast("Xuất file thành công!", "success");
            }
        }
      };
    } catch (err) {
      console.error("Failed to initialize filter worker:", err);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 350); 
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  useEffect(() => {
    if (workerRef.current && inventory && inventory.length > 0) {
        workerRef.current.postMessage({
            action: 'SET_DATA',
            inventory
        });
        workerRef.current.postMessage({
            action: 'FILTER_SORT',
            filterConfig: { 
                searchTerm: debouncedSearchTerm, 
                searchColumn: filters.searchColumn, 
                rangeFilters: filters.rangeFilters, 
                showOddLots: filters.showOddLots 
            },
            sortConfig
        });
    }
  }, [inventory]);

  useEffect(() => {
    if (workerRef.current) {
        workerRef.current.postMessage({
            action: 'FILTER_SORT', 
            filterConfig: { 
                searchTerm: debouncedSearchTerm, 
                searchColumn: filters.searchColumn, 
                rangeFilters: filters.rangeFilters, 
                showOddLots: filters.showOddLots 
            },
            sortConfig
        });
    }
  }, [debouncedSearchTerm, filters, sortConfig]);

  const handleSort = useCallback((key: keyof InventoryItem) => {
    if (filters.showOddLots) return;
    let direction: 'asc' | 'desc' = 'asc';
    setSortConfig(prev => {
        if (prev.key === key && prev.direction === 'asc') {
            direction = 'desc';
        }
        return { key, direction };
    });
  }, [filters.showOddLots]);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateRangeFilter = useCallback((field: string, value: string) => {
      if (value !== '' && isNaN(Number(value))) return;
      setFilters(prev => ({
          ...prev,
          rangeFilters: { ...prev.rangeFilters, [field]: value }
      }));
  }, []);

  const clearRangeFilters = useCallback(() => {
      setFilters(prev => ({
          ...prev,
          rangeFilters: { widthMin: '', widthMax: '', lengthMin: '', lengthMax: '' }
      }));
  }, []);

  const exportAndDownloadCSV = useCallback((columns: ColumnConfig<InventoryItem>[], fileNamePrefix: string) => {
      if (workerRef.current) {
          const simpleColumns = columns.map(c => ({
              header: c.header,
              accessor: c.accessor,
              isNumeric: c.isNumeric
          }));

          addToast("Đang tạo file CSV...", "info");
          workerRef.current.postMessage({
              action: 'EXPORT_CSV',
              columns: simpleColumns,
              fileName: fileNamePrefix
          });
      }
  }, [addToast]);

  return {
    displayInventory,
    totalWeight,
    isFiltering,
    filters,
    sortConfig,
    updateFilter,
    updateRangeFilter,
    clearRangeFilters,
    handleSort,
    exportAndDownloadCSV
  };
};