
import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import SkeletonLoader from './components/SkeletonLoader';
import { PageId, UserInfo, InventoryData, NavItemConfig, ConfigData } from './types';
import { useToast } from './components/ToastContext';
import { api } from './services/api';
import { storage } from './services/storage';

// Lazy Load Components
const InventoryTable = lazy(() => import('./components/InventoryTable'));
const ExportPage = lazy(() => import('./components/ExportPage'));
const ReImportPage = lazy(() => import('./components/ReImportPage'));
const ImportPage = lazy(() => import('./components/ImportPage'));
const HistoryPage = lazy(() => import('./components/HistoryPage'));

// Cache Keys
const CACHE_KEY_INVENTORY = 'app_inventory_data_v3'; // Bump version for IDB migration
const CACHE_KEY_HISTORY_EXPORT = 'app_history_export_v3';
const CACHE_KEY_HISTORY_IMPORT = 'app_history_import_v3';
const CACHE_KEY_CONFIG = 'app_config_data_v3';

// Navigation Items Configuration
const navItems: NavItemConfig[] = [
  { id: 'module/tongquan', label: 'Tổng quan', icon: 'dashboard' },
  { id: 'vitri', label: 'Vị trí', icon: 'host' },
  { id: 'tonkho', label: 'Tồn kho', icon: 'inventory_2' },
  { id: 'nhapkho', label: 'Nhập kho', icon: 'download' },
  { id: 'nhaplai', label: 'Nhập lại', icon: 'published_with_changes' },
  { id: 'xuatkho', label: 'Xuất kho', icon: 'content_paste_go' },
  { id: 'lichsu', label: 'Lịch sử', icon: 'history' },
];

