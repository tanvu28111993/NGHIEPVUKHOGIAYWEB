
import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { MenuId } from '../../types';
import { ModuleLoader } from '../UI/ModuleLoader';
import { ErrorBoundary } from '../UI/ErrorBoundary';
import { APP_ROUTES } from '../../utils/navigationConfig';

interface ContentRouterProps {
  currentMenu: MenuId;
}

export const ContentRouter: React.FC<ContentRouterProps> = React.memo(({ currentMenu }) => {
  // Filter routes that should be kept alive
  const keepAliveRoutes = useMemo(() => APP_ROUTES.filter(r => r.keepAlive), []);
  
  // State to control when to start loading background routes
  const [shouldLoadBackground, setShouldLoadBackground] = useState(false);

  // Find the current active route
  const activeRoute = APP_ROUTES.find(r => r.id === currentMenu);
  const ActiveComponent = activeRoute?.component;
  const isActiveRouteKeepAlive = activeRoute?.keepAlive;

  // Delay loading of background routes to prioritize the active one
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadBackground(true);
    }, 3000); // Wait 3 seconds before loading background iframes
    return () => clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={<ModuleLoader />}>
      <ErrorBoundary resetKey={currentMenu}>
        {/* Render Keep-Alive Routes */}
        {keepAliveRoutes.map(route => {
          const Component = route.component;
          const isActive = route.id === currentMenu;
          
          // Only render if it's active OR if we're ready to load background routes
          // This prevents network contention during initial load
          if (!isActive && !shouldLoadBackground) return null;

          return (
            <div 
              key={route.id} 
              style={{ display: isActive ? 'block' : 'none', height: '100%' }}
              className="h-full w-full"
            >
              <Component />
            </div>
          );
        })}

        {/* Render Standard Routes (Unmounted when inactive) */}
        {!isActiveRouteKeepAlive && ActiveComponent && (
          <div className="h-full w-full">
            <ActiveComponent />
          </div>
        )}

        {!ActiveComponent && !isActiveRouteKeepAlive && (
          <div className="text-gray-500 text-center mt-10">Module not found</div>
        )}
      </ErrorBoundary>
    </Suspense>
  );
});
