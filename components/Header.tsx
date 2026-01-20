
import React, { useState, useEffect } from 'react';
import { pad2, daysDiff, getNextWeekday, getLastFridayOfMonth, getLastFridayOfQuarter, formatDateDDMM } from '../utils/dateUtils';
import { UserInfo } from '../types';

interface HeaderProps {
  isCollapsed: boolean;
  userInfo?: UserInfo;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isCollapsed, userInfo, onLogout }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate schedules
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Stock Check (Next Friday)
  const nextFri = getNextWeekday(today, 5);
  const stockDiff = daysDiff(today, nextFri);
  const stockDateStr = formatDateDDMM(nextFri);
  const stockColorClass = stockDiff <= 2 ? 'text-yellow-neon' : 'text-green-neon';

  // Monthly Check
  const y = today.getFullYear();
  const m = today.getMonth();
  let lastFriM = getLastFridayOfMonth(y, m);
  if (lastFriM < today) lastFriM = getLastFridayOfMonth(y, m + 1);
  const checkDiff = daysDiff(today, lastFriM);
  const checkDateStr = formatDateDDMM(lastFriM);
  
  let checkColorClass = 'text-green-neon';
  if (checkDiff <= 7) checkColorClass = 'text-danger drop-shadow-[0_0_8px_rgba(255,68,68,0.6)]';
  else if (checkDiff < 14) checkColorClass = 'text-yellow-neon drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]';

  // Quarterly Check
  const q = Math.floor(m / 3) + 1;
  let lastFriQ = getLastFridayOfQuarter(y, q);
  if (lastFriQ < today) lastFriQ = getLastFridayOfQuarter(q === 4 ? y + 1 : y, q === 4 ? 1 : q + 1);
  const totalDiff = daysDiff(today, lastFriQ);
  const totalDateStr = formatDateDDMM(lastFriQ);

  let totalColorClass = 'text-green-neon';
  if (totalDiff <= 7) totalColorClass = 'text-danger drop-shadow-[0_0_8px_rgba(255,68,68,0.6)]';
  else if (totalDiff < 21) totalColorClass = 'text-yellow-neon drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]';

  // Clock format
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const days = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
  const dateStr = `${days[now.getDay()]} - ${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)}`;

  return (
    <header 
      className={`
        fixed top-0 right-0 h-[72px] lg:h-[78px] 
        bg-white/10 backdrop-blur-xl flex items-center justify-between px-6 z-40 
        shadow-[0_6px_30px_rgba(0,0,0,0.45)] border-b border-white/5 
        transition-all duration-300
        ${isCollapsed ? 'left-[80px]' : 'left-[240px]'}
      `}
    >
      <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-white/10 via-white/50 to-white/10 shadow-[0_0_8px_rgba(255,255,255,0.06)] pointer-events-none"></div>

      {/* STATUS CARDS */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
        
        {/* Clock */}
        <div className="w-[120px] min-w-[120px] h-[52px] p-2 rounded-[10px] bg-gradient-to-br from-[#383838] to-[#121212] border border-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
          <div className="text-[20px] font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.22)] leading-none mb-[2px]">
            {timeStr}
          </div>
          <div className="text-[12.5px] font-semibold text-blue-50 drop-shadow-[0_0_6px_rgba(255,255,255,0.18)]">
            {dateStr}
          </div>
        </div>

        {/* Stock Check */}
        <div className="w-[140px] min-w-[140px] h-[52px] py-[6px] px-[10px] rounded-[10px] bg-gradient-to-br from-[#383838] to-[#121212] border border-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.5)] flex items-center gap-2">
          <div className="flex flex-col justify-center items-start leading-tight">
            <span className="text-[13.5px] font-semibold text-blue-50 whitespace-nowrap">Đảo kho</span>
            <strong className="text-[15px] font-bold text-white mt-[2px]">{stockDateStr}</strong>
          </div>
          <div className={`flex-1 flex items-center justify-end text-[28px] font-extrabold ${stockColorClass}`}>
            {pad2(stockDiff)}
          </div>
        </div>

        {/* Monthly Check */}
        <div className="w-[140px] min-w-[140px] h-[52px] py-[6px] px-[10px] rounded-[10px] bg-gradient-to-br from-[#383838] to-[#121212] border border-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.5)] flex items-center gap-2">
          <div className="flex flex-col justify-center items-start leading-tight">
            <span className="text-[13.5px] font-semibold text-blue-50 whitespace-nowrap">Kiểm kho</span>
            <strong className="text-[15px] font-bold text-white mt-[2px]">{checkDateStr}</strong>
          </div>
          <div className={`flex-1 flex items-center justify-end text-[28px] font-extrabold ${checkColorClass}`}>
            {pad2(checkDiff)}
          </div>
        </div>

        {/* Quarterly Check */}
        <div className="w-[140px] min-w-[140px] h-[52px] py-[6px] px-[10px] rounded-[10px] bg-gradient-to-br from-[#383838] to-[#121212] border border-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.5)] flex items-center gap-2">
          <div className="flex flex-col justify-center items-start leading-tight">
            <span className="text-[13.5px] font-semibold text-blue-50 whitespace-nowrap">Kiểm tổng</span>
            <strong className="text-[15px] font-bold text-white mt-[2px]">{totalDateStr}</strong>
          </div>
          <div className={`flex-1 flex items-center justify-end text-[28px] font-extrabold ${totalColorClass}`}>
            {pad2(totalDiff)}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block font-semibold text-[15px] text-white">
          👨‍💻 {userInfo?.name || userInfo?.email || 'Người dùng'}
        </div>
        <button 
          onClick={onLogout} 
          className="bg-accent-2 text-white px-3.5 py-2 rounded-lg cursor-pointer flex items-center gap-2 font-semibold shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-[#c10000] active:translate-y-0"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
