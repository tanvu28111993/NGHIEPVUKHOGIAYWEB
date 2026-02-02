
import React, { useState } from 'react';
import { ReImportInputPanel } from './ReImportInputPanel';
import { ReImportTable } from './ReImportTable';
import { useReImportManager } from '../../../hooks/useReImportManager';
import { RotateCcw, Save, QrCode } from 'lucide-react';
import { Button } from '../../UI/Button';
import { ManagerLayout } from '../../Layout/ManagerLayout';

const LabelPrintingModal = React.lazy(() => import('../LabelPrinting/LabelPrintingModal').then(m => ({ default: m.LabelPrintingModal })));

export const ReImportManager: React.FC = () => {
  const { 
    inputList, 
    reImportList,
    addEmptyRow,
    updateInputItem,
    clearInputList,
    removeInputItem, 
    checkAndTransfer,
    removeReImportItem,
    handleConfirmReImport,
    handleFetchFromSheet,
    isLoadingSheet
  } = useReImportManager();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  return (
    <>
      <ManagerLayout
        leftPanelWidth="w-[350px]"
        leftPanel={
            <ReImportInputPanel 
                inputList={inputList}
                onRemove={removeInputItem}
                onCheck={checkAndTransfer}
                onAddRow={addEmptyRow}
                onUpdateRow={updateInputItem}
                onClear={clearInputList}
                onFetchFromSheet={handleFetchFromSheet}
                isLoadingSheet={isLoadingSheet}
            />
        }
        title={
            <>
                <RotateCcw className="w-5 h-5 text-cyan-500" />
                Bảng Nhập Lại ({reImportList.length})
            </>
        }
        subTitle="* Dành cho hàng trả về hoặc điều chỉnh tăng tồn kho."
        actions={
            <>
                <Button 
                    onClick={() => setIsPrintModalOpen(true)}
                    disabled={reImportList.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 border border-purple-500/50 flex items-center gap-2 px-3"
                    title="In tem nhãn"
                >
                    <QrCode className="w-4 h-4" /> IN TEM
                </Button>

                <Button 
                    onClick={handleConfirmReImport}
                    disabled={reImportList.length === 0}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-900/20 border border-cyan-500/50 flex items-center gap-2 px-6"
                >
                    <Save className="w-4 h-4" />
                    XÁC NHẬN NHẬP
                </Button>
            </>
        }
      >
         <ReImportTable 
            data={reImportList}
            onRemove={removeReImportItem}
         />
      </ManagerLayout>

      <React.Suspense fallback={null}>
        <LabelPrintingModal 
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          selectedItems={reImportList}
        />
      </React.Suspense>
    </>
  );
};