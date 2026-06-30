# NovaHotel OS - Sistema de Gestión Hotelera

Sistema integral de gestión hotelera con módulos de recepción, reservaciones, restaurante, bar, minimarket, inventario y portal de huéspedes. Diseñado para ser desplegado en Hostinger con MySQL y Node.js.

## Capturas

<img width="1851" height="825" alt="Untitled" src="https://github.com/user-attachments/assets/773335b3-4cf2-45e4-a098-d2153f2dc7da" />
<img width="1859" height="835" alt="Untitled" src="https://github.com/user-attachments/assets/079640cb-ad11-45f6-96a1-d87aa93b105c" />



## Características

- **7 roles** con control de acceso: Administrador, Gerente, Recepción, Restaurante, Bar, MiniMarket, Huésped
- **Gestión de huéspedes** — registro, edición, historial de reservaciones
- **Reservaciones** — Pernocte y Pasadía, asignación de habitaciones/cabañas, acompañantes, QR check-in/check-out
- **POS Integrado** — Restaurante, Bar & Lounge, Mini Market con carrito y actualización de stock en tiempo real
- **Inventario** — productos, categorías, movimientos, alertas de stock bajo
- **Reportes** — dashboard con KPIs, gráficos de ventas, ocupación
- **Panel de Administración** — usuarios, roles, configuración
- **Portal de Huéspedes** — login vía QR, pedidos desde la habitación, reseñas con estrellas, consulta de consumos
- **API Webhook** — integración externa para crear reservaciones vía API Key
- **Modo Oscuro** — soporte completo dark mode
- **Diseño Responsive** — interfaz adaptativa con navegación inferior en móvil

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS + Recharts + Zustand + Lucide Icons |
| **Backend** | Node.js + Express + TypeScript + MySQL2 |
| **Base de Datos** | MySQL (InnoDB, 23 tablas) |
| **Autenticación** | JWT (staff) + QR code (huéspedes) |
| **QR** | qrcode (npm) |

## Estructura del Proyecto

```
gestion-hotel/
├── backend/                # API REST (Express + TypeScript)
│   ├── src/
│   │   ├── config/         # Configuración (DB, JWT, .env)
│   │   ├── controllers/    # Controladores
│   │   ├── middlewares/     # Auth, RBAC, API Key, Error handler
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── types/          # Interfaces TypeScript
│   │   └── utils/          # Helpers, errores personalizados
│   └── .env
├── frontend/               # SPA (React + Vite + Tailwind)
│   └── src/
│       ├── components/     # Componentes (layout, sidebar, bottom nav)
│       ├── pages/          # Páginas por módulo
│       ├── services/       # API client (axios)
│       ├── store/          # Zustand stores
│       ├── types/          # Interfaces TypeScript
│       └── utils/          # Helpers
├── database/
│   ├── schema.sql          # Esquema completo con seed data
│   └── migrations/         # Migraciones incrementales
├── docs/
│   └── webhook-api.md      # Documentación de webhook API
└── README.md
```

## Requisitos

- Node.js 18+
- MySQL 5.7+ (o MariaDB 10.3+)
- npm

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/Hotel_Management_System.git
cd Hotel_Management_System
```

### 2. Base de Datos

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/migrations/001_recepcion_logic.sql
mysql -u root -p < database/migrations/002_opiniones.sql
```

### 3. Backend

```bash
cd backend
npm install
# Editar .env con tus credenciales
cp .env.example .env
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Acceder

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`
- Credenciales: `admin@hotel.com` / `admin123`

## Variables de Entorno (backend/.env)

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_hotel
JWT_SECRET=gestion-hotel-secret-key-2024
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login de staff |
| POST | `/api/auth/guest-login` | Login de huésped vía código QR |

### Gestión
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/huespedes` | Listar huéspedes |
| POST | `/api/huespedes` | Crear huésped |
| GET | `/api/reservaciones` | Listar reservaciones |
| POST | `/api/reservaciones` | Crear reservación |
| POST | `/api/reservaciones/:id/checkin` | Check-in con QR |
| POST | `/api/reservaciones/:id/checkout` | Check-out |

### Portal Huésped (requiere guest JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/guest/perfil` | Perfil + reservación |
| GET | `/api/guest/productos` | Productos disponibles |
| POST | `/api/guest/pedidos` | Crear pedido |
| GET | `/api/guest/pedidos` | Historial de pedidos |
| GET | `/api/guest/consumos` | Consumos + total |
| POST | `/api/opiniones` | Dejar reseña (1-5 estrellas) |

### Webhook (requiere API Key)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/reservaciones` | Crear reservación externa |

Ver documentación completa en `docs/webhook-api.md`.

## Roles del Sistema

| Rol | Acceso |
|-----|--------|
| Administrador | Todo el sistema |
| Gerente | Reportes, dashboard, configuración |
| Recepción | Huéspedes, reservaciones, check-in/out |
| Restaurante | POS restaurante, pedidos activos |
| Bar | POS bar, pedidos activos |
| MiniMarket | POS minimarket, pedidos activos |
| Huésped | Portal propio: pedidos, reseña, cuenta |

## Flujo de QR

1. Recepción crea reservación y hace Check-In
2. Sistema genera QR con URL: `http://IP:5173/guest?token=CODIGO_UNICO`
3. Huésped escanea el QR → abre el portal
4. Auto-login → puede hacer pedidos, ver cuenta, dejar reseña

## Licencia

MIT
