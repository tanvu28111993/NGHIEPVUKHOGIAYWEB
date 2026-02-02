
// --- CẤU HÌNH ---
var ID_SHEET_DANG_NHAP = "1bJKBNvSlh-YWiu2ZcBJwdiYCBh9RxyKFjNMF8jnKJWU";
var ID_SHEET_KHO = "1DSg_2nJoPkAfudCy4QnHBEbvKhwHm-j6Cd9CK_cwfkg";
var ID_SHEET_DANHMUC = "1mn8QLCcgmCUKKckGXIyRcghDnPPtBAgjuGsVLJaDTF4"; // Sheet Danh mục mới

// External History Sheets
var ID_SHEET_XUAT = "1ztt84ZUrGk1NlhjmbdAIm6tjlGHZBRDMPgOEQi24CUw";
var ID_SHEET_NHAP = "1hmmrdoyEVPS0EIPGH5_PZjzVqN-gUfrP1Q73W6ck9b0";
var ID_SHEET_SKUN = "1HfJ6c48d0BhIsdKdCIZdq6JOBC7UHrszv-A8eI45ORM"; // Sheet Nhập lại SKUN

// --- CACHE CONFIG ---
var CACHE_EXPIRATION_SEC = 300; // Tăng cache lên 5 phút
var CACHE_KEY_PREFIX = "INVENTORY_CHUNK_";
var CACHE_META_KEY = "INVENTORY_META";

// Helper để parse params từ Event
function getParams(e) {
  var params = e.parameter || {};
  if (e.postData && e.postData.contents) {
    try {
      var jsonBody = JSON.parse(e.postData.contents);
      for (var key in jsonBody) {
        params[key] = jsonBody[key];
      }
    } catch (err) {}
  }
  return params;
}

function doGet(e) {
  var params = getParams(e);
  return routeRequest(params);
}

function doPost(e) {
  var params = getParams(e);
  var action = params.action;

  // --- OPTIMIZATION: SEPARATE READ/WRITE LOGIC (CQRS) ---
  // Chỉ sử dụng LockService cho các hành động Ghi (Write)
  if (action === 'batch') {
      var lock = LockService.getScriptLock();
      try {
        // Wait for up to 30 seconds for other processes to finish.
        lock.waitLock(30000);
        return handleBatch(params);
      } catch (e) {
        return responseJSON({ success: false, message: "Server Busy. Try again later." });
      } finally {
        lock.releaseLock();
      }
  }

  // Các hành động Đọc (Read) không cần Lock để tăng tốc độ phản hồi đồng thời
  return routeRequest(params);
}

// Router điều hướng request
function routeRequest(params) {
  var action = params.action;
  if (action == 'login') return handleLogin(params);
  if (action == 'getInventory') return handleGetInventory(params);
  if (action == 'getHistory') return handleGetHistory(params); 
  if (action == 'getMetaData') return handleGetMetaData(); 
  if (action == 'getExportRequests') return handleGetExportRequests(); 
  if (action == 'getReImportRequests') return handleGetReImportRequests(); 
  if (action == 'getRecentExports') return handleGetRecentExports(); 
  if (action == 'checkVersion') return handleCheckVersion();
  
  return responseJSON({ error: "Invalid action" });
}

// --- OPTIMIZATION: RETURN ARRAY INSTEAD OF OBJECT ---
function handleGetRecentExports() {
  try {
    var year = new Date().getFullYear();
    var sheetName = "XUAT_" + year;
    var ss = SpreadsheetApp.openById(ID_SHEET_XUAT);
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        if (new Date().getMonth() < 3) {
             sheet = ss.getSheetByName("XUAT_" + (year - 1));
        }
        if (!sheet) return responseJSON({ success: true, data: [] });
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return responseJSON({ success: true, data: [] });

    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    var now = new Date();
    var threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).getTime();

    var recentItems = [];

    for (var i = data.length - 1; i >= 0; i--) {
        var rowStr = String(data[i][0]);
        if (!rowStr) continue;

        var rowTime = extractTimeFromRow(rowStr);
        
        if (rowTime < threeMonthsAgo) {
             continue; 
        }

        // Tối ưu: Trả về mảng gốc đã split thay vì tạo object map
        // Client sẽ sử dụng Worker để transform ngược lại thành Object
        var parts = rowStr.split('|');
        if (parts.length >= 19) { 
            recentItems.push(parts);
        }
    }

    return responseJSON({ success: true, data: recentItems });

  } catch (err) {
    return responseJSON({ success: false, message: err.message });
  }
}

