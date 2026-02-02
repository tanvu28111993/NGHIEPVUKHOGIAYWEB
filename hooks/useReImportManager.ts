
import { useState, useCallback } from 'react';
import { InventoryItem } from '../types';
import { useInventoryQuery } from './useInventoryQuery';
import { useToast } from '../contexts/ToastContext';
import { useCommandQueue } from '../contexts/CommandQueueContext';
import { useAuth } from '../contexts/AuthContext';
import { parseVNToNumber, formatDateTime } from '../utils/formatting';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../utils/constants';
import { InventoryService } from '../services/inventory';

export interface ReImportInputItem {
  id: string;
  sku: string;
  reImportQty: string;
  reImportWeight: string; // New field
}

export interface ReImportStagingItem extends InventoryItem {
  reImportQty: number;
  reImportWeight: number;
}

export const useReImportManager = () => {
  const { inventory } = useInventoryQuery(); // Still needed for optimistic updates
  const { addToast } = useToast();
  const { addCommand } = useCommandQueue();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load Recent Exports for Validation (3 Months)
  const { data: recentExports = [] } = useQuery({
      queryKey: ['recentExports'],
      queryFn: InventoryService.fetchRecentExports,
      staleTime: 1000 * 60 * 15, // Cache for 15 mins
      refetchOnWindowFocus: false
  });

  // Left Panel State: List of SKU/Qty/Weight to check
  const [inputList, setInputList] = useState<ReImportInputItem[]>([]);
  
  // Right Panel State: Validated items ready for re-import
  const [reImportList, setReImportList] = useState<ReImportStagingItem[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // 1. Add Empty Row
  const addEmptyRow = useCallback(() => {
    setInputList(prev => [...prev, {
        id: crypto.randomUUID(),
        sku: '',
        reImportQty: '1',
        reImportWeight: ''
    }]);
  }, []);

  // 2. Update Row
  const updateInputItem = useCallback((id: string, field: keyof ReImportInputItem, value: string) => {
    setInputList(prev => prev.map(item => {
        if (item.id === id) {
            let newVal = value;
            if (field === 'sku') newVal = value.toUpperCase();
            return { ...item, [field]: newVal };
        }
        return item;
    }));
  }, []);

  const removeInputItem = useCallback((id: string) => {
    setInputList(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearInputList = useCallback(() => {
    setInputList([]);
  }, []);

  // Fetch from Sheet 'SKUN'
  const handleFetchFromSheet = useCallback(async () => {
    setIsLoadingSheet(true);
    try {
        const requests = await InventoryService.fetchReImportRequests();
        
        if (!requests || requests.length === 0) {
            addToast("Sheet SKUN trống hoặc không có dữ liệu hợp lệ", "info");
            setIsLoadingSheet(false);
            return;
        }

        const newItems: ReImportInputItem[] = [];
        let skippedCount = 0;

        requests.forEach(req => {
            const sku = req.sku.toUpperCase();
            // Check duplicate in Re-Import List
            if (reImportList.some(ex => ex.sku === sku)) {
                skippedCount++;
                return;
            }

            newItems.push({
                id: crypto.randomUUID(),
                sku: sku,
                reImportQty: req.quantity ? String(req.quantity).replace(',', '.') : '1',
                reImportWeight: req.weight ? String(req.weight).replace('.', ',') : '' // Sheet weight usually double with dot
            });
        });

        if (newItems.length > 0) {
            setInputList(prev => [...prev, ...newItems]);
            addToast(`Đã lấy ${newItems.length} mã từ Sheet SKUN`, "success");
            if (skippedCount > 0) {
                 addToast(`Đã bỏ qua ${skippedCount} mã vì đang ở bảng nhập lại`, "info");
            }
        } else {
             if (skippedCount > 0) {
                 addToast("Tất cả mã trong Sheet đều đang được xử lý", "warning");
             }
        }

    } catch (err) {
        console.error("Fetch Sheet failed", err);
        addToast("Không thể lấy dữ liệu từ Sheet. Vui lòng thử lại.", "error");
    } finally {
        setIsLoadingSheet(false);
    }
  }, [reImportList, addToast]);

  // 3. Check & Transfer Logic (Use Recent Exports for Validation)
  const checkAndTransfer = useCallback(() => {
    if (inputList.length === 0) return;

    // Filter out empty rows
    const validInputs = inputList.filter(i => i.sku.trim() !== '');
    
    if (validInputs.length === 0) {
        addToast("Danh sách SKU trống", "warning");
        return;
    }

    const newReImportItems: ReImportStagingItem[] = [];
    const notFoundSkus: string[] = [];
    const remainingInputs: ReImportInputItem[] = [];

    const processedSkus = new Set<string>();

    validInputs.forEach(input => {
      // Check duplicate in current batch or existing list
      if (processedSkus.has(input.sku) || reImportList.some(ex => ex.sku === input.sku)) {
          remainingInputs.push(input);
          return;
      }

      // CHANGE: Look up in recentExports instead of inventory
      // We look for items that were *previously exported* to re-import them.
      const foundInHistory = recentExports.find(item => item.sku === input.sku);
      
      // Also check if it happens to be in current inventory (maybe re-importing partly?)
      // Priority: History Data (since we want original specs) -> Current Inventory
      const foundItem = foundInHistory || inventory.find(inv => inv.sku === input.sku);

      if (foundItem) {
        const qtyToAdd = parseVNToNumber(input.reImportQty);
        
        // Use user-provided weight DIRECTLY
        const weightToAdd = parseVNToNumber(input.reImportWeight);

        newReImportItems.push({
          ...foundItem, // Copy specs from history/inventory
          reImportQty: qtyToAdd,
          reImportWeight: weightToAdd
        });
        processedSkus.add(input.sku);

      } else {
        notFoundSkus.push(input.sku);
        remainingInputs.push(input);
      }
    });

    if (newReImportItems.length > 0) {
      setReImportList(prev => [...newReImportItems, ...prev]);
      addToast(`Đã chuyển ${newReImportItems.length} mã sang bảng nhập lại`, "success");
    }

    if (notFoundSkus.length > 0) {
      addToast(`Không tìm thấy ${notFoundSkus.length} mã trong lịch sử xuất (3 tháng gần nhất)`, "error");
    }

    setInputList(remainingInputs);

  }, [inputList, recentExports, inventory, addToast, reImportList]);

  // 4. Remove from Re-Import List
  const removeReImportItem = useCallback((sku: string) => {
    setReImportList(prev => prev.filter(item => item.sku !== sku));
  }, []);

  // 5. Confirm Re-Import (BATCH)
  const handleConfirmReImport = useCallback(async () => {
    if (reImportList.length === 0) return;

    try {
        const currentTime = formatDateTime(new Date());
        const currentUser = user?.username || 'Unknown';

        // Prepare payload for RE_IMPORT_BATCH
        const itemsToReImport = reImportList.map(item => {
             // Logic: Check if item exists in current inventory to determine new Qty/Weight
             // If not in current inventory, it's a "New" item (restoring deleted stock)
             const currentInStock = inventory.find(inv => inv.sku === item.sku);
             
             const currentQty = currentInStock ? currentInStock.quantity : 0;
             const currentWeight = currentInStock ? currentInStock.weight : 0;

             const newQty = currentQty + item.reImportQty;
             const newWeight = currentWeight + item.reImportWeight;
             
             return {
                 sku: item.sku,
                 reImportQty: item.reImportQty,
                 reImportWeight: item.reImportWeight,
                 // History Log (Snapshot of what is being added)
                 originalItem: {
                     ...item,
                     quantity: item.reImportQty,
                     weight: item.reImportWeight,
                     lastUpdated: currentTime,
                     importer: currentUser
                 },
                 // Inventory Update (New Balance)
                 updatedItem: {
                     ...item,
                     quantity: newQty,
                     weight: newWeight,
                     lastUpdated: currentTime,
                     importer: currentUser
                 }
             };
        });

        // 1. Send Command
        await addCommand({
             id: crypto.randomUUID(),
             type: 'RE_IMPORT_BATCH',
             payload: itemsToReImport,
             timestamp: Date.now()
        });

        // 2. Optimistic Update (Local Cache)
        queryClient.setQueryData(QUERY_KEYS.INVENTORY, (oldData: InventoryItem[] | undefined) => {
            if (!oldData) return [];
            
            // Create map of items to update
            const importMap = new Map<string, InventoryItem>(
                itemsToReImport.map(i => [i.sku, i.updatedItem as InventoryItem])
            );
            
            // Update existing items
            const updatedData = oldData.map(item => {
                const updated = importMap.get(item.sku);
                if (updated) {
                    importMap.delete(item.sku); // Remove processed
                    return updated;
                }
                return item;
            });

            // Append "new" items (restored from history that were previously 0/deleted)
            const newItems = Array.from(importMap.values());
            
            return [...updatedData, ...newItems];
        });

        addToast(`Đã nhập lại ${reImportList.length} mã. Dữ liệu đang được đồng bộ.`, "success");
        setReImportList([]);

    } catch (error) {
        console.error("Re-import error", error);
        addToast("Lỗi khi thực hiện nhập lại", "error");
    }
  }, [reImportList, addCommand, addToast, user, queryClient, inventory]);

  return {
    inputList,
    reImportList,
    isLoadingSheet,
    addEmptyRow,
    updateInputItem,
    clearInputList,
    removeInputItem,
    checkAndTransfer,
    removeReImportItem,
    handleConfirmReImport,
    handleFetchFromSheet
  };
};