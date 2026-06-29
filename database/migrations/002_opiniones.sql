-- Migration: Guest reviews (opiniones)

CREATE TABLE opiniones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  huesped_id      INT NOT NULL,
  reservacion_id  INT NOT NULL UNIQUE,
  rating          TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario      TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (huesped_id) REFERENCES huespedes(id) ON DELETE CASCADE,
  FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_opiniones_huesped ON opiniones(huesped_id);
CREATE INDEX idx_opiniones_reservacion ON opiniones(reservacion_id);
