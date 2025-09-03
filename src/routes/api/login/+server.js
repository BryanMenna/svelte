// src/routes/api/login/+server.js
import { pool } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import { serialize } from 'cookie';
// @ts-ignore
import bcrypt from 'bcrypt';

// Función para mostrar la fecha en formato local
// @ts-ignore
function fechaOK(fecha) {
  if (!fecha) return "";
  const fechaObj = new Date(fecha);
  return fechaObj.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

// Función para mostrar tiempo restante
// @ts-ignore
function TiempoRestante(inicio, fin) {
  const diferenciaMs = fin - inicio;
  const totalSegundos = Math.floor(diferenciaMs / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return `${horas}h ${minutos}m ${segundos}s`;
}

// Mapa de intentos por usuario en memoria
const intentosPorUsuario = new Map();
// @ts-ignore
const isDev = process.env.NODE_ENV !== 'production';

// LOGIN ENDPOINT
// @ts-ignore
export async function POST({ request }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ success: false, error: 'Faltan datos de usuario o contraseña' }, { status: 400 });
    }

    // @ts-ignore
    const [rows] = await pool.execute('SELECT * FROM us_usuarios WHERE Usuario = ?', [username]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const user = rows[0];
    const ahora = new Date();
    const hasta = user.Hasta ? new Date(user.Hasta) : null;

    // -------- LÓGICA DE ESTADOS -------- //

    if (user.Estado === 'Bloqueado') {
      if (hasta && hasta > ahora) {
        return json({
          success: false,
          error: `Usuario Bloqueado hasta el ${fechaOK(hasta)} (Tiempo Restante: ${TiempoRestante(ahora, hasta)})`,
          bloqueado_hasta: hasta
        });
      } else {
        // Reactiva si ya terminó el bloqueo o no hay fecha
        // @ts-ignore
        await pool.execute(
          'UPDATE us_usuarios SET Estado = "Activo", Hasta = NULL WHERE ID = ?',
          [user.ID]
        );
        user.Estado = 'Activo';
      }
    }

    if (user.Estado === 'Vacaciones') {
      if (hasta && hasta > ahora) {
        return json({
          success: false,
          error: `Usuario de vacaciones hasta el ${fechaOK(hasta)} (Tiempo Restante: ${TiempoRestante(ahora, hasta)})`,
          bloqueado_hasta: hasta
        });
      } else {
        // Reactiva si ya terminaron las vacaciones o no hay fecha
        // @ts-ignore
        await pool.execute(
          'UPDATE us_usuarios SET Estado = "Activo", Hasta = NULL WHERE ID = ?',
          [user.ID]
        );
        user.Estado = 'Activo';
      }
    }

    // Si llega aquí, Estado es Activo

    // ----- VERIFICAR CONTRASEÑA -----
    let passwordCorrecta = false;
    if (user.Clave.startsWith('$2b$')) {
      passwordCorrecta = await bcrypt.compare(password, user.Clave);
    } else if (password === user.Clave) {
      passwordCorrecta = true;
      const nuevoHash = await bcrypt.hash(password, 10);
      // @ts-ignore
      await pool.execute('UPDATE us_usuarios SET Clave = ? WHERE ID = ?', [nuevoHash, user.ID]);
    }

    if (passwordCorrecta) {
      intentosPorUsuario.delete(username);

      const sessionCookie = serialize('session', String(user.ID), {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: !isDev,
        maxAge: 60 * 60 * 24
      });
      const tipoCookie = serialize('tipoUsuario', String(user.Tipo), {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: !isDev,
        maxAge: 60 * 60 * 24
      });

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.ID,
          username: user.Usuario,
          nombre: user.Nombre,
          apellido: user.Apellido,
          area: user.Area,
          tipo: user.Tipo,
          foto: user.Foto
        }
      }), {
        status: 200,
        // @ts-ignore
        headers: {
          'Set-Cookie': [sessionCookie, tipoCookie],
          'Content-Type': 'application/json'
        }
      });
    }

    // ----- CONTRASEÑA INCORRECTA -----
    let intentos = intentosPorUsuario.get(username) || 0;
    intentos += 1;

    if (intentos >= 3) {
      // Bloquear el usuario por 24h
      const bloqueo = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
      // @ts-ignore
      await pool.execute('UPDATE us_usuarios SET Estado = "Bloqueado", Hasta = ? WHERE ID = ?', [bloqueo, user.ID]);
      intentosPorUsuario.delete(username);

      return json({
        success: false,
        error: `Usuario bloqueado por 24 horas por múltiples intentos fallidos. Desbloqueo: ${fechaOK(bloqueo)} (Tiempo Restante: ${TiempoRestante(ahora, bloqueo)})`,
        bloqueado_hasta: bloqueo
      });
    } else {
      intentosPorUsuario.set(username, intentos);
      return json({
        success: false,
        error: `Contraseña incorrecta. Intentos: ${intentos}/3`
      });
    }

  } catch (error) {
    console.error('Error en /api/login:', error);
    // @ts-ignore
    return json({ success: false, error: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
