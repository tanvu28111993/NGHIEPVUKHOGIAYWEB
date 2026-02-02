
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LabelTemplate, PrintConfig, LabelElement } from '../types/label';
import { DEFAULT_TEMPLATE, DEFAULT_PRINT_CONFIG } from '../utils/labelConstants';

interface LabelState {
  template: LabelTemplate;
  printConfig: PrintConfig;
  selectedElementId: string | null;
  savedTemplates: LabelTemplate[]; // Danh sách mẫu đã lưu

  setTemplate: (template: LabelTemplate) => void;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  addElement: (element: LabelElement) => void;
  removeElement: (id: string) => void;
  setPrintConfig: (config: Partial<PrintConfig>) => void;
  setSelectedElement: (id: string | null) => void;
  setBackgroundImage: (dataUrl: string | undefined) => void;
  resetTemplate: () => void;
  
  // Actions mới cho việc lưu mẫu
  saveTemplateAs: (name: string) => void;
  deleteSavedTemplate: (name: string) => void;
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set) => ({
      template: DEFAULT_TEMPLATE,
      printConfig: DEFAULT_PRINT_CONFIG,
      selectedElementId: null,
      savedTemplates: [],

      setTemplate: (template) => set({ template }),
      
      updateElement: (id, updates) => set((state) => ({
        template: {
          ...state.template,
          elements: state.template.elements.map(el => 
            el.id === id ? { ...el, ...updates } : el
          )
        }
      })),

      addElement: (element) => set((state) => ({
        template: {
          ...state.template,
          elements: [...state.template.elements, element]
        }
      })),

      removeElement: (id) => set((state) => ({
        template: {
          ...state.template,
          elements: state.template.elements.filter(el => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
        }
      })),

      setPrintConfig: (config) => set((state) => ({
        printConfig: { ...state.printConfig, ...config }
      })),

      setSelectedElement: (id) => set({ selectedElementId: id }),

      setBackgroundImage: (dataUrl) => set((state) => ({
        template: { ...state.template, backgroundImage: dataUrl }
      })),

      resetTemplate: () => set({ template: DEFAULT_TEMPLATE }),

      // Logic Lưu Mẫu
      saveTemplateAs: (name) => set((state) => {
          const newTemplate = { ...state.template, name };
          // Loại bỏ mẫu cũ nếu trùng tên, sau đó thêm mới vào đầu danh sách
          const others = state.savedTemplates.filter(t => t.name !== name);
          return { 
              template: newTemplate,
              savedTemplates: [newTemplate, ...others] 
          };
      }),

      // Logic Xóa Mẫu
      deleteSavedTemplate: (name) => set((state) => ({
          savedTemplates: state.savedTemplates.filter(t => t.name !== name)
      })),
    }),
    {
      name: 'label-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
         template: state.template,
         printConfig: state.printConfig,
         savedTemplates: state.savedTemplates // Persist danh sách này
      })
    }
  )
);
