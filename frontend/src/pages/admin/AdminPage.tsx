import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Settings, Users, Shield, Building2, Plus, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function AdminPage() {
  const [tab, setTab] = useState<'usuarios' | 'roles' | 'config'>('usuarios');
  const { isDarkMode, toggleDarkMode } = useAuthStore();

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Administración</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configuración del sistema y usuarios</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'usuarios', label: 'Usuarios', icon: Users },
          { id: 'roles', label: 'Roles y Permisos', icon: Shield },
          { id: 'config', label: 'Configuración', icon: Settings },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
            }`}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && (
        <Card>
          <CardHeader>
            <CardTitle>Usuarios del Sistema</CardTitle>
            <button className="btn-primary text-sm py-1.5 px-3"><Plus size={16} /> Nuevo Usuario</button>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
              <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">A</div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-100">Administrador</p>
                <p className="text-xs text-slate-500">admin@hotel.com</p>
              </div>
              <Badge variant="info">Administrador</Badge>
              <Badge variant="success">Activo</Badge>
            </div>
          </div>
        </Card>
      )}

      {tab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Administrador', 'Gerente', 'Recepción', 'Restaurante', 'Bar', 'MiniMarket', 'Huésped'].map((role) => (
            <Card key={role}>
              <div className="flex items-center gap-3 mb-3">
                <Shield size={20} className="text-brand-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{role}</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                {role === 'Administrador' ? 'Acceso total al sistema' :
                 role === 'Gerente' ? 'Gestión operativa y reportes' :
                 role === 'Recepción' ? 'Gestión de huéspedes y reservaciones' :
                 role === 'Restaurante' ? 'Módulo de restaurante' :
                 role === 'Bar' ? 'Módulo de bar' :
                 role === 'MiniMarket' ? 'Módulo de minimarket' :
                 'Acceso limitado para huéspedes'}
              </p>
              <Badge variant={role === 'Administrador' ? 'danger' : 'neutral'}>{role === 'Administrador' ? 'Super Admin' : 'Estándar'}</Badge>
            </Card>
          ))}
        </div>
      )}

      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Building2 size={18} className="text-brand-600" /><CardTitle>Información del Hotel</CardTitle></div>
            </CardHeader>
            <div className="space-y-4">
              <div><label className="label">Nombre del Hotel</label><input className="input" defaultValue="Hotel Gestión" /></div>
              <div><label className="label">Dirección</label><input className="input" defaultValue="Av. Principal 123" /></div>
              <div><label className="label">Teléfono</label><input className="input" defaultValue="+51 999 888 777" /></div>
              <div><label className="label">Email</label><input className="input" defaultValue="info@hotelgestion.com" /></div>
              <button className="btn-primary w-full">Guardar Cambios</button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Settings size={18} className="text-brand-600" /><CardTitle>Configuración del Sistema</CardTitle></div>
            </CardHeader>
            <div className="space-y-4">
              <div><label className="label">Impuesto (%)</label><input className="input" defaultValue="18" type="number" /></div>
              <div><label className="label">Moneda</label>
                <select className="input" defaultValue="PEN">
                  <option value="PEN">S/. (Sol Peruano)</option>
                  <option value="USD">$ (Dólar)</option>
                  <option value="EUR">€ (Euro)</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-slate-600" />}
                  <div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">Modo Oscuro</p><p className="text-xs text-slate-500">Activar tema oscuro</p></div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={toggleDarkMode} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
