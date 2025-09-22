<script>
// @ts-nocheck
import FormularioIngreso from '../../../lib/components/FormularioIngreso.svelte';
import EgresosModal from '../egresos/+page.svelte'; 
import { Pencil, Trash2, Eye, DollarSign, Plus, FileText, Search } from 'lucide-svelte';
import { formatCurrency } from '$lib/utils/format.js';
import { mostrarToast } from '$lib/utils/mostrarToast.js';

export let ingresos = [];
export let ingresosNumero = "";
export let ingresosIdPresu = "";   // ID del presupuesto
export let ingresosTitulo = "";
export let cerrarIngresos = () => {};
// svelte-ignore export_let_unused
export let onEditar = () => {};
// svelte-ignore export_let_unused
export let onEliminar = () => {};
export let onPresu = () => {};     // callback del padre para abrir egresos

// 🔹 Variables para buscador y filtro
let filtro = "";
let filtroAnio = "todos";
let anios = [2023, 2024, 2025]; // Podés generar esto dinámicamente si querés

function onFiltroInput(e) {
  filtro = e.target.value;
  console.log("Filtro aplicado:", filtro);
}

function cambiarAnio(e) {
  filtroAnio = e.target.value;
  console.log("Año seleccionado:", filtroAnio);
}

function agregarPresupuesto() {
  mostrarToast({ mensaje: "Nuevo presupuesto pendiente", tipo: "info" });
}

// Variables para modal ingreso
let showModal = false;
let modalIngreso = null;
let modoModal = null;

// Variables para Egresos
let mostrarEgresos = false;
let egresos = [];
let egresosTitulo = "";


// Abrir egresos usando el ID del presupuesto
async function abrirEgresos() {
  try {
    console.log("IDPresu recibido:", ingresosIdPresu);
    if (!ingresosIdPresu) throw new Error("IDPresu no definido");

    // ✅ Ahora va con query string
    const res = await fetch(`/api/egresos?idPresu=${ingresosIdPresu}`);
    if (!res.ok) throw new Error("Error al cargar egresos");
    egresos = await res.json();

    console.log("Egresos cargados:", egresos);

    egresosTitulo = `Ordenanza Nº ${ingresosNumero}`;
    mostrarEgresos = true;
  } catch (err) {
    mostrarToast({ mensaje: "Error cargando egresos", tipo: "danger" });
    egresos = [];
  }
}


function cerrarEgresos() {
  mostrarEgresos = false;
  egresos = [];
}

// Título dinámico
let tituloIngreso = ingresosTitulo;
let subtituloIngreso = "";

// Paginación
let itemsPerPageIng = 3;
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

// Modal handler ingreso
function abrirModalIngreso(ing, modo = 'consulta') {
  modalIngreso = { ...ing };
  modoModal = modo;
  showModal = true;
}

function cerrarModal() {
  showModal = false;
  modalIngreso = { Codigo: '', Detalle: '', Presu: '', IT: '' };
}

