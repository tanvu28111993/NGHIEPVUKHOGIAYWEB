import React from 'react';
import { NavItemConfig, PageId } from '../types';

interface SidebarProps {
  navItems: NavItemConfig[];
  isCollapsed: boolean;
  toggleSidebar: () => void;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navItems, isCollapsed, toggleSidebar, activePage, onNavigate }) => {
  return (
    <aside 
      className={`
        fixed left-0 top-0 bottom-0 z-50 flex flex-col 
        bg-white/5 backdrop-blur-xl border-r border-white/10 
        shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] 
        transition-all duration-300
        ${isCollapsed ? 'w-[80px]' : 'w-[240px]'}
      `}
    >
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar} 
        aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        className="absolute -right-3 top-[102px] w-6 h-6 bg-[#2d2f35] border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-accent-1 transition-colors shadow-lg z-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Header / Logo */}
      <div className="w-full pt-[15px] pb-4 flex flex-col flex-grow">
        <div className="flex items-center justify-center transition-all duration-300 shrink-0 mb-[18px]">
          <img 
            src="https://i.postimg.cc/8zF3c24h/image.png" 
            alt="Logo" 
            className={`block rounded-[10px] object-contain transition-all duration-300 ${isCollapsed ? 'w-[45px]' : 'w-[160px]'}`}
          />
        </div>

        {/* Nav Items */}
        <div className="flex-grow w-full px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <div 
                key={item.id}
                onClick={() => onNavigate(item.id)} 
                className={`
                  relative flex items-center gap-3 py-[12px] my-[6px] rounded-[10px] cursor-pointer 
                  transition-all duration-200 select-none group
                  ${isCollapsed ? 'justify-center px-0' : 'px-[22px]'}
                  ${isActive 
                    ? 'bg-gradient-to-r from-accent-1 to-accent-2 shadow-[0_6px_24px_rgba(220,60,60,0.28)] text-white font-bold' 
                    : 'text-gray-200 hover:bg-accent-2/10 hover:text-white'
                  }
                `}
              >
                <div 
                  className={`
                    indicator absolute left-0 top-0 bottom-0 w-[4px] rounded-r-md transition-all duration-200
                    ${isActive 
                      ? 'bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.12)]' 
                      : 'bg-transparent group-hover:bg-[#ff5b5b] group-hover:shadow-[0_0_6px_#ff8888]'
                    }
                  `}
                ></div>
                
                <span className="material-symbols-outlined text-[28px] opacity-95">{item.icon}</span>
                
                <span 
                  className={`
                    text-[16.5px] leading-none whitespace-nowrap overflow-hidden transition-all duration-200
                    ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}
                  `}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible -translate-x-2 group-hover:translate-x-0 transition-all duration-200 pointer-events-none z-[60] whitespace-nowrap border border-white/10">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div 
        className={`text-[11px] text-white/60 mb-3 text-center tracking-wider transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
      >
        Quản Lý Kho Giấy 2.0
      </div>
    </aside>
  );
};

export default Sidebar;