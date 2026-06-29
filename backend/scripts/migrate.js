const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: 'gestion_hotel',
    charset: 'utf8mb4',
  });

  try {
    await conn.execute("ALTER TABLE reservaciones ADD COLUMN tipo ENUM('Pernocte','Pasadia') NOT NULL DEFAULT 'Pernocte' AFTER caba\u00f1a_id");
    console.log('OK - add tipo column');
  } catch (e) {
    if (e.errno === 1060) console.log('OK - tipo column already exists');
    else throw e;
  }

  try {
    await conn.execute(
      "CREATE TABLE IF NOT EXISTS reservacion_acompanantes (" +
      "id INT AUTO_INCREMENT PRIMARY KEY, " +
      "reservacion_id INT NOT NULL, " +
      "nombre VARCHAR(100) NOT NULL, " +
      "apellidos VARCHAR(100) DEFAULT '', " +
      "tipo_documento ENUM('DNI','Pasaporte','CE','Otro') DEFAULT 'DNI', " +
      "numero_documento VARCHAR(20) DEFAULT '', " +
      "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
      "FOREIGN KEY (reservacion_id) REFERENCES reservaciones(id) ON DELETE CASCADE" +
      ") ENGINE=InnoDB"
    );
    console.log('OK - create reservacion_acompanantes table');
  } catch (e) {
    if (e.errno === 1050) console.log('OK - table already exists');
    else throw e;
  }

  try {
    await conn.execute("CREATE INDEX idx_acompanantes_reservacion ON reservacion_acompanantes(reservacion_id)");
    console.log('OK - index created');
  } catch (e) {
    if (e.errno === 1061) console.log('OK - index already exists');
    else console.log('Note:', e.message);
  }

  await conn.end();
  console.log('Migration completed');
}

run().catch(console.error);
