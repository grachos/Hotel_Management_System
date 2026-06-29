import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/helpers';
import {
  LayoutDashboard, Users, CalendarCheck, UtensilsCrossed,
  Wine, ShoppingBag, Package, BarChart3, Settings, LogOut,
  BedDouble, MoreHorizontal, X
} from 'lucide-react';

const mainItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/huespedes', icon: Users, label: 'Recepción' },
  { path: '/reservaciones', icon: CalendarCheck, label: 'Reservaciones' },
  { path: '/restaurante', icon: UtensilsCrossed, label: 'Restaurante' },
];

const moreItems = [
  { path: '/bar', icon: Wine, label: 'Bar & Lounge' },
  { path: '/minimarket', icon: ShoppingBag, label: 'Mini Market' },
  { path: '/inventario', icon: Package, label: 'Inventario' },
  { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  { path: '/admin', icon: Settings, label: 'Administración' },
];

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout, usuario } = useAuthStore();

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-20 left-2 right-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="bg-brand-500 p-1.5 rounded-lg">
                  <BedDouble size={18} className="text-white" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100">NovaHotel</span>
              </div>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-2 py-3 space-y-0.5">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    )
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
            <div className="px-2 py-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 px-4 py-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                  {usuario?.nombre?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{usuario?.nombre || 'Admin'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{usuario?.role_name || 'Usuario'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {mainItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
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
              <span className="text-[10px] font-medium leading-tight truncate max-w-full">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-colors',
              moreOpen ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            )}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}