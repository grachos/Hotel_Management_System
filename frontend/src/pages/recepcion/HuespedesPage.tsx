import { useState, useEffect } from 'react';
import { huespedesApi, reservacionesApi } from '../../services/api';
import { Huesped } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/helpers';
import NuevoHuespedModal from '../../components/recepcion/NuevoHuespedModal';
import { Plus, Search, Mail, Phone, User, CalendarCheck, LogOut, Home, Loader2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HuespedesPage() {
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Huesped | null>(null);
  const [showNuevoHuesped, setShowNuevoHuesped] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '', apellidos: '', email: '', telefono: '',
    tipo_documento: 'DNI', numero_documento: '',
    direccion: '', ciudad: '', pais: '',
    fecha_nacimiento: '', notas: '',
  });

  const [arrivals, setArrivals] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [inHouse, setInHouse] = useState<any[]>([]);

  useEffect(() => {
    loadHuespedes();
    loadTodayStats();
  }, []);

  const loadHuespedes = async () => {
    try {
      const params = search ? { search } : {};
      const { data } = await huespedesApi.listar(params);
      setHuespedes(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayStats = async () => {
    try {
      const [arr, dep, house] = await Promise.all([
        reservacionesApi.listar({ estado: 'Confirmada' }),
        reservacionesApi.listar({ estado: 'CheckIn' }),
        reservacionesApi.listar({ estado: 'CheckIn' }),
      ]);
      const today = new Date().toISOString().split('T')[0];
      setArrivals((arr.data.data || []).filter((r: any) => r.fecha_entrada === today));
      setDepartures((dep.data.data || []).filter((r: any) => r.fecha_salida === today));
      setInHouse(house.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = huespedes.filter((h) =>
    !search || h.nombre.toLowerCase().includes(search.toLowerCase()) ||
    h.apellidos.toLowerCase().includes(search.toLowerCase()) ||
    h.numero_documento?.includes(search)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Recepción</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Registro y búsqueda de huéspedes</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNuevoHuesped(true)}>
          <Plus size={18} />
          Nuevo Huésped
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Llegadas Hoy</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{arrivals.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
            <LogOut size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Salidas Hoy</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{departures.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
            <Home size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500">En Casa</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{inHouse.length}</p>
          </div>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          placeholder="Buscar por nombre, apellido o documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6]?.map((i) => (
            <div key={i} className="card h-36 animate-pulse" />
          ))
        ) : filtered?.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <User size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No se encontraron huéspedes</p>
            <button onClick={() => setShowNuevoHuesped(true)} className="btn-primary mt-4">
              <Plus size={18} /> Registrar primer huésped
            </button>
          </div>
        ) : (
          filtered?.map((huesped) => (
            <Card key={huesped.id} hover onClick={() => setSelected(huesped)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
                  {huesped.nombre.charAt(0)}{huesped.apellidos.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {huesped.nombre} {huesped.apellidos}
                  </h3>
                  <div className="space-y-1 mt-2">
                    {huesped.email && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Mail size={12} /> {huesped.email}
                      </p>
                    )}
                    {huesped.telefono && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Phone size={12} /> {huesped.telefono}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {huesped.tipo_documento}: {huesped.numero_documento}
                    </p>
                  </div>
                </div>
                <Badge variant="info">{huesped.tipo_documento}</Badge>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setEditMode(false); }} title={editMode ? 'Editar Huésped' : 'Detalles del Huésped'} size="lg">
        {selected && !editMode && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-2xl">
                {selected.nombre.charAt(0)}{selected.apellidos.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {selected.nombre} {selected.apellidos}
                </h3>
                <p className="text-sm text-slate-500">{selected.tipo_documento}: {selected.numero_documento}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Email</label><p className="text-slate-700 dark:text-slate-300">{selected.email || '-'}</p></div>
              <div><label className="label">Teléfono</label><p className="text-slate-700 dark:text-slate-300">{selected.telefono || '-'}</p></div>
              <div className="col-span-2"><label className="label">Dirección</label><p className="text-slate-700 dark:text-slate-300">{selected.direccion || '-'}</p></div>
              <div><label className="label">Ciudad</label><p className="text-slate-700 dark:text-slate-300">{selected.ciudad || '-'}</p></div>
              <div><label className="label">País</label><p className="text-slate-700 dark:text-slate-300">{selected.pais || '-'}</p></div>
              <div><label className="label">Fecha de Nacimiento</label><p className="text-slate-700 dark:text-slate-300">{selected.fecha_nacimiento ? formatDate(selected.fecha_nacimiento) : '-'}</p></div>
              <div><label className="label">Notas</label><p className="text-slate-700 dark:text-slate-300">{selected.notas || '-'}</p></div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => { setEditForm({
                nombre: selected.nombre, apellidos: selected.apellidos, email: selected.email || '',
                telefono: selected.telefono || '', tipo_documento: selected.tipo_documento,
                numero_documento: selected.numero_documento || '', direccion: selected.direccion || '',
                ciudad: selected.ciudad || '', pais: selected.pais || '',
                fecha_nacimiento: selected.fecha_nacimiento || '', notas: selected.notas || '',
              }); setEditMode(true); }} className="btn-primary flex-1">
                <Pencil size={18} /> Editar Huésped
              </button>
            </div>
          </div>
        )}
        {selected && editMode && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nombre *</label><input className="input" value={editForm.nombre} onChange={(e) => setEditForm({...editForm, nombre: e.target.value})} /></div>
              <div><label className="label">Apellidos *</label><input className="input" value={editForm.apellidos} onChange={(e) => setEditForm({...editForm, apellidos: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo Documento</label>
                <select className="input" value={editForm.tipo_documento} onChange={(e) => setEditForm({...editForm, tipo_documento: e.target.value})}>
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="CE">CE</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div><label className="label">N° Documento</label><input className="input" value={editForm.numero_documento} onChange={(e) => setEditForm({...editForm, numero_documento: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Email</label><input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} /></div>
              <div><label className="label">Teléfono</label><input className="input" value={editForm.telefono} onChange={(e) => setEditForm({...editForm, telefono: e.target.value})} /></div>
            </div>
            <div><label className="label">Dirección</label><input className="input" value={editForm.direccion} onChange={(e) => setEditForm({...editForm, direccion: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Ciudad</label><input className="input" value={editForm.ciudad} onChange={(e) => setEditForm({...editForm, ciudad: e.target.value})} /></div>
              <div><label className="label">País</label><input className="input" value={editForm.pais} onChange={(e) => setEditForm({...editForm, pais: e.target.value})} /></div>
            </div>
            <div><label className="label">Fecha de Nacimiento</label><input className="input" type="date" value={editForm.fecha_nacimiento} onChange={(e) => setEditForm({...editForm, fecha_nacimiento: e.target.value})} /></div>
            <div><label className="label">Notas</label><textarea className="input" rows={2} value={editForm.notas} onChange={(e) => setEditForm({...editForm, notas: e.target.value})} /></div>
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button onClick={async () => {
                if (!editForm.nombre.trim() || !editForm.apellidos.trim()) { toast.error('Nombre y apellidos son obligatorios'); return; }
                setSaving(true);
                try {
                  await huespedesApi.actualizar(selected.id, editForm);
                  toast.success('Huésped actualizado');
                  setEditMode(false);
                  loadHuespedes();
                } catch (err: any) { toast.error(err.response?.data?.error || 'Error al actualizar'); }
                finally { setSaving(false); }
              }} className="btn-primary flex-1" disabled={saving}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button onClick={() => setEditMode(false)} className="btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      <NuevoHuespedModal
        isOpen={showNuevoHuesped}
        onClose={() => setShowNuevoHuesped(false)}
        onSuccess={loadHuespedes}
      />
    </div>
  );
}
