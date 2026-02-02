
import React from 'react';
import { useAuth } from '../../contexts';
import { MenuId, MenuItem } from '../../types';
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw, 
  History,
  LogOut,
  Loader2
} from 'lucide-react';
import { FULL_WIDTH_MENUS } from '../../utils';

interface SidebarProps {
  currentMenu: MenuId;
  onMenuChange: (id: MenuId) => void;
  isCollapsed: boolean;
  isPending?: boolean;
}

// Optimization: Define menu items outside the component to prevent recreation on every render
const MENU_ITEMS: MenuItem[] = [
  { id: 'OVERVIEW', label: 'TỔNG QUAN', icon: LayoutDashboard },
  { id: 'LOCATIONS', label: 'VỊ TRÍ', icon: MapPin },
  { id: 'INVENTORY', label: 'TỒN KHO', icon: Package },
  { id: 'IMPORT', label: 'NHẬP KHO', icon: ArrowDownToLine },
  { id: 'EXPORT', label: 'XUẤT KHO', icon: ArrowUpFromLine },
  { id: 'RE_IMPORT', label: 'NHẬP LẠI', icon: RotateCcw },
  { id: 'HISTORY', label: 'LỊCH SỬ', icon: History },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentMenu, 
  onMenuChange, 
  isCollapsed,
  isPending
}) => {
  const { logout } = useAuth();

  return (
    <aside 
      className={`
        fixed top-16 left-0 bottom-0 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 z-30 flex flex-col 
        transition-all duration-300 ease-in-out shadow-2xl
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Menu Items */}
      <div className="flex-1 px-3 py-6 overflow-y-auto mt-2">
        <nav className="space-y-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onMenuChange(item.id)}
                title={isCollapsed ? item.label : ''}
                className={`
                  w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden
                  ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}
                  ${isActive 
                    ? 'bg-brand-red text-white shadow-lg shadow-red-900/30' 
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'}
                `}
              >
                {/* Updated Icon: Size changed to w-6 h-6 */}
                <Icon className={`w-6 h-6 relative z-10 transition-colors duration-200 text-white`} />
                
                {!isCollapsed && (
                  <span className="whitespace-nowrap animate-fade-in relative z-10">{item.label}</span>
                )}
                
                {/* Active Indicator / Loading Spinner */}
                {!isCollapsed && (
                  <div className="ml-auto relative z-10 flex items-center justify-center">
                      {isActive && (
                          isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                          ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )
                      )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions & Info */}
      <div className="p-3 border-t border-white/10 bg-black/20 flex flex-col gap-2">
        <button 
          onClick={logout}
          className={`
            w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden
            bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-500 shadow-lg shadow-red-900/10
            ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}
          `}
          title="Đăng xuất"
        >
          {/* Updated Logout Icon: Size changed to w-6 h-6 */}
          <LogOut className="w-6 h-6 relative z-10 text-red-500 group-hover:text-white transition-colors duration-200" />
          
          {!isCollapsed && (
            <span className="whitespace-nowrap animate-fade-in relative z-10">Đăng xuất</span>
          )}
        </button>

         <div className={`text-[10px] text-gray-600 pt-2 border-t border-gray-800/50 ${isCollapsed ? 'text-center' : 'text-center'}`}>
          {isCollapsed ? 'v1.0' : 'v1.0.0 © 2024 Kho Giấy'}
        </div>
      </div>
    </aside>
  );
};
