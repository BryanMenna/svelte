import { pool } from '$lib/db.js';
import { json } from '@sveltejs/kit';

// @ts-ignore
export async function GET({ cookies }) {
  const userId = cookies.get('session');
  const tipoUsuario = cookies.get('tipoUsuario');

  if (!userId) {
    return json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // @ts-ignore
    const [rows] = await pool.query("CALL usp_accesos(?,?)", [userId, tipoUsuario]);
    const modulos = rows[0];

    const mapa = {};
    const grupos = {};
    const rutaMap = {
      'Usuarios': 'usuarios',
      'Categorías': 'categorias',
      'Áreas': 'areas',
      'Reportes': 'reportes'
    };

    for (const mod of modulos) {
      if (mod.ID.length === 2) {
        // @ts-ignore
        grupos[mod.ID] = { title: mod.Modulo, items: [] };
        // @ts-ignore
        mapa[mod.ID] = { refGrupo: grupos[mod.ID] };
      } else {
        const padreId = mod.ID.slice(0, mod.ID.length - 2);
        // @ts-ignore
        let ruta = mod.Ruta || rutaMap[mod.Modulo] || mod.ID;

        // @ts-ignore
        if (mapa[padreId]) {
          const nodo = {
            label: mod.Modulo,
            icon: mod.Icono,
            ruta,
            children: [],
            permisos: mod.Permisos ?? [],
            Color: mod.Color,
            Color_Hover: mod.Color_Hover
          };

          // @ts-ignore
          if (mapa[padreId].refGrupo) {
            // @ts-ignore
            mapa[padreId].refGrupo.items.push(nodo);
          } else {
            // @ts-ignore
            mapa[padreId].children.push(nodo);
          }

          // @ts-ignore
          mapa[mod.ID] = nodo;
        }
      }
    }

    return json(Object.values(grupos));
  } catch (error) {
    console.error("Error ejecutando usp_accesos:", error);
    return json({ error: 'Error interno' }, { status: 500 });
  }
}
