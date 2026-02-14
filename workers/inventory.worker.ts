
/* eslint-disable no-restricted-globals */
import { InventoryItem } from '../types/inventory';

// --- CONFIG: COLUMN MAPPING INDICES ---
// Exported for Testing
export const COL = {
  SKU: 0,
  PURPOSE: 1,
  PACKET_CODE: 2,
  PAPER_TYPE: 3,
  GSM: 4,
  SUPPLIER: 5,
  MANUFACTURER: 6,
  IMPORT_DATE: 7,
  PRODUCTION_DATE: 8,
  LENGTH: 9,
  WIDTH: 10,
  WEIGHT: 11,
  QUANTITY: 12,
  ORDER_CUSTOMER: 13,
  MATERIAL_CODE: 14,
  LOCATION: 15,
  PENDING_OUT: 16,
  IMPORTER: 17,
  LAST_UPDATED: 18,
  TRANSACTION_TYPE: 19 
};

// --- PURE LOGIC FUNCTIONS (Exported for Unit Testing - Main Thread) ---
// Những hàm này chỉ dùng để test hoặc chạy ở Main Thread nếu cần.
// Logic thực sự chạy trong Worker nằm ở biến WORKER_CODE bên dưới.

export const removeVietnameseTones = (str: string): string => {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
    return str;
};

export const formatDate = (val: unknown): string => {
  if (!val) return "";
  try {
    const d = new Date(val as string | number | Date);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(val);
  }
};

export const formatDateTime = (val: unknown): string => {
  if (!val) return "";
  try {
    const d = new Date(val as string | number | Date);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${h}:${m}:${s}`;
  } catch (e) {
    return String(val);
  }
};

export const transformData = (rawData: any[][]): InventoryItem[] => {
    if (Array.isArray(rawData) && rawData.length > 0 && Array.isArray(rawData[0])) {
         return rawData.map((row) => ({
          sku: String(row[COL.SKU]),
          purpose: String(row[COL.PURPOSE]),
          packetCode: String(row[COL.PACKET_CODE]),
          paperType: String(row[COL.PAPER_TYPE]),
          gsm: String(row[COL.GSM] || ""),
          supplier: String(row[COL.SUPPLIER]),
          manufacturer: String(row[COL.MANUFACTURER]),
          importDate: formatDate(row[COL.IMPORT_DATE]),
          productionDate: formatDate(row[COL.PRODUCTION_DATE]),
          length: Number(row[COL.LENGTH]),
          width: Number(row[COL.WIDTH]),
          weight: Number(row[COL.WEIGHT]),
          quantity: Number(row[COL.QUANTITY]),
          orderCustomer: String(row[COL.ORDER_CUSTOMER]),
          materialCode: String(row[COL.MATERIAL_CODE]),
          location: String(row[COL.LOCATION]),
          pendingOut: String(row[COL.PENDING_OUT] || ""),
          importer: String(row[COL.IMPORTER]),
          lastUpdated: formatDateTime(row[COL.LAST_UPDATED]),
          transactionType: row[COL.TRANSACTION_TYPE] as 'IMPORT' | 'EXPORT' | undefined
        }));
      }
      return rawData as unknown as InventoryItem[];
};

export const mergeInventory = (currentData: InventoryItem[], newItems: InventoryItem[]): InventoryItem[] => {
    const itemMap = new Map<string, InventoryItem>();
    if (Array.isArray(currentData)) {
        for (let i = 0; i < currentData.length; i++) {
            const item = currentData[i];
            if (item && item.sku) itemMap.set(item.sku, item);
        }
    }
    if (Array.isArray(newItems)) {
        for (let i = 0; i < newItems.length; i++) {
            const item = newItems[i];
            if (item && item.sku) itemMap.set(item.sku, item);
        }
    }
    return Array.from(itemMap.values());
};

export const parseDateToTimestamp = (val: unknown): number => {
    if (!val || typeof val !== 'string') return -1;
    const parts = val.trim().split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return -1;
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    let hour = 0, minute = 0, second = 0;
    if (parts[1]) {
        const timeParts = parts[1].split(':');
        if (timeParts[0]) hour = parseInt(timeParts[0], 10);
        if (timeParts[1]) minute = parseInt(timeParts[1], 10);
        if (timeParts[2]) second = parseInt(timeParts[2], 10);
    }
    return new Date(year, month - 1, day, hour, minute, second).getTime();
};

// --- WORKER CONSTRUCTION ---
// FIX: We hardcode functions inside the string to prevent minification issues in Production.
// In Production build, function names like 'transformData' might be renamed to 'a', 
// causing "a is not defined" inside the worker if we injected them via toString().

export const WORKER_CODE = `
/* eslint-disable no-restricted-globals */

// 1. DEFINITIONS (Hardcoded to survive minification)
const COL = ${JSON.stringify(COL)};

const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\\u0300|\\u0301|\\u0303|\\u0309|\\u0323/g, ""); 
    return str;
};

