import { getConnection } from '$lib/db.js';
import { json } from '@sveltejs/kit';

// 🔹 Endpoint que devuelve los módulos dinámicamente según Store Procedure
// @ts-ignore
export async function GET({ cookies }) {
  const userId = cookies.get('session');        // ID del usuario logueado
  const tipoUsuario = cookies.get('tipoUsuario'); // 1=operador, 2=supervisor, 3=supervisor general

  if (!userId) {
    return json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const connection = await getConnection();

    // Ejecuta el procedure usp_accesos
    // @ts-ignore
    const [rows] = await connection.query("CALL usp_accesos(?,?)", [userId, tipoUsuario]);
    const modulos = rows[0];
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
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
        // Es un grupo principal
        // @ts-ignore
        grupos[mod.ID] = { title: mod.Modulo, items: [] };
        // @ts-ignore
        mapa[mod.ID] = { refGrupo: grupos[mod.ID] };
      } else {
        // Es submódulo / hijo
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

    // 🚫 IMPORTANTE: no hardcodeamos “Usuarios” nunca más
    return json(Object.values(grupos));
  } catch (error) {
    console.error("Error ejecutando usp_accesos:", error);
    return json({ error: 'Error interno' }, { status: 500 });
  }
}
