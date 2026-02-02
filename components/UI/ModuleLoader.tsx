import React from 'react';
import { Loader2 } from 'lucide-react';

export const ModuleLoader: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 animate-fade-in">
    <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
    <span className="text-sm font-medium tracking-wide">Đang tải module...</span>
  </div>
);