import React from 'react';

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full animate-pulse bg-slate-900/50 p-4">
      <div className="flex gap-4 mb-4">
         <div className="h-8 w-32 bg-slate-800 rounded"></div>
         <div className="h-8 w-48 bg-slate-800 rounded"></div>
         <div className="h-8 w-24 bg-slate-800 rounded ml-auto"></div>
      </div>
      <div className="space-y-3">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-10 w-32 bg-slate-800/60 rounded"></div>
            <div className="h-10 w-24 bg-slate-800/60 rounded"></div>
            <div className="h-10 w-20 bg-slate-800/60 rounded"></div>
            <div className="h-10 flex-1 bg-slate-800/40 rounded"></div>
            <div className="h-10 w-24 bg-slate-800/60 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};