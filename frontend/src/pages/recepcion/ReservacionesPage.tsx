import { useState, useEffect } from 'react';
import { reservacionesApi, habitacionesApi } from '../../services/api';
import { Reservacion, Habitacion, Cabaña } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/helpers';
import NuevaReservacionModal from '../../components/recepcion/NuevaReservacionModal';
import { Plus, QrCode, LogIn, LogOut, Eye, Users, Pencil, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const estadoBadge: Record<string, string> = {
  Pendiente: 'warning',
  Confirmada: 'info',
  CheckIn: 'success',
  CheckOut: 'neutral',
  Cancelada: 'danger',
};

export default function ReservacionesPage() {
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reservacion | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cabanias, setCabanias] = useState<Cabaña[]>([]);
  const [editForm, setEditForm] = useState({
    tipo: 'Pernocte' as 'Pernocte' | 'Pasadia',
    habitacion_id: '' as number | '',
    cabaña_id: '' as number | '',
    fecha_entrada: '',
    fecha_salida: '',
    adultos: 1,
    niños: 0,
    notas: '',
  });

  useEffect(() => {
    loadReservaciones();
  }, [filtro]);

  const loadHabitacionesEdit = async () => {
    try {
      const [habRes, cabRes] = await Promise.all([
        habitacionesApi.listar({ estado: ['Disponible', 'Limpieza'] }),
        habitacionesApi.listarCabanias({ estado: ['Disponible', 'Limpieza'] }),
      ]);
      let habs = habRes.data.data || [];
      let cabs = cabRes.data.data || [];
      if (selected?.habitacion_id && !habs.find((h: any) => h.id === selected.habitacion_id)) {
        const { data } = await habitacionesApi.listar({ estado: ['Reservada', 'Ocupada'] });
        const current = (data.data || []).find((h: any) => h.id === selected.habitacion_id);
        if (current) habs = [...habs, current];
      }
      if (selected?.cabaña_id && !cabs.find((c: any) => c.id === selected.cabaña_id)) {
        const { data } = await habitacionesApi.listarCabanias({ estado: ['Reservada', 'Ocupada'] });
        const current = (data.data || []).find((c: any) => c.id === selected.cabaña_id);
        if (current) cabs = [...cabs, current];
      }
      setHabitaciones(habs);
      setCabanias(cabs);
    } catch (err) { console.error(err); }
  };

  const loadReservaciones = async () => {
    try {
      const params = filtro ? { estado: filtro } : {};
      const { data } = await reservacionesApi.listar(params);
      setReservaciones(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await reservacionesApi.checkIn(id);
      toast.success('Check-In realizado exitosamente');
      loadReservaciones();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al realizar check-in');
    }
  };

  const handleCheckOut = async (id: number) => {
    try {
      await reservacionesApi.checkOut(id);
      toast.success('Check-Out realizado exitosamente');
      loadReservaciones();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al realizar check-out');
    }
  };

  const handleQR = async (id: number) => {
    try {
      const { data } = await reservacionesApi.qr(id);
      setShowQR(data.qr);
    } catch (error) {
      toast.error('Error al generar QR');
    }
  };

  const columns = [
    { key: 'codigo_unico', header: 'ID', render: (r: Reservacion) => (
      <span className="font-mono font-bold text-brand-600">{r.codigo_unico}</span>
    )},
    {
      key: 'tipo',
      header: 'Tipo',
      render: (r: Reservacion) => (
        <Badge variant={r.tipo === 'Pasadia' ? 'warning' : 'info'}>
          {r.tipo === 'Pasadia' ? 'Pasadía' : 'Pernocte'}
        </Badge>
      ),
    },
    {
      key: 'huesped',
      header: 'Huésped',
      render: (r: Reservacion) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{r.huesped_nombre} {r.huesped_apellidos}</p>
          {(r.acompanantes_count ?? 0) > 0 && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Users size={12} /> +{r.acompanantes_count} acompañante(s)
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'habitacion',
      header: 'Alojamiento',
      render: (r: Reservacion) => (
        <span className="font-medium">{r.habitacion_numero || r.cabaña_nombre || '-'}</span>
      ),
    },
    {
      key: 'fecha_entrada',
      header: 'Entrada',
      render: (r: Reservacion) => formatDate(r.fecha_entrada),
    },
    {
      key: 'fecha_salida',
      header: 'Salida',
      render: (r: Reservacion) => formatDate(r.fecha_salida),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (r: Reservacion) => (
        <Badge variant={(estadoBadge[r.estado] || 'neutral') as any}>{r.estado}</Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      render: (r: Reservacion) => (
        <div className="flex gap-1 justify-end">
          {(r.estado === 'Pendiente' || r.estado === 'Confirmada') && (
            <button onClick={(e) => { e.stopPropagation(); handleCheckIn(r.id); }}
              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition" title="Check-In">
              <LogIn size={16} />
            </button>
          )}
          {r.estado === 'CheckIn' && (
            <button onClick={(e) => { e.stopPropagation(); handleCheckOut(r.id); }}
              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Check-Out">
              <LogOut size={16} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleQR(r.id); }}
            className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Ver QR">
            <QrCode size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setSelected(r); }}
            className="p-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg transition" title="Ver detalle">
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  const estados = ['', 'Pendiente', 'Confirmada', 'CheckIn', 'CheckOut', 'Cancelada'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reservaciones</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión de reservaciones y check-in/out</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNueva(true)}>
          <Plus size={18} />
          Nueva Reservación
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {estados.map((e) => (
          <button
            key={e}
            onClick={() => { setFiltro(e); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === e
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            {e || 'Todas'}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={reservaciones}
        isLoading={loading}
        emptyMessage="No hay reservaciones registradas"
        onRowClick={(r) => setSelected(r)}
      />

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setEditMode(false); }} title={editMode ? 'Editar Reservación' : 'Detalle de Reservación'} size="lg">
        {selected && !editMode && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Código</label>
                <p className="text-slate-700 dark:text-slate-300 font-mono font-bold text-brand-600">{selected.codigo_unico}</p>
              </div>
              <div>
                <label className="label">Estado</label>
                <Badge variant={(estadoBadge[selected.estado] || 'neutral') as any}>{selected.estado}</Badge>
              </div>
              <div>
                <label className="label">Tipo</label>
                <Badge variant={selected.tipo === 'Pasadia' ? 'warning' : 'info'}>
                  {selected.tipo === 'Pasadia' ? 'Pasadía' : 'Pernocte'}
                </Badge>
              </div>
              <div>
                <label className="label">Huésped Principal</label>
                <p className="text-slate-700 dark:text-slate-300">{selected.huesped_nombre} {selected.huesped_apellidos}</p>
              </div>
              <div>
                <label className="label">Habitación / Cabaña</label>
                <p className="text-slate-700 dark:text-slate-300">{selected.habitacion_numero || selected.cabaña_nombre || 'Sin asignar'}</p>
              </div>
              <div>
                <label className="label">Acompañantes</label>
                <p className="text-slate-700 dark:text-slate-300">{selected.acompanantes_count || 0}</p>
              </div>
              <div>
                <label className="label">Fecha de Entrada</label>
                <p className="text-slate-700 dark:text-slate-300">{formatDate(selected.fecha_entrada)}</p>
              </div>
              <div>
                <label className="label">Fecha de Salida</label>
                <p className="text-slate-700 dark:text-slate-300">{formatDate(selected.fecha_salida)}</p>
              </div>
              <div>
                <label className="label">Adultos</label>
                <p className="text-slate-700 dark:text-slate-300">{selected.adultos}</p>
              </div>
              <div>
                <label className="label">Niños</label>
                <p className="text-slate-700 dark:text-slate-300">{selected.niños}</p>
              </div>
              {selected.notas && (
                <div className="col-span-2">
                  <label className="label">Notas</label>
                  <p className="text-slate-700 dark:text-slate-300">{selected.notas}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              {(selected.estado === 'Pendiente' || selected.estado === 'Confirmada') && (
                <button onClick={() => handleCheckIn(selected.id)} className="btn-primary flex-1">
                  <LogIn size={18} /> Check-In
                </button>
              )}
              {selected.estado === 'CheckIn' && (
                <button onClick={() => handleCheckOut(selected.id)} className="btn-primary flex-1">
                  <LogOut size={18} /> Check-Out
                </button>
              )}
              {selected.estado !== 'CheckOut' && selected.estado !== 'Cancelada' && (
                <button onClick={() => {
                  setEditForm({
                    tipo: selected.tipo,
                    habitacion_id: selected.habitacion_id || '',
                    cabaña_id: selected.cabaña_id || '',
                    fecha_entrada: selected.fecha_entrada,
                    fecha_salida: selected.fecha_salida,
                    adultos: selected.adultos,
                    niños: selected.niños,
                    notas: selected.notas || '',
                  });
                  loadHabitacionesEdit();
                  setEditMode(true);
                }} className="btn-secondary">
                  <Pencil size={18} /> Editar
                </button>
              )}
              <button onClick={() => handleQR(selected.id)} className="btn-secondary">
                <QrCode size={18} /> QR
              </button>
            </div>
          </div>
        )}
        {selected && editMode && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={editForm.tipo}
                  onChange={(e) => setEditForm({...editForm, tipo: e.target.value as 'Pernocte' | 'Pasadia'})}>
                  <option value="Pernocte">Pernocte</option>
                  <option value="Pasadia">Pasadía</option>
                </select>
              </div>
              <div>
                <label className="label">Huésped</label>
                <p className="text-slate-700 dark:text-slate-300 pt-2">{selected.huesped_nombre} {selected.huesped_apellidos}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Habitación</label>
                <select className="input" value={editForm.habitacion_id}
                  onChange={(e) => setEditForm({...editForm, habitacion_id: Number(e.target.value) || '', cabaña_id: ''})}>
                  <option value="">Sin habitación</option>
                  {habitaciones.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.numero} - {h.tipo} (S/.{Number(h.precio_noche).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cabaña</label>
                <select className="input" value={editForm.cabaña_id}
                  onChange={(e) => setEditForm({...editForm, cabaña_id: Number(e.target.value) || '', habitacion_id: ''})}>
                  <option value="">Sin cabaña</option>
                  {cabanias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} - Cap. {c.capacidad} (S/.{Number(c.precio_noche).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha de Entrada</label>
                <input className="input" type="date" value={editForm.fecha_entrada}
                  onChange={(e) => setEditForm({...editForm, fecha_entrada: e.target.value,
                    fecha_salida: editForm.tipo === 'Pasadia' ? e.target.value : editForm.fecha_salida})} />
              </div>
              <div>
                <label className="label">Fecha de Salida</label>
                <input className="input" type="date" value={editForm.fecha_salida}
                  onChange={(e) => setEditForm({...editForm, fecha_salida: e.target.value})}
                  disabled={editForm.tipo === 'Pasadia'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Adultos</label>
                <input className="input" type="number" min={1} value={editForm.adultos}
                  onChange={(e) => setEditForm({...editForm, adultos: parseInt(e.target.value) || 1})} />
              </div>
              <div>
                <label className="label">Niños</label>
                <input className="input" type="number" min={0} value={editForm.niños}
                  onChange={(e) => setEditForm({...editForm, niños: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div>
              <label className="label">Notas</label>
              <textarea className="input" rows={2} value={editForm.notas}
                onChange={(e) => setEditForm({...editForm, notas: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button onClick={async () => {
                setSaving(true);
                try {
                  await reservacionesApi.actualizar(selected.id, editForm);
                  toast.success('Reservación actualizada');
                  setEditMode(false);
                  loadReservaciones();
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

      <Modal isOpen={!!showQR} onClose={() => setShowQR(null)} title="Código QR de Reservación" size="sm">
        {showQR && (
          <div className="text-center">
            <img src={showQR} alt="QR Code" className="mx-auto w-64 h-64" />
            <p className="text-sm text-slate-500 mt-4">
              Escanea este código para identificar al grupo en pedidos
            </p>
          </div>
        )}
      </Modal>

      <NuevaReservacionModal
        isOpen={showNueva}
        onClose={() => setShowNueva(false)}
        onSuccess={() => { loadReservaciones(); }}
      />
    </div>
  );
}
