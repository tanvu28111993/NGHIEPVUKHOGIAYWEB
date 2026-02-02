import React, { useCallback, useMemo, useEffect } from 'react';
import { useHistoryLogic } from '../../../hooks/useHistoryLogic';
import { useInventoryFilter } from '../../../hooks/useInventoryFilter';
import { useUIStore } from '../../../stores/uiStore'; 
import { INVENTORY_COLUMNS, getDefaultCellStyle } from '../../../utils/inventoryColumnConfig';
import { InventoryTable } from '../Inventory/InventoryTable'; // Reusing table from Inventory
import { HistoryToolbar } from './HistoryToolbar';
import { useToast } from '../../../contexts/ToastContext';

export const HistoryManager: React.FC = () => {
  const { historyViewState, setHistoryViewState } = useUIStore();
  const { addToast } = useToast();

  // 1. Data Logic Extracted to Hook
  const {
    historyData,
    isLoading,
    isBackgroundUpdating,
    filterConfig,
    handleDateFilterChange,
    handleRefresh
  } = useHistoryLogic();

  // 2. UI State Logic (Tabs)
  const activeTabs = historyViewState.activeTabs;
  
  const filteredDataByTab = useMemo(() => {
      if (activeTabs.length === 0) return [];
      return historyData.filter(item => item.transactionType && activeTabs.includes(item.transactionType));
  }, [historyData, activeTabs]);

  const handleToggleTab = useCallback((tab: 'IMPORT' | 'EXPORT') => {
    setHistoryViewState({
        activeTabs: activeTabs.includes(tab) 
            ? activeTabs.filter(t => t !== tab) 
            : [...activeTabs, tab]
    });
  }, [historyViewState, setHistoryViewState, activeTabs]);

  // 3. Worker Filtering Logic
  const {
    displayInventory,
    totalWeight,
    filters,
    sortConfig,
    updateFilter,
    handleSort,
    exportAndDownloadCSV
  } = useInventoryFilter(filteredDataByTab, {
      searchTerm: historyViewState.searchTerm,
      searchColumn: historyViewState.searchColumn
  });

  // Sync Global Search State
  useEffect(() => {
    if (filters.searchTerm !== historyViewState.searchTerm || filters.searchColumn !== historyViewState.searchColumn) {
         setHistoryViewState({
             searchTerm: filters.searchTerm,
             searchColumn: filters.searchColumn
         });
    }
  }, [filters.searchTerm, filters.searchColumn, historyViewState, setHistoryViewState]);

  const handleExportCSV = useCallback(() => {
    if (displayInventory.length === 0) {
      addToast("Không có dữ liệu để xuất file CSV", "info");
      return;
    }
    exportAndDownloadCSV(INVENTORY_COLUMNS, "LichSu");
  }, [displayInventory, addToast, exportAndDownloadCSV]);
  
  const handleSearchChange = useCallback((val: string) => updateFilter('searchTerm', val), [updateFilter]);
  const handleSearchColumnChange = useCallback((val: string) => updateFilter('searchColumn', val), [updateFilter]);

  return (
    <div className="w-full h-full flex flex-col">
      <HistoryToolbar 
        totalWeight={totalWeight}
        totalRows={displayInventory.length}
        isSyncing={isLoading || isBackgroundUpdating}
        
        searchTerm={filters.searchTerm}
        onSearchChange={handleSearchChange}
        
        searchColumn={filters.searchColumn}
        onSearchColumnChange={handleSearchColumnChange}
        
        activeTabs={activeTabs}
        onToggleTab={handleToggleTab}

        onRefresh={handleRefresh}
        onExportCSV={handleExportCSV}
        
        onDateFilterChange={handleDateFilterChange}
        
        initialYear={filterConfig.year}
        initialMonths={filterConfig.months}

        columns={INVENTORY_COLUMNS}
      />

      <InventoryTable 
        data={displayInventory}
        isLoading={isLoading}
        isSyncing={isBackgroundUpdating}
        columns={INVENTORY_COLUMNS}
        
        sortConfig={sortConfig}
        onSort={handleSort}
        
        // Pass filter state directly from hook
        filterState={filters}
        
        hideFooter={true}
        getDefaultStyle={getDefaultCellStyle}
      />
    </div>
  );
};