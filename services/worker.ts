import { InventoryItem, WorkerAction, WorkerResponse } from '../types';
import { WORKER_CODE } from '../workers/inventory.worker';

// Cache Blob URL để tránh tạo object URL liên tục gây leak memory
let workerBlobUrl: string | null = null;

// --- FACTORY FOR WORKER CREATION ---
// Allows creating new worker instances using the same code blob
export const createWorker = (): Worker => {
  try {
    if (!workerBlobUrl) {
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        workerBlobUrl = URL.createObjectURL(blob);
    }
    const worker = new Worker(workerBlobUrl);
    return worker;
  } catch (e) {
    console.error("Failed to create worker", e);
    throw e;
  }
};

// --- SINGLETON WORKER INSTANCE (For Transform/Merge) ---
let sharedWorker: Worker | null = null;

const getSharedWorker = (): Worker => {
  if (!sharedWorker) {
    sharedWorker = createWorker();
    console.log("System: Singleton Transform Worker Initialized");
  }
  return sharedWorker;
};

// Decoder for Transferable Objects
const decoder = new TextDecoder();

const decodeWorkerResponse = (data: WorkerResponse) => {
  if ('resultBuffer' in data && data.resultBuffer) {
    const jsonString = decoder.decode(data.resultBuffer);
    return JSON.parse(jsonString);
  }
  if ('result' in data) {
    return data.result;
  }
  return [];
};

// --- ADAPTER / TRANSFORMER LOGIC ---
// This acts as the Adapter Layer, transforming raw arrays to Typed Objects via Worker
export const WorkerService = {
  createWorker, // Export factory for other hooks (e.g. Filter)

  transformData: (rawData: any[][]): Promise<InventoryItem[]> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = getSharedWorker();

        const handleMessage = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.action === 'TRANSFORM_RESULT') {
            try {
                if (e.data.error) {
                    throw new Error(e.data.error);
                }
                const result = decodeWorkerResponse(e.data);
                resolve(result);
            } catch (err) {
                reject(err);
            }
            worker.removeEventListener('message', handleMessage); 
          }
        };

        worker.addEventListener('message', handleMessage);
        
        worker.onerror = (e) => {
          console.error("Worker Transform Error", e);
          reject(e);
          worker.removeEventListener('message', handleMessage);
        };

        // Send data to worker for transformation (Adapter pattern implementation)
        const message: WorkerAction = { action: 'TRANSFORM', rawData };
        worker.postMessage(message);

      } catch (err) {
        reject(err);
      }
    });
  },

  mergeData: (currentData: InventoryItem[], newItems: InventoryItem[]): Promise<InventoryItem[]> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = getSharedWorker();

        const handleMessage = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.action === 'MERGE_RESULT') {
            try {
                if (e.data.error) {
                    throw new Error(e.data.error);
                }
                const result = decodeWorkerResponse(e.data);
                resolve(result);
            } catch (err) {
                reject(err);
            }
            worker.removeEventListener('message', handleMessage);
          }
        };

        worker.addEventListener('message', handleMessage);

        worker.onerror = (e) => {
          console.error("Worker Merge Error", e);
          reject(e);
          worker.removeEventListener('message', handleMessage);
        };

        const message: WorkerAction = { action: 'MERGE_DATA', currentData, newItems };
        worker.postMessage(message);

      } catch (err) {
        reject(err);
      }
    });
  }
};