<script>
// @ts-nocheck
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { Menu, X, ChevronDown } from 'lucide-svelte';
import AvatarMenu from '$lib/components/AvatarMenu.svelte';
import * as Icons from 'lucide-svelte';



let sidebarItems = [];
let sidebarVisible = true;
let abiertos = {};
let toastMsg = '';
let mostrarToast = false;
let breadcrumbCustom = []; // Array de strings




// Breadcrumb variables
$: currentPath = $page.url.pathname.replace(/^\/dashboard\/?/, "");
$: breadcrumbParts = currentPath ? currentPath.split("/") : [];

$: tituloActual = breadcrumbParts.length
  ? capitalizar(breadcrumbParts[0])
  : "Inicio";


// Navegar

function navegar(ruta) {
  if (ruta && ruta !== "NULL") {
    goto('/dashboard/' + ruta);
    if (window.innerWidth < 768) {
      sidebarVisible = false;
    }
  }
}



// Sidebar API fetch
onMount(async () => {
  const nombre = localStorage.getItem('usuarioNombre');
  if (nombre) {
    toastMsg = `¡Bienvenido, ${nombre}!`;
    mostrarToast = true;
    setTimeout(() => {
      const toastBox = document.querySelector(".toast-box");
      if (toastBox) toastBox.classList.add("slide-out");
      setTimeout(() => {
        mostrarToast = false;
      }, 400);
    }, 2700);
  }

  try {
    const res = await fetch('/api/sidebar');
    if (res.ok) {
      const data = await res.json();
      sidebarItems = data.map(grupo => ({
        ...grupo,
        items: grupo.items.map(item => ({
          ...item,
          color: item.color || item.Color,
          color_hover: item.color_hover || item.Color_Hover,
          _hover: false,
          children: item.children
            ? item.children.map(sub => ({
                ...sub,
                color: sub.color || sub.Color,
                color_hover: sub.color_hover || sub.Color_Hover,
                _hover: false
              }))
            : []
        }))
      }));
    } else {
      toastMsg = 'Error de respuesta al cargar sidebar';
      mostrarToast = true;
      sidebarItems = [];
    }
  } catch (err) {
    console.error('Error cargando sidebar:', err);
    toastMsg = 'Error cargando sidebar';
    mostrarToast = true;
    sidebarItems = [];
  }
});

function toggleGrupo(item) {
  abiertos[item.label] = !abiertos[item.label];
}
function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
}

function logout() {
  localStorage.removeItem('usuarioId');
  localStorage.removeItem('usuarioTipo');
  localStorage.removeItem('usuarioNombre');
  goto('/login');
}

function capitalizar(palabra) {
  if (!palabra) return "";
  return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
}

function irARuta(ruta) {
  navegar(ruta);
}



</script>

