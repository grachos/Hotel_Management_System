import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { guestApi } from '../../services/api';
import { useGuestStore } from '../../store/guestStore';
import { BedDouble, Loader2, AlertCircle } from 'lucide-react';

export default function GuestLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setGuestAuth, isAuthenticated } = useGuestStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/guest/dashboard', { replace: true });
      return;
    }

    const token = searchParams.get('token');
    if (token) {
      doLogin(token);
    } else {
      setLoading(false);
    }
  }, []);

  const doLogin = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await guestApi.guestLogin(token);
      setGuestAuth(data.token, data.huesped, data.reservacion);
      navigate('/guest/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Código inválido.');
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(manualToken.trim());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Ingresando al portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200 dark:shadow-brand-900/30">
            <BedDouble className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Portal del Huésped</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">NovaHotel OS</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 flex items-start gap-3 mb-6">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Código de Reservación
            </label>
            <input
              type="text"
              className="input text-center text-lg tracking-widest"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Ej: H1A2B3C4D5E6F"
            />
            <p className="text-xs text-slate-400 mt-2 text-center">
              Escanea el código QR de tu reservación o ingresa el código manualmente
            </p>
          </div>

          <button type="submit" disabled={!manualToken.trim()} className="btn-primary w-full py-3 mt-2 shadow-md shadow-brand-200 dark:shadow-brand-900/30">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