const App: React.FC = () => {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({ email: '', name: '' });

  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activePage, setActivePage] = useState<PageId>('module/tongquan');
  
  // State for Inventory Data
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  
  // State for Histories
  const [exportHistory, setExportHistory] = useState<string[]>([]);
  const [importHistory, setImportHistory] = useState<string[]>([]);
  
  // State for Master Config Data
  const [configData, setConfigData] = useState<ConfigData>({
    MUC_DICH: [],
    KIEN_GIAY: [],
    NHA_CC: [],
    NHA_SX: [],
    LOAI_GIAY: []
  });

  const [isLoading, setIsLoading] = useState(false);

  // Hook Toast
  const { showToast } = useToast();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // --- PERSISTENCE EFFECT (Non-blocking, using IndexedDB) ---
  useEffect(() => {
    if (inventoryData && inventoryData.length > 0) {
        // IDB is async, so it won't block the UI thread like localStorage
        storage.set(CACHE_KEY_INVENTORY, inventoryData);
    }
  }, [inventoryData]);

  useEffect(() => {
    if (exportHistory && exportHistory.length > 0) {
        storage.set(CACHE_KEY_HISTORY_EXPORT, exportHistory);
    }
  }, [exportHistory]);

  useEffect(() => {
    if (importHistory && importHistory.length > 0) {
        storage.set(CACHE_KEY_HISTORY_IMPORT, importHistory);
    }
  }, [importHistory]);


  // 1. Fetch Inventory Data - Background Safe
  const fetchInventoryData = async (isBackground = false) => {
    if (!inventoryData && !isBackground) {
        // Try to load from IDB first
        const cached = await storage.get<InventoryData>(CACHE_KEY_INVENTORY);
        if (cached && Array.isArray(cached) && cached.length > 0) {
             setInventoryData(cached);
        } else {
             setIsLoading(true);
        }
    }

    try {
      const data = await api.getInventoryData();
      if (Array.isArray(data)) {
        setInventoryData(data);
      }
    } catch (err) {
      console.error(err);
      if (!inventoryData && !isBackground) {
         showToast("Lỗi kết nối server: " + err, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Export History
  const fetchExportHistory = async (isBackground = false) => {
    if (exportHistory.length === 0 && !isBackground) {
        const cached = await storage.get<string[]>(CACHE_KEY_HISTORY_EXPORT);
        if (cached && Array.isArray(cached)) {
            setExportHistory(cached);
        }
    }

    try {
        const data = await api.getExportHistory();
        setExportHistory(data || []);
    } catch (err) {
        console.error("Export History Error", err);
    }
  };

  // 2b. Fetch Import History (New)
  const fetchImportHistory = async (isBackground = false) => {
    if (importHistory.length === 0 && !isBackground) {
        const cached = await storage.get<string[]>(CACHE_KEY_HISTORY_IMPORT);
        if (cached && Array.isArray(cached)) {
            setImportHistory(cached);
        }
    }

    try {
        const data = await api.getImportHistory();
        setImportHistory(data || []);
    } catch (err) {
        console.error("Import History Error", err);
    }
  };

  // 3. Fetch Config Data (Dropdowns)
  const fetchConfigData = async () => {
    const cached = await storage.get<ConfigData>(CACHE_KEY_CONFIG);
    if (cached) {
        setConfigData(cached);
    }

    try {
      const data = await api.getConfigData();
      if (data) {
        setConfigData(data);
        storage.set(CACHE_KEY_CONFIG, data);
      }
    } catch (err) {
      console.error("Config fetch error", err);
    }
  };

  // --- OPTIMISTIC UPDATES ---

  const handleUpdateRow = async (rowIndex: number, newData: any[]) => {
    setInventoryData(prevData => {
        if (!prevData) return null;
        const newDataArray = [...prevData];
        newDataArray[rowIndex] = newData;
        return newDataArray;
    });
    showToast("Đã cập nhật giao diện (Đang lưu server...)", 'info');

    try {
       await api.updateInventoryRow(rowIndex, newData);
    } catch (err) {
       showToast("Lỗi lưu server: " + err + ". Vui lòng tải lại!", 'error');
       fetchInventoryData(true);
    }
  };

  const handleExportTransaction = async (
    logDataRows: string[], 
    inventoryUpdates: {rowIndex: number, rowData: any[] | null}[]
  ) => {
    // UI Update
    setInventoryData(prevData => {
        if (!prevData) return null;
        const newDataArray = [...prevData];
        inventoryUpdates.forEach(update => {
           if (update.rowData === null) {
             if (newDataArray[update.rowIndex]) newDataArray[update.rowIndex] = newDataArray[update.rowIndex].map(() => "");
           } else {
             newDataArray[update.rowIndex] = update.rowData;
           }
        });
        return newDataArray;
    });
    showToast("Đã cập nhật tồn kho (Đang đồng bộ server...)", 'success');

    // Server Call
    try {
        await api.processExportTransaction(logDataRows, inventoryUpdates);
    } catch (err) {
        showToast("Lỗi đồng bộ server: " + err, 'error');
        fetchInventoryData(true);
    }
  };

  const handleReImportTransaction = async (
    logDataRows: string[], 
    inventoryUpdates: {rowIndex: number, rowData: any[] | null}[]
  ) => {
    // Separating updates vs new inserts (append)
    const existingUpdates = inventoryUpdates.filter(u => u.rowIndex !== -1);
    const newRows = inventoryUpdates
        .filter(u => u.rowIndex === -1 && u.rowData !== null)
        .map(u => u.rowData as any[]);

    // UI Update
    setInventoryData(prevData => {
        if (!prevData) return null;
        const newDataArray = [...prevData];
        existingUpdates.forEach(update => {
            if (update.rowData !== null) newDataArray[update.rowIndex] = update.rowData;
        });
        newRows.forEach(row => newDataArray.push(row));
        return newDataArray;
    });
    showToast("Đã cập nhật tồn kho (Đang đồng bộ server...)", 'success');

    // Server Call - isReImport = true
    try {
        await api.processImportTransaction(logDataRows, existingUpdates, newRows, true);
    } catch (err) {
        showToast("Lỗi đồng bộ: " + err, 'error');
        fetchInventoryData(true);
    }
  };

  const handleNewImportTransaction = async (newRows: any[][]) => {
      // UI Update
      setInventoryData(prevData => {
          if (!prevData) return null;
          return [...prevData, ...newRows];
      });
      showToast(`Đã thêm ${newRows.length} dòng (Đang lưu server...)`, 'success');

      const logDataRows = newRows.map(row => row.map(cell => String(cell || "")).join("|"));
      
      // Server Call - isReImport = false
      try {
          await api.processImportTransaction(logDataRows, [], newRows, false);
      } catch (err) {
          showToast("Lỗi lưu kho: " + err, 'error');
          fetchInventoryData(true);
      }
  };

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    if (page === 'module/tongquan') return;
    
    // Refresh Inventory silently
    if (page === 'tonkho' || page === 'xuatkho' || page === 'nhaplai' || page === 'nhapkho') {
      fetchInventoryData(!!inventoryData);
    }
    
    if (page === 'nhapkho') fetchConfigData();
    if (page === 'nhaplai' || page === 'lichsu') {
        fetchExportHistory(!!exportHistory.length);
        if (page === 'lichsu') fetchImportHistory(!!importHistory.length);
    }
  };

  const handleLoginSuccess = (username: string) => {
    setUserInfo({ name: username, email: 'user@local' });
    setIsAuthenticated(true);
    showToast(`Chào mừng trở lại, ${username}!`, 'success');
    
    // Initial fetch
    setTimeout(() => {
        fetchInventoryData(false);
        fetchConfigData();
    }, 100);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo({ name: '', email: '' });
    showToast("Đã đăng xuất", 'info');
  };

  const currentNavItem = navItems.find(item => item.id === activePage);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isInitialDataLoading = isLoading && !inventoryData;

  const getHistoryHeaders = () => {
      if (inventoryData && inventoryData.length > 0) return inventoryData[0];
      return [];
  };

  return (
    <>
      <Sidebar 
        navItems={navItems}
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar} 
        activePage={activePage} 
        onNavigate={handleNavigate} 
      />
      
      <div 
        id="main-container" 
        className={`
          flex flex-col w-full h-full transition-all duration-300
          ${isCollapsed ? 'pl-[80px]' : 'pl-[240px]'}
        `}
      >
        <Header 
          isCollapsed={isCollapsed} 
          userInfo={userInfo} 
          onLogout={handleLogout} 
        />

        <main className="flex-1 mt-[72px] lg:mt-[78px] overflow-auto relative bg-transparent">
          <div id="content-area" className="w-full h-full relative">
            
            {/* 1. TONG QUAN */}
            <iframe 
              src="https://lookerstudio.google.com/embed/reporting/ab2ba689-631b-4c64-87fd-e121cc129f8e/page/X8rPF" 
              className={`w-full h-full border-0 ${activePage === 'module/tongquan' ? 'block' : 'hidden'}`} 
              allowFullScreen
              title="Báo cáo Tổng quan"
            />

            {/* 2. LOADING STATE */}
            {isInitialDataLoading && (
              <div className="absolute inset-0 z-50">
                 <SkeletonLoader />
              </div>
            )}

            {/* 3. VI TRI */}
            {!isInitialDataLoading && (
               <div className={`w-full h-full ${activePage === 'vitri' ? 'block' : 'hidden'}`}>
                  <iframe 
                    title="Báo cáo Vị trí" 
                    width="1024" 
                    height="1060" 
                    src="https://app.powerbi.com/view?r=eyJrIjoiMDg3OWQwOTAtOTYyNy00NTQ0LTg2YmYtZmMwMWE3ZDQ0ZDVmIiwidCI6ImI4YjEyY2UxLTk2NDAtNDg3OC04YWE3LWFkMmY1NDlmNzljZSIsImMiOjEwfQ%3D%3D&pageName=cccd45698c3d0207476e" 
                    className="w-full h-full border-0" 
                    allowFullScreen={true}
                  />
               </div>
            )}

            {!isInitialDataLoading && (
              <Suspense fallback={<div className="p-10 text-white">Đang tải module...</div>}>
                {activePage === 'tonkho' && (
                  <InventoryTable 
                    data={inventoryData} 
                    onRefresh={() => fetchInventoryData(false)} 
                    onUpdateRow={handleUpdateRow}
                    userInfo={userInfo}
                  />
                )}

                {activePage === 'xuatkho' && (
                  <ExportPage 
                    inventoryData={inventoryData}
                    onUpdateRow={handleUpdateRow}
                    onExecuteExportTransaction={handleExportTransaction}
                    onRefresh={() => fetchInventoryData(true)}
                    userInfo={userInfo}
                  />
                )}

                {activePage === 'nhaplai' && (
                  <ReImportPage 
                    inventoryData={inventoryData}
                    exportHistory={exportHistory} 
                    onExecuteTransaction={handleReImportTransaction}
                    onRefresh={() => { fetchInventoryData(true); fetchExportHistory(true); }}
                    userInfo={userInfo}
                    // Props below are less relevant now with api.ts but kept for compat
                    scanSpreadsheetId="" 
                    scanSheetName=""
                  />
                )}

                {activePage === 'nhapkho' && (
                  <ImportPage 
                    inventoryData={inventoryData}
                    onExecuteImport={handleNewImportTransaction}
                    userInfo={userInfo}
                    optionData={configData}
                  />
                )}

                {activePage === 'lichsu' && (
                  <HistoryPage 
                    exportData={exportHistory}
                    importData={importHistory}
                    defaultHeaders={getHistoryHeaders()}
                    onRefresh={() => { fetchExportHistory(false); fetchImportHistory(false); }}
                  />
                )}
              </Suspense>
            )}

            {!isLoading && activePage !== 'module/tongquan' && activePage !== 'tonkho' && activePage !== 'xuatkho' && activePage !== 'nhaplai' && activePage !== 'nhapkho' && activePage !== 'vitri' && activePage !== 'lichsu' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#212830] text-gray-400 gap-5 animate-fadeIn">
                {currentNavItem && (
                  <>
                    <div className="relative">
                      <span className="material-symbols-outlined text-8xl opacity-10 filter blur-[1px]">{currentNavItem.icon}</span>
                      <span className="material-symbols-outlined text-6xl text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        {currentNavItem.icon}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-200 tracking-wide mt-2">{currentNavItem.label}</h2>
                  </>
                )}
              </div>
            )}
            
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
