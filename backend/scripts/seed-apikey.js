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
    await conn.execute(
      "INSERT IGNORE INTO configuracion (clave, valor, descripcion) VALUES (?, ?, ?)",
      ['api.external.key', 'novahotel_apikey_2026', 'API Key para integraciones externas']
    );
    console.log('API Key seeded: novahotel_apikey_2026');
  } catch (e) {
    console.error(e.message);
  }

  await conn.end();
}

run();
