import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn, getInitials } from '../../utils/helpers';
import { useState } from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, UtensilsCrossed,
  Wine, ShoppingBag, Package, BarChart3, Settings, LogOut,
  ChevronLeft, BedDouble
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/huespedes', icon: Users, label: 'Recepción' },
  { path: '/reservaciones', icon: CalendarCheck, label: 'Reservaciones' },
  { path: '/restaurante', icon: UtensilsCrossed, label: 'Restaurante' },
  { path: '/bar', icon: Wine, label: 'Bar & Lounge' },
  { path: '/minimarket', icon: ShoppingBag, label: 'Mini Market' },
  { path: '/inventario', icon: Package, label: 'Inventario' },
  { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  { path: '/admin', icon: Settings, label: 'Administración' },
];

export function Sidebar() {
  const { usuario, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen bg-slate-900 dark:bg-slate-950 text-slate-300 flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
        <div className="bg-brand-500 p-2 rounded-lg">
          <BedDouble size={20} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-wide truncate">NovaHotel</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto btn-ghost p-1 text-slate-500 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-0.5',
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
              {usuario ? getInitials(usuario.nombre) : 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{usuario?.nombre || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{usuario?.role_name || 'Usuario'}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full',
            collapsed && 'justify-center'
          )}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
