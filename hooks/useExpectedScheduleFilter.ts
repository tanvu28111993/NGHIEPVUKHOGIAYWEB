import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from 'react';
import { ExpectedScheduleItem, ColumnConfig } from '../types';
import { WorkerService } from '../services/worker';
import { useToast } from '../contexts/ToastContext';

export interface ExpectedScheduleFilterState {
  searchTerm: string;
  searchColumn: string;
}

export const useExpectedScheduleFilter = (initialData: ExpectedScheduleItem[]) => {
  const [displayData, setDisplayData] = useState<ExpectedScheduleItem[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [isFiltering, startTransition] = useTransition();
  const { addToast } = useToast();

  const [filters, setFilters] = useState<ExpectedScheduleFilterState>({
    searchTerm: '',
    searchColumn: 'all',
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExpectedScheduleItem | null; direction: 'asc' | 'desc' }>({
    key: 'expectedDate',
    direction: 'asc'
  });

  const workerRef = useRef<Worker | null>(null);
  const decoderRef = useRef<TextDecoder | null>(null);

  // Initialize Worker
  useEffect(() => {
    try {
      workerRef.current = WorkerService.createExpectedScheduleWorker();
      decoderRef.current = new TextDecoder();

      workerRef.current.onmessage = (e) => {
        if (e.data.action === 'FILTER_RESULT') {
          startTransition(() => {
            let result = e.data.result;
            if (e.data.resultBuffer && decoderRef.current) {
              try {
                const jsonString = decoderRef.current.decode(e.data.resultBuffer);
                result = JSON.parse(jsonString);
              } catch (err) {
                console.error("Filter decode error", err);
                result = [];
              }
            }
            setDisplayData(result);
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
      console.error("Failed to initialize expected schedule worker:", err);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [addToast]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  // Sync data to worker
  useEffect(() => {
    if (workerRef.current && initialData && initialData.length > 0) {
      workerRef.current.postMessage({
        action: 'SET_DATA',
        data: initialData
      });
      workerRef.current.postMessage({
        action: 'FILTER_SORT',
        filterConfig: {
          searchTerm: debouncedSearchTerm,
          searchColumn: filters.searchColumn
        },
        sortConfig
      });
    } else if (workerRef.current && initialData.length === 0) {
      setDisplayData([]);
      setTotalWeight(0);
    }
  }, [initialData]);

  // Trigger filter/sort on config change
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        action: 'FILTER_SORT',
        filterConfig: {
          searchTerm: debouncedSearchTerm,
          searchColumn: filters.searchColumn
        },
        sortConfig
      });
    }
  }, [debouncedSearchTerm, filters.searchColumn, sortConfig]);

  const updateFilter = useCallback((key: keyof ExpectedScheduleFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSort = useCallback((key: keyof ExpectedScheduleItem) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const exportAndDownloadCSV = useCallback(async (columns: ColumnConfig<ExpectedScheduleItem>[], fileName: string) => {
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
        fileName
      });
    }
  }, [addToast]);

  return {
    displayData,
    totalWeight,
    isFiltering,
    filters,
    sortConfig,
    updateFilter,
    handleSort,
    exportAndDownloadCSV
  };
};
