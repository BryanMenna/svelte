<script>
// @ts-nocheck
import FormularioIngreso from './FormularioIngreso.svelte';
export let ingresos = [];
// svelte-ignore export_let_unused
export let ingresosNumero = "";
export let cerrarIngresos = () => {};
export let onEditar = () => {};
export let onEliminar = () => {};
export let onPresu = () => {};
export let ingresosTitulo = "";

import { Pencil, Trash2, Eye, DollarSign } from 'lucide-svelte';
import { masked_cod, formatCurrency } from '$lib/utils/format.js';
  import { EyeSlash } from 'svelte-hero-icons';

// Variables para modal
let showModal = false;
let modalIngreso = { Codigo: '', Detalle: '', Presu: '', IT: '' };
let modoModal = 'consulta';

// Paginación
let itemsPerPageIng = 7;
let currentPageIng = 1;
$: totalPagesIng = Math.max(Math.ceil(ingresos.length / itemsPerPageIng), 1);
$: ingresosPaginados = ingresos.slice(
  (currentPageIng - 1) * itemsPerPageIng,
  currentPageIng * itemsPerPageIng
);

function nextPageIng() {
  if (currentPageIng < totalPagesIng) currentPageIng++;
}
function prevPageIng() {
  if (currentPageIng > 1) currentPageIng--;
}

// Modal handler
function abrirModalIngreso(ing) {
  modalIngreso = { ...ing };
  modoModal = 'modificar';
  showModal = true;
}
function cerrarModal() {
  showModal = false;
  modalIngreso = { Codigo: '', Detalle: '', Presu: '', IT: '' };
}
function guardarIngresoModal() {
  showModal = false;
}

// Reset paginación cuando cambian los ingresos
$: ingresos, currentPageIng = 1;
</script>

<div class="ingresos-section">
  <h2 class="titulo-modal">{ingresosTitulo}</h2>
  <button 
    class="mb-4 px-4 py-2 bg-[#323a49] text-white rounded hover:bg-[#212631] transition" 
    on:click={cerrarIngresos}
  >
    ⬅ Regresar a presupuestos
  </button>

  <table class="min-w-full border border-gray-300 text-white bg-[#232a34]">
    <thead class="bg-[#323a49]">
      <tr>
        <th class="px-2 py-1 border">Código</th>
        <th class="px-2 py-1 border">Detalle</th>
        <th class="px-2 py-1 border">IT</th>
        <th class="px-2 py-1 border">Presu</th>
        <th class="px-2 py-1 border">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {#if ingresosPaginados.length === 0}
        <tr>
          <td colspan="5" class="text-center py-4 text-gray-400 italic">
            No hay ingresos cargados
          </td>
        </tr>
      {:else}
        {#each ingresosPaginados as ing}
          <tr>
            <td class="border px-2 py-1">{masked_cod(ing.Codigo)}</td>
            <td class="border px-2 py-1">
              {#if ing.IT?.toLowerCase() === "título" || ing.IT?.toLowerCase() === "titulo"}
                <span class="font-bold italic">{ing.Detalle}</span>
              {:else}
                {ing.Detalle}
              {/if}
            </td>
            <td class="border px-2 py-1">{ing.IT}</td>
            <td class="border px-2 py-1">{formatCurrency(ing.Presu)}</td>
            <td class="border-t px-2 py-1 flex gap-2 justify-center items-center whitespace-nowrap">
  <button class="text-blue-500 hover:scale-110" title="Editar" on:click={() => onEditar(ing)}>
    <Pencil class="w-4 h-4" />
  </button>
  <button class="text-red-500 hover:scale-110" title="Eliminar" on:click={() => onEliminar(ing)}>
    <Trash2 class="w-4 h-4" />
  </button>
  <button class="text-green-500 hover:scale-110" title="Ver" on:click={() => onPresu(ing)}>
    <Eye class="w-4 h-4" />
  </button>
  <button class="text-yellow-400 hover:scale-110" title="Dinero" on:click={() => abrirModalIngreso(ing)}>
    <DollarSign class="w-4 h-4" />
  </button>
</td>

          </tr>
        {/each}
      {/if}
    </tbody>
  </table>

  <div class="flex justify-between items-center mt-4 text-white">
    <button
      class="px-3 py-1 bg-[#323a49] rounded disabled:opacity-50"
      on:click={prevPageIng}
      disabled={currentPageIng === 1}
    >⬅ Anterior</button>
    <span>Página {currentPageIng} de {totalPagesIng}</span>
    <button
      class="px-3 py-1 bg-[#323a49] rounded disabled:opacity-50"
      on:click={nextPageIng}
      disabled={currentPageIng === totalPagesIng}
    >Siguiente ➡</button>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-[#2228] flex justify-center items-center z-50" style="backdrop-filter: blur(2px);">
    <div class="bg-[#232a34] rounded-lg p-6 shadow-lg w-full max-w-md mx-auto relative">
      <FormularioIngreso
        bind:ingreso={modalIngreso}
        modo={modoModal}
        onGuardar={guardarIngresoModal}
        onCancelar={cerrarModal}
      />
    </div>
  </div>
{/if}

<style>
.ingresos-section {
  background: #232a34;
  border-radius: 16px;
  box-shadow: 0 2px 16px #0004;
  padding: 26px 22px;
  margin-top: 28px;
}
.titulo-modal { font-size: 1.23rem; font-weight: 700; color: #21A9FD; }
tbody tr:nth-child(odd) { background-color: #2a2f3a; }
tbody tr:nth-child(even) { background-color: #212631; }
tbody td { padding: 8px 12px; }
th:last-child {
  border-bottom: none !important;
}


</style>
