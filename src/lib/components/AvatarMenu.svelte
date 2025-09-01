<script>
  import { User, LogOut, Pencil } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let menuOpen = false;

  async function cerrarSesion() {
    // Realiza la petición de logout
    await fetch('/api/logout', { method: 'POST' });
    // Redirige al login o inicio
    goto('/'); // Cambia la ruta según tu aplicación, por ejemplo '/login'
  }

  function editarUsuario() {
    goto('/dashboard/perfil'); // Navega a la página de edición de usuario
    menuOpen = false;
  }

  // @ts-ignore
  function clickOutside(node) {
    // @ts-ignore
    const handleClick = (event) => {
      if (!node.contains(event.target)) {
        menuOpen = false;
      }
    };
    document.addEventListener('mousedown', handleClick, true);
    return {
      destroy() {
        document.removeEventListener('mousedown', handleClick, true);
      }
    };
  }
</script>

<div class="relative inline-block" use:clickOutside>
  <!-- Botón avatar -->
  <button
    class="flex items-center justify-center rounded-full w-10 h-10 bg-[#323a49] transition-shadow shadow-lg"
    aria-label="Abrir menú de usuario"
    on:click={() => (menuOpen = !menuOpen)}
  >
    <User class="w-6 h-6 text-white" />
  </button>
  {#if menuOpen}
    <div class="absolute right-0 mt-2 w-48 bg-[#212631] rounded shadow-lg z-50 py-2 border border-surface-500">
      <div class="px-4 py-2 text-sm text-gray-300 border-b border-surface-500">
        Perfil de usuario
      </div>
      <button
        class="w-full flex items-center text-left px-4 py-2 text-gray-300 hover:bg-white/10 transition"
        on:click={editarUsuario}
      >
        <Pencil class="w-5 h-5 mr-2 text-white" />
        <span>Editar usuario</span>
      </button>
      <button
        class="w-full flex items-center text-left px-4 py-2 text-gray-300 hover:bg-white/10 transition"
        on:click={cerrarSesion}
      >
        <LogOut class="w-5 h-5 mr-2 text-white" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  {/if}
</div>