<!-- HEADER -->
<header class="fixed top-0 left-0 right-0 h-14 border-b border-surface-500 flex items-center px-4 z-50" style="background-color: #212631; border-bottom: 1px solid #323a49;">
  
  <button class="btn btn-ghost p-2" onclick={toggleSidebar}>
    {#if sidebarVisible}
      <X class="w-6 h-6 text-white" />
    {:else}
      <Menu class="w-6 h-6 text-white" />
    {/if}
  </button>
  <div class="ml-auto flex items-center">
    <AvatarMenu on:logout={logout} />
  </div>
</header>

<!-- NAV con breadcrumb dinámico -->
<nav
 class="fixed top-14 left-0 right-0 h-10 flex items-center px-6 border-b border-surface-500 text-sm text-gray-300 bg-[#212631] z-40 transition-all duration-300"

  class:ml-64={sidebarVisible}
  class:ml-0={!sidebarVisible}
  style="border-bottom: 1px solid #323a49;"
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span class="cursor-pointer hover:underline text-[#5e5cd0]" onclick={() => goto('/dashboard')}>Inicio</span>
  {#each breadcrumbParts as part, i}
    <span class="mx-2">/</span>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span
  class="cursor-pointer hover:underline"
  class:text-blue-400={i === breadcrumbParts.length - 1}
  style="color: #fff9;"
  onclick={() => navegar(breadcrumbParts.slice(0, i + 1).join("/"))}
>
  {capitalizar(part)}
</span>


  {/each}
</nav>


<!-- TOAST de bienvenida -->
{#if mostrarToast}
  <div class="toast-box fixed bottom-4 right-4 px-8 py-5 min-h-[70px] flex items-center bg-blue-600 text-white shadow-lg rounded-lg z-50 transition-all duration-400" style="font-size: 1rem; font-weight: 500;">
    <Icons.ThumbsUp class="mr-3 w-6 h-6" style="color: #fff;" />
    <span>{toastMsg}</span>
  </div>
{/if}

<div  class="flex pt-24 min-h-screen" style="background: transparent;">
  <!-- SIDEBAR -->
 <aside
  class="fixed top-14 left-0 w-64 border-r border-surface-500 p-4 transition-transform duration-300 z-40 text-[#fff] 
         overflow-y-auto max-h-[calc(100vh-3.5rem)] md:bottom-0"
  style="background-color: #212631; border-right: 1px solid #323a49 !important;"
  class:-translate-x-full={!sidebarVisible}
>

    {#each sidebarItems as grupo}
      {#if grupo.title}
        <div class="text-xs font-bold uppercase mt-4 mb-2 titulo-especial">{grupo.title}</div>
        {#each grupo.items as item}
          {#if item.children && item.children.length > 0}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="flex items-center gap-2 py-2 px-2 rounded cursor-pointer hover:bg-white/10 group"
              onclick={() => toggleGrupo(item)}
              onmouseenter={() => item._hover = true}
              onmouseleave={() => item._hover = false}
            >
              <svelte:component
                this={Icons[item.icon] || Icons.FileText}
                style={`color: ${item._hover ? item.color_hover : item.color || "#fff"}; transition: color 0.2s;`}
                class="w-4 h-4 opacity-70 group-hover:opacity-100"
              />
              <span class="text-inherit" style="color: #ffffffde;">{item.label}</span>
              {#if item.children && item.children.length > 0}
                <ChevronDown
                  class="ml-auto w-4 h-4 transition-transform text-[#61646c] group-hover:text-[#fcfcfc] {abiertos[item.label] ? 'rotate-180' : ''}"
                />
              {/if}
            </div>
            {#if abiertos[item.label]}
              <div>
                {#each item.children as sub}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div class="flex items-center py-2 px-2 w-full rounded cursor-pointer hover:bg-white/10 group"
                   onclick={() => sub.ruta && sub.ruta !== "NULL" ? navegar(sub.ruta) : null}
                    onmouseenter={() => sub._hover = true}
                    onmouseleave={() => sub._hover = false}
                  >
                    <div class="flex items-center gap-x-4 pl-8 w-full">
                      <svelte:component
                        this={Icons[sub.icon] || Icons.FileText}
                        style={`color: ${sub._hover ? sub.color_hover : sub.color || "#fff"}; transition: color 0.2s;`}
                        class="w-5 h-5 opacity-70 group-hover:opacity-100"
                      />
                      <span class="text-inherit" style="color: #ffffffde;">{sub.label}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="flex items-center gap-2 py-2 px-2 rounded cursor-pointer hover:bg-white/10 group"
              onclick={() => navegar(item.ruta)}
              onmouseenter={() => item._hover = true}
              onmouseleave={() => item._hover = false}
            >
              <svelte:component
                this={Icons[item.icon] || Icons.FileText}
                style={`color: ${item._hover ? item.color_hover : item.color || "#fff"}; transition: color 0.2s;`}
                class="w-4 h-4 opacity-70 group-hover:opacity-100"
              />
              <span class="text-inherit">{item.label}</span>
            </div>
          {/if}
        {/each}
      {/if}
    {/each}
  </aside>

  <!-- MAIN -->
<!-- MAIN -->
<main
  class="flex-1 p-8 transition-all duration-300"
  class:ml-64={sidebarVisible}
  class:ml-0={!sidebarVisible}
  style="background-color: #1d222b;"
>
  <slot />
</main>

</div>

<style>
.titulo-especial {
  color: #DD8888 !important;
}
@keyframes slideOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(100%); }
}
/* Scroll más estrecho y estilizado para el sidebar */
aside::-webkit-scrollbar {
  width: 6px;       /* ancho del scroll */
}

aside::-webkit-scrollbar-track {
  background: #1c2129; /* fondo del track */
  border-radius: 3px;
}

aside::-webkit-scrollbar-thumb {
  background-color: #1c2129; /* color del "thumb" */
  border-radius: 3px;
}

aside::-webkit-scrollbar-thumb:hover {
  background-color: #292e39;
}

/* Para Firefox */
aside {
  scrollbar-width: thin;
   scrollbar-color: #101318 #1c2129;
}

main {
  overflow-x: auto; /* Permite scroll horizontal si el contenido se desborda */
  -webkit-overflow-scrolling: touch; /* para suavizar scroll en iOS */
  max-width: 100vw; /* para que no se salga de la pantalla */
  box-sizing: border-box;
}


</style>
