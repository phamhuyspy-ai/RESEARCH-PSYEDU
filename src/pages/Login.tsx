
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { gasService } from '../services/gasService';
import { Lock, Mail, Key, AlertCircle, Loader2, Globe, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const { gasUrl, updateSettings } = useSettingsStore();
  const [step, setStep] = useState<'pin' | 'auth'>('pin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [inputGasUrl, setInputGasUrl] = useState(gasUrl);
  const [showGasConfig, setShowGasConfig] = useState(!gasUrl);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const from = location.state?.from?.pathname || '/admin';

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN is 123456 as requested
    if (pin === '123456') {
      setStep('auth');
      setError('');
    } else {
      setError('Mã PIN không chính xác. Vui lòng kiểm tra lại.');
    }
  };

  const handleTestConnection = async () => {
    if (!inputGasUrl) {
      setError('Vui lòng nhập GAS URL để kiểm tra.');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setError('');

    try {
      const response = await fetch(inputGasUrl + '?action=health');
      const result = await response.json();
      
      if (result.status === 'ok') {
        setConnectionStatus('success');
        updateSettings({ gasUrl: inputGasUrl });
      } else {
        setConnectionStatus('error');
        setError('Không thể kết nối với GAS URL này.');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError('Lỗi kết nối. Vui lòng kiểm tra lại URL và quyền truy cập (CORS).');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await gasService.login(email, password);
      
      if (response.success && response.user) {
        login(response.user);
        navigate(from, { replace: true });
      } else {
        setError(response.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra khi kết nối với máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Vui lòng nhập email của bạn.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await gasService.recoverPassword(email);
      if (response.success) {
        setSuccessMsg(response.message || 'Mật khẩu mới đã được gửi vào email của bạn.');
        setIsForgotPassword(false);
      } else {
        setError(response.message || 'Không thể khôi phục mật khẩu.');
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra khi kết nối với máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3 transform hover:rotate-0 transition-transform">
            <Lock size={32} />
          </div>
        </div>
        <h2 className="mt-8 text-center text-3xl font-black text-text-main tracking-tight">
          {step === 'pin' ? 'Khu vực quản trị' : isForgotPassword ? 'Quên mật khẩu' : 'Đăng nhập hệ thống'}
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          {step === 'pin' ? 'Vui lòng nhập mã PIN bảo mật để tiếp tục' : 'Chào mừng bạn quay lại với ProPsy Admin'}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-gray-200/50 sm:rounded-[32px] sm:px-12 border border-border-main relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <form className="space-y-6 relative" onSubmit={step === 'pin' ? handlePinSubmit : (isForgotPassword ? handleForgotPassword : handleSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
              </div>
            )}
            
            {successMsg && (
              <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                <p className="text-sm text-green-700 font-medium leading-tight">{successMsg}</p>
              </div>
            )}

            {step === 'pin' ? (
              <div className="space-y-6">
                <div>
                  <label htmlFor="pin" className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">
                    Mã PIN 6 số
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <input
                      id="pin"
                      name="pin"
                      type="password"
                      required
                      maxLength={6}
                      autoFocus
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="appearance-none block w-full pl-12 px-4 py-4 border-2 border-border-main rounded-2xl text-lg font-mono tracking-[0.5em] placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-center"
                      placeholder="••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all active:scale-[0.98]"
                >
                  Tiếp tục
                  <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                {showGasConfig && (
                  <div className="bg-bg-main p-4 rounded-2xl border-2 border-border-main space-y-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="gasUrl" className="block text-[10px] font-black text-text-muted uppercase tracking-widest">
                        Cấu hình kết nối
                      </label>
                    </div>
                    <div className="relative group">
                      <input
                        id="gasUrl"
                        type="url"
                        value={inputGasUrl}
                        onChange={(e) => {
                          setInputGasUrl(e.target.value);
                          setConnectionStatus('idle');
                        }}
                        className="appearance-none block w-full px-4 py-3 border-2 border-white rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        placeholder="Dán GAS Web App URL tại đây..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection || !inputGasUrl}
                      className="w-full text-xs font-bold py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 bg-white text-text-main border-border-main hover:bg-white hover:border-primary group"
                    >
                      {isTestingConnection ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : connectionStatus === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : 'Kiểm tra & Áp dụng'}
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="email" className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                      Tài khoản Email
                    </label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full pl-11 px-4 py-4 border-2 border-border-main rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                      placeholder="example@propsy.vn"
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label htmlFor="password" className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                        Mật khẩu
                      </label>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError('');
                        }}
                        className="text-[10px] font-black text-primary hover:text-blue-800 tracking-wider"
                      >
                        QUÊN?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                        <Key size={18} />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required={!isForgotPassword}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full pl-11 px-4 py-4 border-2 border-border-main rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-6 w-6" />
                    ) : isForgotPassword ? (
                      'Lấy lại mật khẩu'
                    ) : (
                      'Đăng nhập ngay'
                    )}
                  </button>
                </div>

                <div className="flex flex-col gap-4 text-center mt-6">
                  {isForgotPassword ? (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="text-sm font-bold text-text-muted hover:text-primary transition-colors"
                    >
                      Quay lại trang đăng nhập
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowGasConfig(!showGasConfig)}
                      className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-[0.2em]"
                    >
                      {showGasConfig ? 'Đóng cấu hình' : 'Thiết lập kết nối GAS'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
        
        <p className="mt-10 text-center text-xs text-text-muted font-medium opacity-40">
          PROPSY DATABASE SYSTEM &copy; 2024
        </p>
      </div>
    </div>
  );
};

export default Login;
