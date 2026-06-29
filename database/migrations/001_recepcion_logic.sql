-- Migration: Recepción logic - tipo de reservación y acompañantes

ALTER TABLE reservaciones
  ADD COLUMN tipo ENUM('Pernocte','Pasadia') NOT NULL DEFAULT 'Pernocte' AFTER cabaña_id,
  ADD INDEX idx_reservaciones_tipo (tipo);

CREATE TABLE reservacion_acompanantes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reservacion_id  INT NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(100) DEFAULT '',
  tipo_documento  ENUM('DNI','Pasaporte','CE','Otro') DEFAULT 'DNI',
  numero_documento VARCHAR(20) DEFAULT '',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_acompanantes_reservacion ON reservacion_acompanantes(reservacion_id);
