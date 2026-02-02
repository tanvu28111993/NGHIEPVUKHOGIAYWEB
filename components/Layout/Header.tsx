import React from 'react';
import { useAuth } from '../../contexts';
import { useBusinessLogic } from '../../hooks';
import { DateTimeWidget } from './DateTimeWidget';
import { CloudStatus } from './CloudStatus';
import { StatusWidget } from './StatusWidget';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { stockRotation, stockCheck, totalCheck } = useBusinessLogic();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between pl-3 pr-6 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-4">
        <img 
          src="https://i.postimg.cc/8zF3c24h/image.png" 
          alt="Logo" 
          loading="lazy"
          className="w-14 h-14 object-contain rounded-lg shadow-lg shadow-black/50"
        />

        <div className="flex flex-col justify-center">
           <span className="text-[10px] font-bold text-gray-400 uppercase leading-tight tracking-wider">TNHH THƯƠNG MẠI</span>
           <span className="text-sm font-bold text-white uppercase leading-tight tracking-wide">IN BAO BÌ TUẤN BẰNG</span>
        </div>

        <div className="hidden xl:block h-8 w-px bg-white/10 mx-2"></div>

        {/* Date Time Widget (Isolated Render) */}
        <DateTimeWidget />

        {/* Stock Rotation Widget */}
        <StatusWidget 
            title="Đảo kho" 
            date={stockRotation.dateDisplay} 
            daysLeft={stockRotation.daysLeft} 
            warningThreshold={2} 
            criticalThreshold={0} // Only red if 0 or less, otherwise orange/green
        />

        {/* Stock Check Widget */}
        <StatusWidget 
            title="Kiểm kho" 
            date={stockCheck.dateDisplay} 
            daysLeft={stockCheck.daysLeft} 
            warningThreshold={7} 
            criticalThreshold={2}
        />

        {/* Total Check Widget */}
        <StatusWidget 
            title="Kiểm Tổng" 
            date={totalCheck.dateDisplay} 
            daysLeft={totalCheck.daysLeft} 
            warningThreshold={14} 
            criticalThreshold={7}
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-5">
        <div className="hidden xl:flex flex-col items-center justify-center">
             <span className="text-sm font-black text-[#FF8C00] uppercase tracking-widest drop-shadow-lg leading-none mb-0.5" style={{textShadow: '0 0 10px rgba(255, 140, 0, 0.3)'}}>
                NGHIỆP VỤ
            </span>
             <span className="text-xl font-black text-[#FF8C00] uppercase tracking-widest drop-shadow-lg leading-none" style={{textShadow: '0 0 10px rgba(255, 140, 0, 0.3)'}}>
                KHO GIẤY
            </span>
        </div>

        <div className="flex items-center justify-center">
            <CloudStatus />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <p className="text-sm font-semibold text-white">{user?.username}</p>
        </div>
      </div>
    </header>
  );
};