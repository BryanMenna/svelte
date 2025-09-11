// src/routes/api/presupuesto/+server.js
import { pool } from '$lib/db.js';
import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    // @ts-ignore
    const [rows] = await pool.execute(`
      SELECT 
        ID AS id_presu, 
        Tipo AS tipo, 
        Numero AS numero, 
        FechaVig AS fecha_vig, 
        FechaPro AS fecha_pro,
        YEAR(FechaVig) AS anio
      FROM ct_presu
      ORDER BY anio ASC, FechaVig ASC
    `);
    return json(rows);
  } catch (err) {
    console.error('Error al obtener presupuestos:', err);
    // @ts-ignore
    return json({ error: err.message }, { status: 500 });
  }
}

// ➡️ Crear nuevo presupuesto
// @ts-ignore
export async function POST({ request }) {
  try {
    const { tipo, numero, fecha_vig, fecha_pro } = await request.json();

    // @ts-ignore
    const [result] = await pool.execute(
      `INSERT INTO ct_presu (Tipo, Numero, FechaVig, FechaPro)
       VALUES (?, ?, ?, ?)`,
      [tipo, numero, fecha_vig, fecha_pro]
    );

    return json({ id_presu: result.insertId, tipo, numero, fecha_vig, fecha_pro });
  } catch (err) {
    console.error('Error al crear presupuesto:', err);
    // @ts-ignore
    return json({ error: err.message }, { status: 500 });
  }
}

// ➡️ Editar presupuesto
// @ts-ignore
export async function PUT({ request }) {
  try {
    const { id_presu, tipo, numero, fecha_vig, fecha_pro } = await request.json();

    // @ts-ignore
    await pool.execute(
      `UPDATE ct_presu 
       SET Tipo = ?, Numero = ?, FechaVig = ?, FechaPro = ?
       WHERE ID = ?`,
      [tipo, numero, fecha_vig, fecha_pro, id_presu]
    );

    return json({ success: true });
  } catch (err) {
    console.error('Error al editar presupuesto:', err);
    // @ts-ignore
    return json({ error: err.message }, { status: 500 });
  }
}

// ➡️ Eliminar presupuesto
// @ts-ignore
export async function DELETE({ request }) {
  try {
    const { id_presu } = await request.json();
    // @ts-ignore
    await pool.execute(`DELETE FROM ct_presu WHERE ID = ?`, [id_presu]);
    return json({ success: true });
  } catch (err) {
    console.error('Error al eliminar presupuesto:', err);
    // @ts-ignore
    return json({ error: err.message }, { status: 500 });
  }
}
