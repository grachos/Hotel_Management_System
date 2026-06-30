import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const [migrationFile] = process.argv.slice(2);
if (!migrationFile) {
  console.error('Uso: npx ts-node scripts/apply-migration.ts database/migrations/006_fix_admin_password.sql');
  process.exit(1);
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_hotel',
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, '..', '..', migrationFile);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await connection.query(sql);
  console.log(`Migration ${migrationFile} applied.`);
  await connection.end();
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