// --- OPTIMIZATION: RETURN ARRAY INSTEAD OF OBJECT ---
function handleGetReImportRequests() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET_SKUN);
    var sheet = ss.getSheetByName("SKUN");
    if (!sheet) {
        return responseJSON({ success: false, message: "Không tìm thấy Sheet 'SKUN'" });
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        return responseJSON({ success: true, data: [] }); 
    }

    var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    
    // Trả về mảng thuần [SKU, Quantity, Weight]
    var requests = data.map(function(row) {
        return [
            String(row[0] || "").trim(), // SKU
            row[1] || 0,                 // Quantity
            row[2] || 0                  // Weight
        ];
    }).filter(function(item) {
        return item[0] !== "";
    });

    return responseJSON({ success: true, data: requests });

  } catch (err) {
    return responseJSON({ success: false, message: err.message });
  }
}

// --- OPTIMIZATION: RETURN ARRAY INSTEAD OF OBJECT ---
function handleGetExportRequests() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET_XUAT);
    var sheet = ss.getSheetByName("SKUX");
    if (!sheet) {
        return responseJSON({ success: false, message: "Không tìm thấy Sheet 'SKUX'" });
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        return responseJSON({ success: true, data: [] });
    }

    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    
    // Trả về mảng thuần [SKU, Quantity]
    var requests = data.map(function(row) {
        return [
            String(row[0] || "").trim(), // SKU
            row[1] || 0                  // Quantity
        ];
    }).filter(function(item) {
        return item[0] !== "";
    });

    return responseJSON({ success: true, data: requests });

  } catch (err) {
    return responseJSON({ success: false, message: err.message });
  }
}

function handleGetMetaData() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET_DANHMUC);
    
    var readSheet = function(sheetName, numCols) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return []; 
      var data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
      return data.filter(function(row) { return row[0] && String(row[0]).trim() !== ""; });
    };

    var data = {
      loaiNhap: readSheet("LOAINHAP", 2),
      kienGiay: readSheet("KIENGIAY", 2),
      loaiGiay: readSheet("GIAY", 2),    
      ncc: readSheet("NCC", 1),          
      nsx: readSheet("NSX", 1)           
    };

    return responseJSON({ success: true, data: data });
  } catch (err) {
    return responseJSON({ success: false, message: err.message, data: {} });
  }
}

