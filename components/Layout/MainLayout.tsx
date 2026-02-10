
import React, { useState, useTransition, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ContentRouter } from './ContentRouter';
import { MenuId } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { APP_ROUTES } from '../../utils/navigationConfig';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';

export const MainLayout: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState<MenuId>('OVERVIEW');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Kích hoạt phím tắt toàn cục
  useGlobalShortcuts();

  // Determine layout mode from config
  const isFullWidthPage = useMemo(() => {
      const route = APP_ROUTES.find(r => r.id === currentMenu);
      return route?.isFullWidth || false;
  }, [currentMenu]);

  const handleMenuChange = (id: MenuId) => {
    startTransition(() => {
      setCurrentMenu(id);
    });
  };

  return (
    <div className="h-screen bg-slate-950 text-white relative isolate flex flex-col overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-40 pointer-events-none -z-10"></div>
      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>

      {/* Header Fixed at Top */}
      <Header />

      <div className="flex flex-1 pt-16 relative h-full">
        {/* Left Sidebar */}
        <Sidebar 
          currentMenu={currentMenu} 
          onMenuChange={handleMenuChange}
          isCollapsed={isSidebarCollapsed}
          isPending={isPending}
        />

        {/* External Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`
            fixed z-40 w-8 h-8 flex items-center justify-center rounded-full 
            bg-brand-red text-white shadow-lg shadow-red-900/40 
            border border-white/20 hover:bg-red-600 hover:scale-110 transition-all duration-300 ease-in-out
          `}
          style={{ 
            left: isSidebarCollapsed ? '59px' : '235px', 
            top: '110px'
          }}
          title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* Main Content Wrapper */}
        <div 
          className={`
            flex-1 flex flex-col h-full transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}
            relative z-0 overflow-hidden
          `}
        > 
          {/* Main Container */}
          <main className={`
            flex-1 flex flex-col ${isFullWidthPage ? 'p-4' : 'p-8'} mx-auto w-full h-full overflow-hidden
            ${isFullWidthPage ? 'max-w-full' : 'max-w-7xl'}
          `}>
            <div className={`flex-1 flex flex-col h-full min-h-0 relative animate-fade-in transition-opacity duration-200 ${isPending ? 'opacity-70 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
              {/* Delegated Routing Logic to ContentRouter */}
              <ContentRouter currentMenu={currentMenu} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
