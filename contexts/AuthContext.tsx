import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { User } from '../types';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  // Sử dụng custom hook để xử lý logic timeout
  useSessionTimeout(user, logout);

  // Sử dụng useMemo để object value không bị tạo mới mỗi lần render
  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    isAuthenticated: !!user
  }), [user, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};