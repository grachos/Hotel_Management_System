import { useState, useEffect } from 'react';
import { useGuestStore } from '../../store/guestStore';
import { configApi } from '../../services/api';
import { BedDouble, Calendar, MapPin, Wifi, Clock, Coffee, ChevronRight, Loader2, Tv, Bath, Wine, Maximize, Sofa, Sun, Snowflake, Lock, Phone, CookingPot, Eye, Wind, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), 'dd MMM yyyy', { locale: es }); } catch { return dateStr; }
}

function parseAmenities(amenitiesStr?: string): string[] {
  if (!amenitiesStr) return [];
  return amenitiesStr.split(',')?.map((a) => a.trim()).filter(Boolean);
}

const amenityIcons: Record<string, any> = {
  tv: Tv, wifi: Wifi, baño: Bath, ducha: Bath, minibar: Wine, bar: Wine,
  balcón: Maximize, sala: Sofa, jacuzzi: Bath, terraza: Sun, sol: Sun,
  cocina: CookingPot, aire: Wind, 'aire acondicionado': Wind, cama: BedDouble,
  vista: Eye, teléfono: Phone, 'caja fuerte': Lock, seguro: Lock,
  nevera: Snowflake, refrigeradora: Snowflake, frigobar: Wine,
  escritorio: Sofa, chimenea: Star, fogata: Star,
};

function getAmenityIcon(name: string): any {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(amenityIcons)) {
    if (lower.includes(key)) return icon;
  }
  return Star;
}

export default function GuestDashboard() {
  const { huesped, reservacion } = useGuestStore();
  const [hotelInfo, setHotelInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configApi.hotelInfo().then(({ data }) => {
      setHotelInfo(data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (!huesped || !reservacion) {
    return <div className="text-center py-12 text-slate-500"><p>No hay información de reservación disponible.</p></div>;
  }

  const habitacion = reservacion.habitacion_numero
    ? `${reservacion.habitacion_numero}${reservacion.habitacion_tipo ? ` (${reservacion.habitacion_tipo})` : ''}`
    : reservacion.cabaña_nombre || 'No asignada';

  const amenities = parseAmenities(reservacion.habitacion_amenities || reservacion.cabaña_amenities);

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
          <div className="bg-white/20 p-2 rounded-xl"><BedDouble size={22} /></div>
          <div>
            <p className="text-sm text-white/70">Habitación / Cabaña</p>
            <p className="text-xl font-bold">{habitacion}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-white/70" />
            <div><p className="text-xs text-white/70">Entrada</p><p className="text-sm font-medium">{formatDate(reservacion.fecha_entrada)}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-white/70" />
            <div><p className="text-xs text-white/70">Salida</p><p className="text-sm font-medium">{formatDate(reservacion.fecha_salida)}</p></div>
          </div>
        </div>
      </div>

      {amenities?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Amenidades de {reservacion.habitacion_numero ? 'la Habitación' : 'la Cabaña'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {amenities?.map((amenity, i) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <div key={i} className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-8 h-8 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-brand-600" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Información del Hotel</h2>
          <div className="space-y-3">
            {hotelInfo.wifi_ssid && hotelInfo.wifi_password && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400"><Wifi size={18} /></div>
                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">WiFi</p><p className="text-xs text-slate-500 dark:text-slate-400">Red: {hotelInfo.wifi_ssid} / Clave: {hotelInfo.wifi_password}</p></div>
              </div>
            )}
            {hotelInfo.desayuno_horario && hotelInfo.desayuno_lugar && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400"><Coffee size={18} /></div>
                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Desayuno</p><p className="text-xs text-slate-500 dark:text-slate-400">{hotelInfo.desayuno_horario} en el {hotelInfo.desayuno_lugar}</p></div>
              </div>
            )}
            {hotelInfo.checkout_horario && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400"><Clock size={18} /></div>
                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Check-out</p><p className="text-xs text-slate-500 dark:text-slate-400">{hotelInfo.checkout_horario}</p></div>
              </div>
            )}
            {hotelInfo.servicios && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400"><MapPin size={18} /></div>
                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Servicios</p><p className="text-xs text-slate-500 dark:text-slate-400">{hotelInfo.servicios}</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 gap-3">
          <a href="/guest/dashboard/pedir" className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
            <span className="text-sm font-medium">Hacer Pedido</span><ChevronRight size={16} />
          </a>
          <a href="/guest/dashboard/cuenta" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="text-sm font-medium">Mi Cuenta</span><ChevronRight size={16} />
          </a>
          <a href="/guest/dashboard/resena" className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
            <span className="text-sm font-medium">Dejar Reseña</span><ChevronRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