const formatDate = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return day + '/' + month + '/' + year;
  } catch (e) {
    return String(val);
  }
};

const formatDateTime = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return day + '/' + month + '/' + year + ' ' + h + ':' + m + ':' + s;
  } catch (e) {
    return String(val);
  }
};

const transformData = (rawData) => {
    if (Array.isArray(rawData) && rawData.length > 0 && Array.isArray(rawData[0])) {
         return rawData.map((row) => ({
          sku: String(row[COL.SKU]),
          purpose: String(row[COL.PURPOSE]),
          packetCode: String(row[COL.PACKET_CODE]),
          paperType: String(row[COL.PAPER_TYPE]),
          gsm: String(row[COL.GSM] || ""),
          supplier: String(row[COL.SUPPLIER]),
          manufacturer: String(row[COL.MANUFACTURER]),
          importDate: formatDate(row[COL.IMPORT_DATE]),
          productionDate: formatDate(row[COL.PRODUCTION_DATE]),
          length: Number(row[COL.LENGTH]),
          width: Number(row[COL.WIDTH]),
          weight: Number(row[COL.WEIGHT]),
          quantity: Number(row[COL.QUANTITY]),
          orderCustomer: String(row[COL.ORDER_CUSTOMER]),
          materialCode: String(row[COL.MATERIAL_CODE]),
          location: String(row[COL.LOCATION]),
          pendingOut: String(row[COL.PENDING_OUT] || ""),
          importer: String(row[COL.IMPORTER]),
          lastUpdated: formatDateTime(row[COL.LAST_UPDATED]),
          transactionType: row[COL.TRANSACTION_TYPE]
        }));
      }
      return rawData;
};

const mergeInventory = (currentData, newItems) => {
    const itemMap = new Map();
    if (Array.isArray(currentData)) {
        for (let i = 0; i < currentData.length; i++) {
            const item = currentData[i];
            if (item && item.sku) itemMap.set(item.sku, item);
        }
    }
    if (Array.isArray(newItems)) {
        for (let i = 0; i < newItems.length; i++) {
            const item = newItems[i];
            if (item && item.sku) itemMap.set(item.sku, item);
        }
    }
    // Convert Iterator to Array manually if needed or use Array.from
    const result = [];
    itemMap.forEach(v => result.push(v));
    return result;
};

const parseDateToTimestamp = (val) => {
    if (!val || typeof val !== 'string') return -1;
    const parts = val.trim().split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return -1;
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    let hour = 0, minute = 0, second = 0;
    if (parts[1]) {
        const timeParts = parts[1].split(':');
        if (timeParts[0]) hour = parseInt(timeParts[0], 10);
        if (timeParts[1]) minute = parseInt(timeParts[1], 10);
        if (timeParts[2]) second = parseInt(timeParts[2], 10);
    }
    return new Date(year, month - 1, day, hour, minute, second).getTime();
};

// 2. WORKER STATE
let cachedInventory = [];
let lastFilteredResult = [];

// Encoder for Transferable Objects
const encoder = new TextEncoder();

// Helper to send data using Transferable Objects (Zero-Copy-ish)
const postResult = (action, result, extras = {}) => {
    try {
        const jsonString = JSON.stringify(result);
        const encoded = encoder.encode(jsonString);
        // Transfer the buffer ownership to Main Thread
        self.postMessage(
            { action, resultBuffer: encoded.buffer, ...extras }, 
            [encoded.buffer]
        );
    } catch (err) {
        console.error("Worker encode error", err);
        self.postMessage({ action, result: [], error: err.message });
    }
};

// 3. EXPORT LOGIC (Formatters)
const numberFormatter = new Intl.NumberFormat('vi-VN');

const generateCSV = (data, columns) => {
    const BOM = "\\uFEFF";
    const headers = columns.map(c => c.header).join(';');
    
    const rows = data.map(item => {
        return columns.map(col => {
            let val = item[col.accessor];

            if (col.isNumeric && val !== null && val !== undefined && val !== '') {
                 const num = Number(val);
                 if (!isNaN(num)) {
                     val = numberFormatter.format(num);
                 }
            }

            if (typeof val === 'string') {
                val = val.replace(/;/g, ','); 
                val = val.replace(/[\\n\\r]+/g, ' ');
            }

            return val !== null && val !== undefined ? val : '';
        }).join(';');
    }).join('\\n');

    return BOM + headers + "\\n" + rows;
};

