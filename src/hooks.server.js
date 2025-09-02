// hooks.server.js
import { pool } from '$lib/db.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const sessionId = event.cookies.get('session');

  if (sessionId) {
    // @ts-ignore
    const [rows] = await pool.execute('SELECT * FROM us_usuarios WHERE ID = ?', [sessionId]);

    if (rows.length > 0) {
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
