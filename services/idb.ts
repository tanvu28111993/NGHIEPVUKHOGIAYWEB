import { DB_CONFIG } from '../utils/constants';

// Service quản lý IndexedDB với Connection Pooling (Singleton Promise)
let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Tạo các store nếu chưa có
        Object.values(DB_CONFIG.STORES).forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        });
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Xử lý khi connection bị đóng đột ngột (do version change ở tab khác v.v)
        db.onversionchange = () => {
            db.close();
            dbPromise = null;
        };
        db.onclose = () => {
            dbPromise = null;
        }

        resolve(db);
      };

      request.onerror = (event) => {
        dbPromise = null; // Reset promise on error
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  return dbPromise;
};

export const IDBService = {
  get: async (key: string, storeName: string = DB_CONFIG.STORES.INVENTORY) => {
    const db = await openDB();
    return new Promise<any>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  put: async (key: string, value: any, storeName: string = DB_CONFIG.STORES.INVENTORY) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  delete: async (key: string, storeName: string = DB_CONFIG.STORES.INVENTORY) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  clear: async (storeName: string) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Export constant reference
  STORES: DB_CONFIG.STORES
};