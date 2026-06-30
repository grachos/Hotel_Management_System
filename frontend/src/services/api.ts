import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const staffToken = localStorage.getItem('token');
  const guestToken = localStorage.getItem('guest_token');
  if (staffToken) {
    config.headers.Authorization = `Bearer ${staffToken}`;
  } else if (guestToken) {
    config.headers.Authorization = `Bearer ${guestToken}`;
  }
  return config;
});

let redirecting401 = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !redirecting401) {
      redirecting401 = true;
      const isGuest = !!localStorage.getItem('guest_token');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('guest_token');
      localStorage.removeItem('guest_huesped');
      localStorage.removeItem('guest_reservacion');
      window.location.href = isGuest ? '/guest' : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  profile: () => api.get('/auth/profile'),
  verify: () => api.get('/auth/verify'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  listarUsuarios: () => api.get('/auth/usuarios'),
  crearUsuario: (data: any) => api.post('/auth/usuarios', data),
  actualizarUsuario: (id: number, data: any) => api.put(`/auth/usuarios/${id}`, data),
};

export const huespedesApi = {
  listar: (filtros?: any) => api.get('/huespedes', { params: filtros }),
  obtener: (id: number) => api.get(`/huespedes/${id}`),
  crear: (data: any) => api.post('/huespedes', data),
  actualizar: (id: number, data: any) => api.put(`/huespedes/${id}`, data),
  eliminar: (id: number) => api.delete(`/huespedes/${id}`),
};

export const reservacionesApi = {
  listar: (filtros?: any) => api.get('/reservaciones', { params: filtros }),
  obtener: (id: number) => api.get(`/reservaciones/${id}`),
  crear: (data: any) => api.post('/reservaciones', data),
  checkIn: (id: number) => api.post(`/reservaciones/${id}/checkin`),
  checkOut: (id: number) => api.post(`/reservaciones/${id}/checkout`),
  actualizar: (id: number, data: any) => api.put(`/reservaciones/${id}`, data),
  cancelar: (id: number) => api.post(`/reservaciones/${id}/cancelar`),
  qr: (id: number) => api.get(`/reservaciones/${id}/qr`),
  consumos: (id: number) => api.get(`/reservaciones/${id}/consumos`),
  factura: (id: number) => api.get(`/reservaciones/${id}/factura`),
  acompanantes: (id: number) => api.get(`/reservaciones/${id}/acompanantes`),
  agregarAcompanante: (id: number, data: any) => api.post(`/reservaciones/${id}/acompanantes`, data),
  eliminarAcompanante: (id: number, acompananteId: number) => api.delete(`/reservaciones/${id}/acompanantes/${acompananteId}`),
};

export const inventarioApi = {
  listarProductos: (filtros?: any) => api.get('/inventario/productos', { params: filtros }),
  obtenerProducto: (id: number) => api.get(`/inventario/productos/${id}`),
  crearProducto: (data: any) => api.post('/inventario/productos', data),
  actualizarProducto: (id: number, data: any) => api.put(`/inventario/productos/${id}`, data),
  ajustarStock: (id: number, data: any) => api.post(`/inventario/productos/${id}/ajustar-stock`, data),
  listarMovimientos: (params?: any) => api.get('/inventario/movimientos', { params }),
  categorias: () => api.get('/inventario/categorias'),
  proveedores: () => api.get('/inventario/proveedores'),
  stockBajo: () => api.get('/inventario/productos/stock-bajo'),
};

export const pedidosApi = {
  listar: (filtros?: any) => api.get('/pedidos', { params: filtros }),
  obtener: (id: number) => api.get(`/pedidos/${id}`),
  crear: (data: any) => api.post('/pedidos', data),
  actualizarEstado: (id: number, estado: string) => api.put(`/pedidos/${id}/estado`, { estado }),
  activos: (modulo?: string) => api.get('/pedidos/activos', { params: { modulo } }),
  ocupados: () => api.get('/pedidos/ocupados'),
};

export const habitacionesApi = {
  listar: (params?: any) => api.get('/habitaciones', { params }),
  listarCabanias: (params?: any) => api.get('/habitaciones/cabanias', { params }),
};

export const dashboardApi = {
  resumen: () => api.get('/dashboard/resumen'),
  ventas: (dias?: number) => api.get('/dashboard/ventas', { params: { dias } }),
  alertas: () => api.get('/dashboard/alertas'),
  marcarAlerta: (id: number) => api.put(`/dashboard/alertas/${id}/leer`),
};

export const guestApi = {
  guestLogin: (token: string) => api.post('/auth/guest-login', { token }),
  perfil: () => api.get('/guest/perfil'),
  productos: (modulo?: string) => api.get('/guest/productos', { params: { modulo } }),
  pedidos: () => api.get('/guest/pedidos'),
  crearPedido: (data: any) => api.post('/guest/pedidos', data),
  consumos: () => api.get('/guest/consumos'),
  config: () => api.get('/guest/config'),
};

export const configApi = {
  getAll: () => api.get('/config'),
  update: (entries: { clave: string; valor: string }[]) => api.put('/config', { entries }),
  hotelInfo: () => api.get('/config/hotel-info'),
};

export const reportsApi = {
  kpiSummary: () => api.get('/reports/kpi-summary'),
  salesTrend: (dias: number = 30) => api.get('/reports/sales-trend', { params: { dias } }),
  topProductos: (limite: number = 10) => api.get('/reports/top-productos', { params: { limite } }),
  guestDemographics: () => api.get('/reports/guest-demographics'),
};

export const opinionesApi = {
  listar: (params?: any) => api.get('/opiniones', { params }),
  obtener: (id: number) => api.get(`/opiniones/${id}`),
  crear: (data: any) => api.post('/opiniones', data),
  actualizar: (id: number, data: any) => api.put(`/opiniones/${id}`, data),
  eliminar: (id: number) => api.delete(`/opiniones/${id}`),
};


