-- ============================================================
-- SISTEMA DE GESTIÓN HOTELERA - ESQUEMA DE BASE DE DATOS
-- Motor: MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS gestion_hotel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestion_hotel;

-- ============================================================
-- 1. SEGURIDAD Y ACCESO
-- ============================================================

CREATE TABLE roles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permisos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  modulo      VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE roles_permisos (
  role_id     INT NOT NULL,
  permiso_id  INT NOT NULL,
  PRIMARY KEY (role_id, permiso_id),
  FOREIGN KEY (role_id)    REFERENCES roles(id)    ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  telefono      VARCHAR(20),
  role_id       INT NOT NULL,
  avatar        VARCHAR(255),
  reset_token   VARCHAR(255),
  reset_token_expires DATETIME,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_acceso TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ============================================================
-- 2. HUÉSPEDES Y RESERVACIONES
-- ============================================================

CREATE TABLE huespedes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(100) NOT NULL,
  email           VARCHAR(150),
  telefono        VARCHAR(20),
  tipo_documento  ENUM('DNI','Pasaporte','CE','Otro') DEFAULT 'DNI',
  numero_documento VARCHAR(20),
  direccion       TEXT,
  ciudad          VARCHAR(100),
  pais            VARCHAR(100),
  fecha_nacimiento DATE,
  notas           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE habitaciones (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  numero        VARCHAR(10) NOT NULL UNIQUE,
  piso          INT NOT NULL DEFAULT 1,
  tipo          ENUM('Individual','Doble','Suite','Familiar','Presidencial') NOT NULL,
  capacidad     INT NOT NULL DEFAULT 2,
  precio_noche  DECIMAL(10,2) NOT NULL,
  estado        ENUM('Disponible','Ocupada','Limpieza','Mantenimiento','Reservada') DEFAULT 'Disponible',
  descripcion   TEXT,
  amenities     TEXT,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE cabañas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL UNIQUE,
  capacidad     INT NOT NULL DEFAULT 4,
  precio_noche  DECIMAL(10,2) NOT NULL,
  estado        ENUM('Disponible','Ocupada','Limpieza','Mantenimiento','Reservada') DEFAULT 'Disponible',
  descripcion   TEXT,
  amenities     TEXT,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reservaciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  huesped_id      INT NOT NULL,
  habitacion_id   INT,
  cabaña_id       INT,
  fecha_entrada   DATE NOT NULL,
  fecha_salida    DATE NOT NULL,
  adultos         INT NOT NULL DEFAULT 1,
  niños           INT NOT NULL DEFAULT 0,
  estado          ENUM('Pendiente','Confirmada','CheckIn','CheckOut','Cancelada') DEFAULT 'Pendiente',
  codigo_qr       VARCHAR(255),
  codigo_unico    VARCHAR(20) NOT NULL UNIQUE,
  notas           TEXT,
  created_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (huesped_id)    REFERENCES huespedes(id),
  FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
  FOREIGN KEY (cabaña_id)     REFERENCES cabañas(id),
  FOREIGN KEY (created_by)    REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. INVENTARIO Y PRODUCTOS
-- ============================================================

CREATE TABLE categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  modulo      ENUM('Restaurante','Bar','MiniMarket','Todos') DEFAULT 'Todos',
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE proveedores (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  contacto    VARCHAR(100),
  telefono    VARCHAR(20),
  email       VARCHAR(150),
  direccion   TEXT,
  ruc         VARCHAR(20),
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE productos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id    INT NOT NULL,
  proveedor_id    INT,
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  sku             VARCHAR(50) UNIQUE,
  unidad          ENUM('Unidad','Kg','Lt','Gr','Ml','Docena','Caja','Pack','Botella','Porción') DEFAULT 'Unidad',
  stock_actual    DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo    DECIMAL(10,2) NOT NULL DEFAULT 5,
  precio_compra   DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta    DECIMAL(10,2) NOT NULL DEFAULT 0,
  imagen          VARCHAR(255),
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  visible         TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
) ENGINE=InnoDB;

CREATE TABLE movimientos_inventario (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  producto_id   INT NOT NULL,
  tipo          ENUM('Entrada','Salida','Ajuste','Venta','Compra','Devolución') NOT NULL,
  cantidad      DECIMAL(10,2) NOT NULL,
  stock_anterior DECIMAL(10,2) NOT NULL,
  stock_nuevo   DECIMAL(10,2) NOT NULL,
  referencia_id INT,
  referencia_tipo VARCHAR(50),
  observacion   TEXT,
  created_by    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (created_by)  REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. PEDIDOS Y CONSUMO
-- ============================================================

CREATE TABLE pedidos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reservacion_id  INT,
  huesped_id      INT,
  mesa            VARCHAR(10),
  tipo_entrega    ENUM('Local','Habitación','Cabaña','ParaLlevar') DEFAULT 'Local',
  modulo          ENUM('Restaurante','Bar','MiniMarket') NOT NULL,
  estado          ENUM('Pendiente','Preparando','Completado','Entregado','Cancelado','Facturado') DEFAULT 'Pendiente',
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  impuesto        DECIMAL(10,2) NOT NULL DEFAULT 0,
  recargo_delivery DECIMAL(10,2) DEFAULT 0.00,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  notas           TEXT,
  atendido_por    INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id),
  FOREIGN KEY (huesped_id)     REFERENCES huespedes(id),
  FOREIGN KEY (atendido_por)   REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE detalle_pedidos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id     INT NOT NULL,
  producto_id   INT NOT NULL,
  cantidad      DECIMAL(10,2) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  notas         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id)   REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

CREATE TABLE consumos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reservacion_id  INT NOT NULL,
  huesped_id      INT NOT NULL,
  producto_id     INT NOT NULL,
  pedido_id       INT,
  cantidad        DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  modulo          ENUM('Restaurante','Bar','MiniMarket') NOT NULL,
  tipo_entrega    ENUM('Local','Habitación','Cabaña','ParaLlevar') DEFAULT 'Local',
  registrado_por  INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id),
  FOREIGN KEY (huesped_id)     REFERENCES huespedes(id),
  FOREIGN KEY (producto_id)    REFERENCES productos(id),
  FOREIGN KEY (pedido_id)      REFERENCES pedidos(id),
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ============================================================
-- 5. FACTURACIÓN
-- ============================================================

