
import React, { useState } from 'react';
import { useToast } from './ToastContext';
import { api } from '../services/api';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin ❗', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      // Sử dụng API Service mới
      const result = await api.checkLogin(username, password);
      
      if (result && result.success) {
        setTimeout(() => {
          onLoginSuccess(username);
        }, 500);
      } else {
        setIsLoading(false);
        showToast(result?.message || 'Sai thông tin đăng nhập', 'error');
      }
    } catch (error) {
       console.error(error);
       setIsLoading(false);
       showToast('Lỗi kết nối Server GAS. Vui lòng thử lại.', 'error');
    }
  };

  return (
    <div className="login-wrapper w-full h-full flex items-center justify-center font-inter text-[#111]">
      <style>{`
        :root{
          --brand-red:#cc0000;
          --brand-green:#22bb33;
          --white:#ffffff;
          --overlay: rgba(255,255,255,0.03);
          --card-bg: rgba(255, 255, 255, 0.3);
          --radius:16px;
        }
        .login-wrapper {
             font-family: 'Inter', system-ui, sans-serif;
        }
        .bg {
          position: fixed; 
          inset: 0; 
          background-color: #000000;
          background: radial-gradient(circle at 50% 30%, #6e0000 0%, #4a0000 30%, #1a0000 60%, #000000 100%);
          z-index: -2;
        }
        .veil {
          position: fixed; 
          inset: 0; 
          background: radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.9) 100%);
          z-index: -1;
        }
        .container{width:100%; max-width:1000px; display:flex; align-items:center; justify-content:center; min-height:72vh; padding:20px;}
        .card{
          width:100%; 
          background: var(--card-bg); 
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: var(--radius); 
          backdrop-filter: blur(20px); 
          box-shadow: 0 30px 60px rgba(0,0,0,0.8); 
          display:flex; 
          align-items:center; 
          padding:40px; 
          gap:48px;
        }
        .brand{flex:0 0 320px; display:flex; align-items:center; justify-content:center;}
        .brand .logo{max-width:260px;width:100%;height:auto;object-fit:contain; filter: drop-shadow(0 0 20px rgba(255,0,0,0.2));}
        .form-wrap{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;}
        
        .title{font-size:36px;font-weight:800;margin:0 0 18px;text-align:center;color:#ffffff;line-height:1.2; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);}
        
        form{width:100%; max-width:520px; display:flex; flex-direction:column; gap:14px; align-items:center;}
        
        .input{
          width:100%; 
          padding:14px 16px; 
          border-radius:10px; 
          border:1px solid rgba(255,255,255,0.2); 
          background: rgba(0, 0, 0, 0.4); 
          font-size:16px; 
          outline:none; 
          transition:all 0.2s ease; 
          color: #fff;
          font-weight: 500;
        }
        .input::placeholder { color: rgba(255,255,255,0.6); }
        .input:focus {
          border-color: var(--brand-red);
          background: rgba(0, 0, 0, 0.6);
          box-shadow: 0 0 0 3px rgba(204, 0, 0, 0.3);
        }
        
        .btn{width:100%; padding:14px 18px; border-radius:10px; border:none; background: linear-gradient(to right, #990000, #cc0000); color:var(--white); font-weight:700; font-size:18px; cursor:pointer; margin-top:6px; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.5);}
        .btn:hover{background: linear-gradient(to right, #7a0000, #a30000); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.6);}
        .btn:disabled{opacity:0.7;cursor:not-allowed;}
        
        .help{margin-top:10px;font-size:13px;color:rgba(255,255,255,0.7);opacity:0.9;}
        .spinner{border:3px solid rgba(255,255,255,0.2); border-top:3px solid #fff; border-radius:50%; width:18px;height:18px; animation:spin 0.8s linear infinite;}
        @keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}

        @media (max-width: 880px) {
          .card {flex-direction: column;padding: 22px 18px;gap: 20px;backdrop-filter: blur(20px);box-shadow: 0 4px 20px rgba(0,0,0,0.4);}
          .brand .logo {max-width: 180px;}
          .title {font-size: 24px;margin-bottom: 12px;}
          form {max-width: 100%;gap: 10px;}
          .input {font-size: 15px;padding: 12px 14px;}
          .btn {font-size: 16px;padding: 12px;}
          .help {font-size: 12px;text-align: center;line-height: 1.4;}
        }
      `}</style>

      <div className="bg"></div>
      <div className="veil"></div>

      <div className="container">
        <div className="card">
          <div className="brand">
            <img src="https://i.postimg.cc/8zF3c24h/image.png" alt="Logo" className="logo" />
          </div>
          <div className="form-wrap">
            <h1 className="title">
              Nghiệp Vụ Kho Giấy
            </h1>
            <form onSubmit={handleLogin}>
              <input 
                id="username" 
                className="input" 
                type="text" 
                placeholder="Tên đăng nhập" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input 
                id="password" 
                className="input" 
                type="password" 
                placeholder="Mật khẩu" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="spinner"></div> <span>Đang xác minh...</span>
                  </>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>
              <div className="help">Quên mật khẩu? Liên hệ quản trị viên.</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
