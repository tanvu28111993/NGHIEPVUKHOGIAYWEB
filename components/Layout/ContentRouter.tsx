
import React, { Suspense } from 'react';
import { MenuId } from '../../types';
import { ModuleLoader } from '../UI/ModuleLoader';
import { ErrorBoundary } from '../UI/ErrorBoundary';
import { APP_ROUTES } from '../../utils/navigationConfig';

interface ContentRouterProps {
  currentMenu: MenuId;
}

export const ContentRouter: React.FC<ContentRouterProps> = React.memo(({ currentMenu }) => {
  const route = APP_ROUTES.find(r => r.id === currentMenu);
  const Component = route?.component;

  return (
    <Suspense fallback={<ModuleLoader />}>
      <ErrorBoundary resetKey={currentMenu}>
        {Component ? <Component /> : <div className="text-gray-500 text-center mt-10">Module not found</div>}
      </ErrorBoundary>
    </Suspense>
  );
});
