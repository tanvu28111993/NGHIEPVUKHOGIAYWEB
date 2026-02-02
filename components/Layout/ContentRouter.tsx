import React, { Suspense, lazy, useMemo } from 'react';
import { MenuId } from '../../types';
import { ModuleLoader } from '../UI/ModuleLoader';
import { ErrorBoundary } from '../UI/ErrorBoundary';

// --- Code Splitting (Lazy Loading) ---
const Overview = lazy(() => import('../Dashboard/Overview').then(m => ({ default: m.Overview })));

// Updated paths to standardized folder structure
const LocationManager = lazy(() => import('../Modules/Locations/LocationManager').then(m => ({ default: m.LocationManager })));
const InventoryManager = lazy(() => import('../Modules/Inventory/InventoryManager').then(m => ({ default: m.InventoryManager })));
const ImportManager = lazy(() => import('../Modules/Import/ImportManager').then(m => ({ default: m.ImportManager })));
const ExportManager = lazy(() => import('../Modules/Export/ExportManager').then(m => ({ default: m.ExportManager })));
const ReImportManager = lazy(() => import('../Modules/ReImport/ReImportManager').then(m => ({ default: m.ReImportManager })));
const HistoryManager = lazy(() => import('../Modules/History/HistoryManager').then(m => ({ default: m.HistoryManager })));

interface ContentRouterProps {
  currentMenu: MenuId;
}

export const ContentRouter: React.FC<ContentRouterProps> = React.memo(({ currentMenu }) => {
  
  // Route Configuration Map
  const routeComponents = useMemo<Record<MenuId, React.LazyExoticComponent<React.FC>>>(() => ({
    OVERVIEW: Overview,
    LOCATIONS: LocationManager,
    INVENTORY: InventoryManager,
    IMPORT: ImportManager,
    EXPORT: ExportManager,
    RE_IMPORT: ReImportManager,
    HISTORY: HistoryManager,
  }), []);

  const Component = routeComponents[currentMenu];

  return (
    <Suspense fallback={<ModuleLoader />}>
      <ErrorBoundary resetKey={currentMenu}>
        {Component ? <Component /> : null}
      </ErrorBoundary>
    </Suspense>
  );
});
