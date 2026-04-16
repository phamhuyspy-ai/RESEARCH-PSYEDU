
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { gasService } from '../services/gasService';
import { Lock, Mail, Key, AlertCircle, Loader2, Globe, CheckCircle2 } from 'lucide-react';


const Login: React.FC = () => {
  const { gasUrl, updateSettings } = useSettingsStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [inputGasUrl, setInputGasUrl] = useState(gasUrl);
  const [showGasConfig, setShowGasConfig] = useState(!gasUrl);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const from = location.state?.from?.pathname || '/admin';

  const handleTestConnection = async () => {
    if (!inputGasUrl) {
      setError('Vui lòng nhập GAS URL để kiểm tra.');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setError('');

    try {
      // Temporarily update store to test
      const originalUrl = gasUrl;
      updateSettings({ gasUrl: inputGasUrl });
      
      const response = await gasService.request('health_check');
      
      if (response.success) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setError(response.message || 'Không thể kết nối với GAS URL này.');
        // Revert if failed
        updateSettings({ gasUrl: originalUrl });
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

    if (!inputGasUrl) {
      setError('Vui lòng cấu hình GAS URL trước khi đăng nhập.');
      setShowGasConfig(true);
      return;
    }

    // Update gasUrl in store if changed
    if (inputGasUrl !== gasUrl) {
      updateSettings({ gasUrl: inputGasUrl });
    }

    setIsLoading(true);

    try {
      const response = await gasService.login(email, password, pin);
      
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

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
            <Lock size={24} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-text-main tracking-tight">
          PsychAdmin Login
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          System Overview & Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-border-main">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={18} />
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            {showGasConfig && (
              <div className="bg-bg-main p-4 rounded-lg border border-border-main space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="gasUrl" className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Google Apps Script URL
                  </label>
                  {!gasUrl && <span className="text-[10px] font-bold text-red-500 uppercase">Bắt buộc</span>}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-text-muted" />
                  </div>
                  <input
                    id="gasUrl"
                    type="url"
                    value={inputGasUrl}
                    onChange={(e) => {
                      setInputGasUrl(e.target.value);
                      setConnectionStatus('idle');
                    }}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-border-main rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-text-muted leading-relaxed max-w-[200px]">
                    Dán URL của Web App đã được triển khai từ Google Apps Script.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !inputGasUrl}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-md border transition-all flex items-center gap-1.5 ${
                      connectionStatus === 'success' 
                        ? 'bg-green-50 text-green-600 border-green-200' 
                        : connectionStatus === 'error'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-white text-text-main border-border-main hover:bg-bg-main'
                    }`}
                  >
                    {isTestingConnection ? (
                      <Loader2 className="animate-spin h-3 w-3" />
                    ) : connectionStatus === 'success' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : connectionStatus === 'error' ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : null}
                    {connectionStatus === 'success' ? 'Kết nối OK' : 'Kiểm tra kết nối'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                  Email Address
                </label>
                {gasUrl && (
                  <button 
                    type="button"
                    onClick={() => setShowGasConfig(!showGasConfig)}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    {showGasConfig ? 'Ẩn cấu hình' : 'Đổi GAS URL'}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-text-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-border-main rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="admin@psycheval.io"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-border-main rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pin" className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Verification PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-text-muted" />
                </div>
                <input
                  id="pin"
                  name="pin"
                  type="text"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-border-main rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="123456"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest opacity-50">
            v2.4.0-production
          </p>
        </div>
      </div>
    </div>
  );
};


export default Login;
