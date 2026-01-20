
import { useState, useEffect, useRef } from 'react';

// --- WORKER CODE AS STRING (To avoid build config issues) ---
const workerCode = `
self.onmessage = function(e) {
  const { type, data, filters, sortConfig, chunkSize } = e.data;

  if (type === 'PROCESS') {
    const { activeHistoryData, selectedMonths, keywords, searchColIndex } = data;
    const hasDateFilter = selectedMonths && selectedMonths.length > 0;
    const hasKeywords = keywords && keywords.length > 0;
    const selectedMonthSet = new Set(selectedMonths);

    // Helper: Extract YYYYMM
    const getYearMonth = (rowStr) => {
      if (!rowStr) return 0;
      const lastPipeIndex = rowStr.lastIndexOf('|');
      if (lastPipeIndex === -1) return 0;
      const datePart = rowStr.substring(lastPipeIndex + 1).trim();
      
      const firstSlash = datePart.indexOf('/');
      const secondSlash = datePart.indexOf('/', firstSlash + 1);
      
      if (firstSlash > 0 && secondSlash > firstSlash) {
           const monthStr = datePart.substring(firstSlash + 1, secondSlash);
           // Find end of year (space or end of string)
           let endOfYear = datePart.indexOf(' ', secondSlash + 1);
           if (endOfYear === -1) endOfYear = datePart.length;
           const yearStr = datePart.substring(secondSlash + 1, endOfYear);
           
           const m = parseInt(monthStr, 10);
           const y = parseInt(yearStr, 10);
           
           if (!isNaN(m) && !isNaN(y)) {
               return y * 100 + m;
           }
      }
      return 0;
    };

    // Helper: Sort Value
    const parseValueForSort = (val) => {
        if (val === null || val === undefined) return '';
        const strVal = String(val).trim();
        if (/^-?[\\d,.]+$/.test(strVal) && /\\d/.test(strVal)) {
            const num = parseFloat(strVal.replace(/,/g, ''));
            if (!isNaN(num)) return num;
        }
        return strVal.toLowerCase();
    };

    let results = [];
    const total = activeHistoryData.length;
    let processed = 0;

    for (let j = 0; j < total; j++) {
        const item = activeHistoryData[j];
        const rawLine = item.line;
        
        // 1. Date Filter
        if (hasDateFilter) {
            const val = getYearMonth(rawLine);
            if (val === 0) continue;
            const y = Math.floor(val / 100);
            const m = val % 100;
            const key = y + '-' + String(m).padStart(2, '0');
            if (!selectedMonthSet.has(key)) continue;
        }

        // 2. Search Filter
        let parts = null;
        if (hasKeywords) {
             const lowerLine = rawLine.toLowerCase();
             if (!keywords.every(k => lowerLine.includes(k))) {
                 continue; 
             }
             
             // Column specific search
             parts = rawLine.split('|');
             if (searchColIndex !== -1) {
                const cell = parts[searchColIndex];
                const match = keywords.every(k => String(cell || '').toLowerCase().includes(k));
                if (!match) continue;
             } 
        }

        // If we haven't split yet and we passed filters, split now
        if (!parts) parts = rawLine.split('|');

        results.push({ row: parts, originalIndex: j, type: item.type });
        
        processed++;
        // Report progress every 2000 items
        if (j % 2000 === 0) {
             self.postMessage({ type: 'PROGRESS', progress: Math.round((j / total) * 100) });
        }
    }

    // 3. Sorting
    if (sortConfig) {
        results.sort((a, b) => {
            const valA = parseValueForSort(a.row[sortConfig.key]);
            const valB = parseValueForSort(b.row[sortConfig.key]);
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    self.postMessage({ type: 'RESULT', results });
  }
};
`;

interface HistoryItem {
  line: string;
  type: 'export' | 'import';
}

export interface ProcessedHistoryRow {
  row: string[];
  originalIndex: number;
  type: 'export' | 'import';
}

export const useHistoryData = (
  exportData: string[],
  importData: string[],
  sourceConfig: { export: boolean; import: boolean },
  selectedMonths: Set<string>,
  debouncedSearchTerm: string,
  searchColIndex: string,
  sortConfig: { key: number; direction: 'asc' | 'desc' } | null
) => {
  const [processedRows, setProcessedRows] = useState<ProcessedHistoryRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      const { type, results, progress } = e.data;
      if (type === 'RESULT') {
        setProcessedRows(results);
        setIsProcessing(false);
      } else if (type === 'PROGRESS') {
        setProgress(progress);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Prepare Source Data
  const activeHistoryData = useState(() => {
     // Initial state, updated via effect below
     return [] as HistoryItem[];
  })[0]; 

  // We actually need to derive combined data inside the hook or pass it. 
  // Let's derive it here but careful not to block.
  // Actually, passing giant arrays to Worker can be slow due to cloning.
  // Ideally, Transferable objects (ArrayBuffer) are best, but strings are okay if logic is simple.
  
  useEffect(() => {
    if (!workerRef.current) return;

    setIsProcessing(true);
    setProgress(0);

    // Combine data on main thread (cheap enough for concat)
    // or we could send separate arrays to worker.
    let combined: HistoryItem[] = [];
    if (sourceConfig.export && exportData) {
        // Optimization: Don't map if we can help it, but we need type info.
        // Let's assume the worker handles raw strings and type arrays.
        // For now, map is fine for < 50k rows.
        for(let i=0; i<exportData.length; i++) combined.push({line: exportData[i], type: 'export'});
    }
    if (sourceConfig.import && importData) {
        for(let i=0; i<importData.length; i++) combined.push({line: importData[i], type: 'import'});
    }
    
    // Sort by timestamp rough logic inside main thread or worker? 
    // Let's let the worker handle filtering first.
    // However, the original code sorted by timestamp *before* filtering.
    // To mimic: getTimestampFromRow. 
    // Optimization: Just send raw data to worker.

    const keywords = debouncedSearchTerm.toLowerCase().split(';').map(k => k.trim()).filter(k => k.length > 0);
    const colIdx = searchColIndex !== 'all' ? parseInt(searchColIndex, 10) : -1;

    workerRef.current.postMessage({
      type: 'PROCESS',
      data: {
        activeHistoryData: combined,
        selectedMonths: Array.from(selectedMonths),
        keywords,
        searchColIndex: colIdx
      },
      sortConfig
    });

  }, [exportData, importData, sourceConfig, selectedMonths, debouncedSearchTerm, searchColIndex, sortConfig]);

  return { processedRows, isProcessing, progress };
};
