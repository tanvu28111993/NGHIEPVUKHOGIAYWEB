import React from 'react';
import { useCommandQueue } from '../../contexts/CommandQueueContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Custom Cloud Icon
const CloudIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.819 10.035C17.632 6.578 14.773 3.967 11.25 4.004C7.886 4.04 5.228 6.666 5.034 10.031C2.716 10.329 1 12.288 1 14.5C1 16.9853 3.01472 19 5.5 19L17.5 19Z" />
  </svg>
);

export const CloudStatus: React.FC = () => {
  const { status, queue } = useCommandQueue();
  const baseIconClass = "w-8 h-8 transition-all duration-500 ease-in-out"; 

  switch (status) {
    case 'SYNCING':
      return (
        <div className="relative group cursor-help" title="Đang đồng bộ dữ liệu...">
          <CloudIcon className={`${baseIconClass} text-blue-400 fill-blue-400/10 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)] animate-pulse`} />
          <div className="absolute -bottom-1 -right-1">
             <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
             </span>
          </div>
        </div>
      );

    case 'SUCCESS':
      return (
        <div className="relative group cursor-help" title="Dữ liệu đã được đồng bộ">
          <CloudIcon className={`${baseIconClass} text-emerald-400 fill-emerald-400/10 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]`} />
          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full border border-emerald-500/50 p-[1px] shadow-sm">
             <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
      );

    case 'ERROR':
      return (
        <div className="relative group cursor-help" title="Lỗi kết nối máy chủ">
          <CloudIcon className={`${baseIconClass} text-red-500 fill-red-500/10 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]`} />
          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full border border-red-500/50 p-[1px] shadow-sm">
             <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
        </div>
      );

    case 'PENDING':
      return (
        <div className="relative group cursor-help" title={`Đang chờ gửi: ${queue.length} lệnh`}>
          <CloudIcon className={`${baseIconClass} text-amber-400 fill-amber-400/10 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]`} />
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-slate-900 bg-amber-400 rounded-full border-2 border-slate-900 shadow-sm">
            {queue.length}
          </span>
        </div>
      );

    case 'IDLE':
    default:
      return (
        <div className="relative group cursor-help" title="Hệ thống sẵn sàng">
          <CloudIcon className={`${baseIconClass} text-slate-500 fill-slate-500/5 hover:text-slate-300 hover:fill-slate-300/10 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]`} />
        </div>
      );
  }
};