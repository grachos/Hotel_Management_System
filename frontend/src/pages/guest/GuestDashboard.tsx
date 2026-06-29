import { useGuestStore } from '../../store/guestStore';
import { BedDouble, Calendar, MapPin, Wifi, Clock, Coffee, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export default function GuestDashboard() {
  const { huesped, reservacion } = useGuestStore();

  if (!huesped || !reservacion) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No hay información de reservación disponible.</p>
      </div>
    );
  }

  const habitacion = reservacion.habitacion_numero
    ? `${reservacion.habitacion_numero}${reservacion.habitacion_tipo ? ` (${reservacion.habitacion_tipo})` : ''}`
    : reservacion.cabaña_nombre || 'No asignada';

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          ¡Bienvenido, {huesped.nombre}!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {reservacion.estado === 'CheckIn' ? 'Tu estadía está activa' : `Estado: ${reservacion.estado}`}
        </p>
      </div>

      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-5 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-2 rounded-xl">
            <BedDouble size={22} />
          </div>
          <div>
            <p className="text-sm text-white/70">Habitación / Cabaña</p>
            <p className="text-xl font-bold">{habitacion}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-white/70" />
            <div>
              <p className="text-xs text-white/70">Entrada</p>
              <p className="text-sm font-medium">{formatDate(reservacion.fecha_entrada)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-white/70" />
            <div>
              <p className="text-xs text-white/70">Salida</p>
              <p className="text-sm font-medium">{formatDate(reservacion.fecha_salida)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Información del Hotel</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Wifi size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">WiFi</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Red: NovaHotel / Clave: bienvenido2024</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Coffee size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Desayuno</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">7:00 AM - 10:00 AM en el Restaurante</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Check-out</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Antes de las 12:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Servicios</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Restaurante, Bar, Mini Market, Piscina</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 gap-3">
          <a href="/guest/dashboard/pedir" className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
            <span className="text-sm font-medium">Hacer Pedido</span>
            <ChevronRight size={16} />
          </a>
          <a href="/guest/dashboard/cuenta" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="text-sm font-medium">Mi Cuenta</span>
            <ChevronRight size={16} />
          </a>
          <a href="/guest/dashboard/resena" className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
            <span className="text-sm font-medium">Dejar Reseña</span>
            <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
