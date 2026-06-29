import { create } from 'zustand';
import { Usuario } from '../types';

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isDarkMode: boolean;
  setAuth: (token: string, usuario: Usuario) => void;
  logout: () => void;
  toggleDarkMode: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),
  isDarkMode: localStorage.getItem('darkMode') !== 'false',

  setAuth: (token: string, usuario: Usuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    set({ token, usuario, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    set({ token: null, usuario: null, isAuthenticated: false });
  },

  toggleDarkMode: () => {
    const newMode = !useAuthStore.getState().isDarkMode;
    localStorage.setItem('darkMode', String(newMode));
    set({ isDarkMode: newMode });
  },
}));
