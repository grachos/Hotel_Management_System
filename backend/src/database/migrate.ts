import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Conectado a MySQL');

  const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await connection.query(schema);
    console.log('Base de datos inicializada exitosamente');
  } catch (error) {
    console.log('Schema ya existe, continuando con migraciones...');
  }

  const migrationsDir = path.join(__dirname, '..', '..', '..', 'database', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  if (!files.length) {
    await connection.end();
    process.exit(0);
  }

  await connection.query(`CREATE TABLE IF NOT EXISTS _migrations (name VARCHAR(255) PRIMARY KEY, applied_at DATETIME DEFAULT NOW())`);

  for (const file of files) {
    const [rows] = await connection.query(`SELECT 1 FROM _migrations WHERE name = ?`, [file]);
    if ((rows as any[]).length) {
      console.log(`  Skip ${file} (ya aplicada)`);
      continue;
    }

    const sqlPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await connection.query(sql);
    await connection.query(`INSERT INTO _migrations (name) VALUES (?)`, [file]);
    console.log(`  Aplicada ${file}`);
  }

  await connection.end();
  process.exit(0);
}

migrate().catch((err) => { console.error(err); process.exit(1); });