function handleBatch(params) {
  var commands = params.commands;
  if (!commands || !Array.isArray(commands)) {
    return responseJSON({ success: false, message: "Invalid batch data" });
  }

  var results = [];
  var ssKho = SpreadsheetApp.openById(ID_SHEET_KHO);
  var sheetKho = ssKho.getSheetByName("KHO");

  commands.forEach(function(cmd) {
    try {
      if (cmd.type === 'IMPORT') {
         var item = cmd.payload;
         if (!item || !item.sku) {
             results.push({ id: cmd.id, success: false, message: "Missing SKU in payload" });
             return;
         }
         var rowData = convertItemToRow(item);
         sheetKho.appendRow(rowData);
         
         try {
             logImportHistory([item]);
         } catch (e) { console.error("History Log Error (Single): " + e.message); }

         results.push({ id: cmd.id, success: true });

      } else if (cmd.type === 'IMPORT_BATCH') {
         var items = cmd.payload;
         if (!items || !Array.isArray(items) || items.length === 0) {
            results.push({ id: cmd.id, success: false, message: "Invalid batch payload" });
            return;
         }
         var rowsToAdd = items.map(convertItemToRow);
         if (rowsToAdd.length > 0) {
            var lastRow = sheetKho.getLastRow();
            sheetKho.getRange(lastRow + 1, 1, rowsToAdd.length, 19).setValues(rowsToAdd);
         }

         try {
             logImportHistory(items);
         } catch (e) { console.error("History Log Error (Batch): " + e.message); }

         results.push({ id: cmd.id, success: true });

      } else if (cmd.type === 'UPDATE') {
         var item = cmd.payload;
         if (!item || !item.sku) {
             results.push({ id: cmd.id, success: false, message: "Missing SKU" });
             return;
         }
         var textFinder = sheetKho.getRange("A:A").createTextFinder(item.sku).matchEntireCell(true);
         var foundRange = textFinder.findNext();
         if (foundRange) {
             var row = foundRange.getRow();
             var rowData = convertItemToRow(item);
             sheetKho.getRange(row, 1, 1, 19).setValues([rowData]);
             results.push({ id: cmd.id, success: true });
         } else {
             results.push({ id: cmd.id, success: false, message: "SKU not found: " + item.sku });
         }

      } else if (cmd.type === 'EXPORT_BATCH') {
         var exportItems = cmd.payload; 
         if (!exportItems || exportItems.length === 0) {
            results.push({ id: cmd.id, success: false, message: "Empty export payload" });
            return;
         }

         var lastRow = sheetKho.getLastRow();
         var skuMap = {}; 
         if (lastRow > 1) {
             var skuValues = sheetKho.getRange(2, 1, lastRow - 1, 1).getValues();
             for (var i = 0; i < skuValues.length; i++) {
                 var rawSku = String(skuValues[i][0]);
                 if (rawSku) {
                     skuMap[rawSku.trim().toUpperCase()] = i + 2; 
                 }
             }
         }

         var rowsToDelete = [];
         var rowsToUpdate = []; 
         var historyRows = [];
         var skusProcessed = [];

         exportItems.forEach(function(entry) {
             var sku = String(entry.sku).trim().toUpperCase();
             var rowIndex = skuMap[sku];
             
             if (rowIndex) {
                 var updated = entry.updatedItem;
                 var qty = Number(updated.quantity);
                 if (isNaN(qty)) qty = 0;
                 
                 if (qty <= 0.01) {
                     rowsToDelete.push(rowIndex);
                 } else {
                     rowsToUpdate.push({
                         row: rowIndex,
                         values: convertItemToRow(updated)
                     });
                 }
                 
                 var histItem = entry.originalItem; 
                 var rowArr = convertItemToRow(histItem);
                 
                 var historyStr = rowArr.map(function(v) { 
                     return (v === null || v === undefined) ? "" : String(v); 
                 }).join('|');
                 
                 historyRows.push([historyStr]);
                 skusProcessed.push(sku);
             }
         });

         if (rowsToUpdate.length > 0) {
             rowsToUpdate.forEach(function(upd) {
                 sheetKho.getRange(upd.row, 1, 1, 19).setValues([upd.values]);
             });
         }
         
         if (rowsToDelete.length > 0) {
             rowsToDelete.sort(function(a, b) { return b - a; });
             rowsToDelete.forEach(function(rowIndex) {
                 sheetKho.deleteRow(rowIndex);
             });
         }

         if (historyRows.length > 0) {
             try {
                 var year = new Date().getFullYear();
                 var sheetName = "XUAT_" + year;
                 var ssHistory = SpreadsheetApp.openById(ID_SHEET_XUAT);
                 var sheetHist = ssHistory.getSheetByName(sheetName);
                 if (!sheetHist) {
                     sheetHist = ssHistory.insertSheet(sheetName);
                 }
                 sheetHist.getRange(sheetHist.getLastRow() + 1, 1, historyRows.length, 1).setValues(historyRows);
             } catch (e) {
                 console.error("History Log Error: " + e.message);
             }
         }

         if (skusProcessed.length > 0) {
             try {
                var ssHistory = SpreadsheetApp.openById(ID_SHEET_XUAT);
                var sheetSkux = ssHistory.getSheetByName("SKUX");
                if (sheetSkux) {
                    var skuxLastRow = sheetSkux.getLastRow();
                    if (skuxLastRow > 1) {
                        var skuxRange = sheetSkux.getRange(2, 1, skuxLastRow - 1, 1);
                        var skuxValues = skuxRange.getValues();
                        
                        for (var i = 0; i < skuxValues.length; i++) {
                            var sheetSku = String(skuxValues[i][0]).trim().toUpperCase();
                            if (skusProcessed.indexOf(sheetSku) !== -1) {
                                sheetSkux.getRange(i + 2, 1, 1, 2).clearContent();
                            }
                        }
                    }
                }
             } catch (e) {
                 console.error("SKUX Clean Error: " + e.message);
             }
         }

         results.push({ id: cmd.id, success: true, processedCount: skusProcessed.length });

      } else if (cmd.type === 'RE_IMPORT_BATCH') {
         var importItems = cmd.payload; 
         if (!importItems || importItems.length === 0) {
            results.push({ id: cmd.id, success: false, message: "Empty re-import payload" });
            return;
         }

         var lastRow = sheetKho.getLastRow();
         var skuMap = {}; 
         if (lastRow > 1) {
             var skuValues = sheetKho.getRange(2, 1, lastRow - 1, 1).getValues();
             for (var i = 0; i < skuValues.length; i++) {
                 var rawSku = String(skuValues[i][0]);
                 if (rawSku) {
                     skuMap[rawSku.trim().toUpperCase()] = i + 2; 
                 }
             }
         }

         var rowsToUpdate = [];
         var skusProcessed = [];

         importItems.forEach(function(entry) {
             var sku = String(entry.sku).trim().toUpperCase();
             var rowIndex = skuMap[sku];
             
             if (rowIndex) {
                 rowsToUpdate.push({
                     row: rowIndex,
                     values: convertItemToRow(entry.updatedItem)
                 });
             } else {
                 var rowData = convertItemToRow(entry.updatedItem);
                 rowsToUpdate.push({
                     row: -1, 
                     values: rowData
                 });
             }
             
             skusProcessed.push(sku);
         });

         var rowsToAdd = [];
         if (rowsToUpdate.length > 0) {
             rowsToUpdate.forEach(function(upd) {
                 if (upd.row !== -1) {
                    sheetKho.getRange(upd.row, 1, 1, 19).setValues([upd.values]);
                 } else {
                    rowsToAdd.push(upd.values);
                 }
             });
         }
         
         if (rowsToAdd.length > 0) {
             sheetKho.getRange(sheetKho.getLastRow() + 1, 1, rowsToAdd.length, 19).setValues(rowsToAdd);
         }

         if (skusProcessed.length > 0) {
             try {
                var ssSkun = SpreadsheetApp.openById(ID_SHEET_SKUN);
                var sheetSkun = ssSkun.getSheetByName("SKUN");
                if (sheetSkun) {
                    var skunLastRow = sheetSkun.getLastRow();
                    if (skunLastRow > 1) {
                        var skunRange = sheetSkun.getRange(2, 1, skunLastRow - 1, 1);
                        var skunValues = skunRange.getValues();
                        
                        for (var i = 0; i < skunValues.length; i++) {
                            var sheetSku = String(skunValues[i][0]).trim().toUpperCase();
                            if (skusProcessed.indexOf(sheetSku) !== -1) {
                                sheetSkun.getRange(i + 2, 1, 1, 3).clearContent();
                            }
                        }
                    }
                }
             } catch (e) {
                 console.error("SKUN Clean Error: " + e.message);
             }
         }

         results.push({ id: cmd.id, success: true, processedCount: skusProcessed.length });

      } else {
         results.push({ id: cmd.id, success: true, message: "No-op" });
      }
    } catch (err) {
      results.push({ id: cmd.id, success: false, error: err.message });
    }
  });

  SpreadsheetApp.flush();
  return responseJSON({ success: true, results: results });
}