CREATE TABLE facturas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reservacion_id  INT NOT NULL,
  huesped_id      INT NOT NULL,
  numero_factura  VARCHAR(20) NOT NULL UNIQUE,
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  impuesto        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  metodo_pago     ENUM('Efectivo','Tarjeta','Transferencia','Otro') DEFAULT 'Efectivo',
  estado          ENUM('Pendiente','Pagada','Anulada') DEFAULT 'Pendiente',
  created_by      INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id),
  FOREIGN KEY (huesped_id)     REFERENCES huespedes(id),
  FOREIGN KEY (created_by)     REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. COMPRAS Y PROVEEDORES
-- ============================================================

CREATE TABLE compras (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id    INT NOT NULL,
  numero_compra   VARCHAR(20) NOT NULL UNIQUE,
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  impuesto        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado          ENUM('Pendiente','Recibida','Anulada') DEFAULT 'Pendiente',
  created_by      INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (created_by)   REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE detalle_compras (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  compra_id     INT NOT NULL,
  producto_id   INT NOT NULL,
  cantidad      DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (compra_id)   REFERENCES compras(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. ALERTAS Y AUDITORÍA
-- ============================================================

CREATE TABLE alertas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tipo        ENUM('Stock','Pedido','Reservacion','Sistema','Factura') NOT NULL,
  titulo      VARCHAR(200) NOT NULL,
  mensaje     TEXT NOT NULL,
  leida       TINYINT(1) NOT NULL DEFAULT 0,
  usuario_id  INT,
  referencia_id INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT,
  accion        VARCHAR(50) NOT NULL,
  tabla         VARCHAR(50) NOT NULL,
  registro_id   INT,
  valor_anterior JSON,
  valor_nuevo   JSON,
  direccion_ip  VARCHAR(45),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE configuracion (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  clave       VARCHAR(100) NOT NULL UNIQUE,
  valor       TEXT NOT NULL,
  descripcion TEXT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_reservaciones_fechas ON reservaciones(fecha_entrada, fecha_salida);
CREATE INDEX idx_reservaciones_estado ON reservaciones(estado);
CREATE INDEX idx_reservaciones_qr ON reservaciones(codigo_qr);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_modulo ON pedidos(modulo);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_stock ON productos(stock_actual);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_consumos_reservacion ON consumos(reservacion_id);
CREATE INDEX idx_audit_logs_tabla ON audit_logs(tabla, registro_id);
CREATE INDEX idx_alertas_leida ON alertas(leida);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Gerente', 'Gestión operativa y reportes'),
('Recepcion', 'Gestión de huéspedes y reservaciones'),
('Restaurante', 'Módulo de restaurante'),
('Bar', 'Módulo de bar'),
('MiniMarket', 'Módulo de minimarket'),
('Huesped', 'Acceso limitado para huéspedes');

-- Permisos
INSERT INTO permisos (nombre, descripcion, modulo) VALUES
('dashboard.ver', 'Ver dashboard ejecutivo', 'Dashboard'),
('dashboard.ventas', 'Ver reportes de ventas', 'Dashboard'),
('huespedes.ver', 'Ver lista de huéspedes', 'Huéspedes'),
('huespedes.crear', 'Crear huéspedes', 'Huéspedes'),
('huespedes.editar', 'Editar huéspedes', 'Huéspedes'),
('huespedes.eliminar', 'Eliminar huéspedes', 'Huéspedes'),
('reservaciones.ver', 'Ver reservaciones', 'Reservaciones'),
('reservaciones.crear', 'Crear reservaciones', 'Reservaciones'),
('reservaciones.editar', 'Editar reservaciones', 'Reservaciones'),
('reservaciones.cancelar', 'Cancelar reservaciones', 'Reservaciones'),
('reservaciones.checkin', 'Realizar check-in', 'Reservaciones'),
('reservaciones.checkout', 'Realizar check-out', 'Reservaciones'),
('habitaciones.ver', 'Ver habitaciones', 'Habitaciones'),
('habitaciones.editar', 'Editar habitaciones', 'Habitaciones'),
('inventario.ver', 'Ver inventario', 'Inventario'),
('inventario.editar', 'Editar inventario', 'Inventario'),
('inventario.movimientos', 'Ver movimientos', 'Inventario'),
('pedidos.ver', 'Ver pedidos', 'Pedidos'),
('pedidos.crear', 'Crear pedidos', 'Pedidos'),
('pedidos.editar', 'Editar pedidos', 'Pedidos'),
('pedidos.cancelar', 'Cancelar pedidos', 'Pedidos'),
('reportes.ver', 'Ver reportes', 'Reportes'),
('reportes.exportar', 'Exportar reportes', 'Reportes'),
('admin.usuarios', 'Gestionar usuarios', 'Administración'),
('admin.roles', 'Gestionar roles', 'Administración'),
('admin.config', 'Configurar sistema', 'Administración'),
('proveedores.ver', 'Ver proveedores', 'Proveedores'),
('proveedores.editar', 'Editar proveedores', 'Proveedores'),
('facturas.ver', 'Ver facturas', 'Facturación'),
('facturas.crear', 'Crear facturas', 'Facturación');

-- Asignar todos los permisos al Administrador
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 1, id FROM permisos;

-- Asignar permisos al Gerente
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 2, id FROM permisos WHERE nombre NOT IN (
  'admin.usuarios', 'admin.roles', 'admin.config', 'huespedes.eliminar'
);

-- Asignar permisos a Recepción
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 3, id FROM permisos WHERE nombre IN (
  'dashboard.ver', 'huespedes.ver', 'huespedes.crear', 'huespedes.editar',
  'reservaciones.ver', 'reservaciones.crear', 'reservaciones.editar',
  'reservaciones.cancelar', 'reservaciones.checkin', 'reservaciones.checkout',
  'habitaciones.ver', 'facturas.ver', 'facturas.crear'
);

-- Asignar permisos a Restaurante
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 4, id FROM permisos WHERE nombre IN (
  'dashboard.ver', 'pedidos.ver', 'pedidos.crear', 'pedidos.editar',
  'inventario.ver'
);

-- Asignar permisos a Bar
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 5, id FROM permisos WHERE nombre IN (
  'dashboard.ver', 'pedidos.ver', 'pedidos.crear', 'pedidos.editar',
  'inventario.ver'
);

-- Asignar permisos a MiniMarket
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 6, id FROM permisos WHERE nombre IN (
  'dashboard.ver', 'pedidos.ver', 'pedidos.crear', 'pedidos.editar',
  'inventario.ver'
);

-- Asignar permisos a Huésped
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 7, id FROM permisos WHERE nombre IN (
  'pedidos.ver', 'pedidos.crear'
);

-- Usuario administrador por defecto (password: admin123)
-- Hash generado con bcryptjs para 'admin123'
INSERT INTO usuarios (nombre, email, password, role_id) VALUES
('Administrador', 'admin@hotel.com', '$2a$10$9SsVKXNUqwVroWqcoma8XeRfa1hytQzN5jRAAiqqdP1FZxhb51xD2', 1);

-- Configuración por defecto
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('hotel.nombre', 'Hotel Gestión', 'Nombre del hotel'),
('hotel.direccion', 'Av. Principal 123', 'Dirección del hotel'),
('hotel.telefono', '+51 999 888 777', 'Teléfono del hotel'),
('hotel.email', 'info@hotelgestion.com', 'Email del hotel'),
('hotel.impuesto', '18', 'Porcentaje de impuesto'),
('hotel.moneda', 'S/.', 'Símbolo de moneda'),
('hotel.moneda_codigo', 'PEN', 'Código ISO de moneda'),
('sistema.modo_oscuro', 'true', 'Modo oscuro por defecto'),
('sistema.idioma', 'es', 'Idioma del sistema');

-- Categorías de productos
INSERT INTO categorias (nombre, descripcion, modulo) VALUES
('Entradas', 'Platos de entrada', 'Restaurante'),
('Platos de Fondo', 'Platos principales', 'Restaurante'),
('Postres', 'Postres y dulces', 'Restaurante'),
('Bebidas', 'Bebidas en general', 'Todos'),
('Cocktails', 'Cocktails y coctelería', 'Bar'),
('Cervezas', 'Cervezas artesanales e industriales', 'Bar'),
('Licores', 'Licores y destilados', 'Bar'),
('Snacks', 'Snacks y botanas', 'MiniMarket'),
('Abarrotes', 'Productos de abarrotes', 'MiniMarket'),
('Souvenirs', 'Recuerdos y regalos', 'MiniMarket'),
('Aseo', 'Productos de aseo personal', 'MiniMarket');

-- Habitaciones de ejemplo
INSERT INTO habitaciones (numero, piso, tipo, capacidad, precio_noche, descripcion, amenities) VALUES
('101', 1, 'Individual', 1, 120.00, 'Habitación individual con vista al jardín', 'TV, WiFi, Baño privado'),
('102', 1, 'Doble', 2, 180.00, 'Habitación doble con dos camas', 'TV, WiFi, Baño privado, Minibar'),
('103', 1, 'Doble', 2, 190.00, 'Habitación doble con cama queen', 'TV, WiFi, Baño privado, Minibar, Balcón'),
('201', 2, 'Suite', 3, 350.00, 'Suite con sala de estar independiente', 'TV 55", WiFi, Baño con tina, Minibar, Sala'),
('202', 2, 'Familiar', 4, 420.00, 'Habitación familiar con dos ambientes', 'TV, WiFi, Baño privado, Minibar, Cocina pequeña'),
('301', 3, 'Presidencial', 4, 650.00, 'Suite presidencial con terraza panorámica', 'TV 65", WiFi, Jacuzzi, Minibar, Sala, Terraza');

-- Cabañas de ejemplo
INSERT INTO cabañas (nombre, capacidad, precio_noche, descripcion, amenities) VALUES
('Cabaña del Lago', 4, 280.00, 'Cabaña rústica con vista al lago', 'Chimenea, WiFi, Baño privado, Terraza, Parrilla'),
('Cabaña del Bosque', 6, 380.00, 'Cabaña amplia rodeada de naturaleza', 'Chimenea, WiFi, Baño privado, Jacuzzi, Terraza, Parrilla, Cocina'),
('Cabaña Familiar', 8, 520.00, 'Cabaña para grupos familiares', 'Chimenea, WiFi, 2 Baños, Terraza, Parrilla, Cocina completa, Jardín');

-- Productos de ejemplo - Restaurante
INSERT INTO productos (categoria_id, nombre, descripcion, unidad, stock_actual, stock_minimo, precio_compra, precio_venta) VALUES
(1, 'Causa Limeña', 'Entrada fría a base de papa amarilla', 'Porción', 50, 10, 8.00, 22.00),
(1, 'Tequeños', 'Palitos de queso envueltos en masa', 'Porción', 40, 10, 5.00, 18.00),
(1, 'Ceviche Clásico', 'Pescado fresco marinado en limón', 'Porción', 30, 5, 12.00, 32.00),
(2, 'Lomo Saltado', 'Tiras de carne salteadas con verduras', 'Porción', 25, 5, 15.00, 38.00),
(2, 'Ají de Gallina', 'Pollo desmenuzado en crema de ají', 'Porción', 20, 5, 10.00, 30.00),
(2, 'Parrilla Personal', 'Carne asada con guarniciones', 'Porción', 15, 3, 18.00, 45.00),
(3, 'Suspiro Limeño', 'Postre tradicional peruano', 'Porción', 30, 5, 4.00, 14.00),
(3, 'Picarones', 'Donas de zapallo y camote con miel', 'Porción', 25, 5, 3.00, 12.00);

-- Productos de ejemplo - Bar
INSERT INTO productos (categoria_id, nombre, descripcion, unidad, stock_actual, stock_minimo, precio_compra, precio_venta) VALUES
(5, 'Pisco Sour', 'Cocktail clásico peruano', 'Botella', 100, 10, 10.00, 28.00),
(5, 'Margarita Clásica', 'Cocktail de tequila con limón', 'Botella', 60, 10, 12.00, 30.00),
(5, 'Mojito', 'Cocktail de ron con hierbabuena', 'Botella', 80, 10, 9.00, 25.00),
(6, 'Cerveza Cusqueña', 'Cerveza rubia', 'Unidad', 200, 20, 4.00, 12.00),
(6, 'Cerveza Artesanal', 'Cerveza IPA artesanal', 'Botella', 100, 15, 8.00, 18.00),
(7, 'Whisky Johnnie Walker', 'Whisky escocés etiqueta roja', 'Botella', 30, 5, 45.00, 85.00),
(7, 'Vino Tinto Reserva', 'Vino tinto chileno reserva', 'Botella', 40, 5, 25.00, 55.00);

-- Productos de ejemplo - MiniMarket
INSERT INTO productos (categoria_id, nombre, descripcion, unidad, stock_actual, stock_minimo, precio_compra, precio_venta) VALUES
(8, 'Papas Lays', 'Papas fritas en bolsa', 'Unidad', 100, 20, 2.50, 5.00),
(8, 'Chocolate Sublime', 'Chocolate con leche', 'Unidad', 80, 15, 3.00, 6.00),
(4, 'Agua Mineral', 'Agua sin gas 500ml', 'Botella', 200, 30, 1.50, 3.00),
(4, 'Gaseosa Coca-Cola', 'Gaseosa 500ml', 'Botella', 150, 25, 2.00, 4.00),
(4, 'Jugo Natural', 'Jugo de fruta natural 400ml', 'Botella', 60, 10, 4.00, 8.00),
(9, 'Galletas Oreo', 'Galletas rellenas de crema', 'Unidad', 120, 20, 2.00, 4.50),
(10, 'Llavero Recuerdo', 'Llavero artesanal del hotel', 'Unidad', 200, 10, 3.00, 12.00),
(10, 'Taza Cerámica', 'Taza con logo del hotel', 'Unidad', 100, 10, 8.00, 20.00),
(11, 'Shampoo', 'Shampoo pequeño 50ml', 'Unidad', 300, 50, 2.00, 5.00),
(11, 'Cepillo Dental', 'Cepillo dental con estuche', 'Unidad', 200, 30, 1.50, 4.00);
