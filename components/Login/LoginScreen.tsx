
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/auth';
import { queryClient } from '../../lib/queryClient'; 
import { fetchInventoryData } from '../../hooks/useInventoryQuery';
import { InventoryService } from '../../services/inventory';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input'; 
import { Lock, User } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect: Prefetch Data using React Query
  useEffect(() => {
    console.log("System: Starting data prefetch...");

    // 1. Prefetch Inventory (Tồn kho)
    queryClient.prefetchQuery({
        queryKey: ['inventory'],
        queryFn: () => fetchInventoryData(queryClient)
    });

    // 2. Prefetch Metadata (NCC, NSX, Loại giấy...)
    // Sử dụng staleTime: 0 để ép buộc tải mới từ Google Sheet mỗi khi vào màn hình Login
    // Điều này đảm bảo dữ liệu danh mục luôn mới nhất khi bắt đầu phiên làm việc
    queryClient.prefetchQuery({
        queryKey: ['metadata'],
        queryFn: () => InventoryService.fetchMetaData(),
        staleTime: 0 
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await AuthService.login(username, password);
      if (user) {
        login(user);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Decorative overlay elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-40"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl opacity-50"></div>
      
      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl p-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Logo Only - Width 2/5 */}
          <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col items-center justify-center relative">
            <img 
              src="https://i.postimg.cc/8zF3c24h/image.png" 
              alt="Kho Giấy Pro Logo" 
              loading="lazy"
              className="relative z-10 w-80 h-auto hover:scale-105 transition-transform duration-300 drop-shadow-xl mb-6"
            />
          </div>

          {/* Right Column: Title & Login Form - Width 3/5 */}
          <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
            
            {/* System Title & Version moved here */}
            <div className="mb-8 text-center">
                <p className="text-2xl md:text-2xl font-bold text-white uppercase tracking-widest leading-relaxed">
                  Nghiệp Vụ Kho Giấy WEBAPP
                </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  icon={User}
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Mã Nhân Viên"
                  className="h-14 !text-lg"
                />

                <Input
                  icon={Lock}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 !text-lg"
                />
              </div>

              {error && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                fullWidth 
                isLoading={loading}
                className="py-3 bg-blue-600 hover:bg-blue-700 shadow-blue-900/20 border-transparent text-white font-semibold tracking-wide"
              >
                ĐĂNG NHẬP
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-600">
              <p>Hệ thống nội bộ - Vui lòng không chia sẻ tài khoản</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1">
                  v2.0.0 • PTB BULD 2026
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};