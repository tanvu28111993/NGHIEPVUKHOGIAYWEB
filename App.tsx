import React from 'react';
import { useAuth } from './contexts';
import { LoginScreen } from './components/Login/LoginScreen';
import { MainLayout } from './components/Layout/MainLayout';
import { AppProviders } from './components/AppProviders';
import { useDataSynchronizer } from './hooks';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Kích hoạt đồng bộ dữ liệu nền nếu đã đăng nhập
  useDataSynchronizer(isAuthenticated);
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

const App: React.FC = () => {
  return (
    <AppProviders>
        <AppContent />
    </AppProviders>
  );
};

export default App;