export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  role_id: number;
  role_name: string;
  avatar?: string;
  activo: number;
  ultimo_acceso?: string;
  permisos: string[];
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

export interface Acompanante {
  id: number;
  reservacion_id: number;
  nombre: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  created_at?: string;
}

export interface Reservacion {
  id: number;
  huesped_id: number;
  habitacion_id?: number;
  cabaña_id?: number;
  tipo: 'Pernocte' | 'Pasadia';
  fecha_entrada: string;
  fecha_salida: string;
  adultos: number;
  niños: number;
  estado: string;
  codigo_qr?: string;
  codigo_unico: string;
  notas?: string;
  incluye_comidas?: number | boolean;
  huesped_nombre?: string;
  huesped_apellidos?: string;
  habitacion_numero?: string;
  cabaña_nombre?: string;
  acompanantes_count?: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  modulo: string;
  activo: number;
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
  categoria_modulo?: string;
  proveedor_nombre?: string;
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
  recargo_delivery?: number;
  atendido_por?: number;
  created_at?: string;
  updated_at?: string;
  huesped_nombre?: string;
  atendido_por_nombre?: string;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  producto_nombre?: string;
  unidad?: string;
}

export interface DashboardResumen {
  ventasHoy: number;
  ventasMes: number;
  ocupacion: {
    habitaciones_ocupadas: number;
    habitaciones_totales: number;
    cabañas_ocupadas: number;
    cabañas_totales: number;
  };
  pedidosPendientes: number;
  stockBajo: number;
  topProductos: any[];
  ventasModulo: any[];
  huespedesActivos: number;
}
