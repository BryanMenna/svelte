import { writable } from 'svelte/store';

// Store reactiva de toasts
export const toasts = writable([]);

// Función para mostrar un toast
// ✅ Ahora acepta:
//    1) mostrarToast("Mensaje", "success")
//    2) mostrarToast({ mensaje: "Mensaje", tipo: "success", tiempo: 5000 })
// @ts-ignore
export function mostrarToast(arg1, arg2, arg3) {
    let mensaje, tipo, tiempo;

    if (typeof arg1 === "string") {
        // Caso string + tipo + tiempo opcional
        mensaje = arg1;
        tipo = arg2 || "default";
        tiempo = arg3 || 5000;
    } else if (typeof arg1 === "object" && arg1 !== null) {
        // Caso objeto
        mensaje = arg1.mensaje || "Mensaje vacío";
        tipo = arg1.tipo || "default";
        tiempo = arg1.tiempo || 5000;
    } else {
        console.warn("Formato de toast no válido:", arg1, arg2, arg3);
        return;
    }

    const id = Date.now() + Math.random();
    // @ts-ignore
    toasts.update(arr => [...arr, { id, mensaje, tipo }]);

    setTimeout(() => {
        // @ts-ignore
        toasts.update(arr => arr.filter(t => t.id !== id));
    }, tiempo);
}
