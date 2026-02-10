
import { lazy } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw, 
  History 
} from 'lucide-react';
import { AppRouteConfig } from '../types';

// Code Splitting (Lazy Loading) centralized here
const Overview = lazy(() => import('../components/Dashboard/Overview').then(m => ({ default: m.Overview })));
const LocationManager = lazy(() => import('../components/Modules/Locations/LocationManager').then(m => ({ default: m.LocationManager })));
const InventoryManager = lazy(() => import('../components/Modules/Inventory/InventoryManager').then(m => ({ default: m.InventoryManager })));
const ImportManager = lazy(() => import('../components/Modules/Import/ImportManager').then(m => ({ default: m.ImportManager })));
const ExportManager = lazy(() => import('../components/Modules/Export/ExportManager').then(m => ({ default: m.ExportManager })));
const ReImportManager = lazy(() => import('../components/Modules/ReImport/ReImportManager').then(m => ({ default: m.ReImportManager })));
const HistoryManager = lazy(() => import('../components/Modules/History/HistoryManager').then(m => ({ default: m.HistoryManager })));

export const APP_ROUTES: AppRouteConfig[] = [
  { 
    id: 'OVERVIEW', 
    label: 'TỔNG QUAN', 
    icon: LayoutDashboard, 
    component: Overview,
    isFullWidth: false 
  },
  { 
    id: 'LOCATIONS', 
    label: 'VỊ TRÍ', 
    icon: MapPin, 
    component: LocationManager,
    isFullWidth: false
  },
  { 
    id: 'INVENTORY', 
    label: 'TỒN KHO', 
    icon: Package, 
    component: InventoryManager,
    isFullWidth: true 
  },
  { 
    id: 'IMPORT', 
    label: 'NHẬP KHO', 
    icon: ArrowDownToLine, 
    component: ImportManager,
    isFullWidth: true 
  },
  { 
    id: 'EXPORT', 
    label: 'XUẤT KHO', 
    icon: ArrowUpFromLine, 
    component: ExportManager,
    isFullWidth: true 
  },
  { 
    id: 'RE_IMPORT', 
    label: 'NHẬP LẠI', 
    icon: RotateCcw, 
    component: ReImportManager,
    isFullWidth: true 
  },
  { 
    id: 'HISTORY', 
    label: 'LỊCH SỬ', 
    icon: History, 
    component: HistoryManager,
    isFullWidth: true 
  },
];
