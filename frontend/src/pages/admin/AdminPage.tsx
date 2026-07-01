import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { configApi, authApi } from '../../services/api';
import { Settings, Users, Shield, Building2, Plus, Sun, Moon, Wifi, Coffee, Clock, MapPin, BedDouble, Loader2, CheckCircle, Pencil, Power, PowerOff, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import HabitacionesManager from './HabitacionesManager';
import toast from 'react-hot-toast';

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
        ]?.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
            }`}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <UsuariosManager />}

      {tab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Administrador', 'Gerente', 'Recepción', 'Restaurante', 'Bar', 'MiniMarket', 'Huésped']?.map((role) => (
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

function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', role_id: 2 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await authApi.listarUsuarios();
      setUsuarios(data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.email || !form.password) {
      toast.error('Nombre, email y contraseña son requeridos');
      return;
    }
    setSaving(true);
    try {
      await authApi.crearUsuario(form);
      toast.success('Usuario creado');
      setShowModal(false);
      setForm({ nombre: '', email: '', password: '', telefono: '', role_id: 2 });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear usuario');
    } finally { setSaving(false); }
  };

  const toggleActivo = async (user: any) => {
    try {
      await authApi.actualizarUsuario(user.id, { activo: !user.activo });
      toast.success(`Usuario ${user.activo ? 'desactivado' : 'activado'}`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Gerente' },
    { id: 3, nombre: 'Recepción' },
    { id: 4, nombre: 'Restaurante' },
    { id: 5, nombre: 'Bar' },
    { id: 6, nombre: 'MiniMarket' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-1.5 px-3"><Plus size={16} /> Nuevo Usuario</button>
        </CardHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-600" /></div>
        ) : (
          <div className="space-y-2">
            {usuarios?.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-600">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${u.activo ? 'bg-brand-600' : 'bg-slate-400'}`}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{u.nombre}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}{u.telefono ? ` · ${u.telefono}` : ''}</p>
                </div>
                <Badge variant={u.role_name === 'Administrador' ? 'danger' : 'info'}>{u.role_name}</Badge>
                <Badge variant={u.activo ? 'success' : 'neutral'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                {u.role_name !== 'Administrador' && (
                  <button onClick={() => toggleActivo(u)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title={u.activo ? 'Desactivar' : 'Activar'}>
                    {u.activo ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                )}
              </div>
            ))}
            {!usuarios.length && <p className="text-sm text-slate-400 text-center py-4">Sin usuarios registrados</p>}
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Usuario" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="ejemplo@hotel.com" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Mín. 6 caracteres" />
          </div>
          <div>
            <label className="label">Teléfono (opcional)</label>
            <input className="input" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} placeholder="+51 999 888 777" />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role_id} onChange={(e) => setForm({...form, role_id: Number(e.target.value)})}>
              {roles.filter((r) => r.id !== 1)?.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 py-2.5">
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Crear Usuario'}
            </button>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-2.5">Cancelar</button>
          </div>
        </div>
      </Modal>
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
      const entries = Object.entries(configs)?.map(([clave, valor]) => ({ clave, valor }));
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
                <option value="COP">$ (Peso Colombiano)</option>
                <option value="USD">$ (Dólar)</option>
                <option value="EUR">€ (Euro)</option>
              </select>
            </div>
            <div><label className="label">Recargo por Delivery (S/.)</label><input className="input" type="number" step="0.01" value={configs['delivery.recargo'] || '0'} onChange={(e) => setVal('delivery.recargo', e.target.value)} /></div>
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
