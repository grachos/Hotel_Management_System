import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useGuestStore } from '../../store/guestStore';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { BedDouble, Sun, Moon, LogOut, Home, UtensilsCrossed, Star, Receipt, MoreHorizontal, X, User } from 'lucide-react';
import { cn } from '../../utils/helpers';

const bottomItems = [
  { path: '/guest/dashboard', icon: Home, label: 'Inicio', end: true },
  { path: '/guest/dashboard/pedir', icon: UtensilsCrossed, label: 'Pedir' },
  { path: '/guest/dashboard/resena', icon: Star, label: 'Reseña' },
  { path: '/guest/dashboard/cuenta', icon: Receipt, label: 'Cuenta' },
];

export default function GuestLayout() {
  const { logout: guestLogout, huesped } = useGuestStore();
  const { isDarkMode, toggleDarkMode } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    guestLogout();
    navigate('/guest', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="shrink-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-500 p-1.5 rounded-lg">
            <BedDouble size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">NovaHotel</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="btn-ghost p-2">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-2">
            <User size={16} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-16 right-2 left-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
                  {huesped?.nombre?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{huesped?.nombre} {huesped?.apellidos}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Huésped</p>
                </div>
              </div>
            </div>
            <div className="px-2 py-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-around h-16 px-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl min-w-0 transition-colors',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                )
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
