<script>
// @ts-nocheck
import EgresosForm from "../../../lib/components/EgresosForm.svelte";
import { Pencil, Trash2, Eye, DollarSign, Plus, FileText, Search } from "lucide-svelte";
import { masked_cod, formatCurrency } from "$lib/utils/format.js";
import { mostrarToast } from "$lib/utils/mostrarToast.js";

export let mostrarEgresos = false;
export let egresos = [];
export let cerrarEgresos = () => {};
export let egresosTitulo = "";   // título principal
export let cerrarIngresos;

// 🔹 Variables de filtro / buscador
let filtroEgreso = "";
let filtroAnioEgreso = "todos";
let aniosEgreso = [2023, 2024, 2025]; // podés generarlo dinámico

function onFiltroEgreso(e) {
  filtroEgreso = e.target.value;
  console.log("Filtro egreso:", filtroEgreso);
}
function cambiarAnioEgreso(e) {
  filtroAnioEgreso = e.target.value;
  console.log("Año egreso:", filtroAnioEgreso);
}
function agregarEgreso() {
  mostrarToast({ mensaje: "Nuevo egreso pendiente", tipo: "info" });
}

// Formulario egreso activo
let modalEgreso = null;
let modoModalEgreso = null;

// Paginación
let currentPage = 1;
let itemsPerPage = 5;
$: totalPages = Math.max(Math.ceil(egresos.length / itemsPerPage), 1);
$: egresosPaginados = egresos.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

function nextPage() {
  if (currentPage < totalPages) currentPage++;
}
function prevPage() {
  if (currentPage > 1) currentPage--;
}

// Abrir formulario
function abrirFormularioEgreso(eg, modo = "consulta") {
  modalEgreso = { ...eg };
  modoModalEgreso = modo;
}

// Cerrar formulario
function cerrarFormularioEgreso() {
  modalEgreso = null;
  modoModalEgreso = null;
}

// Guardar (mock)
function guardarEgreso(event) {
  mostrarToast({ mensaje: "✅ Egreso guardado con éxito", tipo: "success" });
  modalEgreso = null;
  modoModalEgreso = null;
}

import { coloresModulo } from '$lib/utils/coloresModulo.js';
function abrirEgresos() {
  mostrarEgresos = true;
  moduloActual = "egresos";
  tituloActual = "Egresos";
}


</script>

