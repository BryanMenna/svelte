import { redirect } from '@sveltejs/kit';

// @ts-ignore
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  return {
    user: locals.user
  };
}