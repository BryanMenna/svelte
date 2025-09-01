import { serialize } from 'cookie';

export async function POST() {
  const sessionCookie = serialize('session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: 0
  });
  const tipoCookie = serialize('tipoUsuario', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: 0
  });
  return new Response('Logout OK', {
    status: 200,
    // @ts-ignore
    headers: {
      'Set-Cookie': [sessionCookie, tipoCookie]
    }
  });
}
