
import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-4 animate-pulse bg-[#212830]">
      {/* Toolbar Skeleton */}
      <div className="flex flex-col xl:flex-row items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10 gap-3">
         <div className="flex gap-2 w-full xl:w-auto">
            <div className="h-8 w-32 bg-white/10 rounded-lg"></div>
            <div className="h-8 w-32 bg-white/10 rounded-lg"></div>
         </div>
         <div className="flex gap-2 w-full xl:w-auto">
            <div className="h-10 w-64 bg-white/10 rounded-md"></div>
            <div className="h-10 w-10 bg-white/10 rounded-md"></div>
         </div>
      </div>
      
      {/* Table Skeleton */}
      <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-[#2d2f35]/20 flex flex-col">
        {/* Header */}
        <div className="h-12 bg-[#2d2f35] border-b border-white/10 flex items-center px-4 gap-4 shrink-0">
           <div className="h-4 w-4 bg-white/20 rounded"></div>
           {[...Array(8)].map((_, i) => (
             <div key={i} className="h-4 bg-white/10 rounded flex-1"></div>
           ))}
        </div>
        {/* Rows */}
        <div className="p-0 flex-1 overflow-hidden">
           {[...Array(15)].map((_, i) => (
             <div key={i} className="flex items-center px-4 py-3 border-b border-white/5 gap-4">
                <div className="h-4 w-4 bg-white/5 rounded shrink-0"></div>
                {[...Array(8)].map((_, j) => (
                  <div key={j} className="h-3 bg-white/5 rounded flex-1"></div>
                ))}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
