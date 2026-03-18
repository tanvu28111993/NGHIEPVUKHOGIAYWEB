import React, { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useExpectedScheduleQuery } from '../../../hooks/useExpectedScheduleQuery';
import { useExpectedScheduleFilter } from '../../../hooks/useExpectedScheduleFilter';
import { ExpectedScheduleToolbar } from './ExpectedScheduleToolbar';
import { ExpectedScheduleTable } from './ExpectedScheduleTable';
import { EXPECTED_SCHEDULE_COLUMNS, getDefaultCellStyle } from '../../../utils/expectedScheduleColumnConfig';
import { useSelection } from '../../../hooks/useSelection';
import { ExpectedScheduleItem } from '../../../types';
import { navigateToMenu } from '../../../utils/navigation';
import { useCommandQueue } from '../../../contexts/CommandQueueContext';

export const ExpectedSchedule: React.FC = () => {
  const queryClient = useQueryClient();
  const { expectedSchedule, isLoading, isFetching, refresh } = useExpectedScheduleQuery();
  const { addCommand } = useCommandQueue();
  
  const {
    displayData,
    totalWeight,
    isFiltering,
    filters,
    sortConfig,
    updateFilter,
    handleSort,
    exportAndDownloadCSV
  } = useExpectedScheduleFilter(expectedSchedule);

  const { 
    selectedKeys: selectedIds, 
    toggle: handleSelectRow, 
    toggleAll: handleSelectAll, 
    clear: clearSelection,
    count: selectedCount
  } = useSelection<ExpectedScheduleItem>(displayData, (item) => item.id);

  const handleExportCSV = useCallback(() => {
    exportAndDownloadCSV(EXPECTED_SCHEDULE_COLUMNS, "LichDuKien");
  }, [exportAndDownloadCSV]);

  const handleImportToWarehouse = useCallback(() => {
    if (selectedCount === 0) return;
    
    // Get the actual selected items
    const selectedItems = displayData.filter(item => selectedIds.has(item.id));
    
    // Navigate to IMPORT menu and pass the selected items
    navigateToMenu('IMPORT', { selectedItems });
  }, [selectedCount, selectedIds, displayData]);

  const handleDeleteRows = useCallback(async () => {
    if (selectedCount === 0) return;

    const idsToDelete = Array.from(selectedIds);

    // 1. Optimistic update: Remove from cache
    queryClient.setQueryData(['expectedSchedule'], (oldData: ExpectedScheduleItem[] | undefined) => {
      if (!oldData) return [];
      return oldData.filter(item => !idsToDelete.includes(item.id));
    });

    // 2. Clear selection
    clearSelection();

    // 3. Queue command for backend
    const command = {
      id: crypto.randomUUID(),
      type: 'DELETE_SCHEDULE_BATCH',
      payload: idsToDelete,
      timestamp: Date.now()
    };

    await addCommand(command);
  }, [selectedCount, selectedIds, queryClient, clearSelection, addCommand]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <ExpectedScheduleToolbar 
          totalWeight={totalWeight}
          totalRows={displayData.length}
          isPending={isFiltering}
          isSyncing={isFetching}
          filterState={filters}
          onUpdateFilter={updateFilter}
          onRefresh={refresh}
          onExportCSV={handleExportCSV}
          onDeleteRows={handleDeleteRows}
          onImportToWarehouse={handleImportToWarehouse}
          selectedCount={selectedCount}
          columns={EXPECTED_SCHEDULE_COLUMNS}
        />
      </div>

      <ExpectedScheduleTable 
        data={displayData}
        isLoading={isLoading}
        isSyncing={isFetching}
        columns={EXPECTED_SCHEDULE_COLUMNS}
        sortConfig={sortConfig}
        onSort={handleSort}
        filterState={filters}
        getDefaultStyle={getDefaultCellStyle}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
};