function logImportHistory(items) {
    if (!items || items.length === 0) return;
    
    var year = new Date().getFullYear();
    var sheetName = "NHAP_" + year;
    
    var ssHistory = SpreadsheetApp.openById(ID_SHEET_NHAP);
    var sheetHist = ssHistory.getSheetByName(sheetName);
    
    if (!sheetHist) {
        sheetHist = ssHistory.insertSheet(sheetName);
    }
    
    var historyRows = items.map(function(item) {
        var rowArr = convertItemToRow(item);
        var rowStr = rowArr.map(function(v) { 
             return (v === null || v === undefined) ? "" : String(v); 
        }).join('|');
        return [rowStr];
    });
    
    if (historyRows.length > 0) {
        sheetHist.getRange(sheetHist.getLastRow() + 1, 1, historyRows.length, 1).setValues(historyRows);
    }
}

function convertItemToRow(item) {
    return [
        item.sku,                       
        item.purpose || "",             
        item.packetCode || "",          
        item.paperType || "",           
        item.gsm || "",                 
        item.supplier || "",            
        item.manufacturer || "",        
        item.importDate || "",          
        item.productionDate || "",      
        Number(item.length) || 0,       
        Number(item.width) || 0,        
        Number(item.weight) || 0,       
        Number(item.quantity) || 0,     
        item.orderCustomer || "",       
        item.materialCode || "",        
        item.location || "",            
        item.pendingOut || "",          
        item.importer || "",            
        item.lastUpdated || ""          
    ];
}

