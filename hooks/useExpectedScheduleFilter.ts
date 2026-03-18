import { useState, useMemo, useCallback } from 'react';
import { ExpectedScheduleItem, ColumnConfig } from '../types';
import { WorkerService } from '../services/worker';

export interface ExpectedScheduleFilterState {
  searchTerm: string;
  searchColumn: string;
}

export const useExpectedScheduleFilter = (initialData: ExpectedScheduleItem[]) => {
  const [filters, setFilters] = useState<ExpectedScheduleFilterState>({
    searchTerm: '',
    searchColumn: 'all',
  });

  const [sortConfig, setSortConfig] = useState<{ key: keyof ExpectedScheduleItem | null; direction: 'asc' | 'desc' }>({
    key: 'expectedDate',
    direction: 'asc'
  });

  const [isFiltering, setIsFiltering] = useState(false);

  const updateFilter = useCallback((key: keyof ExpectedScheduleFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSort = useCallback((key: keyof ExpectedScheduleItem) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const displayData = useMemo(() => {
    let result = [...initialData];

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(item => {
        if (filters.searchColumn !== 'all') {
          const val = item[filters.searchColumn as keyof ExpectedScheduleItem];
          return val != null && String(val).toLowerCase().includes(term);
        }
        return Object.values(item).some(val => 
          val != null && String(val).toLowerCase().includes(term)
        );
      });
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof ExpectedScheduleItem];
        const bVal = b[sortConfig.key as keyof ExpectedScheduleItem];
        
        if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [initialData, filters, sortConfig]);

  const totalWeight = useMemo(() => {
    return displayData.reduce((sum, item) => sum + (item.quantity || 0), 0) / 1000; // Assuming quantity is in kg, converting to tons
  }, [displayData]);

  const exportAndDownloadCSV = useCallback(async (columns: ColumnConfig<ExpectedScheduleItem>[], fileName: string) => {
    try {
      setIsFiltering(true);
      // Fallback to main thread export if WorkerService doesn't support ExpectedScheduleItem
      // For now, we'll just do a simple CSV generation here
      const headers = columns.map(c => c.header).join(',');
      const rows = displayData.map(item => {
        return columns.map(c => {
          let val = item[c.accessor as keyof ExpectedScheduleItem];
          if (c.format) val = c.format(val) as any;
          return `"${String(val || '').replace(/"/g, '""')}"`;
        }).join(',');
      });
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error("Export Error:", error);
    } finally {
      setIsFiltering(false);
    }
  }, [displayData]);

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
