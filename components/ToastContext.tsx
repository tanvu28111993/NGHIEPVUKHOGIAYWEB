import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container - Moved to bottom right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      startExit();
    }, 4000); // Tự động tắt sau 4s
    return () => clearTimeout(timer);
  }, []);

  const startExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 400); // Đợi animation exit chạy xong
  };

  // Cấu hình giao diện theo loại thông báo
  const config = {
    success: { icon: 'check_circle', color: 'text-green-neon', border: 'border-green-500/50', bg: 'bg-[#1a1a1a]/90' },
    error: { icon: 'error', color: 'text-danger', border: 'border-red-500/50', bg: 'bg-[#2d2f35]/95' },
    warning: { icon: 'warning', color: 'text-yellow-neon', border: 'border-yellow-500/50', bg: 'bg-[#1a1a1a]/90' },
    info: { icon: 'info', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-[#1a1a1a]/90' },
  }[toast.type];

  return (
    <div
      className={`
        pointer-events-auto min-w-[300px] max-w-[400px] p-4 rounded-lg shadow-2xl backdrop-blur-md border border-l-4
        flex items-start gap-3 transform transition-all duration-500 ease-in-out
        ${config.bg} ${config.border} ${config.color}
        ${isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100 animate-slideInRight'}
      `}
      style={{ borderLeftColor: 'currentColor' }}
    >
      <span className="material-symbols-outlined text-[24px] mt-0.5">{config.icon}</span>
      <div className="flex-1">
        <h4 className="font-bold text-sm uppercase tracking-wider mb-1 text-white opacity-90">
          {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi' : toast.type === 'warning' ? 'Cảnh báo' : 'Thông tin'}
        </h4>
        <p className="text-[14px] text-gray-200 font-medium leading-tight">{toast.message}</p>
      </div>
      <button 
        onClick={startExit}
        aria-label="Đóng thông báo"
        className="text-white/40 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
      <style>{`
         @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } 
         .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};