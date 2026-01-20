
import { get, set, del } from 'idb-keyval';

// IndexedDB is asynchronous and can store large objects (blobs, arrays) > 5MB.
// This prevents LocalStorage quota errors and UI freezing during serialization.

export const storage = {
  get: async <T>(key: string): Promise<T | undefined> => {
    try {
      return await get<T>(key);
    } catch (error) {
      console.error(`Error getting key ${key} from IDB:`, error);
      return undefined;
    }
  },
  
  set: async (key: string, value: any): Promise<void> => {
    try {
      await set(key, value);
    } catch (error) {
      console.error(`Error setting key ${key} to IDB:`, error);
    }
  },
  
  remove: async (key: string): Promise<void> => {
    try {
      await del(key);
    } catch (error) {
       console.error(`Error removing key ${key} from IDB:`, error);
    }
  }
};
