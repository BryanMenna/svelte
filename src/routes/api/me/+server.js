// src/routes/api/me/+server.js
// @ts-ignore
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

// @ts-ignore
export async function GET({ cookies }) {
    const token = cookies.get('jwt');

    if (!token) {
    return json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return json({ success: true, user: decoded });
    } catch (error) {
    return json({ success: false, message: 'Token inválido o expirado' }, { status: 401 });
    }
}
