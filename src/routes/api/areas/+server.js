import { pool } from '$lib/db.js';
import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    // @ts-ignore
    const [areas] = await pool.query(
      'SELECT ID, Detalle AS Area FROM us_areas ORDER BY Detalle ASC'
    );
    return json({ success: true, areas });
  } catch (error) {
    console.error('❌ Error al obtener áreas:', error);
    return json({ success: false, error: 'No se pudieron cargar las áreas.' });
  }
}
