import { getConnection } from '$lib/db.js';
import { json } from '@sveltejs/kit';

// @ts-ignore
export async function GET({ cookies }) {
  const userId = cookies.get('session');
  const tipoUsuario = cookies.get('tipoUsuario'); // 1 = operador, 2 = supervisor, 3 = supervisor general

  if (!userId) {
    return json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const connection = await getConnection();

    // @ts-ignore
    const [rows] = await connection.query(
      "CALL usp_accesos(?, ?)",
      [userId, tipoUsuario]
    );
    const modulos = rows[0];

    // Multi-nivel
    const mapa = {};
    const salida = [];

    // Padres (nivel 1, ID longitud 2, no navegables)
    for (const mod of modulos) {
      if (mod.ID.length === 2) {
        // @ts-ignore
        mapa[mod.ID] = { id: mod.ID, title: mod.Detalle, items: [] };
        // @ts-ignore
        salida.push(mapa[mod.ID]);
      }
    }

    // Hijos (nivel 2, ID longitud 4)
    for (const mod of modulos) {
      if (mod.ID.length === 4) {
        const nodo = {
          label: mod.Detalle,
          ruta: mod.Accion,
          icon: mod.Icono,
          color: mod.Color,
          color_hover: mod.Color_Hover,
          children: []
        };
        // @ts-ignore
        if (mapa[mod.ID.slice(0, 2)]) {
          // @ts-ignore
          mapa[mod.ID.slice(0, 2)].items.push(nodo);
          // @ts-ignore
          mapa[mod.ID] = nodo;
        }
      }
    }

    // Nietos (>4)
    for (const mod of modulos) {
      if (mod.ID.length > 4) {
        const nodo = {
          label: mod.Detalle,
          ruta: mod.Accion,
          icon: mod.Icono,
          color: mod.Color,
          color_hover: mod.Color_Hover,
          children: []
        };
        // @ts-ignore
        if (mapa[mod.ID.slice(0, 4)]) {
          // @ts-ignore
          mapa[mod.ID.slice(0, 4)].children.push(nodo);
        }
      }
    }

    return json(salida);

  } catch (error) {
    console.error("Error ejecutando usp_accesos:", error);
    return json({ error: 'Error interno' }, { status: 500 });
  }
}
