CREATE TABLE reservacion_acompanantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservacion_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    tipo_documento ENUM('DNI', 'Pasaporte', 'CE', 'Otro') DEFAULT 'DNI', -- Se cambió el nombre de esta columna
    numero_documento VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id) ON DELETE CASCADE
);
