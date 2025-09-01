// src/routes/api/usuarios/+server.js
import { getConnection } from '$lib/db.js';
import { json } from '@sveltejs/kit';

// GET: Obtener usuarios
export async function GET() {
    try {
        const conn = await getConnection();
        // @ts-ignore
        const [rows] = await conn.query(`
          SELECT u.ID, u.Nombre, u.Apellido, u.Domicilio, u.Telefono, u.Correo AS email,
                 u.Tipo AS tipo, u.Area AS IDarea, a.Detalle AS areaDet, 
                 u.Usuario, u.Clave, u.Estado, u.Hasta
          FROM us_usuarios u
          LEFT JOIN us_areas a ON u.Area = a.ID
        `);
        return json({ success: true, usuarios: rows });
    } catch (err) {
        console.error("Error en GET /api/usuarios:", err);
        // @ts-ignore
        return json({ success: false, error: err.message }, { status: 500 });
    }
}

// POST: Crear usuario
// @ts-ignore
export async function POST({ request }) {
    const data = await request.json();
    const {
        Apellido,
        Nombre,
        Domicilio = '',
        Telefono = '',
        Correo,
        Usuario,
        Clave,
        Tipo,
        Area,
        Estado,
        Hasta = null
    } = data;

    if (!Apellido || !Nombre || !Correo || !Clave || !Tipo || !Area || !Estado) {
        return json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    try {
        const conn = await getConnection();
        const usuarioFinal = Usuario && Usuario.trim() !== ''
            ? Usuario
            : `${Nombre}${Apellido}`.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').substring(0,15);

        // @ts-ignore
        const [existe] = await conn.query(
            `SELECT 1 FROM us_usuarios WHERE LOWER(Usuario) = LOWER(?) OR LOWER(Correo) = LOWER(?) LIMIT 1`,
            [usuarioFinal, Correo]
        );
        if (existe.length > 0) {
            return json({ success: false, error: 'Ese usuario o correo ya está registrado.' }, { status: 400 });
        }

        // Normalizar campo Hasta
        const hastaFinal = (Hasta && Hasta.trim() !== '') ? Hasta : null;

        // @ts-ignore
        await conn.execute(
            `INSERT INTO us_usuarios 
                (Apellido, Nombre, Domicilio, Telefono, Correo, Usuario, Clave, Tipo, Area, Estado, Hasta)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [Apellido, Nombre, Domicilio, Telefono, Correo, usuarioFinal, Clave, Tipo, Area, Estado, hastaFinal]
        );

        return json({ success: true, mensaje: 'Usuario creado correctamente.' });
    } catch (err) {
        console.error("Error en POST /api/usuarios:", err);
        // @ts-ignore
        return json({ success: false, error: err.message }, { status: 500 });
    }
}

// PUT: Editar usuario
// @ts-ignore
export async function PUT({ request }) {
    const data = await request.json();
    const {
        ID,
        Apellido,
        Nombre,
        Domicilio = '',
        Telefono = '',
        Correo,
        Usuario,
        Clave,
        Tipo,
        Area,
        Estado,
        Hasta = null
    } = data;

    if (!ID || !Apellido || !Nombre || !Correo || !Usuario || !Clave || !Tipo || !Area || !Estado) {
        return json({ success: false, error: 'Faltan datos para actualizar.' }, { status: 400 });
    }

    try {
        const conn = await getConnection();

        // Normalizar campo Hasta
        const hastaFinal = (Hasta && Hasta.trim() !== '') ? Hasta : null;

        // @ts-ignore
        await conn.execute(
            `UPDATE us_usuarios SET
                Apellido = ?, Nombre = ?, Domicilio = ?, Telefono = ?,
                Correo = ?, Usuario = ?, Clave = ?, Tipo = ?, Area = ?, Estado = ?, Hasta = ?
             WHERE ID = ?`,
            [Apellido, Nombre, Domicilio, Telefono, Correo, Usuario, Clave, Tipo, Area, Estado, hastaFinal, ID]
        );
        return json({ success: true, mensaje: 'Usuario actualizado correctamente.' });
    } catch (err) {
        console.error("Error en PUT /api/usuarios:", err);
        // @ts-ignore
        return json({ success: false, error: err.message }, { status: 500 });
    }
}

// DELETE: Eliminar usuario
// @ts-ignore
export async function DELETE({ request }) {
    const { id } = await request.json();
    if (!id) {
        return json({ success: false, error: 'ID requerido para eliminar.' }, { status: 400 });
    }
    try {
        const conn = await getConnection();
        // @ts-ignore
        await conn.execute('DELETE FROM us_usuarios WHERE ID = ?', [id]);
        return json({ success: true, mensaje: 'Usuario eliminado correctamente.' });
    } catch (err) {
        console.error("Error en DELETE /api/usuarios:", err);
        // @ts-ignore
        return json({ success: false, error: err.message }, { status: 500 });
    }
}