{#if mostrarEgresos}
  <!-- Título -->
  <div class="titulo-ingresos"  style="background: linear-gradient(to right, {coloresModulo.ingresos.start}, {coloresModulo.ingresos.end});">
    <h2 class="titulo-principal">EGRESOS</h2>
    <p class="subtitulo">{egresosTitulo}</p>
  </div>

  <!-- 🔹 BUSCADOR Y FILTRO FUERA DEL CUADRO -->
  <div class="w-full flex items-center my-4 justify-between">
    <div class="flex items-center gap-3">
      <!-- Buscar -->
      <div class="relative w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
        <input
          type="text"
          class="w-full pl-10 bg-[#2a2f3a] text-white border-none rounded focus:outline-none"
          placeholder="Buscar fecha..."
          bind:value={filtroEgreso}
          on:input={onFiltroEgreso}
        />
      </div>

      <!-- Nuevo -->
      <button 
        class="flex items-center justify-center p-2 rounded-full text-white hover:scale-110 transition"
        style="background-color: #21A9FD; width: 32px; height: 32px;"
        title="Nuevo egreso"
        on:click={agregarEgreso}
      >
        <Plus class="w-6 h-6" />
      </button>

      <!-- PDF -->
      <button 
        class="p-2 rounded-full text-white hover:scale-110 transition"
        style="background-color: #323a49; width: 35px; height: 35px;"
        title="Descargar PDF"
        on:click={() => mostrarToast({mensaje:"PDF pendiente", tipo:"info"})}
      >
        <FileText class="w-5 h-5" />
      </button>
    </div>

    <!-- Año -->
    <div class="flex items-center">
      <label for="anioEgreso" class="text-white mr-2">Año:</label>
      <div class="select-container">
        <select id="anioEgreso" bind:value={filtroAnioEgreso} on:change={cambiarAnioEgreso}>
          <option value="todos">Todos</option>
          {#each aniosEgreso as anio}
            <option value={anio}>{anio}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- 🔹 CUADRO DE EGRESOS -->
  <div class="egresos-section relative">
    <!-- BOTONES DENTRO DEL CUADRO -->
    <div class="flex justify-between mb-4">
      <button 
        class="px-4 py-2 "
        style="background: linear-gradient(90deg, {coloresModulo.presupuesto.start}, {coloresModulo.presupuesto.end});"
        on:click={() => { cerrarEgresos(); cerrarIngresos(); }}
      >
        ⬅ Regresar a Presupuesto
      </button>

      <button 
        class="px-4 py-2 " 
        style="background: linear-gradient(90deg, {coloresModulo.ingresos.start}, {coloresModulo.ingresos.end});"
        on:click={() => { cerrarEgresos(); }}
      >
        Ir a Ingresos ➡
      </button>
    </div>

  <!-- TABLA SOLO SI NO HAY FORMULARIO -->
  {#if !modalEgreso && !modoModalEgreso}
    <div class="overflow-x-auto rounded-lg shadow-lg">
      <table class="min-w-full text-white bg-[#232a34] border-collapse">
        <thead class="bg-[#323a49]">
          <tr>
            <th class="px-2 py-1 text-left">Código</th>
            <th class="px-2 py-1 text-left">Detalle</th>
            <th class="px-2 py-1 text-center">Tipo</th>
            <th class="px-2 py-1 text-left">Presupuesto</th>
            <th class="px-2 py-1 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#if egresosPaginados.length === 0}
            <tr>
              <td colspan="5" class="text-center py-4 text-gray-400 italic">
                No hay egresos cargados
              </td>
            </tr>
          {:else}
            {#each egresosPaginados as eg}
              <tr>
                <td class="px-2 py-1">
                  <span class="{eg.IT.toUpperCase() === 'TÍTULO' ? 'font-bold italic' : ''}">
                     {masked_cod(eg.Codigo)}
                  </span>
                 </td>
                <td class="px-2 py-1">
                  <span class="{eg.IT.toUpperCase() === 'TÍTULO' ? 'font-bold italic' : ''}">
                    {eg.Detalle}
                  </span>
                </td>
                <td class="px-2 py-1 text-center">
                  <span 
                    class="px-2 py-1 rounded text-xs font-semibold"
                    style="background-color: {eg.IT.toUpperCase() === 'TÍTULO' ? '#34D399' : '#FFC107'}; color: #fff;"
                    >
                    {eg.IT.toUpperCase()}
                  </span>
                </td>
                <td class="px-2 py-1">
                   <span class="{eg.IT.toUpperCase() === 'TÍTULO' ? 'font-bold italic' : ''}">
                     {formatCurrency(eg.Presu)}
                  </span>
                  </td>
                <td class="px-2 py-1 flex gap-2 justify-center items-center whitespace-nowrap">
                  <!-- Eliminar -->
    <button
      class="text-red-500 hover:scale-110"
      title="Eliminar"
      on:click={() => {
        abrirFormularioEgreso(eg, "baja");
        mostrarToast({ mensaje: `Eliminar egreso ${eg.Codigo}`, tipo: "danger" });
      }}
    >
      <Trash2 class="w-5 h-5" />
    </button>

    <!-- Editar -->
    <button
      class="text-blue-500 hover:scale-110"
      title="Editar"
      on:click={() => {
        abrirFormularioEgreso(eg, "modificar");
        mostrarToast({ mensaje: `Editar egreso ${eg.Codigo}`, tipo: "info" });
      }}
    >
      <Pencil class="w-5 h-5" />
    </button>

    <!-- Ver -->
    <button
      class="text-green-500 hover:scale-110"
      title="Ver"
      on:click={() => {
        abrirFormularioEgreso(eg, "consulta");
        mostrarToast({ mensaje: `Ver egreso ${eg.Codigo}`, tipo: "success" });
      }}
    >
      <Eye class="w-5 h-5" />
    </button>

    <!-- Presupuesto -->
    <button
      class="text-yellow-400 hover:scale-110"
      title="Dinero"
      on:click={() => {
        abrirFormularioEgreso(eg, "presu");
        mostrarToast({ mensaje: `Presupuesto del egreso ${eg.Codigo}`, tipo: "warning" });
      }}
    >
      <DollarSign class="w-5 h-5" />
    </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex justify-between items-center mt-4 text-white">
      <button 
        class="px-4 py-2 bg-[#323a49] rounded hover:bg-[#212631] disabled:opacity-40"
        on:click={prevPage}
        disabled={currentPage === 1}
      >
        ⬅ Anterior
      </button>
      <span>Página {currentPage} de {totalPages}</span>
      <button 
        class="px-4 py-2 bg-[#323a49] rounded hover:bg-[#212631] disabled:opacity-40"
        on:click={nextPage}
        disabled={currentPage === totalPages}
      >
        Siguiente ➡
      </button>
    </div>
  {/if}

  <!-- FORMULARIO ENCIMA DE LA TABLA -->
  {#if modalEgreso && modoModalEgreso}
    <div class="mt-6">
      <EgresosForm
        egreso={modalEgreso}
        modo={modoModalEgreso}
        on:guardar={guardarEgreso}             
        on:cancelar={cerrarFormularioEgreso}   
      />
    </div>
  {/if}
</div>
{/if}

<style>
.egresos-section {
  background: #232a34;
  border-radius: 16px;
  box-shadow: 0 2px 16px #0004;
  padding: 26px 22px;
  margin-top: 28px;
}

tbody tr:nth-child(odd) { background-color: #2a2f3a; }
tbody tr:nth-child(even) { background-color: #212631; }
tbody td { padding: 12px 12px; }

.titulo-ingresos {
  background: #2a2f3a; 
  text-align: center;
  color: #fff;
  padding: 8px 0;
  margin: 23px auto;
  border-radius: 6px;
  max-width: 400px;
}
.titulo-ingresos .titulo-principal {
  font-weight: 700;
  font-size: 1.6rem;
  margin: 0;
  text-transform: uppercase;
}
.titulo-ingresos .subtitulo {
  font-style: italic;
  font-size: 1rem;
  margin-top: 4px;
  margin-bottom: 0;
}
th, td { padding: 8px 12px; }
th:last-child { border-bottom: none !important; }

select {
    background-color: #323a49;
    color: white;
    border-radius: 5px;
}
</style>
