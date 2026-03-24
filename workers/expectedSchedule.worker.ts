export const EXPECTED_SCHEDULE_WORKER_CODE = `
/* eslint-disable no-restricted-globals */

// Helper to remove Vietnamese tones for searching
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

// WORKER STATE
let cachedData = [];
let lastFilteredResult = [];

// Encoder for Transferable Objects
const encoder = new TextEncoder();

const postResult = (action, result, extras = {}) => {
    try {
        const jsonString = JSON.stringify(result);
        const encoded = encoder.encode(jsonString);
        self.postMessage(
            { action, resultBuffer: encoded.buffer, ...extras }, 
            [encoded.buffer]
        );
    } catch (err) {
        console.error("Worker encode error", err);
        self.postMessage({ action, result: [], error: err.message });
    }
};

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

self.onmessage = (e) => {
  const { 
    action,
    data, 
    filterConfig, 
    sortConfig,
    columns,
    fileName
  } = e.data;

  if (action === 'SET_DATA') {
    if (data) {
      cachedData = data;
      lastFilteredResult = [...data];
    }
    return;
  }

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

  if (action === 'FILTER_SORT' || !action) {
      const dataToProcess = data || cachedData;

      if (!dataToProcess || dataToProcess.length === 0) {
        lastFilteredResult = [];
        self.postMessage({ action: 'FILTER_RESULT', result: [], totalWeight: 0 });
        return;
      }

      const { searchTerm, searchColumn } = filterConfig || {};

      // Filter
      const filtered = dataToProcess.filter((item) => {
        if (!searchTerm) return true;

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
      if (sortConfig && sortConfig.key) {
           const key = sortConfig.key;
           const dir = sortConfig.direction === 'asc' ? 1 : -1;

           if (['expectedDate', 'purchaseDate', 'lastUpdated'].includes(key)) {
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

      // Calculate total weight (quantity)
      const totalWeight = sorted.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) / 1000;
      
      postResult('FILTER_RESULT', sorted, { totalWeight });
  }
};
`;
