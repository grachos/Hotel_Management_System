import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { huespedesApi } from '../../services/api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NuevoHuespedModal({ isOpen, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    direccion: '',
    ciudad: '',
    pais: '',
    fecha_nacimiento: '',
    notas: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.apellidos.trim()) {
      toast.error('Nombre y apellidos son obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      await huespedesApi.crear({
        ...form,
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        numero_documento: form.numero_documento.trim() || null,
        direccion: form.direccion.trim() || null,
        ciudad: form.ciudad.trim() || null,
        pais: form.pais.trim() || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        notas: form.notas.trim() || null,
      });
      toast.success('Huésped registrado exitosamente');
      setForm({
        nombre: '', apellidos: '', email: '', telefono: '',
        tipo_documento: 'DNI', numero_documento: '',
        direccion: '', ciudad: '', pais: '',
        fecha_nacimiento: '', notas: '',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar huésped');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Huésped" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" placeholder="Nombres" value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)} />
          </div>
          <div>
            <label className="label">Apellidos *</label>
            <input className="input" placeholder="Apellidos" value={form.apellidos}
              onChange={(e) => handleChange('apellidos', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo Documento</label>
            <select className="input" value={form.tipo_documento}
              onChange={(e) => handleChange('tipo_documento', e.target.value)}>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="CE">Carné de Extranjería</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">N° Documento</label>
            <input className="input" placeholder="Número de documento" value={form.numero_documento}
              onChange={(e) => handleChange('numero_documento', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="correo@ejemplo.com" value={form.email}
              onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" placeholder="+51 999 888 777" value={form.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Dirección</label>
          <input className="input" placeholder="Dirección completa" value={form.direccion}
            onChange={(e) => handleChange('direccion', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ciudad</label>
            <input className="input" placeholder="Ciudad" value={form.ciudad}
              onChange={(e) => handleChange('ciudad', e.target.value)} />
          </div>
          <div>
            <label className="label">País</label>
            <input className="input" placeholder="País" value={form.pais}
              onChange={(e) => handleChange('pais', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Fecha de Nacimiento</label>
          <input className="input" type="date" value={form.fecha_nacimiento}
            onChange={(e) => handleChange('fecha_nacimiento', e.target.value)} />
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea className="input" rows={2} placeholder="Notas adicionales..." value={form.notas}
            onChange={(e) => handleChange('notas', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 pt-5 border-t border-slate-100 dark:border-slate-700 mt-5">
        <button onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancelar</button>
        <button onClick={handleSubmit} className="btn-primary flex-1" disabled={submitting}>
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {submitting ? 'Guardando...' : 'Registrar Huésped'}
        </button>
      </div>
    </Modal>
  );
}
