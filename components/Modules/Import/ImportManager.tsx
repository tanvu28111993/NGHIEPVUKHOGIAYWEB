
import React, { useState } from 'react';
import { ImportForm } from './ImportForm';
import { ImportTable } from './ImportTable'; 
import { Save, ListPlus, QrCode } from 'lucide-react';
import { Button } from '../../UI/Button';
import { useImportManager } from '../../../hooks/useImportManager';
import { ManagerLayout } from '../../Layout/ManagerLayout';

const LabelPrintingModal = React.lazy(() => import('../LabelPrinting/LabelPrintingModal').then(m => ({ default: m.LabelPrintingModal })));

export const ImportManager: React.FC = () => {
  const { 
    pendingImports, 
    existingSkus, 
    addToTable, 
    removeItem, 
    saveToInventory 
  } = useImportManager();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  return (
    <>
      <ManagerLayout
        leftPanel={<ImportForm onAddItems={addToTable} />}
        title={
            <>
                <ListPlus className="w-5 h-5 text-blue-500" />
                Bảng Nhập Kho ({pendingImports.length})
            </>
        }
        subTitle="* Tích đúp vào hàng để xóa. Các mã trùng lặp sẽ được báo đỏ."
        actions={
            <>
                <Button 
                    onClick={() => setIsPrintModalOpen(true)}
                    disabled={pendingImports.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 border border-purple-500/50 flex items-center gap-2 px-3"
                    title="In tem nhãn cho các mã vừa nhập"
                >
                    <QrCode className="w-4 h-4" /> IN TEM
                </Button>

                <Button 
                    onClick={saveToInventory}
                    disabled={pendingImports.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20 border border-green-500/50 flex items-center gap-2 px-6"
                >
                    <Save className="w-4 h-4" />
                    LƯU KHO
                </Button>
            </>
        }
      >
         <ImportTable 
            data={pendingImports} 
            onRemoveItem={removeItem}
            existingSkus={existingSkus}
         />
      </ManagerLayout>

      <React.Suspense fallback={null}>
        <LabelPrintingModal 
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          selectedItems={pendingImports}
        />
      </React.Suspense>
    </>
  );
};