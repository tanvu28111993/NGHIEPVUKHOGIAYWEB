
import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InventoryItem } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useCommandQueue } from '../contexts/CommandQueueContext';
import { useInventoryQuery } from './useInventoryQuery';
import { QUERY_KEYS } from '../utils/constants';
import { useWorkflowStore } from '../stores/workflowStore';

export const useImportManager = () => {
  const { addToast } = useToast();
  const { addCommand } = useCommandQueue();
  const { inventory } = useInventoryQuery();
  const queryClient = useQueryClient();

  // Sử dụng Store thay vì useState cục bộ
  const { pendingImports, setPendingImports, resetImportState } = useWorkflowStore();

  // Tạo Set chứa các SKU đã tồn tại để tra cứu nhanh (O(1))
  const existingSkus = useMemo(() => {
    return new Set((inventory as InventoryItem[]).map(item => item.sku));
  }, [inventory]);

  // Helper tạo mã SKU theo định dạng
  // Format: TB[MãMụcĐích][MãKiện]_[Gsm]_[NgàyDDMMYY]_[Suffix4Digits]
  const generateSKU = (
      purposeCode: string, 
      packetCode: string, 
      gsm: string, 
      importDate: string,
      sequenceNumber: number
  ) => {
      const prefix = `TB${purposeCode}${packetCode}`;
      
      let dateCode = "000000";
      if (importDate) {
          const parts = importDate.split('/');
          if (parts.length === 3) {
              const d = parts[0];
              const m = parts[1];
              const y = parts[2].slice(-2);
              dateCode = `${d}${m}${y}`;
          }
      }

      const suffix = sequenceNumber.toString().padStart(4, '0');
      return `${prefix}_${gsm}_${dateCode}_${suffix}`;
  };

  // Thêm vào bảng tạm
  const addToTable = useCallback((
      itemData: Omit<InventoryItem, 'sku'>, 
      copies: number,
      codes: { purposeCode: string; packetCode: string }
  ) => {
    const newItems: InventoryItem[] = [];
    
    for (let i = 0; i < copies; i++) {
        const newSku = generateSKU(
            codes.purposeCode, 
            codes.packetCode, 
            itemData.gsm, 
            itemData.importDate, 
            i + 1
        );
        
        newItems.push({
            ...itemData,
            sku: newSku,
            transactionType: 'IMPORT'
        });
    }

    setPendingImports(prev => [...newItems, ...prev]);
    addToast(`Đã thêm ${copies} dòng vào bảng tạm`, "info");
  }, [addToast, setPendingImports]);

  // Xóa khỏi bảng tạm
  const removeItem = useCallback((index: number) => {
    setPendingImports(prev => prev.filter((_, i) => i !== index));
  }, [setPendingImports]);

  // Lưu vào kho (Dispatch Command)
  const saveToInventory = useCallback(async () => {
    if (pendingImports.length === 0) return;

    // Validate Duplicate
    const duplicates = pendingImports.filter(item => existingSkus.has(item.sku));
    if (duplicates.length > 0) {
        addToast(`Cảnh báo: Có ${duplicates.length} mã SKU bị trùng với tồn kho. Vui lòng kiểm tra lại!`, "error", 5000);
        return;
    }

    try {
        // 1. Lưu xuống Backend (Queue) - Dạng Mảng (Batch)
        // Thay vì gửi N lệnh, gửi 1 lệnh chứa mảng dữ liệu để Google Sheet xử lý setValues (bulk insert)
        await addCommand({
            id: crypto.randomUUID(),
            type: 'IMPORT_BATCH',
            payload: pendingImports, 
            timestamp: Date.now()
        });

        // 2. Cập nhật ngay lập tức vào Cache Tồn Kho (Optimistic Update)
        queryClient.setQueryData(QUERY_KEYS.INVENTORY, (oldData: InventoryItem[] | undefined) => {
            const newInventoryItems = pendingImports.map(item => ({ ...item }));
            
            if (!oldData) return newInventoryItems;
            
            // Merge vào dữ liệu cũ
            return [...oldData, ...newInventoryItems];
        });

        addToast(`Đã lưu kho thành công ${pendingImports.length} cuộn giấy!`, "success");
        resetImportState();
    } catch (error) {
        console.error("Save error", error);
        addToast("Có lỗi xảy ra khi lưu kho.", "error");
    }
  }, [pendingImports, existingSkus, addCommand, addToast, queryClient, resetImportState]);

  return {
    pendingImports,
    existingSkus,
    addToTable,
    removeItem,
    saveToInventory
  };
};
