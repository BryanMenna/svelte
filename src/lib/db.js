// src/lib/db.js
import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: Number(env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,   // máximo de conexiones simultáneas
  queueLimit: 0
});

export default pool;
