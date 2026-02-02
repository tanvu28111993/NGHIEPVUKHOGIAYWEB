
import { useState, useCallback } from 'react';
import { InventoryItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCommandQueue } from '../contexts/CommandQueueContext';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../utils/constants';
import { formatDateTime, parseVNDateTimeToTimestamp } from '../utils/formatting';
import { useInventoryQuery } from './useInventoryQuery';

export const useInventoryActions = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { addCommand } = useCommandQueue();
  const queryClient = useQueryClient();
  const { refresh } = useInventoryQuery();

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleRowDoubleClick = useCallback((item: InventoryItem) => {
    setEditingItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingItem(null);
  }, []);

  const handleSaveItem = useCallback(async (updatedItem: InventoryItem) => {
    // --- Conflict Resolution Strategy ---
    // Kiểm tra dữ liệu hiện tại trong Cache (được sync nền liên tục)
    const currentCache = queryClient.getQueryData<InventoryItem[]>(QUERY_KEYS.INVENTORY) || [];
    const latestVersion = currentCache.find(i => i.sku === updatedItem.sku);

    // updatedItem.lastUpdated tại thời điểm này VẪN LÀ thời gian cũ (khi mở form)
    // vì hàm formatDateTime() để gán thời gian mới chỉ được gọi bên dưới.
    if (latestVersion) {
        const latestTime = parseVNDateTimeToTimestamp(latestVersion.lastUpdated);
        const editingTime = parseVNDateTimeToTimestamp(updatedItem.lastUpdated);

        // Nếu dữ liệu trên server (latestTime) mới hơn dữ liệu đang sửa (editingTime)
        // Nghĩa là đã có người khác sửa trong lúc user đang mở form
        if (latestTime > editingTime) {
            const confirmed = window.confirm(
                `⚠️ CẢNH BÁO XUNG ĐỘT DỮ LIỆU!\n\n` +
                `SKU: ${updatedItem.sku}\n` +
                `Dữ liệu này vừa được cập nhật bởi: ${latestVersion.importer}\n` +
                `Vào lúc: ${latestVersion.lastUpdated}\n\n` +
                `Bạn đang sửa trên phiên bản cũ. Nếu tiếp tục, bạn sẽ GHI ĐÈ lên thay đổi của họ.\n` +
                `Bạn có chắc chắn muốn lưu không?`
            );

            if (!confirmed) {
                // Nếu hủy, nên reload lại dữ liệu để user thấy cái mới
                refresh();
                handleCloseModal();
                return;
            }
        }
    }

    // --- Prepare Save Data ---
    const formattedDate = formatDateTime(new Date());
    
    const finalItem = {
      ...updatedItem,
      importer: user?.username || updatedItem.importer || 'Unknown',
      lastUpdated: formattedDate
    };

    try {
      // 1. Update React Query Cache immediately (Optimistic UI)
      queryClient.setQueryData(QUERY_KEYS.INVENTORY, (oldData: InventoryItem[] | undefined) => {
          if (!oldData) return [finalItem];
          return oldData.map(item => item.sku === finalItem.sku ? finalItem : item);
      });

      // 2. Push command to queue for background sync
      await addCommand({
        id: crypto.randomUUID(),
        type: 'UPDATE',
        payload: finalItem,
        timestamp: Date.now()
      });

      console.log("Queued Update Item:", finalItem);
      addToast(`Đã lưu thay đổi cho SKU: ${finalItem.sku}.`, 'success');
      setEditingItem(null);
      
    } catch (error) {
      console.error("Failed to queue update command", error);
      addToast("Lỗi khi lưu thay đổi", "error");
      refresh(); // Revert data if error
    }
  }, [addToast, user, addCommand, queryClient, refresh, handleCloseModal]);

  return {
    editingItem,
    handleRowDoubleClick,
    handleCloseModal,
    handleSaveItem
  };
};
