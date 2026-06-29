# API Webhook — NovaHotel OS

Interfaz REST para crear reservaciones desde aplicaciones externas (páginas web, booking engines, OTAs, WhatsApp bots, etc.).

---

## Autenticación

Todas las peticiones deben incluir el header:

```
X-API-Key: novahotel_apikey_2026
```

La API Key se configura desde el panel de Administración del sistema.

---

## Endpoints

### `GET /api/v1/health`

Verifica que el servicio webhook está operativo.

**Respuesta:**
```json
{
  "success": true,
  "message": "API Webhook NovaHotel OS - OK",
  "version": "1.0.0"
}
```

---

### `POST /api/v1/reservaciones`

Crear una nueva reservación. Si el huésped no existe, se crea automáticamente.

**Headers:**
```
Content-Type: application/json
X-API-Key: novahotel_apikey_2026
```

**Body (mínimo requerido):**
```json
{
  "huesped": {
    "nombre": "Juan",
    "apellidos": "Pérez",
    "email": "juan@ejemplo.com",
    "telefono": "+51999888777",
    "tipo_documento": "DNI",
    "numero_documento": "12345678"
  },
  "fecha_entrada": "2026-07-15",
  "fecha_salida": "2026-07-18",
  "tipo": "Pernocte"
}
```

**Body completo (con todos los campos):**
```json
{
  "huesped": {
    "nombre": "Juan",
    "apellidos": "Pérez",
    "email": "juan@ejemplo.com",
    "telefono": "+51999888777",
    "tipo_documento": "DNI",
    "numero_documento": "12345678",
    "direccion": "Av. Principal 123",
    "ciudad": "Lima",
    "pais": "Perú"
  },
  "habitacion_id": 1,
  "cabaña_id": null,
  "fecha_entrada": "2026-07-15",
  "fecha_salida": "2026-07-18",
  "tipo": "Pernocte",
  "adultos": 2,
  "niños": 1,
  "notas": "Solicitud desde web",
  "acompanantes": [
    {
      "nombre": "María",
      "apellidos": "Pérez",
      "tipo_documento": "DNI",
      "numero_documento": "87654321"
    }
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Reservación creada exitosamente",
  "data": {
    "id": 5,
    "codigo_unico": "HMQYLC0BW7A5B98",
    "tipo": "Pernocte",
    "huesped": "Juan Pérez",
    "habitacion": "101",
    "cabaña": null,
    "fecha_entrada": "2026-07-15",
    "fecha_salida": "2026-07-18",
    "estado": "Pendiente",
    "adultos": 2,
    "niños": 1,
    "acompanantes": 1,
    "qr": "data:image/png;base64,..."
  }
}
```

---

## Campos del Request

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `huesped.nombre` | string | Sí | Nombre del huésped principal |
| `huesped.apellidos` | string | Sí | Apellidos del huésped principal |
| `huesped.email` | string | No | Correo electrónico |
| `huesped.telefono` | string | No | Teléfono de contacto |
| `huesped.tipo_documento` | string | No | DNI, Pasaporte, CE, Otro (default: DNI) |
| `huesped.numero_documento` | string | No | Número de documento (usado para búsqueda) |
| `huesped.direccion` | string | No | Dirección |
| `huesped.ciudad` | string | No | Ciudad |
| `huesped.pais` | string | No | País |
| `huesped.id` | number | No* | ID si el huésped ya existe en el sistema |
| `fecha_entrada` | string (date) | Sí | Fecha de entrada (YYYY-MM-DD) |
| `fecha_salida` | string (date) | No | Fecha de salida. Si no se envía y tipo es Pernocte, se usa igual que entrada |
| `tipo` | string | No | Pernocte o Pasadia (default: Pernocte) |
| `habitacion_id` | number | No | ID de la habitación |
| `cabaña_id` | number | No | ID de la cabaña |
| `adultos` | number | No | Cantidad de adultos (default: 1) |
| `niños` | number | No | Cantidad de niños (default: 0) |
| `notas` | string | No | Notas adicionales |
| `acompanantes[]` | array | No | Lista de acompañantes |

### Acompañante

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `nombre` | string | Sí | Nombre del acompañante |
| `apellidos` | string | No | Apellidos |
| `tipo_documento` | string | No | DNI, Pasaporte, CE, Otro |
| `numero_documento` | string | No | Número de documento |

---

## Códigos de Respuesta

| Código | Significado |
|---|---|
| 201 | Reservación creada exitosamente |
| 400 | Error de validación (campo faltante o inválido) |
| 401 | API Key no proporcionada |
| 403 | API Key inválida |
| 409 | Conflicto (habitación no disponible) |
| 500 | Error interno del servidor |

---

## Ejemplo con cURL

```bash
curl -X POST http://localhost:4000/api/v1/reservaciones \
  -H "Content-Type: application/json" \
  -H "X-API-Key: novahotel_apikey_2026" \
  -d '{
    "huesped": {
      "nombre": "Carlos",
      "apellidos": "López",
      "email": "carlos@ejemplo.com",
      "tipo_documento": "DNI",
      "numero_documento": "99999999"
    },
    "fecha_entrada": "2026-07-20",
    "fecha_salida": "2026-07-22",
    "tipo": "Pernocte",
    "habitacion_id": 2,
    "adultos": 2,
    "notas": "Reservación desde web"
  }'
```

## Ejemplo con JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:4000/api/v1/reservaciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'novahotel_apikey_2026',
  },
  body: JSON.stringify({
    huesped: {
      nombre: 'Ana',
      apellidos: 'García',
      email: 'ana@ejemplo.com',
    },
    fecha_entrada: '2026-08-01',
    fecha_salida: '2026-08-05',
    tipo: 'Pernocte',
    adultos: 1,
  }),
});

const data = await response.json();
console.log('Reservación creada:', data.data.codigo_unico);
console.log('QR:', data.data.qr);
```

---

## Notas importantes

- El QR se genera automáticamente al crear la reservación
- Si se envía `huesped.id`, se omite la búsqueda/creación y se usa ese ID directamente
- Si `tipo` es `Pasadia`, `fecha_salida` se ignora y se usa el mismo valor que `fecha_entrada`
- Las habitaciones se marcan como `Reservada` automáticamente
- La configuración de la API Key se realiza desde Administración > Configuración del sistema
