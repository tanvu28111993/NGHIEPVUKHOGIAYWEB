
import React, { useState } from 'react';
import { InventoryItem } from '../../../types';
import { LabelDesigner } from './LabelDesigner';
import { PrintPreview } from './PrintPreview';
import { PencilRuler, Printer } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: InventoryItem[];
}

export const LabelPrintingModal: React.FC<Props> = ({ isOpen, onClose, selectedItems }) => {
  const [activeTab, setActiveTab] = useState<'DESIGN' | 'PREVIEW'>('PREVIEW');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full h-full max-w-[95vw] max-h-[90vh] rounded-xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header & Tabs */}
        <div className="flex items-center justify-between px-4 bg-slate-950 border-b border-gray-800">
            <div className="flex gap-6">
                <button 
                    onClick={() => setActiveTab('PREVIEW')}
                    className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'PREVIEW' ? 'text-blue-500 border-blue-500' : 'text-gray-400 border-transparent hover:text-white'}`}
                >
                    <Printer className="w-4 h-4" /> BỐ CỤC IN ({selectedItems.length})
                </button>
                <button 
                    onClick={() => setActiveTab('DESIGN')}
                    className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'DESIGN' ? 'text-brand-red border-brand-red' : 'text-gray-400 border-transparent hover:text-white'}`}
                >
                    <PencilRuler className="w-4 h-4" /> THIẾT KẾ MẪU TEM
                </button>
            </div>
            
            {activeTab === 'DESIGN' && (
                 <button onClick={onClose} className="text-gray-400 hover:text-white">
                     Đóng
                 </button>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'DESIGN' ? (
                <LabelDesigner />
            ) : (
                <PrintPreview items={selectedItems} onClose={onClose} />
            )}
        </div>
      </div>
    </div>
  );
};
