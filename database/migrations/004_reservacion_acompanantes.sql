CREATE TABLE IF NOT EXISTS reservacion_acompanantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservacion_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    documento VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id) ON DELETE CASCADE
);