function handleLogin(params) {
  var username = params.username;
  var password = params.password;
  
  if (!username || !password) return responseJSON({ success: false, message: "Thiếu thông tin" });

  var ss = SpreadsheetApp.openById(ID_SHEET_DANG_NHAP);
  var sheet = ss.getSheetByName("DN");
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return responseJSON({ success: false, message: "Lỗi hệ thống" });
  
  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) == username && String(data[i][1]) == password) {
      return responseJSON({ success: true, user: { username: username } });
    }
  }
  return responseJSON({ success: false, message: "Sai tài khoản/mật khẩu" });
}

function handleCheckVersion() {
  var ss = SpreadsheetApp.openById(ID_SHEET_KHO);
  var sheet = ss.getSheetByName("KHO");
  var lastRow = sheet.getLastRow();
  var version = "0_0";
  if (lastRow > 1) {
    var lastUpdateCell = sheet.getRange(lastRow, 19).getValue(); 
    version = lastRow + "_" + lastUpdateCell;
  }
  return responseJSON({ version: version });
}

function parseDateStr(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    try {
        var parts = dateStr.trim().split(' '); 
        if (parts.length === 0) return 0;
        var dateParts = parts[0].split('/');
        if (dateParts.length < 3) return 0;
        var day = +dateParts[0]; 
        var month = +dateParts[1] - 1; 
        var year = +dateParts[2];
        var hours = 0, minutes = 0, seconds = 0;
        if (parts.length > 1) {
            var timeParts = parts[1].split(':');
            if (timeParts.length >= 2) {
                hours = +timeParts[0];
                minutes = +timeParts[1];
                if (timeParts.length > 2) seconds = +timeParts[2];
            }
        }
        return new Date(year, month, day, hours, minutes, seconds).getTime();
    } catch (e) { return 0; }
}

function extractTimeFromRow(rawStr) {
  if (!rawStr || rawStr.length < 10) return 0;
  var lastPipeIndex = rawStr.lastIndexOf('|');
  if (lastPipeIndex === -1) return 0;
  var dateStr = rawStr.substring(lastPipeIndex + 1);
  return parseDateStr(dateStr) || Date.parse(dateStr) || 0;
}

function handleGetHistory(params) {
  try {
    var filterStart = params.startDate ? parseInt(params.startDate) : 0;
    var filterEnd = params.endDate ? parseInt(params.endDate) : 0;
    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 10000; 
    
    var historyData = [];

    var fetchAndFilterSheet = function(sheetId, sheetName, transactionType) {
      try {
        var ss = SpreadsheetApp.openById(sheetId);
        var sheet = ss.getSheetByName(sheetName); 
        if (!sheet) return [];
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) return [];
        var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        var len = data.length;
        if (len === 0) return [];

        var startIndex = -1;
        var l = 0, r = len - 1;
        while (l <= r) {
          var mid = Math.floor((l + r) / 2);
          var rowTime = extractTimeFromRow(String(data[mid][0]));
          if (rowTime >= filterStart) {
            startIndex = mid;
            r = mid - 1;
          } else {
            l = mid + 1;
          }
        }
        if (startIndex === -1) return [];

        var result = [];
        for (var i = startIndex; i < len; i++) {
          var rawCell = String(data[i][0]);
          var rowTime = extractTimeFromRow(rawCell);
          if (rowTime > filterEnd) break;
          var parts = rawCell.split('|');
          var cleanRow = parts.map(function(p) { return p ? p.trim() : ""; });
          cleanRow.push(transactionType);
          result.push(cleanRow);
        }
        return result;
      } catch (e) { return []; }
    };

    var startYear = new Date(filterStart).getFullYear();
    var endYear = new Date(filterEnd).getFullYear();
    var currentYear = new Date().getFullYear();
    if (isNaN(startYear)) startYear = currentYear;
    if (isNaN(endYear)) endYear = currentYear;
    if (endYear - startYear > 3) startYear = endYear - 3;

    for (var year = startYear; year <= endYear; year++) {
        var xuatSheetName = "XUAT_" + year;
        var nhapSheetName = "NHAP_" + year;
        historyData = historyData.concat(fetchAndFilterSheet(ID_SHEET_XUAT, xuatSheetName, 'EXPORT'));
        historyData = historyData.concat(fetchAndFilterSheet(ID_SHEET_NHAP, nhapSheetName, 'IMPORT'));
    }

    historyData.sort(function(a, b) {
        var idxA = a.length - 2; 
        var idxB = b.length - 2;
        var valA = idxA >= 0 ? a[idxA] : "";
        var valB = idxB >= 0 ? b[idxB] : "";
        var dateA = typeof valA === 'string' ? (parseDateStr(valA) || Date.parse(valA) || 0) : 0;
        var dateB = typeof valB === 'string' ? (parseDateStr(valB) || Date.parse(valB) || 0) : 0;
        return dateA - dateB; 
    });

    var totalRecords = historyData.length;
    var totalPages = Math.ceil(totalRecords / pageSize);
    var startIndex = (page - 1) * pageSize;
    var pagedData = historyData.slice(startIndex, startIndex + pageSize);

    return responseJSON({
      success: true,
      data: pagedData,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: totalRecords,
        totalPages: totalPages
      }
    });

  } catch (error) {
    return responseJSON({ error: error.message });
  }
}

