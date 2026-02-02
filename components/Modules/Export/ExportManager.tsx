import React from 'react';
import { ExportInputPanel } from './ExportInputPanel';
import { ExportTable } from './ExportTable';
import { useExportManager } from '../../../hooks/useExportManager';
import { ArrowUpFromLine, Save, Download } from 'lucide-react';
import { Button } from '../../UI/Button';
import { ManagerLayout } from '../../Layout/ManagerLayout';

export const ExportManager: React.FC = () => {
  const { 
    inputList, 
    exportList,
    isLoadingSheet,
    addToInputList,
    addEmptyRow,
    updateInputItem,
    handleFetchFromSheet,
    clearInputList,
    removeInputItem, 
    checkAndTransfer,
    removeExportItem,
    handleConfirmExport,
    handleExportCSV
  } = useExportManager();

  return (
    <ManagerLayout
        leftPanel={
            <ExportInputPanel 
                inputList={inputList}
                onAdd={addToInputList}
                onRemove={removeInputItem}
                onCheck={checkAndTransfer}
                onAddRow={addEmptyRow}
                onUpdateRow={updateInputItem}
                onFetchFromSheet={handleFetchFromSheet}
                onClear={clearInputList}
                isLoadingSheet={isLoadingSheet}
            />
        }
        title={
            <>
                <ArrowUpFromLine className="w-5 h-5 text-orange-500" />
                Bảng Xuất Kho ({exportList.length})
            </>
        }
        subTitle="* Trọng lượng xuất được tính tự động dựa trên tồn kho."
        actions={
            <>
                <Button 
                    onClick={handleExportCSV}
                    disabled={exportList.length === 0}
                    className="bg-blue-600/80 hover:bg-blue-700 border border-blue-500/50 text-white flex items-center gap-2 px-3"
                    title="Tải xuống file CSV"
                >
                    <Download className="w-4 h-4" /> CSV
                </Button>

                <Button 
                    onClick={handleConfirmExport}
                    disabled={exportList.length === 0}
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20 border border-orange-500/50 flex items-center gap-2 px-6"
                >
                    <Save className="w-4 h-4" />
                    XÁC NHẬN XUẤT
                </Button>
            </>
        }
    >
        <ExportTable 
            data={exportList}
            onRemove={removeExportItem}
        />
    </ManagerLayout>
  );
};