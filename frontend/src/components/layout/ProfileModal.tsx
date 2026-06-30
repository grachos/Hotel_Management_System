import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: Props) {
  const { usuario, setAuth } = useAuthStore();
  const [email, setEmail] = useState(usuario?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const body: any = {};
      if (email !== usuario?.email) body.email = email;
      if (currentPassword) {
        body.currentPassword = currentPassword;
        if (newPassword) body.newPassword = newPassword;
      }
      if (!Object.keys(body).length) { toast.error('Sin cambios'); return; }

      await authApi.updateProfile(body);
      toast.success('Perfil actualizado');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mi Perfil" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={usuario?.nombre || ''} disabled />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <hr className="border-slate-200 dark:border-slate-700" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Cambiar Contraseña</p>
        <div>
          <label className="label">Contraseña actual</label>
          <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Requerida para cambios" />
        </div>
        <div>
          <label className="label">Nueva contraseña</label>
          <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
        </div>
        <div>
          <label className="label">Confirmar nueva contraseña</label>
          <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Guardar Cambios'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
