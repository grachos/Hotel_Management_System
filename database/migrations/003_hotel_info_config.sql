-- Migration: Hotel info config for guest portal

INSERT INTO configuracion (clave, valor, descripcion) VALUES
('hotel.wifi_ssid', 'NovaHotel', 'Nombre de la red WiFi'),
('hotel.wifi_password', 'bienvenido2024', 'Contraseña de la red WiFi'),
('hotel.desayuno_horario', '7:00 AM - 10:00 AM', 'Horario del desayuno'),
('hotel.desayuno_lugar', 'Restaurante', 'Lugar donde se sirve el desayuno'),
('hotel.checkout_horario', 'Antes de las 12:00 PM', 'Horario de check-out'),
('hotel.servicios', 'Restaurante, Bar, Mini Market, Piscina', 'Servicios del hotel')
ON DUPLICATE KEY UPDATE valor = VALUES(valor), descripcion = VALUES(descripcion);
