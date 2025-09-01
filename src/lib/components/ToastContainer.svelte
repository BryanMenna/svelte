<script>
// @ts-nocheck

    import { toasts } from '$lib/utils/mostrarToast.js';

    const colores = {
        success: "bg-green-600 text-white",
        danger: "bg-red-600 text-white",
        warning: "bg-yellow-400 text-black",
        info: "bg-sky-600 text-white",
        primary: "bg-blue-500 text-white",
        secondary: "bg-gray-500 text-white",
        default: "bg-slate-700 text-white"
    };
</script>

<div class="fixed top-4 right-4 flex flex-col gap-3 z-[9999]">
    {#each $toasts as t (t.id)}
        <div class={`shadow-lg rounded-lg px-6 py-4 min-h-[70px] flex items-center text-lg font-medium ${colores[t.tipo] || colores.default}`}>
            {t.mensaje}
        </div>
    {/each}
</div>
