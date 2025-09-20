// src/routes/api/egresos/+server.js
import { json } from '@sveltejs/kit';
import { pool } from '$lib/db.js';

// GET: lista egresos por presupuesto
// @ts-ignore
export async function GET({ url }) {
  try {
    const idPresu = url.searchParams.get("idPresu");
    if (!idPresu) return json({ error: "Falta idPresu" }, { status: 400 });

    // @ts-ignore
    const [rows] = await pool.execute(
      `SELECT IDPresu, Codigo, Detalle, Presu, IT, TP
       FROM ct_part_eg
       WHERE IDPresu = ?
       ORDER BY Codigo ASC`,
      [idPresu]
    );
    return json(rows);
  } catch (err) {
    console.error("❌ Error GET egresos:", err);
    return json({ error: "Error cargando egresos" }, { status: 500 });
  }
}

// POST: alta egreso
// @ts-ignore
export async function POST({ request }) {
  try {
    const { IDPresu, Codigo, Detalle, Presu, IT, TP } = await request.json();
    console.log("📩 POST recibido (egreso):", { IDPresu, Codigo, Detalle, Presu, IT, TP });

    // @ts-ignore
    await pool.execute(
      `INSERT INTO ct_part_eg (IDPresu, Codigo, Detalle, Presu, IT, TP)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [IDPresu, Codigo, Detalle, Presu, IT || 'Imputable', TP || 'Normal']
    );

    return json({ message: "Egreso creado con éxito" });
  } catch (err) {
    console.error("❌ Error POST egreso:", err);
    return json({ error: "Error creando egreso" }, { status: 500 });
  }
}

// PUT: modificar egreso
// @ts-ignore
export async function PUT({ request }) {
  try {
    const { IDPresu, Codigo, Detalle, Presu, IT, TP } = await request.json();
    console.log("📩 PUT recibido (egreso):", { IDPresu, Codigo, Detalle, Presu, IT, TP });

    // @ts-ignore
    const [result] = await pool.execute(
      `UPDATE ct_part_eg
       SET Detalle = ?, Presu = ?, IT = ?, TP = ?
       WHERE IDPresu = ? AND Codigo = ?`,
      [Detalle, Presu, IT || 'Imputable', TP || 'Normal', IDPresu, Codigo]
    );

    if (result.affectedRows === 0) {
      return json({ error: "No se encontró el egreso para actualizar" }, { status: 404 });
    }

    return json({ message: "Egreso actualizado con éxito" });
  } catch (err) {
    console.error("❌ Error PUT egreso:", err);
    return json({ error: "Error actualizando egreso" }, { status: 500 });
  }
}

// DELETE: baja egreso
// @ts-ignore
export async function DELETE({ request }) {
  try {
    const { IDPresu, Codigo } = await request.json();
    console.log("📩 DELETE recibido (egreso):", { IDPresu, Codigo });

    // @ts-ignore
    const [result] = await pool.execute(
      `DELETE FROM ct_part_eg WHERE IDPresu = ? AND Codigo = ?`,
      [IDPresu, Codigo]
    );

    if (result.affectedRows === 0) {
      return json({ error: "No se encontró el egreso para eliminar" }, { status: 404 });
    }

    return json({ message: "Egreso eliminado con éxito" });
  } catch (err) {
    console.error("❌ Error DELETE egreso:", err);
    return json({ error: "Error eliminando egreso" }, { status: 500 });
  }
}
