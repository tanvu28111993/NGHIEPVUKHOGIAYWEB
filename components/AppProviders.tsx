import React, { ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '../lib/queryClient';
import { AuthProvider } from '../contexts/AuthContext';
import { CommandQueueProvider } from '../contexts/CommandQueueContext';
import { ToastProvider } from '../contexts/ToastContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
      onSuccess={() => console.log('React Query Cache Restored from IDB')}
    >
      <ToastProvider>
        <AuthProvider>
          <CommandQueueProvider>
              {children}
          </CommandQueueProvider>
        </AuthProvider>
      </ToastProvider>
    </PersistQueryClientProvider>
  );
};