
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { InventoryItem, ExportInputItem, ExportStagingItem, ReImportInputItem, ReImportStagingItem } from '../types';

interface WorkflowState {
  // Import Module State
  pendingImports: InventoryItem[];
  setPendingImports: (items: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => void;

  // Export Module State
  exportInputList: ExportInputItem[];
  exportStagingList: ExportStagingItem[];
  setExportInputList: (items: ExportInputItem[] | ((prev: ExportInputItem[]) => ExportInputItem[])) => void;
  setExportStagingList: (items: ExportStagingItem[] | ((prev: ExportStagingItem[]) => ExportStagingItem[])) => void;

  // Re-Import Module State
  reImportInputList: ReImportInputItem[];
  reImportStagingList: ReImportStagingItem[];
  setReImportInputList: (items: ReImportInputItem[] | ((prev: ReImportInputItem[]) => ReImportInputItem[])) => void;
  setReImportStagingList: (items: ReImportStagingItem[] | ((prev: ReImportStagingItem[]) => ReImportStagingItem[])) => void;

  // Reset Actions
  resetImportState: () => void;
  resetExportState: () => void;
  resetReImportState: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      // --- Import ---
      pendingImports: [],
      setPendingImports: (updater) => set((state) => ({
         pendingImports: typeof updater === 'function' ? updater(state.pendingImports) : updater
      })),

      // --- Export ---
      exportInputList: [],
      exportStagingList: [],
      setExportInputList: (updater) => set((state) => ({
         exportInputList: typeof updater === 'function' ? updater(state.exportInputList) : updater
      })),
      setExportStagingList: (updater) => set((state) => ({
         exportStagingList: typeof updater === 'function' ? updater(state.exportStagingList) : updater
      })),

      // --- Re-Import ---
      reImportInputList: [],
      reImportStagingList: [],
      setReImportInputList: (updater) => set((state) => ({
         reImportInputList: typeof updater === 'function' ? updater(state.reImportInputList) : updater
      })),
      setReImportStagingList: (updater) => set((state) => ({
         reImportStagingList: typeof updater === 'function' ? updater(state.reImportStagingList) : updater
      })),

      // --- Resets ---
      resetImportState: () => set({ pendingImports: [] }),
      resetExportState: () => set({ exportInputList: [], exportStagingList: [] }),
      resetReImportState: () => set({ reImportInputList: [], reImportStagingList: [] }),
    }),
    {
      name: 'workflow-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
