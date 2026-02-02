import React, { ReactNode } from 'react';

interface ManagerLayoutProps {
  leftPanel: ReactNode;
  title: ReactNode;
  subTitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode; // Table Content
  leftPanelWidth?: string;
  className?: string;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({
  leftPanel,
  title,
  subTitle,
  actions,
  children,
  leftPanelWidth = "w-[320px]",
  className = ""
}) => {
  return (
    <div className={`w-full h-full flex flex-col overflow-hidden animate-fade-in ${className}`}>
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel: Input Form */}
        <div className={`${leftPanelWidth} flex-shrink-0 h-full flex flex-col shadow-2xl z-20 transition-all duration-300`}>
           {leftPanel}
        </div>

        {/* Right Panel: Data Table & Toolbar */}
        <div className="flex-1 h-full bg-slate-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-xl relative z-10">
             
             {/* Toolbar Header */}
             <div className="px-4 py-3 border-b border-gray-800 bg-slate-950 flex justify-between items-center flex-shrink-0 min-h-[60px] relative z-20">
                 <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        {title}
                    </div>
                    {subTitle && (
                        <div className="text-[10px] text-gray-500 italic hidden sm:block">
                            {subTitle}
                        </div>
                    )}
                 </div>

                 <div className="flex items-center gap-3">
                    {actions}
                 </div>
             </div>

             {/* Main Table Content */}
             <div className="flex-1 min-h-0 relative flex flex-col z-10 bg-slate-900/50">
                 {children}
             </div>
        </div>
      </div>
    </div>
  );
};