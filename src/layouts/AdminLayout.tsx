
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  ClipboardList
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { organizationName, logoUrl } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Danh sách bảng hỏi', path: '/admin/surveys', icon: ClipboardList },
    { label: 'Tạo bảng hỏi', path: '/admin/builder', icon: PlusCircle },
    { label: 'System Settings', path: '/admin/settings', icon: SettingsIcon, roles: ['super_admin'] },
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
            <div className="user-pill flex items-center gap-2.5 px-3 py-1.5 bg-white border border-border-main rounded-full text-[13px] font-medium shadow-sm">
              <div className="w-6 h-6 bg-gray-300 rounded-full" />
              <span>{user?.email}</span>
              <span className="text-text-muted text-[10px]">▼</span>
            </div>
            <button onClick={handleLogout} className="text-text-muted hover:text-red-600 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};


export default AdminLayout;
