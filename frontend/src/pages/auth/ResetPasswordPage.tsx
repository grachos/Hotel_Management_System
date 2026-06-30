import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { BedDouble, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err: any) { setError(err.response?.data?.error || 'Token inválido o expirado'); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center fade-in">
          <XCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Enlace Inválido</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">El enlace de recuperación no es válido o está incompleto.</p>
          <Link to="/forgot-password" className="btn-primary inline-flex items-center gap-2 py-2.5 px-6">Solicitar nuevo enlace</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center fade-in">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Contraseña Actualizada</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2 py-2.5 px-6">Iniciar Sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BedDouble className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Nueva Contraseña</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva contraseña</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar contraseña</label>
            <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la contraseña" required />
          </div>
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Restablecer Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
