import React, { useState, useEffect, memo } from 'react';

// Chỉ component này sẽ re-render mỗi giây nhờ memo
export const DateTimeWidget = memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ['CN', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7'];
  const dayName = days[currentTime.getDay()];
  const timeStr = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = currentTime.getDate().toString().padStart(2, '0');
  const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
  const dateStr = `${day}/${month}`;

  return (
    <div className="hidden md:flex flex-col justify-center items-center px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 shadow-lg shadow-black/50 min-w-[110px]">
        <div className="text-xl font-bold text-white tracking-widest font-mono leading-none mb-1">
            {timeStr}
        </div>
        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none">
            {dayName}, {dateStr}
        </div>
    </div>
  );
});