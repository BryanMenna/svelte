import { getConnection } from '$lib/db.js';
import { json } from '@sveltejs/kit';

// @ts-ignore
export async function PUT({ params, request }) {
  const id = params.id;

  try {
    const body = await request.json();

    if (!id) {
      return json({ success: false, error: 'ID no proporcionado' }, { status: 400 });
    }

    const {
      Nombre,
      Apellido,
      Correo,
      Usuario,
      ID_Tipo,
      ID_Area,
      Estado
    } = body;

    if (!Nombre || !Apellido || !Correo || !ID_Tipo || !ID_Area || !Estado) {
      return json({ success: false, error: 'Campos incompletos' }, { status: 400 });
    }

    const conn = await getConnection();

    // @ts-ignore
    await conn.query(
      `UPDATE us_usuarios SET 
        Nombre = ?, 
        Apellido = ?, 
        Correo = ?, 
        Usuario =?,
        ID_Tipo = ?, 
        ID_Area = ?, 
        Estado = ?
      WHERE ID = ?`,
      [Nombre, Apellido, Correo, ID_Tipo, ID_Area, Estado, id]
    );

    return json({ success: true, mensaje: 'Usuario actualizado correctamente' });

  } catch (error) {
    console.error('❌ Error en PUT /api/usuarios/[id]:', error);
    // @ts-ignore
    return json({ success: false, error: 'Error en el servidor: ' + error.message }, { status: 500 });
  }
}
