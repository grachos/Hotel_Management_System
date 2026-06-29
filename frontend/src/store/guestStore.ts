import { create } from 'zustand';

interface GuestInfo {
  id: number;
  nombre: string;
  apellidos: string;
  email?: string;
  telefono?: string;
}

interface GuestReservacion {
  id: number;
  codigo_unico: string;
  fecha_entrada: string;
  fecha_salida: string;
  estado: string;
  tipo: string;
  habitacion_numero?: string;
  habitacion_tipo?: string;
  cabaña_nombre?: string;
}

interface GuestState {
  token: string | null;
  huesped: GuestInfo | null;
  reservacion: GuestReservacion | null;
  isAuthenticated: boolean;
  setGuestAuth: (token: string, huesped: GuestInfo, reservacion: GuestReservacion) => void;
  logout: () => void;
}

export const useGuestStore = create<GuestState>((set) => ({
  token: localStorage.getItem('guest_token'),
  huesped: JSON.parse(localStorage.getItem('guest_huesped') || 'null'),
  reservacion: JSON.parse(localStorage.getItem('guest_reservacion') || 'null'),
  isAuthenticated: !!localStorage.getItem('guest_token'),

  setGuestAuth: (token, huesped, reservacion) => {
    localStorage.setItem('guest_token', token);
    localStorage.setItem('guest_huesped', JSON.stringify(huesped));
    localStorage.setItem('guest_reservacion', JSON.stringify(reservacion));
    set({ token, huesped, reservacion, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('guest_token');
    localStorage.removeItem('guest_huesped');
    localStorage.removeItem('guest_reservacion');
    set({ token: null, huesped: null, reservacion: null, isAuthenticated: false });
  },
}));