async function guardarIngresoModal(ingActualizado) {
  try {
    let res;
    const payload = { ...ingActualizado, IDPresu: ingresosIdPresu };

    if (modoModal === 'alta') {
      res = await fetch('/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else if (modoModal === 'modificar' || modoModal === 'presu') {
      res = await fetch('/api/ingresos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else if (modoModal === 'baja') {
      res = await fetch('/api/ingresos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) throw new Error(await res.text());

    // Refrescar
    const lista = await fetch(`/api/ingresos?idPresu=${ingresosIdPresu}`);
    ingresos = await lista.json();

    mostrarToast({ mensaje: "✅ Cambios guardados en BD", tipo: "success" });
  } catch (err) {
    mostrarToast({ mensaje: "❌ Error actualizando en BD", tipo: "danger" });
    console.error(err);
  } finally {
    modalIngreso = null;
    modoModal = null;
  }
}






function abrirFormularioIngreso(ing, modo = 'consulta') {
  modalIngreso = { ...ing };
  modoModal = modo;
}

// Acción al presionar el ojo
function verIngreso(ing) {
  tituloIngreso = "INGRESOS";
  subtituloIngreso = `Ordenanza Nº ${ing.Codigo}/${new Date().getFullYear().toString().slice(-2)}`;
  onPresu(ing); // callback al padre (si lo querés usar)
}

// Reset paginación cuando cambian los ingresos
$: ingresos, currentPageIng = 1;

import { coloresModulo } from '$lib/utils/coloresModulo.js';

// svelte-ignore export_let_unused
export let picIG = "9.9.99.99.99";

export function masked_cod(cod) {
  if (!cod) return "⚠️ Sin código";

  cod = String(cod).replace(/\*/g, ""); // 🔹 limpio cualquier asterisco que venga de la BD
  let pos = 0;
  let resultado = "";

  for (let i = 0; i < picIG.length && pos < cod.length; i++) {
    if (picIG[i] === ".") {
      resultado += ".";
    } else {
      resultado += cod[pos];
      pos++;
    }
  }
  return resultado;
}



</script>


<!-- Sección de ingresos -->
{#if !mostrarEgresos}
  <!-- Título -->
  <div class="titulo-ingresos" style="background: linear-gradient(to right, {coloresModulo.egresos.start}, {coloresModulo.egresos.end});">
    <h2 class="titulo-principal">INGRESOS</h2>
    <p class="subtitulo">{subtituloIngreso || `Ordenanza Nº ${ingresosNumero}`}</p>

    
  </div>

  
  <!-- 🔹 Bloque buscador / nuevo / pdf / año -->
 {#if !modalIngreso && !modoModal}
  <!-- 🔹 Bloque buscador / nuevo / pdf -->
  <div class="w-full flex items-center my-4 justify-between">
    <div class="flex items-center gap-3">
      <!-- Input buscar -->
      <div class="relative w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
        <input
          type="text"
          class="w-full pl-10 bg-[#2a2f3a] text-white border-none rounded focus:outline-none"
          placeholder="Buscar fecha..."
          bind:value={filtro}
          on:input={onFiltroInput}
        />
      </div>

      <!-- Botón agregar presupuesto -->
      <button 
  class="flex items-center justify-center p-2 rounded-full text-white hover:scale-110 transition"
  style="background-color: #21A9FD; width: 32px; height: 32px;"
  title="Nuevo Ingresos"
  on:click={() => {
    abrirFormularioIngreso({ Codigo: '', Detalle: '', Presu: 0, IT: '' }, 'alta');
    tituloIngreso = "Nuevo Ingresos";   // 🔹 Cambia el título dinámico
  }}
>
  <Plus class="w-6 h-6" />
</button>

      <!-- Botón PDF -->
      <button 
        class="p-2 rounded-full text-white hover:scale-110 transition"
        style="background-color: #323a49; width: 35px; height: 35px;"
        title="Descargar PDF"
        on:click={() => mostrarToast({mensaje:"PDF pendiente", tipo:"info"})}
      >
        <FileText class="w-5 h-5" />
      </button>
    </div>
  </div>
{/if}

  <!-- 🔹 Fin bloque buscador -->

  <!-- Botones navegación -->
   
  <div class="ingresos-section">
    {#if !modalIngreso && !modoModal}
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-2 items-center">
        <button 
          class="px-4 py-2 " 
           style="background: linear-gradient(90deg, {coloresModulo.presupuesto.start}, {coloresModulo.presupuesto.end});"
          on:click={cerrarIngresos}
        >
          ⬅ Regresar a presupuestos
        </button>
      </div>

     <button 
  class="px-4 py-2 " 
  style="background: linear-gradient(90deg, {coloresModulo.ingresos.start}, {coloresModulo.ingresos.end});"
  on:click={abrirEgresos}  
>
   Ir a Egresos ➡
</button>

    </div>
    {/if}


    <!-- 🔹 MOSTRAR TABLA SOLO SI NO HAY FORMULARIO -->
    {#if !modalIngreso && !modoModal}
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
            {#if ingresosPaginados.length === 0}
              <tr>
                <td colspan="5" class="text-center py-4 text-gray-400 italic">
                  No hay ingresos cargados
                </td>
              </tr>
            {:else}
              {#each ingresosPaginados as ing}
                <tr>
                  <td class="px-3 py-1">
  <span
    class:font-bold={ing.IT.toUpperCase() === 'TÍTULO'}
    class:italic={ing.IT.toUpperCase() === 'TÍTULO'}
  >
    {masked_cod(ing.Codigo)}
  </span>
</td>


<td class="px-2 py-1">
  <span
    class:font-bold={ing.IT.toUpperCase() === 'TÍTULO'}
    class:italic={ing.IT.toUpperCase() === 'TÍTULO'}
  >
    {ing.Detalle}
  </span>
</td>

<td class="px-2 py-1 text-center">
  <span
    class="px-2 py-1 rounded text-xs font-semibold"
    style="background-color: {ing.IT.toUpperCase() === 'TÍTULO' ? '#34D399' : '#FFC107'}; color: #fff;"
  >
    {ing.IT.toUpperCase()}
  </span>
</td>

<td class="px-2 py-1">
  <span
    class:font-bold={ing.IT.toUpperCase() === 'TÍTULO'}
    class:italic={ing.IT.toUpperCase() === 'TÍTULO'}
  >
    {formatCurrency(ing.Presu)}
  </span>
</td>

                  <td class="px-2 py-1 flex gap-2 justify-center items-center whitespace-nowrap">

                   <!-- Eliminar -->
<button
  class="text-red-500 hover:scale-110"
  title="Eliminar"
  on:click={() => {
    abrirModalIngreso(ing, 'baja');
    mostrarToast({ mensaje: `Eliminar ingreso ${ing.Codigo}`, tipo: "danger" });
  }}
>
  <Trash2 class="w-5 h-5" />
</button>

<!-- Editar -->
<button
  class="text-blue-500 hover:scale-110"
  title="Editar"
  on:click={() => {
    abrirFormularioIngreso(ing, 'modificar');
    mostrarToast({ mensaje: `Editar ingreso ${ing.Codigo}`, tipo: "info" });
  }}
>
  <Pencil class="w-5 h-5" />
</button>

<!-- Ver -->
<button
  class="text-green-500 hover:scale-110"
  title="Ver"
  on:click={() => {
    abrirFormularioIngreso(ing, 'consulta');
    mostrarToast({ mensaje: `Ver ingreso ${ing.Codigo}`, tipo: "success" });
  }}
>
  <Eye class="w-5 h-5" />
</button>

<!-- Presupuesto -->
<button
  class="text-yellow-400 hover:scale-110"
  title="Dinero"
  on:click={() => {
    abrirModalIngreso(ing, 'presu');
    mostrarToast({ mensaje: `Presupuesto del ingreso ${ing.Codigo}`, tipo: "warning" });
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
    {/if}

    <!-- 🔹 FORMULARIO ENCIMA DE LA TABLA -->
    {#if modalIngreso && modoModal}
      <div class="mt-6">
        <FormularioIngreso
          bind:ingreso={modalIngreso}
          picIG={picIG}
          modo={modoModal}
          onGuardar={guardarIngresoModal}
          onCancelar={() => {
            modalIngreso = null;
            modoModal = null;
          }}
        />
      </div>
    {/if}
  </div>
{/if}



<!-- Modal egresos -->
{#if mostrarEgresos}
  <EgresosModal
    {mostrarEgresos}
    egresosIdPresu={ingresosIdPresu} 
    {egresos}
    {cerrarEgresos}
    egresosTitulo={egresosTitulo}
    onEditar={(eg) => mostrarToast({ mensaje:`Editar egreso ${eg.Codigo}`, tipo:"info" })}
    onEliminar={(eg) => mostrarToast({ mensaje:`Eliminar egreso ${eg.Codigo}`, tipo:"danger" })}
    {cerrarIngresos}
  />
{/if}

<style>
.ingresos-section {
  background: #232a34;
  border-radius: 16px;
  box-shadow: 0 2px 16px #0004;
  padding: 26px 22px;
  margin-top: 28px;
}
tbody tr:nth-child(odd) { background-color: #2a2f3a; }
tbody tr:nth-child(even) { background-color: #212631; }
tbody td { padding: 12px 12px; }
th:last-child {
  border-bottom: none !important;
}
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
  text-transform: uppercase; /* Para que siempre esté en mayúsculas */
}

.titulo-ingresos .subtitulo {
  font-style: italic;
  font-size: 1rem;
  margin-top: 4px;
  margin-bottom: 0;
}

/* Quitar bordes de toda la tabla */
table, th, td {
  border: none !important;
}

/* Opcional: mantener padding y colores */
th, td {
  padding: 8px 12px;
}

.titulo-ingresos .subtitulo {
  font-style: italic; /* cursiva */
  font-weight: 700;   /* negrita */
  font-size: 1rem;
  margin-top: 4px;
  margin-bottom: 0;
}

</style>
