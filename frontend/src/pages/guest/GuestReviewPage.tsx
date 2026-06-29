import { useState } from 'react';
import { opinionesApi } from '../../services/api';
import { useGuestStore } from '../../store/guestStore';
import { Star, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/helpers';

export default function GuestReviewPage() {
  const { reservacion, huesped } = useGuestStore();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setError('');

    try {
      if (!reservacion?.id || !huesped?.id) {
        setError('No se encontró la reservación');
        setSubmitting(false);
        return;
      }

      await opinionesApi.crear({
        huesped_id: huesped.id,
        reservacion_id: reservacion.id,
        rating,
        comentario: comentario.trim() || null,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar reseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 pb-4 text-center pt-12">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">¡Gracias por tu reseña!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Tu opinión nos ayuda a mejorar.</p>
        <button onClick={() => { setSuccess(false); setRating(0); setComentario(''); }} className="text-brand-600 text-sm font-medium mt-4">
          Dejar otra reseña
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Deja tu Reseña</h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <MessageSquare size={18} className="text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{huesped?.nombre || 'Huésped'}</p>
            <p className="text-xs text-slate-400">Reservación #{reservacion?.codigo_unico || ''}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Califica tu estadía</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={cn(
                      'transition-colors',
                      star <= (hoveredStar || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {rating === 0 ? 'Selecciona una calificación' :
               rating === 1 ? 'Malo' :
               rating === 2 ? 'Regular' :
               rating === 3 ? 'Bueno' :
               rating === 4 ? 'Muy bueno' : 'Excelente'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              className="input min-h-[120px] resize-none"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia..."
              maxLength={500}
            />
            <p className="text-xs text-slate-400 text-right mt-1">{comentario.length}/500</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="btn-primary w-full py-3"
          >
            {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Enviar Reseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
