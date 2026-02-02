import React from 'react';

interface StatusWidgetProps {
    title: string;
    date: string;
    daysLeft: number;
    warningThreshold: number;
    criticalThreshold: number;
}

export const StatusWidget: React.FC<StatusWidgetProps> = ({ title, date, daysLeft, warningThreshold, criticalThreshold }) => {
    const getDaysColor = (days: number, warning: number, critical: number) => {
        if (days > warning) return 'text-green-500'; 
        if (days > critical) return 'text-[#FF8C00]'; 
        return 'text-[#DA291C]'; 
    };

    return (
        <div className="hidden md:flex flex-row items-center justify-between gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 shadow-lg shadow-black/50 w-[145px]">
            <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none">
                    {title}
                </span>
                <span className="text-sm font-bold text-gray-400 font-mono leading-none">
                   {date}
                </span>
            </div>
            <div className={`font-black leading-none text-4xl ${getDaysColor(daysLeft, warningThreshold, criticalThreshold)}`}>
               {daysLeft.toString().padStart(2, '0')}
            </div>
        </div>
    );
};