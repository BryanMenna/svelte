<script>
// @ts-nocheck
import EgresosForm from "../../../lib/components/EgresosForm.svelte";
import { Pencil, Trash2, Eye, DollarSign } from "lucide-svelte";
import { masked_cod, formatCurrency } from "$lib/utils/format.js";
import { mostrarToast } from "$lib/utils/mostrarToast.js";

export let mostrarEgresos = false;
export let egresos = [];
export let cerrarEgresos = () => {};
export let egresosTitulo = "";   // título principal

// Formulario egreso activo
let modalEgreso = null;
let modoModalEgreso = null;

// Paginación
let currentPage = 1;
let itemsPerPage = 7;
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

// Guardar (mock, podés reemplazar con tu lógica)
function guardarEgreso(event) {
  mostrarToast({ mensaje: "✅ Egreso guardado con éxito", tipo: "success" });
  modalEgreso = null;
  modoModalEgreso = null;
}
</script>

{#if mostrarEgresos}
<!-- Título -->
  <div class="titulo-ingresos">
    <h2 class="titulo-principal">EGRESOS</h2>
    <p class="subtitulo">{egresosTitulo}</p>
  </div>


<div class="egresos-section relative">
  
  <!-- BOTÓN REGRESAR DENTRO DEL CUADRO -->
  <div class="flex justify-start mb-4">
    <button 
      class="px-4 py-2 bg-[#323a49] text-white rounded hover:bg-[#212631]"
      on:click={cerrarEgresos}
    >
      ⬅ Regresar a Ingresos
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
            <th class="px-2 py-1 text-center">IT</th>
            <th class="px-2 py-1 text-left">Presu</th>
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
                <td class="px-2 py-1">{masked_cod(eg.Codigo)}</td>
                <td class="px-2 py-1">{eg.Detalle}</td>
                <td class="px-2 py-1 text-center">{eg.IT}</td>
                <td class="px-2 py-1">{formatCurrency(eg.Presu)}</td>
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
</style>
