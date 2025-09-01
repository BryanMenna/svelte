import { getConnection } from '$lib/db.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const sessionId = event.cookies.get('session');

  if (sessionId) {
    const conn = await getConnection();

    // Buscamos por ID, porque `session` guarda el ID del usuario
    // @ts-ignore
    const [rows] = await conn.execute('SELECT * FROM us_usuarios WHERE ID = ?', [sessionId]);

    // @ts-ignore
    if (rows.length > 0) {
      // @ts-ignore
      const user = rows[0];
      // @ts-ignore
      event.locals.user = {
        id: user.ID,
        username: user.Usuario,
        nombre: user.Nombre,
        apellido: user.Apellido
      };
    } else {
      // @ts-ignore
      event.locals.user = null;
    }
  } else {
    // @ts-ignore
    event.locals.user = null;
  }

  return resolve(event);
}
