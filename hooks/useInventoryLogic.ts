
import { useState, useMemo, useTransition } from 'react';
import { InventoryData } from '../types';

const COL_IDX_WEIGHT = 11;
const PENDING_COL_IDX = 16;

export interface SortConfig {
  key: number;
  direction: 'asc' | 'desc';
}

export const useInventoryLogic = (data: InventoryData | null, headers: string[]) => {
  // UI State
  const [inputValue, setInputValue] = useState('');
  const [filterValue, setFilterValue] = useState(''); // Value used for heavy filtering
  const [searchColIndex, setSearchColIndex] = useState<string>('all');
  const [filterSmallLots, setFilterSmallLots] = useState(false);
  const [filterPendingExport, setFilterPendingExport] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  // Transition for smooth typing
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (val: string) => {
    setInputValue(val);
    startTransition(() => {
      setFilterValue(val);
    });
  };

  const processedRows = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Skip header row
    const originalRows = data.slice(1);
    const indexedRows = originalRows.map((row, idx) => ({ row, originalIndex: idx + 1 }));
    let rows = indexedRows;

    // 1. Filter by Search Term
    if (filterValue.trim()) {
      const lowerTerm = filterValue.toLowerCase();
      const keywords = lowerTerm.split(';').map(k => k.trim()).filter(k => k.length > 0);
      
      if (keywords.length > 0) {
        rows = rows.filter(({ row }) => {
          if (searchColIndex === 'all') {
            return keywords.every(keyword => row.some((cell: any) => String(cell).toLowerCase().includes(keyword)));
          } else {
            const colIdx = parseInt(searchColIndex, 10);
            return keywords.every(keyword => String((row as any[])[colIdx]).toLowerCase().includes(keyword));
          }
        });
      }
    }

    // Helpers for parsing
    const parseWeight = (val: any) => {
      const str = String(val).replace(/,/g, ''); 
      const num = parseFloat(str);
      return isNaN(num) ? Infinity : num;
    };

    const parseValueForSort = (val: any) => {
      if (val === null || val === undefined) return '';
      const strVal = String(val).trim();
      if (/^-?[\d,.]+$/.test(strVal) && /\d/.test(strVal)) {
        const num = parseFloat(strVal.replace(/,/g, ''));
        if (!isNaN(num)) return num;
      }
      return strVal.toLowerCase();
    };

    // 2. Pre-calculate sets for specific filters to avoid O(N^2) or re-loops
    let smallLotIndices = new Set<number>();
    let pendingExportIndices = new Set<number>();

    // Small Lots Logic: Top 10 smallest weights
    if (filterSmallLots && rows.length > 0) {
      // Clone to sort for finding smallest
      const sortedByWeight = [...rows].sort((a, b) => parseWeight(a.row[COL_IDX_WEIGHT]) - parseWeight(b.row[COL_IDX_WEIGHT]));
      sortedByWeight.slice(0, 10).forEach(item => {
        if (parseWeight(item.row[COL_IDX_WEIGHT]) !== Infinity) smallLotIndices.add(item.originalIndex);
      });
    }

    // Pending Export Logic
    if (filterPendingExport && rows.length > 0) {
      rows.forEach(item => {
        const pendingVal = item.row[PENDING_COL_IDX];
        if (pendingVal !== null && pendingVal !== undefined && String(pendingVal).trim() !== '') {
            pendingExportIndices.add(item.originalIndex);
        }
      });
    }

    // 3. Sorting
    if (sortConfig !== null) {
      rows.sort((a, b) => {
        const valA = parseValueForSort(a.row[sortConfig.key]);
        const valB = parseValueForSort(b.row[sortConfig.key]);
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (filterSmallLots) {
       // If filtering small lots but no specific sort, bring small lots to top
       rows.sort((a, b) => {
          const aSmall = smallLotIndices.has(a.originalIndex);
          const bSmall = smallLotIndices.has(b.originalIndex);
          if (aSmall && !bSmall) return -1; 
          if (!aSmall && bSmall) return 1;  
          return 0;
       });
    }

    // 4. Map final properties
    return rows.map(item => ({
      ...item,
      isSmall: smallLotIndices.has(item.originalIndex),
      isPending: pendingExportIndices.has(item.originalIndex)
    }));

  }, [data, filterValue, searchColIndex, filterSmallLots, filterPendingExport, sortConfig]);

  // Calculate Total Weight from the *filtered* list
  const totalWeight = useMemo(() => {
    return processedRows.reduce((acc, { row }) => {
        const val = row[COL_IDX_WEIGHT];
        if (!val) return acc;
        const clean = String(val).replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);
        return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [processedRows]);

  return {
    inputValue,
    handleSearchChange,
    searchColIndex,
    setSearchColIndex,
    filterSmallLots,
    setFilterSmallLots,
    filterPendingExport,
    setFilterPendingExport,
    sortConfig,
    setSortConfig,
    processedRows,
    totalWeight,
    isPendingSearch: isPending
  };
};
