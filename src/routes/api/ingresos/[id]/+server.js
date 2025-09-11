import { pool } from '$lib/db.js';
import { json } from '@sveltejs/kit';

// @ts-ignore
export async function GET({ params, url }) {
  try {
    const idPresu = params.id;
    // @ts-ignore
    const numero = url.searchParams.get('numero');
    // @ts-ignore
    const [rows] = await pool.query(
      `SELECT 
         p.numero, 
         i.Codigo, 
         i.Detalle, 
         i.IT, 
         i.Presu
       FROM ct_part_ig i
       JOIN ct_presu p ON p.ID = i.IDPresu
       WHERE i.IDPresu = ?
       ORDER BY i.Codigo ASC`,
      [idPresu]
    );
    return json(rows);
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
