import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/db';

export async function GET() {
    let conn;
    try {
        conn = await getConnection();
        // @ts-ignore
       const [areas] = await conn.query(
    'SELECT ID, Detalle AS Area FROM us_areas ORDER BY Detalle ASC'
);

        return json({
            success: true,
            areas
        });
    } catch (error) {
        console.error('❌ Error al obtener áreas:', error);
        return json({
            success: false,
            error: 'No se pudieron cargar las áreas desde la base de datos.'
        });
    } finally {
        if (conn) await conn.end();
    }
}
