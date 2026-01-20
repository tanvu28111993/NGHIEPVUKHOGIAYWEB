
// URL Web App của bạn (Đảm bảo URL này là phiên bản 'exec' mới nhất sau khi deploy)
const API_URL = 'https://script.google.com/macros/s/AKfycbzEt765u66s_F8dnt5rQAVjct1NirSoXPAXclhL4-_HsQJjbZr5f6LQIgYRvUtwoHvewg/exec';

/**
 * Parses a TSV (Tab-Separated Values) string into a 2D array.
 * Backend returns TSV for inventory data to reduce JSON payload size.
 */
const parseTsv = (tsv: any): any[][] => {
  if (!tsv || typeof tsv !== 'string') return [];
  // Split by newline, then by tab
  return tsv.split('\n').map(line => line.split('\t'));
};

/**
 * Parses a newline-separated string into an array of strings.
 * Backend returns joined strings for history logs.
 */
const parseHistoryString = (data: any): string[] => {
  if (!data || typeof data !== 'string') return [];
  return data.split('\n').filter(line => line.trim() !== '');
};

// Generic POST request handler
async function post(action: string, args: any[] = []): Promise<any> {
  // Use a specific structure for the body to match backend expectation
  const body = JSON.stringify({ action, args });
  
  try {
    // Sử dụng text/plain để tránh CORS preflight (OPTIONS request) của GAS
    const response = await fetch(API_URL, {
      method: 'POST',
      body: body,
      // Important: Google Apps Script requires text/plain to avoid preflight checks
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
    });

    const json = await response.json();
    
    // Check lỗi từ server GAS trả về (Object format { error: ... })
    if (json && typeof json === 'object' && json.error) {
      throw new Error(json.error);
    }
    
    return json;
  } catch (e) {
    console.error(`API Error [${action}]:`, e);
    throw e;
  }
}

export const api = {
  checkLogin: async (u: string, p: string) => {
    return await post('checkLogin', [u, p]);
  },

  getInventoryData: async () => {
    // Backend returns a TSV string (huge performance boost over JSON array)
    const tsvData = await post('getInventoryData'); 
    return parseTsv(tsvData); 
  },

  getExportHistory: async () => {
    // Backend returns a single string joined by \n
    const rawString = await post('getExportHistory');
    return parseHistoryString(rawString);
  },

  getImportHistory: async () => {
    // Backend returns a single string joined by \n
    const rawString = await post('getImportHistory');
    return parseHistoryString(rawString);
  },

  getConfigData: async () => {
    // Returns JSON object directly
    return await post('getConfigData');
  },

  updateInventoryRow: async (rowIndex: number, rowData: any[]) => {
    return await post('updateInventoryRow', [rowIndex, rowData]);
  },

  // Combined Transaction for Export
  processExportTransaction: async (logDataRows: string[], inventoryUpdates: any[]) => {
    return await post('processExportTransaction', [logDataRows, inventoryUpdates]);
  },

  // Combined Transaction for Import & Re-Import
  processImportTransaction: async (logDataRows: string[], inventoryUpdates: any[], newRows: any[], isReImport: boolean) => {
    return await post('processImportTransaction', [logDataRows, inventoryUpdates, newRows, isReImport]);
  },

  // Scan Data
  getExportScanData: async () => {
    // Backend returns 2D array (values) directly from range
    return await post('getExportScanData'); 
  },

  getReImportScanData: async () => {
    // Backend returns 2D array (values) directly from range
    return await post('getReImportScanData'); 
  }
};
