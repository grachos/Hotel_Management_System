import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { configApi } from '../../services/api';
import { Settings, Users, Shield, Building2, Plus, Sun, Moon, Wifi, Coffee, Clock, MapPin, BedDouble, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import HabitacionesManager from './HabitacionesManager';

export default function AdminPage() {
  const [tab, setTab] = useState<'usuarios' | 'roles' | 'config' | 'habitaciones'>('usuarios');
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
          { id: 'habitaciones', label: 'Habitaciones', icon: BedDouble },
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

      {tab === 'config' && <ConfigPanel />}
      {tab === 'habitaciones' && <HabitacionesManager />}
    </div>
  );
}

function ConfigPanel() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const { isDarkMode, toggleDarkMode } = useAuthStore();

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data } = await configApi.getAll();
      const map: Record<string, string> = {};
      data.data.forEach((c: any) => { map[c.clave] = c.valor; });
      setConfigs(map);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const setVal = (clave: string, valor: string) => {
    setConfigs((prev) => ({ ...prev, [clave]: valor }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(configs).map(([clave, valor]) => ({ clave, valor }));
      await configApi.update(entries);
      setSuccess('Configuración guardada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Building2 size={18} className="text-brand-600" /><CardTitle>Información del Hotel</CardTitle></div>
          </CardHeader>
          <div className="space-y-4">
            <div><label className="label">Nombre del Hotel</label><input className="input" value={configs['hotel.nombre'] || ''} onChange={(e) => setVal('hotel.nombre', e.target.value)} /></div>
            <div><label className="label">Dirección</label><input className="input" value={configs['hotel.direccion'] || ''} onChange={(e) => setVal('hotel.direccion', e.target.value)} /></div>
            <div><label className="label">Teléfono</label><input className="input" value={configs['hotel.telefono'] || ''} onChange={(e) => setVal('hotel.telefono', e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input" value={configs['hotel.email'] || ''} onChange={(e) => setVal('hotel.email', e.target.value)} /></div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Settings size={18} className="text-brand-600" /><CardTitle>Configuración del Sistema</CardTitle></div>
          </CardHeader>
          <div className="space-y-4">
            <div><label className="label">Impuesto (%)</label><input className="input" type="number" value={configs['hotel.impuesto'] || '0'} onChange={(e) => setVal('hotel.impuesto', e.target.value)} /></div>
            <div><label className="label">Moneda</label>
              <select className="input" value={configs['hotel.moneda_codigo'] || 'PEN'} onChange={(e) => setVal('hotel.moneda_codigo', e.target.value)}>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><MapPin size={18} className="text-brand-600" /><CardTitle>Info para Huéspedes</CardTitle></div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-slate-400" />
              <label className="label flex-1">WiFi - Nombre de Red</label>
            </div>
            <input className="input" value={configs['hotel.wifi_ssid'] || ''} onChange={(e) => setVal('hotel.wifi_ssid', e.target.value)} />
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-slate-400" />
              <label className="label flex-1">WiFi - Contraseña</label>
            </div>
            <input className="input" value={configs['hotel.wifi_password'] || ''} onChange={(e) => setVal('hotel.wifi_password', e.target.value)} />
            <div className="flex items-center gap-2">
              <Coffee size={16} className="text-slate-400" />
              <label className="label flex-1">Desayuno - Horario</label>
            </div>
            <input className="input" value={configs['hotel.desayuno_horario'] || ''} onChange={(e) => setVal('hotel.desayuno_horario', e.target.value)} placeholder="Ej: 7:00 AM - 10:00 AM" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coffee size={16} className="text-slate-400" />
              <label className="label flex-1">Desayuno - Lugar</label>
            </div>
            <input className="input" value={configs['hotel.desayuno_lugar'] || ''} onChange={(e) => setVal('hotel.desayuno_lugar', e.target.value)} placeholder="Ej: Restaurante" />
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <label className="label flex-1">Horario de Check-out</label>
            </div>
            <input className="input" value={configs['hotel.checkout_horario'] || ''} onChange={(e) => setVal('hotel.checkout_horario', e.target.value)} placeholder="Ej: Antes de las 12:00 PM" />
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              <label className="label flex-1">Servicios del Hotel</label>
            </div>
            <input className="input" value={configs['hotel.servicios'] || ''} onChange={(e) => setVal('hotel.servicios', e.target.value)} placeholder="Ej: Restaurante, Bar, Piscina" />
          </div>
        </div>
      </Card>

      <button onClick={save} disabled={saving} className="btn-primary px-8 py-3">
        {saving ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Todos los Cambios'}
      </button>
    </div>
  );
}
