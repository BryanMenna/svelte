// src/routes/api/ingresos/+server.js
import { json } from '@sveltejs/kit';
import { pool } from '$lib/db.js';

// GET: lista ingresos por presupuesto
// @ts-ignore
export async function GET({ url }) {
  try {
    const idPresu = url.searchParams.get("idPresu");
    if (!idPresu) return json({ error: "Falta idPresu" }, { status: 400 });

    // @ts-ignore
    const [rows] = await pool.execute(
      `SELECT IDPresu, Codigo, Detalle, Presu, IT, TP
       FROM ct_part_ig
       WHERE IDPresu = ?`,
      [idPresu]
    );
    return json(rows);
  } catch (err) {
    console.error("❌ Error GET ingresos:", err);
    return json({ error: "Error cargando ingresos" }, { status: 500 });
  }
}

// POST: alta ingreso
// @ts-ignore
export async function POST({ request }) {
  try {
    const { IDPresu, Codigo, Detalle, Presu, IT, TP } = await request.json();
    console.log("📩 POST recibido:", { IDPresu, Codigo, Detalle, Presu, IT, TP });

    // @ts-ignore
    await pool.execute(
      `INSERT INTO ct_part_ig (IDPresu, Codigo, Detalle, Presu, IT, TP)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [IDPresu, Codigo, Detalle, Presu, IT || 'Imputable', TP || 'Normal']
    );

    return json({ message: "Ingreso creado con éxito" });
  } catch (err) {
    console.error("❌ Error POST ingreso:", err);
    return json({ error: "Error creando ingreso" }, { status: 500 });
  }
}

// PUT: modificar ingreso
// @ts-ignore
export async function PUT({ request }) {
  try {
    const { IDPresu, Codigo, Detalle, Presu, IT, TP } = await request.json();
    console.log("📩 PUT recibido:", { IDPresu, Codigo, Detalle, Presu, IT, TP });

    // @ts-ignore
    const [result] = await pool.execute(
      `UPDATE ct_part_ig
       SET Detalle = ?, Presu = ?, IT = ?, TP = ?
       WHERE IDPresu = ? AND Codigo = ?`,
      [Detalle, Presu, IT || 'Imputable', TP || 'Normal', IDPresu, Codigo]
    );

    console.log("✅ Resultado UPDATE:", result);

    if (result.affectedRows === 0) {
      return json({ error: "No se encontró el ingreso para actualizar" }, { status: 404 });
    }

    return json({ message: "Ingreso actualizado con éxito" });
  } catch (err) {
    console.error("❌ Error PUT ingreso:", err);
    return json({ error: "Error actualizando ingreso" }, { status: 500 });
  }
}

// DELETE: baja ingreso
// @ts-ignore
export async function DELETE({ request }) {
  try {
    const { IDPresu, Codigo } = await request.json();
    console.log("📩 DELETE recibido:", { IDPresu, Codigo });

    // @ts-ignore
    const [result] = await pool.execute(
      `DELETE FROM ct_part_ig WHERE IDPresu = ? AND Codigo = ?`,
      [IDPresu, Codigo]
    );

    console.log("✅ Resultado DELETE:", result);

    if (result.affectedRows === 0) {
      return json({ error: "No se encontró el ingreso para eliminar" }, { status: 404 });
    }

    return json({ message: "Ingreso eliminado con éxito" });
  } catch (err) {
    console.error("❌ Error DELETE ingreso:", err);
    return json({ error: "Error eliminando ingreso" }, { status: 500 });
  }
}
