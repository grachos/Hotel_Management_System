import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { huespedesApi, habitacionesApi, reservacionesApi } from '../../services/api';
import { Huesped, Habitacion, Cabaña } from '../../types';
import { Plus, Trash2, Search, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AcompananteForm {
  nombre: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NuevaReservacionModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tipo, setTipo] = useState<'Pernocte' | 'Pasadia'>('Pernocte');
  const [huespedSearch, setHuespedSearch] = useState('');
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [selectedHuesped, setSelectedHuesped] = useState<Huesped | null>(null);
  const [showHuespedSearch, setShowHuespedSearch] = useState(false);

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cabanias, setCabanias] = useState<Cabaña[]>([]);
  const [selectedHabitacion, setSelectedHabitacion] = useState<number | ''>('');
  const [selectedCabania, setSelectedCabania] = useState<number | ''>('');
  const [asignarAlojamiento, setAsignarAlojamiento] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [fechaEntrada, setFechaEntrada] = useState(today);
  const [fechaSalida, setFechaSalida] = useState('');
  const [adultos, setAdultos] = useState(1);
  const [ninos, setNinos] = useState(0);
  const [notas, setNotas] = useState('');
  const [acompanantes, setAcompanantes] = useState<AcompananteForm[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadHabitaciones();
      loadHuespedes('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (tipo === 'Pasadia') {
      setFechaSalida(fechaEntrada);
    }
  }, [tipo, fechaEntrada]);

  const loadHabitaciones = async () => {
    try {
      const [habRes, cabRes] = await Promise.all([
        habitacionesApi.listar({ estado: ['Disponible', 'Limpieza'] }),
        habitacionesApi.listarCabanias({ estado: ['Disponible', 'Limpieza'] }),
      ]);
      setHabitaciones(habRes.data.data || []);
      setCabanias(cabRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHuespedes = async (search: string) => {
    try {
      const { data } = await huespedesApi.listar(search ? { search } : {});
      setHuespedes(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchChange = (val: string) => {
    setHuespedSearch(val);
    if (val.length >= 2) {
      loadHuespedes(val);
      setShowHuespedSearch(true);
    } else {
      setShowHuespedSearch(false);
    }
  };

  const selectHuesped = (h: Huesped) => {
    setSelectedHuesped(h);
    setHuespedSearch('');
    setShowHuespedSearch(false);
  };

  const addAcompanante = () => {
    setAcompanantes([...acompanantes, { nombre: '', apellidos: '', tipo_documento: 'DNI', numero_documento: '' }]);
  };

  const removeAcompanante = (idx: number) => {
    setAcompanantes(acompanantes.filter((_, i) => i !== idx));
  };

  const updateAcompanante = (idx: number, field: keyof AcompananteForm, value: string) => {
    const updated = [...acompanantes];
    updated[idx] = { ...updated[idx], [field]: value };
    setAcompanantes(updated);
  };

  const handleSubmit = async () => {
    if (!selectedHuesped) {
      toast.error('Selecciona el huésped principal');
      return;
    }
    if (!fechaEntrada) {
      toast.error('Selecciona la fecha de entrada');
      return;
    }
    if (tipo === 'Pernocte' && !fechaSalida) {
      toast.error('Selecciona la fecha de salida');
      return;
    }
    if (tipo === 'Pernocte' && !selectedHabitacion && !selectedCabania) {
      toast.error('Selecciona una habitación o cabaña');
      return;
    }

    setSubmitting(true);
    try {
      await reservacionesApi.crear({
        huesped_id: selectedHuesped.id,
        tipo,
        habitacion_id: selectedHabitacion || null,
        cabaña_id: selectedCabania || null,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        adultos,
        niños: ninos,
        notas: notas || null,
        acompanantes: acompanantes.filter((a) => a.nombre.trim()),
      });
      toast.success('Reservación creada exitosamente');
      onSuccess();
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear reservación');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTipo('Pernocte');
    setSelectedHuesped(null);
    setHuespedSearch('');
    setSelectedHabitacion('');
    setSelectedCabania('');
    setAsignarAlojamiento(false);
    setFechaEntrada(today);
    setFechaSalida('');
    setAdultos(1);
    setNinos(0);
    setNotas('');
    setAcompanantes([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Reservación" size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="label">Tipo de Reservación</label>
          <div className="flex gap-3">
            {(['Pernocte', 'Pasadia'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  tipo === t
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {t === 'Pernocte' ? 'Pernocte (Con pernocte)' : 'Pasadía (Sin pernocte)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Huésped Principal</label>
          {selectedHuesped ? (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold">
                {selectedHuesped.nombre.charAt(0)}{selectedHuesped.apellidos.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedHuesped.nombre} {selectedHuesped.apellidos}</p>
                <p className="text-xs text-slate-500">{selectedHuesped.tipo_documento}: {selectedHuesped.numero_documento}</p>
              </div>
              <button onClick={() => setSelectedHuesped(null)} className="text-sm text-red-500 hover:text-red-600">Cambiar</button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Buscar huésped por nombre o documento..."
                value={huespedSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {showHuespedSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {huespedes.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400 text-center">No se encontraron huéspedes</p>
                  ) : (
                    huespedes.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => selectHuesped(h)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <User size={16} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{h.nombre} {h.apellidos}</span>
                        <span className="text-xs text-slate-400 ml-auto">{h.numero_documento}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {tipo === 'Pernocte' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="label mb-0">Asignar Alojamiento</label>
              <button
                type="button"
                onClick={() => setAsignarAlojamiento(true)}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                {asignarAlojamiento ? '' : '(opcional)'}
              </button>
            </div>
            {asignarAlojamiento && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Habitación</label>
                  <select
                    className="input"
                    value={selectedHabitacion}
                    onChange={(e) => { setSelectedHabitacion(Number(e.target.value) || ''); setSelectedCabania(''); }}
                  >
                    <option value="">Sin habitación</option>
                    {habitaciones.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.numero} - {h.tipo} (S/.{h.precio_noche})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Cabaña</label>
                  <select
                    className="input"
                    value={selectedCabania}
                    onChange={(e) => { setSelectedCabania(Number(e.target.value) || ''); setSelectedHabitacion(''); }}
                  >
                    <option value="">Sin cabaña</option>
                    {cabanias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - Cap. {c.capacidad} (S/.{c.precio_noche})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha de Entrada</label>
            <input type="date" className="input" value={fechaEntrada}
              onChange={(e) => setFechaEntrada(e.target.value)} min={today} />
          </div>
          <div>
            <label className="label">Fecha de Salida</label>
            <input type="date" className="input" value={fechaSalida}
              onChange={(e) => setFechaSalida(e.target.value)}
              min={fechaEntrada || today}
              disabled={tipo === 'Pasadia'} />
            {tipo === 'Pasadia' && <p className="text-xs text-slate-400 mt-1">Misma fecha de entrada</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Adultos</label>
            <input type="number" className="input" value={adultos}
              onChange={(e) => setAdultos(Math.max(1, parseInt(e.target.value) || 1))} min={1} />
          </div>
          <div>
            <label className="label">Niños</label>
            <input type="number" className="input" value={ninos}
              onChange={(e) => setNinos(Math.max(0, parseInt(e.target.value) || 0))} min={0} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Acompañantes</label>
            <button type="button" onClick={addAcompanante} className="btn-ghost text-xs py-1 px-2">
              <Plus size={14} /> Agregar
            </button>
          </div>
          {acompanantes.length === 0 ? (
            <p className="text-xs text-slate-400">Sin acompañantes registrados</p>
          ) : (
            <div className="space-y-2">
              {acompanantes.map((a, i) => (
                <div key={i} className="flex gap-2 items-start p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input className="input text-sm py-1.5" placeholder="Nombre"
                      value={a.nombre} onChange={(e) => updateAcompanante(i, 'nombre', e.target.value)} />
                    <input className="input text-sm py-1.5" placeholder="Apellidos"
                      value={a.apellidos} onChange={(e) => updateAcompanante(i, 'apellidos', e.target.value)} />
                    <select className="input text-sm py-1.5"
                      value={a.tipo_documento} onChange={(e) => updateAcompanante(i, 'tipo_documento', e.target.value)}>
                      <option value="DNI">DNI</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="CE">CE</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <input className="input text-sm py-1.5" placeholder="N° Documento"
                      value={a.numero_documento} onChange={(e) => updateAcompanante(i, 'numero_documento', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeAcompanante(i)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea className="input" rows={2} placeholder="Notas adicionales..."
            value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 pt-5 border-t border-slate-100 dark:border-slate-700 mt-5">
        <button onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancelar</button>
        <button onClick={handleSubmit} className="btn-primary flex-1" disabled={submitting}>
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {submitting ? 'Creando...' : 'Crear Reservación'}
        </button>
      </div>
    </Modal>
  );
}