function getCachedData() {
  try {
    var cache = CacheService.getScriptCache();
    var meta = cache.get(CACHE_META_KEY);
    if (!meta) return null;
    var metaObj = JSON.parse(meta);
    var rawData = [];
    for (var i = 0; i < metaObj.chunks; i++) {
      var chunk = cache.get(CACHE_KEY_PREFIX + i);
      if (!chunk) return null; 
      rawData = rawData.concat(JSON.parse(chunk));
    }
    return rawData;
  } catch (e) { return null; }
}

function setCachedData(data) {
  try {
    var cache = CacheService.getScriptCache();
    var arrayChunkSize = 1000; 
    var totalChunks = Math.ceil(data.length / arrayChunkSize);
    var cacheObject = {};
    for (var k = 0; k < totalChunks; k++) {
      var slice = data.slice(k * arrayChunkSize, (k + 1) * arrayChunkSize);
      cacheObject[CACHE_KEY_PREFIX + k] = JSON.stringify(slice);
    }
    cacheObject[CACHE_META_KEY] = JSON.stringify({ chunks: totalChunks });
    cache.putAll(cacheObject, CACHE_EXPIRATION_SEC);
  } catch (e) {}
}

function handleGetInventory(params) {
  var rawData = getCachedData();
  var isFromCache = true;

  if (!rawData) {
    var ss = SpreadsheetApp.openById(ID_SHEET_KHO);
    var sheet = ss.getSheetByName("KHO");
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return responseJSON({ data: [], serverTimestamp: Date.now() });
    rawData = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
    setCachedData(rawData);
    isFromCache = false;
  }

  var lastClientTime = Number(params.lastUpdated) || 0;
  var optimizedData = [];
  var len = rawData.length;
  var maxTimestamp = 0; 

  for (var i = 0; i < len; i++) {
    var row = rawData[i];
    if (!row[0]) continue; 
    var rowTime = 0;
    var lastUpdatedVal = row[18];
    if (typeof lastUpdatedVal === 'string' && lastUpdatedVal.includes('T')) {
        rowTime = new Date(lastUpdatedVal).getTime();
    } else if (lastUpdatedVal instanceof Date) {
        rowTime = lastUpdatedVal.getTime();
    } else if (typeof lastUpdatedVal === 'string' && lastUpdatedVal.trim() !== "") {
        rowTime = new Date(lastUpdatedVal).getTime();
    }
    if (!isNaN(rowTime) && rowTime > maxTimestamp) maxTimestamp = rowTime;

    if (rowTime > lastClientTime) {
      optimizedData.push([
        String(row[0]), String(row[1]), String(row[2]), String(row[3]), String(row[4] || ""),
        String(row[5]), String(row[6]), row[7], row[8], Number(row[9]) || 0,
        Number(row[10]) || 0, Number(row[11]) || 0, Number(row[12]) || 0, String(row[13]),
        String(row[14]), String(row[15]), String(row[16] || ""), String(row[17]), row[18]
      ]);
    }
  }
  if (maxTimestamp === 0) maxTimestamp = Date.now();
  return responseJSON({
    serverTimestamp: maxTimestamp,
    data: optimizedData,
    cached: isFromCache 
  });
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
