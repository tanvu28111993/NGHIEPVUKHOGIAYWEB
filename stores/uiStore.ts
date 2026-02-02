import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface InventoryViewState {
  searchTerm: string;
  searchColumn: string;
  showOddLots: boolean;
  showPendingOut: boolean;
  showAdvancedFilters: boolean;
  rangeFilters: {
    widthMin: string;
    widthMax: string;
    lengthMin: string;
    lengthMax: string;
  };
}

export interface HistoryViewState {
  searchTerm: string;
  searchColumn: string;
  activeTabs: ('IMPORT' | 'EXPORT')[];
}

interface UIState {
  inventoryViewState: InventoryViewState;
  setInventoryViewState: (state: Partial<InventoryViewState>) => void;
  
  historyViewState: HistoryViewState;
  setHistoryViewState: (state: Partial<HistoryViewState>) => void;
  
  resetInventoryState: () => void;
}

const DEFAULT_INVENTORY_STATE: InventoryViewState = {
  searchTerm: '',
  searchColumn: 'all',
  showOddLots: false,
  showPendingOut: false,
  showAdvancedFilters: false,
  rangeFilters: { widthMin: '', widthMax: '', lengthMin: '', lengthMax: '' }
};

const DEFAULT_HISTORY_STATE: HistoryViewState = {
  searchTerm: '',
  searchColumn: 'all',
  activeTabs: ['IMPORT', 'EXPORT']
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      inventoryViewState: DEFAULT_INVENTORY_STATE,
      setInventoryViewState: (newState) => 
        set((state) => ({ 
          inventoryViewState: { ...state.inventoryViewState, ...newState } 
        })),

      historyViewState: DEFAULT_HISTORY_STATE,
      setHistoryViewState: (newState) => 
        set((state) => ({ 
          historyViewState: { ...state.historyViewState, ...newState } 
        })),
        
      resetInventoryState: () => set({ inventoryViewState: DEFAULT_INVENTORY_STATE })
    }),
    {
      name: 'ui-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
          inventoryViewState: state.inventoryViewState,
          historyViewState: state.historyViewState
      }),
    }
  )
);