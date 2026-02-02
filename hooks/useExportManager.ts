import { useState, useCallback } from 'react';
import { InventoryItem } from '../types';
import { useInventoryQuery } from './useInventoryQuery';
import { useToast } from '../contexts/ToastContext';
import { useCommandQueue } from '../contexts/CommandQueueContext';
import { useAuth } from '../contexts/AuthContext';
import { parseVNToNumber, formatDateTime, formatNumberToVN } from '../utils/formatting';
import { InventoryService } from '../services/inventory';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../utils/constants';

export interface ExportInputItem {
  id: string;
  sku: string;
  exportQty: string;
}

export interface ExportStagingItem extends InventoryItem {
  exportQty: number;
  exportWeight: number;
}

export const useExportManager = () => {
  const { inventory } = useInventoryQuery();
  const { addToast } = useToast();
  const { addCommand } = useCommandQueue();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Left Panel State: List of SKU/Qty to check
  const [inputList, setInputList] = useState<ExportInputItem[]>([]);
  
  // Right Panel State: Validated items ready for export
  const [exportList, setExportList] = useState<ExportStagingItem[]>([]);

  // Loading state for fetching sheet
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // 1. Add to Input List (Legacy/Single Add) -> Replaced by direct manipulation
  const addToInputList = useCallback((sku: string, qty: string) => {
    // Legacy support if needed, but we mostly use addEmptyRow or handleFetchFromSheet now
    const cleanSku = sku.trim().toUpperCase();
    const cleanQty = qty.replace(',', '.');

    if (exportList.some(item => item.sku === cleanSku)) {
        addToast("SKU này đã được chuyển sang bảng xuất", "warning");
        return;
    }

    setInputList(prev => [{
      id: crypto.randomUUID(),
      sku: cleanSku,
      exportQty: cleanQty || '1'
    }, ...prev]);
  }, [exportList, addToast]);

  // NEW: Add Empty Row
  const addEmptyRow = useCallback(() => {
    setInputList(prev => [...prev, {
        id: crypto.randomUUID(),
        sku: '',
        exportQty: '1'
    }]);
  }, []);

  // NEW: Update Row
  const updateInputItem = useCallback((id: string, field: keyof ExportInputItem, value: string) => {
    setInputList(prev => prev.map(item => {
        if (item.id === id) {
            let newVal = value;
            if (field === 'sku') newVal = value.toUpperCase();
            return { ...item, [field]: newVal };
        }
        return item;
    }));
  }, []);

  // NEW: Fetch from Sheet 'SKUX'
  const handleFetchFromSheet = useCallback(async () => {
    setIsLoadingSheet(true);
    try {
        const requests = await InventoryService.fetchExportRequests();
        
        if (!requests || requests.length === 0) {
            addToast("Sheet SKUX trống hoặc không có dữ liệu hợp lệ", "info");
            setIsLoadingSheet(false);
            return;
        }

        const newItems: ExportInputItem[] = [];
        let skippedCount = 0;

        requests.forEach(req => {
            const sku = req.sku.toUpperCase();
            // Check duplicate in Export List
            if (exportList.some(ex => ex.sku === sku)) {
                skippedCount++;
                return;
            }

            newItems.push({
                id: crypto.randomUUID(),
                sku: sku,
                exportQty: req.quantity ? String(req.quantity).replace(',', '.') : '1'
            });
        });

        if (newItems.length > 0) {
            setInputList(prev => [...prev, ...newItems]);
            addToast(`Đã lấy ${newItems.length} mã từ Sheet SKUX`, "success");
            if (skippedCount > 0) {
                 addToast(`Đã bỏ qua ${skippedCount} mã vì đang ở bảng xuất`, "info");
            }
        } else {
             if (skippedCount > 0) {
                 addToast("Tất cả mã trong Sheet đều đang được xử lý ở bảng xuất", "warning");
             }
        }

    } catch (err) {
        console.error("Fetch Sheet failed", err);
        addToast("Không thể lấy dữ liệu từ Sheet. Vui lòng thử lại.", "error");
    } finally {
        setIsLoadingSheet(false);
    }
  }, [exportList, addToast]);

  const removeInputItem = useCallback((id: string) => {
    setInputList(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearInputList = useCallback(() => {
    setInputList([]);
  }, []);

  // 2. Check & Transfer Logic
  const checkAndTransfer = useCallback(() => {
    if (inputList.length === 0) return;

    // Filter out empty rows
    const validInputs = inputList.filter(i => i.sku.trim() !== '');
    
    if (validInputs.length === 0) {
        addToast("Danh sách SKU trống", "warning");
        return;
    }

    const newExportItems: ExportStagingItem[] = [];
    const notFoundSkus: string[] = [];
    const remainingInputs: ExportInputItem[] = [];

    // Use a temporary Set to track SKUs moved in this batch to prevent double adding within the same batch
    const processedSkus = new Set<string>();

    validInputs.forEach(input => {
      // Check duplicate in current batch or existing export list
      if (processedSkus.has(input.sku) || exportList.some(ex => ex.sku === input.sku)) {
          // Skip or handle duplicate? Let's skip and keep in remaining if strictly distinct
          remainingInputs.push(input);
          return;
      }

      // Find in Inventory
      const foundItem = inventory.find(inv => inv.sku === input.sku);

      if (foundItem) {
        // Calculate Logic
        const expQty = parseVNToNumber(input.exportQty);
        const invWeight = foundItem.weight || 0;
        const invQty = foundItem.quantity || 1; // Avoid division by zero
        
        // Formula: Export Weight = Export Qty * (Total Weight / Total Qty)
        let unitWeight = 0;
        if (invQty > 0) {
            unitWeight = invWeight / invQty;
        }
        
        const expWeight = expQty * unitWeight;

        // Validation: Export Qty > Inventory Qty?
        if (expQty > invQty) {
            addToast(`Cảnh báo: SKU ${input.sku} xuất (${expQty}) lớn hơn tồn (${invQty})`, "warning", 5000);
        }

        newExportItems.push({
          ...foundItem,
          exportQty: expQty,
          exportWeight: expWeight
        });
        processedSkus.add(input.sku);

      } else {
        notFoundSkus.push(input.sku);
        remainingInputs.push(input);
      }
    });

    // Update States
    if (newExportItems.length > 0) {
      setExportList(prev => [...newExportItems, ...prev]);
      addToast(`Đã chuyển ${newExportItems.length} mã sang bảng xuất`, "success");
    }

    if (notFoundSkus.length > 0) {
      addToast(`Không tìm thấy ${notFoundSkus.length} mã SKU trong kho`, "error");
    }

    // Update Input List with only remaining/invalid items (plus empty rows if any were filtered out previously, but usually we just keep the ones that failed)
    setInputList(remainingInputs);

  }, [inputList, inventory, addToast, exportList]);

  // 3. Remove from Export List (Right Panel)
  const removeExportItem = useCallback((sku: string) => {
    setExportList(prev => prev.filter(item => item.sku !== sku));
  }, []);

  // NEW: Handle Export CSV
  const handleExportCSV = useCallback(() => {
    if (exportList.length === 0) {
        addToast("Không có dữ liệu để xuất file CSV", "info");
        return;
    }

    try {
        // Headers đầy đủ các cột
        const headers = [
            "STT", 
            "Mã SKU", 
            "TL Xuất (KG)", 
            "SL Xuất", 
            "Mục Đích", 
            "Mã Kiện", 
            "Loại Giấy", 
            "Định Lượng", 
            "Nhà Cung Cấp",
            "Nhà Sản Xuất",
            "Ngày Nhập",
            "Ngày SX",
            "Dài (cm)", 
            "Rộng (cm)", 
            "Đơn Hàng/KH",
            "Mã Vật Tư",
            "Vị Trí",
            "Chờ Xuất",
            "Người Nhập",
            "Cập Nhật"
        ];

        // Format data rows đầy đủ
        const rows = exportList.map((item, index) => [
            index + 1,
            item.sku,
            formatNumberToVN(item.exportWeight),
            formatNumberToVN(item.exportQty),
            item.purpose,
            item.packetCode,
            item.paperType,
            item.gsm,
            item.supplier,
            item.manufacturer,
            item.importDate,
            item.productionDate,
            formatNumberToVN(item.length),
            formatNumberToVN(item.width),
            item.orderCustomer,
            item.materialCode,
            item.location,
            item.pendingOut,
            item.importer,
            item.lastUpdated
        ]);

        // Create CSV Content with BOM for Excel compatibility
        const csvContent = "\uFEFF" + [
            headers.join(";"),
            ...rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(";"))
        ].join("\n");

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.href = url;
        link.download = `DanhSach_XuatKho_FULL_${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addToast("Xuất file CSV thành công!", "success");

    } catch (e) {
        console.error("Export CSV Error", e);
        addToast("Lỗi khi tạo file CSV", "error");
    }
  }, [exportList, addToast]);

  // 4. Confirm Export (BATCH)
  const handleConfirmExport = useCallback(async () => {
    if (exportList.length === 0) return;

    try {
        const currentTime = formatDateTime(new Date());
        const currentUser = user?.username || 'Unknown';

        // Prepare payload for EXPORT_BATCH
        const itemsToExport = exportList.map(item => {
             const remainingQty = Math.max(0, item.quantity - item.exportQty);
             const remainingWeight = Math.max(0, item.weight - item.exportWeight);
             
             return {
                 sku: item.sku,
                 exportQty: item.exportQty,
                 exportWeight: item.exportWeight,
                 // Data for History Log (Transactional Snapshot)
                 // IMPORTANT: History needs to show WHAT was exported, not what was in stock.
                 originalItem: {
                     ...item,
                     // Override with Export Amounts for the history log
                     quantity: item.exportQty,
                     weight: item.exportWeight,
                     lastUpdated: currentTime,
                     importer: currentUser
                 },
                 // Data for Inventory Update (New Balance)
                 updatedItem: {
                     ...item,
                     quantity: remainingQty,
                     weight: remainingWeight,
                     lastUpdated: currentTime,
                     importer: currentUser
                 }
             };
        });

        // 1. Send Command
        await addCommand({
             id: crypto.randomUUID(),
             type: 'EXPORT_BATCH',
             payload: itemsToExport,
             timestamp: Date.now()
        });

        // 2. Optimistic Update (Local Cache)
        queryClient.setQueryData(QUERY_KEYS.INVENTORY, (oldData: InventoryItem[] | undefined) => {
            if (!oldData) return [];
            
            // Create map for fast lookup
            // Explicitly type the Map to ensure values are InventoryItem
            const exportMap = new Map<string, InventoryItem>(
                itemsToExport.map(i => [i.sku, i.updatedItem as InventoryItem])
            );
            
            // Filter out items with 0 quantity (Delete) AND map updated items
            return oldData
                .map(item => {
                    const updated = exportMap.get(item.sku);
                    return updated || item;
                })
                .filter(item => item.quantity > 0);
        });

        addToast(`Đã xuất kho ${exportList.length} cuộn giấy. Dữ liệu đang được đồng bộ.`, "success");
        setExportList([]);

    } catch (error) {
        console.error("Export error", error);
        addToast("Lỗi khi thực hiện xuất kho", "error");
    }
  }, [exportList, addCommand, addToast, user, queryClient]);

  return {
    inputList,
    exportList,
    isLoadingSheet,
    addToInputList,
    addEmptyRow,
    updateInputItem,
    handleFetchFromSheet,
    clearInputList,
    removeInputItem,
    checkAndTransfer,
    removeExportItem,
    handleConfirmExport,
    handleExportCSV // Export new function
  };
};