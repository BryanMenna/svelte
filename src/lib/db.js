// src/lib/db.js
import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

export async function getConnection() {
  return await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT),
    multipleStatements: true 
  });
}
