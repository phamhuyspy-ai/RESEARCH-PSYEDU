
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { gasService } from '../services/gasService';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  ClipboardList,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { orgName, logoUrl } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Mật khẩu mới không khớp.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Assuming gasService.updatePassword exists
      const response = await gasService.updatePassword({ 
        email: user?.email || '', 
        oldPassword: passwordData.oldPassword, 
        newPassword: passwordData.newPassword 
      });
      if (response.success) {
        setPasswordSuccess('Đổi mật khẩu thành công.');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(response.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
      }
    } catch (err) {
      setPasswordError('Đã có lỗi xảy ra khi kết nối với máy chủ.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const navItems = [
    { label: 'Trang chủ', path: '/', icon: Globe },
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Bảng hỏi', path: '/admin/surveys', icon: ClipboardList },
    { label: 'Kết quả', path: '/admin/responses', icon: FileText },
    { label: 'Tạo bảng hỏi', path: '/admin/builder', icon: PlusCircle },
    { label: 'Cài đặt hệ thống', path: '/admin/settings', icon: SettingsIcon, roles: ['admin'] },
  ].filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="min-h-screen bg-bg-main flex flex-col md:flex-row text-text-main">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[240px] bg-sidebar text-white py-6">
        <div className="logo px-6 pb-8 font-bold text-lg tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md" />
          PsychAdmin
        </div>

        <nav className="flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item-minimal",
                location.pathname === item.path && "nav-item-minimal-active"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 mt-auto text-[10px] opacity-40 uppercase tracking-widest">
          v2.4.0-production
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-border-main p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md" />
          <span className="font-bold text-text-main">PsychAdmin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-text-muted">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-sidebar pt-20 p-6 text-white">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium",
                  location.pathname === item.path ? "bg-white/10" : "opacity-70"
                )}
              >
                <item.icon size={24} />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-lg font-medium text-red-400"
            >
              <LogOut size={24} />
              Đăng xuất
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            {navItems.find(i => i.path === location.pathname)?.label || 'System Overview'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="user-pill flex items-center gap-2.5 px-3 py-1.5 bg-white border border-border-main rounded-full text-[13px] font-medium shadow-sm cursor-pointer hover:bg-gray-50">
                <div className="w-6 h-6 bg-primary/10 text-primary flex items-center justify-center rounded-full font-bold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0)}
                </div>
                <span>{user?.name || user?.email}</span>
                <span className="text-text-muted text-[10px]">▼</span>
              </div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border-main py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-4 py-2 border-b border-border-main">
                  <p className="text-xs font-bold text-text-main truncate">{user?.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-bg-main flex items-center gap-2"
                >
                  <Key size={14} />
                  Đổi mật khẩu
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1">
          <Outlet />
        </div>
      </main>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border-main flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Key size={20} className="text-primary" />
                Đổi mật khẩu
              </h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-text-muted hover:text-text-main transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs text-red-700 font-medium">{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-100 p-3 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                  <p className="text-xs text-green-700 font-medium">{passwordSuccess}</p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary px-6 py-2 flex items-center gap-2"
                >
                  {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminLayout;
