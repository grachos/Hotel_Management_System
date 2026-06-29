import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BedDouble, Home, Plus, Edit3, Trash2, Loader2, CheckCircle, X } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const tiposHabitacion = ['Individual', 'Doble', 'Suite', 'Familiar', 'Presidencial'];
const estados = ['Disponible', 'Ocupada', 'Limpieza', 'Mantenimiento', 'Reservada'];

interface RoomForm {
  numero: string; piso: number; tipo: string; capacidad: number;
  precio_noche: number; estado: string; descripcion: string; amenities: string;
}

interface CabinForm {
  nombre: string; capacidad: number; precio_noche: number;
  estado: string; descripcion: string; amenities: string;
}

const emptyRoom: RoomForm = { numero: '', piso: 1, tipo: 'Doble', capacidad: 2, precio_noche: 0, estado: 'Disponible', descripcion: '', amenities: '' };
const emptyCabin: CabinForm = { nombre: '', capacidad: 4, precio_noche: 0, estado: 'Disponible', descripcion: '', amenities: '' };

export default function HabitacionesManager() {
  const [tab, setTab] = useState<'habitaciones' | 'cabanias'>('habitaciones');
  const [rooms, setRooms] = useState<any[]>([]);
  const [cabins, setCabins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomForm | CabinForm>(emptyRoom);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const r = await api.get('/habitaciones');
      setRooms(r.data.data);
    } catch (err) { console.error('Error loading habitaciones:', err); }
    try {
      const c = await api.get('/habitaciones/cabanias');
      setCabins(c.data.data);
    } catch (err) { console.error('Error loading cabañas:', err); }
    setLoading(false);
  };

  const openNew = () => {
    setForm(tab === 'habitaciones' ? { ...emptyRoom } : { ...emptyCabin });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    if (tab === 'habitaciones') {
      setForm({ numero: item.numero, piso: item.piso, tipo: item.tipo, capacidad: item.capacidad, precio_noche: parseFloat(item.precio_noche), estado: item.estado, descripcion: item.descripcion || '', amenities: item.amenities || '' });
    } else {
      setForm({ nombre: item.nombre, capacidad: item.capacidad, precio_noche: parseFloat(item.precio_noche), estado: item.estado, descripcion: item.descripcion || '', amenities: item.amenities || '' });
    }
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'habitaciones') {
        const f = form as RoomForm;
        if (editingId) {
          await api.put(`/habitaciones/${editingId}`, f);
        } else {
          await api.post('/habitaciones', f);
        }
      } else {
        const f = form as CabinForm;
        if (editingId) {
          await api.put(`/habitaciones/cabanias/${editingId}`, f);
        } else {
          await api.post('/habitaciones/cabanias', f);
        }
      }
      setSuccess(editingId ? 'Actualizado' : 'Creado');
      setTimeout(() => setSuccess(''), 3000);
      setShowForm(false);
      loadAll();
    } catch (err: any) { alert(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este elemento?')) return;
    try {
      if (tab === 'habitaciones') {
        await api.delete(`/habitaciones/${id}`);
      } else {
        await api.delete(`/habitaciones/cabanias/${id}`);
      }
      loadAll();
    } catch (err: any) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => { setTab('habitaciones'); setShowForm(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'habitaciones' ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>
            <BedDouble size={16} className="inline mr-1" /> Habitaciones
          </button>
          <button onClick={() => { setTab('cabanias'); setShowForm(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cabanias' ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>
            <Home size={16} className="inline mr-1" /> Cabañas
          </button>
        </div>
        <button onClick={openNew} className="btn-primary text-sm py-1.5 px-3"><Plus size={16} /> Nuevo</button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Editar' : 'Nuevo'} {tab === 'habitaciones' ? 'Habitación' : 'Cabaña'}</CardTitle>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tab === 'habitaciones' ? (
              <>
                <div><label className="label">Número</label><input className="input" value={(form as RoomForm).numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
                <div><label className="label">Piso</label><input className="input" type="number" value={(form as RoomForm).piso} onChange={(e) => setForm({ ...form, piso: Number(e.target.value) })} /></div>
                <div><label className="label">Tipo</label><select className="input" value={(form as RoomForm).tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{tiposHabitacion.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="label">Capacidad</label><input className="input" type="number" value={(form as RoomForm).capacidad} onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })} /></div>
                <div><label className="label">Precio por Noche (S/.)</label><input className="input" type="number" step="0.01" value={(form as RoomForm).precio_noche} onChange={(e) => setForm({ ...form, precio_noche: Number(e.target.value) })} /></div>
                <div><label className="label">Estado</label><select className="input" value={(form as RoomForm).estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{estados.map(e => <option key={e}>{e}</option>)}</select></div>
                <div className="md:col-span-2"><label className="label">Descripción</label><textarea className="input" value={(form as RoomForm).descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
                <div className="md:col-span-2"><label className="label">Amenities (separados por coma)</label><textarea className="input" value={(form as RoomForm).amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="TV, WiFi, Baño privado, Minibar..." /></div>
              </>
            ) : (
              <>
                <div><label className="label">Nombre</label><input className="input" value={(form as CabinForm).nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
                <div><label className="label">Capacidad</label><input className="input" type="number" value={(form as CabinForm).capacidad} onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })} /></div>
                <div><label className="label">Precio por Noche (S/.)</label><input className="input" type="number" step="0.01" value={(form as CabinForm).precio_noche} onChange={(e) => setForm({ ...form, precio_noche: Number(e.target.value) })} /></div>
                <div><label className="label">Estado</label><select className="input" value={(form as CabinForm).estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{estados.map(e => <option key={e}>{e}</option>)}</select></div>
                <div className="md:col-span-2"><label className="label">Descripción</label><textarea className="input" value={(form as CabinForm).descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
                <div className="md:col-span-2"><label className="label">Amenities (separados por coma)</label><textarea className="input" value={(form as CabinForm).amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="TV, WiFi, Baño privado, Fogata..." /></div>
              </>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 px-8 py-2.5">
            {saving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? 'Guardar Cambios' : 'Crear')}
          </button>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{tab === 'habitaciones' ? 'Habitaciones' : 'Cabañas'}</CardTitle></CardHeader>
        {tab === 'habitaciones' ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rooms.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600">
                  <BedDouble size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">Habitación {r.numero} <span className="text-xs text-slate-400 font-normal">- Piso {r.piso}</span></p>
                  <p className="text-xs text-slate-500">{r.tipo} · Capacidad: {r.capacidad} · {formatCurrency(parseFloat(r.precio_noche))}/noche</p>
                  {r.amenities && <p className="text-xs text-slate-400 mt-0.5 truncate">{r.amenities}</p>}
                </div>
                <Badge variant={r.estado === 'Disponible' ? 'success' : r.estado === 'Ocupada' ? 'danger' : 'neutral'}>{r.estado}</Badge>
                <button onClick={() => openEdit(r)} className="btn-ghost p-1.5 text-slate-400 hover:text-brand-600"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(r.id)} className="btn-ghost p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
            {rooms.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No hay habitaciones</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {cabins.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                  <Home size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{c.nombre}</p>
                  <p className="text-xs text-slate-500">Capacidad: {c.capacidad} · {formatCurrency(parseFloat(c.precio_noche))}/noche</p>
                  {c.amenities && <p className="text-xs text-slate-400 mt-0.5 truncate">{c.amenities}</p>}
                </div>
                <Badge variant={c.estado === 'Disponible' ? 'success' : c.estado === 'Ocupada' ? 'danger' : 'neutral'}>{c.estado}</Badge>
                <button onClick={() => openEdit(c)} className="btn-ghost p-1.5 text-slate-400 hover:text-brand-600"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(c.id)} className="btn-ghost p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
            {cabins.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No hay cabañas</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
