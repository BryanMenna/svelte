// src/routes/api/egresos/[id].js
import { pool } from '$lib/db';

// @ts-ignore
export async function GET({ params }) {
  try {
    // 🔹 Usamos el pool definido en src/lib/db.js
    // @ts-ignore
    const [rows] = await pool.execute(
      'SELECT * FROM ct_part_eg WHERE IDPresu = ?',
      [params.id]
    );

    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error al obtener egresos:', err);
    return new Response(JSON.stringify({ error: 'Error al obtener egresos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
