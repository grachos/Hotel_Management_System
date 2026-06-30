export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  role_id: number;
  avatar?: string;
  activo: number;
  ultimo_acceso?: string;
  reset_token?: string;
  reset_token_expires?: string;
  created_at: string;
  updated_at: string;
  role_name?: string;
}

export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: number;
}

export interface Permiso {
  id: number;
  nombre: string;
  descripcion?: string;
  modulo?: string;
}

export interface Huesped {
  id: number;
  nombre: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  tipo_documento: string;
  numero_documento?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  fecha_nacimiento?: string;
  notas?: string;
}

export interface Habitacion {
  id: number;
  numero: string;
  piso: number;
  tipo: string;
  capacidad: number;
  precio_noche: number;
  estado: string;
  descripcion?: string;
  amenities?: string;
  activo: number;
}

export interface Cabaña {
  id: number;
  nombre: string;
  capacidad: number;
  precio_noche: number;
  estado: string;
  descripcion?: string;
  amenities?: string;
  activo: number;
}

export interface Reservacion {
  id: number;
  huesped_id: number;
  habitacion_id?: number;
  cabaña_id?: number;
  fecha_entrada: string;
  fecha_salida: string;
  adultos: number;
  niños: number;
  estado: string;
  codigo_qr?: string;
  codigo_unico: string;
  notas?: string;
}

export interface Producto {
  id: number;
  categoria_id: number;
  proveedor_id?: number;
  nombre: string;
  descripcion?: string;
  sku?: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  precio_compra: number;
  precio_venta: number;
  imagen?: string;
  activo: number;
  categoria_nombre?: string;
}

export interface Pedido {
  id: number;
  reservacion_id?: number;
  huesped_id?: number;
  mesa?: string;
  tipo_entrega: string;
  modulo: string;
  estado: string;
  subtotal: number;
  impuesto: number;
  total: number;
  notas?: string;
  atendido_por?: number;
}

export interface AuthPayload {
  userId: number;
  roleId: number;
  roleName: string;
  permisos: string[];
}

export interface JwtPayload {
  userId: number;
  roleId: number;
  roleName: string;
  tipo?: 'staff' | 'huesped';
  iat?: number;
  exp?: number;
}

export interface GuestJwtPayload {
  huespedId: number;
  reservacionId: number;
  codigo: string;
  roleName: 'Huesped';
  tipo: 'huesped';
  iat?: number;
  exp?: number;
}