// 4. MESSAGE HANDLER
self.onmessage = (e) => {
  const { 
    action,
    rawData,
    inventory, 
    filterConfig, 
    sortConfig,
    columns,
    fileName,
    currentData,
    newItems
  } = e.data;

  // 1. TRANSFORM
  if (action === 'TRANSFORM') {
    try {
        const result = transformData(rawData);
        // Use Transferable Object
        postResult('TRANSFORM_RESULT', result);
    } catch (err) {
        self.postMessage({ action: 'TRANSFORM_RESULT', result: [], error: err.message });
    }
    return;
  }

  // 2. MERGE DATA
  if (action === 'MERGE_DATA') {
      try {
        const result = mergeInventory(currentData, newItems);
        // Use Transferable Object
        postResult('MERGE_RESULT', result);
      } catch (err) {
        self.postMessage({ action: 'MERGE_RESULT', result: [], error: err.message });
      }
      return;
  }

  // 3. SET DATA
  if (action === 'SET_DATA') {
    if (inventory) {
      cachedInventory = inventory;
      lastFilteredResult = [...inventory];
    }
    return;
  }

  // 4. EXPORT CSV
  if (action === 'EXPORT_CSV') {
      try {
          const csvContent = generateCSV(lastFilteredResult, columns);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          
          self.postMessage({ 
              action: 'EXPORT_RESULT', 
              blob: blob,
              fileName: fileName 
          });
      } catch (err) {
          console.error("Export Error", err);
      }
      return;
  }

  // 5. FILTER & SORT
  if (action === 'FILTER_SORT' || !action) {
      const dataToProcess = inventory || cachedInventory;

      if (!dataToProcess || dataToProcess.length === 0) {
        lastFilteredResult = [];
        self.postMessage({ action: 'FILTER_RESULT', result: [], totalWeight: 0 });
        return;
      }

      const { searchTerm, searchColumn, rangeFilters, showOddLots } = filterConfig || {};

      // Filter
      const filtered = dataToProcess.filter((item) => {
        if (rangeFilters) {
            const width = Number(item.width) || 0;
            const length = Number(item.length) || 0;
            if (rangeFilters.widthMin && width < Number(rangeFilters.widthMin)) return false;
            if (rangeFilters.widthMax && width > Number(rangeFilters.widthMax)) return false;
            if (rangeFilters.lengthMin && length < Number(rangeFilters.lengthMin)) return false;
            if (rangeFilters.lengthMax && length > Number(rangeFilters.lengthMax)) return false;
        }

        if (!searchTerm) return true;

        // --- IMPROVED SEARCH LOGIC (Accent Insensitive) ---
        const normalize = (str) => removeVietnameseTones(String(str).toLowerCase().trim());
        const cleanSearchTerm = normalize(searchTerm);
        const searchTerms = cleanSearchTerm.split(';').map((t) => t.trim()).filter((t) => t !== '');
        
        if (searchTerms.length === 0) return true;

        if (searchColumn === 'all') {
          return searchTerms.every((term) => 
            Object.values(item).some((val) =>
              normalize(val).includes(term)
            )
          );
        } else {
          const value = normalize(item[searchColumn]);
          return searchTerms.every((term) => value.includes(term));
        }
      });

      // Sort
      let sorted = filtered;
      if (showOddLots) {
           sorted = [...filtered].sort((a, b) => (Number(a.weight) || 0) - (Number(b.weight) || 0));
      } else if (sortConfig && sortConfig.key) {
           const key = sortConfig.key;
           const dir = sortConfig.direction === 'asc' ? 1 : -1;

           if (['importDate', 'productionDate', 'lastUpdated'].includes(key)) {
                const mapped = filtered.map((item, i) => ({ 
                    index: i, 
                    value: parseDateToTimestamp(item[key]) 
                }));
                mapped.sort((a, b) => (a.value - b.value) * dir);
                sorted = mapped.map(el => filtered[el.index]);
           } else {
               sorted = [...filtered].sort((a, b) => {
                    const aVal = a[key];
                    const bVal = b[key];
                    if (aVal === bVal) return 0;
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;

                    const numA = Number(aVal);
                    const numB = Number(bVal);
                    if (!isNaN(numA) && !isNaN(numB) && String(aVal).trim() !== '' && String(bVal).trim() !== '') {
                        return (numA - numB) * dir;
                    }
                    const strA = String(aVal).toLowerCase();
                    const strB = String(bVal).toLowerCase();
                    return strA.localeCompare(strB, 'vi', { numeric: true }) * dir;
               });
           }
      }

      lastFilteredResult = sorted;

      const totalWeight = sorted.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) / 1000;
      
      // Use Transferable Object for Filter Result
      postResult('FILTER_RESULT', sorted, { totalWeight });
  }
};
`;
