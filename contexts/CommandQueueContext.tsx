
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from './ToastContext';
import { SyncService } from '../services/sync';
import { QueueCommand } from '../types';

// --- Interfaces for Background Sync API ---
interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
}

type QueueStatus = 'IDLE' | 'PENDING' | 'SYNCING' | 'SUCCESS' | 'ERROR';

interface CommandQueueContextType {
  addCommand: (cmd: QueueCommand) => Promise<void>;
  queue: QueueCommand[];
  status: QueueStatus;
  lastSynced: Date | null;
}

const CommandQueueContext = createContext<CommandQueueContextType | undefined>(undefined);

export const CommandQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueueCommand[]>([]);
  const [status, setStatus] = useState<QueueStatus>('IDLE');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { addToast } = useToast();

  // 1. Init: Load queue from IndexedDB via SyncService
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const savedQueue = await SyncService.getQueue();
        if (savedQueue && Array.isArray(savedQueue) && savedQueue.length > 0) {
          setQueue(savedQueue);
          setStatus('PENDING');
          addToast(`Đã khôi phục ${savedQueue.length} lệnh chưa gửi`, 'info');
          
          registerBackgroundSync();
        }
      } catch (e) {
        console.error("Failed to load command queue", e);
      }
    };
    loadQueue();
  }, [addToast]);

  // 2. Listen to Broadcast Channel (from SW or SyncService)
  useEffect(() => {
    const channel = new BroadcastChannel(SyncService.CONSTANTS.BROADCAST_CHANNEL);
    
    channel.onmessage = (event) => {
      const { type, count, results } = event.data;

      if (type === 'SYNC_COMPLETE') {
        console.log('UI received SYNC_COMPLETE');
        setQueue([]); 
        setLastSynced(new Date());
        setStatus('SUCCESS');
        
        // --- Enhanced Conflict & Error Feedback ---
        // Check if results contain specific errors
        if (results && Array.isArray(results)) {
            const conflicts = results.filter((r: any) => r.success === false && (r.message?.includes('conflict') || r.message?.includes('mismatch')));
            const errors = results.filter((r: any) => r.success === false && !conflicts.includes(r));

            if (conflicts.length > 0) {
                // Show critical warning for conflicts
                addToast(`CẢNH BÁO: Phát hiện ${conflicts.length} xung đột dữ liệu! Một số thay đổi đã bị từ chối do có người khác chỉnh sửa.`, 'warning', 8000);
            } else if (errors.length > 0) {
                addToast(`Đồng bộ có lỗi: ${errors.length} lệnh thất bại.`, 'error');
            } else {
                addToast(`Đồng bộ dữ liệu thành công (${count} lệnh)`, 'success');
            }
        } else {
            addToast(`Đồng bộ dữ liệu thành công (${count} lệnh)`, 'success');
        }
        
        setTimeout(() => {
          setStatus('IDLE');
        }, 3000);
      } else if (type === 'SYNC_ERROR') {
          setStatus('ERROR');
          addToast(`Lỗi đồng bộ nền: ${event.data.error || 'Unknown'}`, 'error');
      }
    };

    return () => channel.close();
  }, [addToast]);

  const registerBackgroundSync = async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync;
        await registration.sync.register(SyncService.CONSTANTS.SYNC_TAG);
      } catch (err) {
        console.warn('Background Sync registration failed:', err);
      }
    }
  };

  const addCommand = useCallback(async (cmd: QueueCommand) => {
    setStatus('PENDING');
    
    // Update Local State (Optimistic UI)
    setQueue((prev) => [...prev, cmd]);

    // Persist to IDB via Service
    try {
        await SyncService.addToQueue(cmd);
        registerBackgroundSync();
    } catch (e) {
        console.error("Failed to add command to SyncService", e);
        addToast("Lỗi lưu lệnh offline", "error");
    }
  }, [addToast]);

  // 4. Batch Processing Fallback (Foreground Sync when Online)
  const processQueueBatch = useCallback(async () => {
    if (status === 'SYNCING' || queue.length === 0) return;

    setStatus('SYNCING');
    
    try {
      // Gọi chung Logic SyncService
      await SyncService.processQueue();
      
      // Note: State update sẽ được trigger bởi BroadcastChannel listener ở trên
      // để đảm bảo đồng bộ với logic của Service Worker.
    } catch (error) {
      console.error("[Batch] Sync Error", error);
      setStatus('ERROR');
      // Just show simple error here, detailed feedback comes from Broadcast if partial success
      // If complete network fail:
      if (!navigator.onLine) {
          addToast('Mất kết nối mạng. Dữ liệu sẽ được gửi khi có mạng.', 'warning');
      } else {
          addToast('Lỗi kết nối máy chủ. Hệ thống sẽ tự thử lại.', 'error');
      }
      registerBackgroundSync();
    }
  }, [queue, status, addToast]);

  // Interval trigger for batching (Foreground Check)
  useEffect(() => {
    const interval = setInterval(() => {
      if (queue.length > 0 && status !== 'SYNCING') {
        if (navigator.onLine) {
            processQueueBatch();
        }
      }
    }, 15000); 

    return () => clearInterval(interval);
  }, [queue, status, processQueueBatch]);

  return (
    <CommandQueueContext.Provider value={{ addCommand, queue, status, lastSynced }}>
      {children}
    </CommandQueueContext.Provider>
  );
};

export const useCommandQueue = () => {
  const context = useContext(CommandQueueContext);
  if (context === undefined) {
    throw new Error('useCommandQueue must be used within a CommandQueueProvider');
  }
  return context;
};
