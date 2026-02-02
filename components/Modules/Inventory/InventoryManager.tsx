import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useInventoryQuery } from '../../../hooks/useInventoryQuery'; 
import { useUIStore } from '../../../stores/uiStore'; 
import { InventoryToolbar } from './InventoryToolbar';
import { InventoryTable } from './InventoryTable';
import { useInventoryFilter } from '../../../hooks/useInventoryFilter';
import { useInventoryActions } from '../../../hooks/useInventoryActions';
import { INVENTORY_COLUMNS, getDefaultCellStyle } from '../../../utils/inventoryColumnConfig';
import { useToast } from '../../../contexts/ToastContext';
import { GLOBAL_EVENTS } from '../../../hooks/useGlobalShortcuts';
import { useSelection } from '../../../hooks/useSelection';
import { InventoryItem } from '../../../types';

// Code Splitting for heavy modals
const EditInventoryModal = React.lazy(() => import('./EditInventoryModal').then(m => ({ default: m.EditInventoryModal })));
const LabelPrintingModal = React.lazy(() => import('../LabelPrinting/LabelPrintingModal').then(m => ({ default: m.LabelPrintingModal })));

export const InventoryManager: React.FC = () => {
  // 1. Data & Fetching State
  const { inventory, isLoading: isInitialLoading, isFetching: isSyncing, refresh } = useInventoryQuery();
  const { addToast } = useToast();
  
  // 2. Actions & Local UI State
  const { editingItem, handleRowDoubleClick, handleCloseModal, handleSaveItem } = useInventoryActions();

  // 3. UI Global State
  const { inventoryViewState, setInventoryViewState } = useUIStore();
  
  // 4. Business Logic Layer (Filtering)
  const {
    displayInventory,
    totalWeight,
    isFiltering,
    filters,
    sortConfig,
    updateFilter,
    updateRangeFilter,
    clearRangeFilters,
    handleSort,
    exportAndDownloadCSV
  } = useInventoryFilter(inventory, inventoryViewState);

  // 5. Selection Logic (Optimized via Custom Hook)
  const { 
    selectedKeys: selectedSkus, 
    toggle: handleSelectRow, 
    toggleAll: handleSelectAll, 
    clear: clearSelection,
    count: selectedCount
  } = useSelection<InventoryItem>(displayInventory, (item) => item.sku);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Reset selection when filters change (data changes)
  useEffect(() => {
    clearSelection();
  }, [filters, sortConfig, clearSelection]);

  // Sync state changes back to Global Store
  useEffect(() => {
    setInventoryViewState(filters);
  }, [filters, setInventoryViewState]);

  // Wrappers
  const handleExportCSV = useCallback(() => {
    exportAndDownloadCSV(INVENTORY_COLUMNS, "TonKho");
  }, [exportAndDownloadCSV]);

  const handleOpenPrintModal = useCallback(() => {
      if (selectedCount === 0) {
          addToast("Vui lòng chọn ít nhất một dòng để in tem", "warning");
          return;
      }
      setIsPrintModalOpen(true);
  }, [selectedCount, addToast]);

  // --- LISTEN FOR GLOBAL SHORTCUTS ---
  useEffect(() => {
    const handleGlobalPrint = () => handleOpenPrintModal();
    const handleGlobalSync = () => {
       addToast("Đang đồng bộ dữ liệu...", "info");
       refresh();
    };

    window.addEventListener(GLOBAL_EVENTS.TRIGGER_PRINT, handleGlobalPrint);
    window.addEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);

    return () => {
        window.removeEventListener(GLOBAL_EVENTS.TRIGGER_PRINT, handleGlobalPrint);
        window.removeEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);
    };
  }, [handleOpenPrintModal, refresh, addToast]);

  // Derived Selected Items for Modal
  const selectedItemsForPrint = useMemo(() => {
      return displayInventory.filter(item => selectedSkus.has(item.sku));
  }, [displayInventory, selectedSkus]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
          <InventoryToolbar 
            totalWeight={totalWeight}
            totalRows={displayInventory.length}
            isPending={isFiltering}
            isSyncing={isSyncing}
            
            // Cleaned up Props
            filterState={filters}
            onUpdateFilter={updateFilter}
            onClearRangeFilters={clearRangeFilters}
            
            onRefresh={refresh}
            onExportCSV={handleExportCSV}
            onPrint={handleOpenPrintModal}
            selectedCount={selectedCount}
            
            columns={INVENTORY_COLUMNS}
          />
      </div>

      <InventoryTable 
        data={displayInventory}
        isLoading={isInitialLoading}
        isSyncing={isSyncing}
        columns={INVENTORY_COLUMNS}
        
        sortConfig={sortConfig}
        onSort={handleSort}
        
        // Combined Filter State
        filterState={filters}
        
        onRowDoubleClick={handleRowDoubleClick}
        getDefaultStyle={getDefaultCellStyle}

        // Selection Props
        selectedSkus={selectedSkus}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
      />

      {editingItem && (
        <React.Suspense fallback={null}>
          <EditInventoryModal 
            item={editingItem}
            isOpen={true}
            onClose={handleCloseModal}
            onSave={handleSaveItem}
          />
        </React.Suspense>
      )}

      {/* Label Printing Modal */}
      <React.Suspense fallback={null}>
        <LabelPrintingModal 
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          selectedItems={selectedItemsForPrint} 
        />
      </React.Suspense>
    </div>
  );
};