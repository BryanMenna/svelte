import { writable } from 'svelte/store';

// Store reactiva de toasts
export const toasts = writable([]);

// Función para mostrar un toast
// @ts-ignore
export function mostrarToast({ mensaje, tipo = "default", tiempo = 3000 }) {
    const id = Date.now() + Math.random();
    // @ts-ignore
    toasts.update(arr => [...arr, { id, mensaje, tipo }]);
    setTimeout(() => {
        // @ts-ignore
        toasts.update(arr => arr.filter(t => t.id !== id));
    }, tiempo);
}
