import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { BedDouble, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch { setError('Error al enviar. Verifica el email.'); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center fade-in">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Correo Enviado</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Si el email está registrado, recibirás un enlace para restablecer tu contraseña.</p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2 py-2.5 px-6"><ArrowLeft size={16} /> Volver al Login</Link>
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Recuperar Contraseña</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Ingresa tu email y te enviaremos un enlace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hotel.com" required />
          </div>
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Enlace'}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link to="/login" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"><ArrowLeft size={14} /> Volver al Login</Link>
        </p>
      </div>
    </div>
  );
}
