import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_hotel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}

export async function query(sql: string, params?: any[]): Promise<any> {
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function querySingle(sql: string, params?: any[]): Promise<any> {
  const results = await query(sql, params);
  return (results as any[])[0] || null;
}

export default pool;
