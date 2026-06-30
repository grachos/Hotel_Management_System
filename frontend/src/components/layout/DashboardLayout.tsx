import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '../../store/authStore';
import { Moon, Sun, User } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import ProfileModal from './ProfileModal';

export default function DashboardLayout() {
  const { isDarkMode, toggleDarkMode, usuario } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 md:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">Panel de Control</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="btn-ghost p-2">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationPanel />
            <button onClick={() => setShowProfile(true)} className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors pr-2 py-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                {usuario?.nombre?.charAt(0) || 'A'}
              </div>
              <div className="text-sm text-left">
                <p className="font-medium text-slate-800 dark:text-slate-100">{usuario?.nombre || 'Admin'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{usuario?.role_name || 'Usuario'}</p>
              </div>
            </button>
            <button onClick={() => setShowProfile(true)} className="sm:hidden btn-ghost p-2">
              <User size={18} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
