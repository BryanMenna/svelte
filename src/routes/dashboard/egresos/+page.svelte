<script>
// @ts-nocheck
import EgresosForm from "../../../lib/components/EgresosForm.svelte";
import { Pencil, Trash2, Eye, DollarSign, Plus, FileText, Search } from "lucide-svelte";
import { formatCurrency } from "$lib/utils/format.js";
import { mostrarToast } from "$lib/utils/mostrarToast.js";
import ToastContainer from '$lib/components/ToastContainer.svelte';

import { coloresModulo } from '$lib/utils/coloresModulo.js';
export let picIG = "9.9.99.99.99";
export let mostrarEgresos = false;
export let egresos = [];
export let cerrarEgresos = () => {};
export let egresosTitulo = "";   // título principal
export let cerrarIngresos;
export let egresosIdPresu = null;

// 🔹 Variables de filtro / buscador
let filtroEgreso = "";
let filtroAnioEgreso = "todos";
let aniosEgreso = [2023, 2024, 2025]; 

// Filtros
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

// 🔹 Limpiar código
function cleanCodigo(cod) {
  if (!cod) return "";
  return String(cod).replace(/\*/g, "");
}

// 🔹 Guardar egreso (alta, modificar, baja)
async function guardarEgresoModal(egresoActualizado) {
  try {
    if (!egresosIdPresu) {
      mostrarToast({ mensaje: "❌ Falta IDPresu, no se puede guardar", tipo: "danger" });
      return;
    }

    const codigoLimpio = cleanCodigo(egresoActualizado.Codigo);

    const payload = {
      ...egresoActualizado,
      IDPresu: egresosIdPresu,   // 👈 forzamos siempre el ID
      Codigo: codigoLimpio
    };

    console.log("📤 Payload enviado a BD:", payload);

    let res;
    if (modoModalEgreso === 'alta') {
      res = await fetch('/api/egresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else if (modoModalEgreso === 'modificar' || modoModalEgreso === 'presu') {
      res = await fetch('/api/egresos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else if (modoModalEgreso === 'baja') {
      res = await fetch('/api/egresos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    // Refrescar lista de egresos
    const lista = await fetch(`/api/egresos?idPresu=${egresosIdPresu}`);
    egresos = await lista.json();

    mostrarToast({ mensaje: "✅ Cambios guardados en BD", tipo: "success" });
  } catch (err) {
    mostrarToast({ mensaje: "❌ Error guardando egreso", tipo: "danger" });
    console.error("Error guardarEgresoModal:", err);
  } finally {
    modalEgreso = null;
    modoModalEgreso = null;
  }
}

// 🔹 Variables de formulario
let modalEgreso = null;
let modoModalEgreso = null;

// 🔹 Enmascarar código
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

// 🔹 Paginación
let currentPage = 1;
let itemsPerPage = 3;

// 👉 Aplico filtro dinámico
$: egresosFiltrados = egresos.filter(eg => {
  const buscar = filtroEgreso.toLowerCase();
  const codigo = masked_cod(eg.Codigo).toLowerCase();
  const detalle = (eg.Detalle || "").toLowerCase();

  const matchTexto = codigo.includes(buscar) || detalle.includes(buscar);

  const matchAnio = filtroAnioEgreso === "todos" 
    ? true 
    : new Date(eg.FechaVig).getFullYear() === Number(filtroAnioEgreso);

  return matchTexto && matchAnio;
});

$: totalPages = Math.max(Math.ceil(egresosFiltrados.length / itemsPerPage), 1);
$: egresosPaginados = egresosFiltrados.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

function nextPage() { if (currentPage < totalPages) currentPage++; }
function prevPage() { if (currentPage > 1) currentPage--; }

// 🔹 Abrir/Cerrar formulario
function abrirFormularioEgreso(eg, modo = "consulta") {
  modalEgreso = { 
    ...eg, 
    IDPresu: egresosIdPresu,   // 👈 se agrega el ID siempre
    Codigo: cleanCodigo(eg.Codigo) 
  };
  modoModalEgreso = modo;
}
function cerrarFormularioEgreso() {
  modalEgreso = null;
  modoModalEgreso = null;
}

// 🔹 Mock guardar local
function guardarEgreso(event) {
  mostrarToast({ mensaje: "✅ Egreso guardado con éxito", tipo: "success" });
  modalEgreso = null;
  modoModalEgreso = null;
}

// 🔹 Abrir módulo
function abrirEgresos() {
  mostrarEgresos = true;
  moduloActual = "egresos";
  tituloActual = "Egresos";
}
</script>
<ToastContainer />

{#if mostrarEgresos}
  <!-- Título -->
  <div class="titulo-ingresos" style="background: linear-gradient(to right, {coloresModulo.ingresos.start}, {coloresModulo.ingresos.end});">
    <h2 class="titulo-principal">EGRESOS</h2>
    <p class="subtitulo">{egresosTitulo}</p>
  </div>

  <!-- 🔹 Buscador -->
  {#if !modalEgreso && !modoModalEgreso}
  <div class="w-full flex items-center my-4 justify-between">
    <div class="flex items-center gap-3">
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

      <!-- Botón agregar egreso -->
      <button 
        class="flex items-center justify-center p-2 rounded-full text-white hover:scale-110 transition"
        style="background-color: #21A9FD; width: 32px; height: 32px;"
        title="Nuevo egreso"
        on:click={() => {
          abrirFormularioEgreso({ Codigo: '', Detalle: '', Presu: 0, IT: '' }, 'alta');
          tituloEgreso = "Nuevo Egreso";   // 🔹 título dinámico
          mostrarToast({ mensaje: "Creando nuevo egreso", tipo: "info" });
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

  <!-- 🔹 Tabla -->
  <div class="egresos-section relative">
    {#if !modalEgreso && !modoModalEgreso}
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
  style="background: linear-gradient(90deg, {coloresModulo.egresos.start}, {coloresModulo.egresos.end});"
  on:click={() => { cerrarEgresos(); }}
>
  Ir a Ingresos ➡
</button>

    </div>
    {/if}

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
                  <td class="px-2 py-1">{masked_cod(eg.Codigo)}</td>
                  <td class="px-2 py-1">{eg.Detalle}</td>
                  <td class="px-2 py-1 text-center">
                    <span class="px-2 py-1 rounded text-xs font-semibold"
                      style="background-color: {eg.IT.toUpperCase() === 'TÍTULO' ? '#34D399' : '#FFC107'}; color: #fff;">
                      {eg.IT.toUpperCase()}
                    </span>
                  </td>
                  <td class="px-2 py-1">{formatCurrency(eg.Presu)}</td>
                 <td class="px-2 py-1 flex gap-2 justify-center items-center">
  <!-- Eliminar -->
  <button class="text-red-500 hover:scale-110" title="Eliminar"
    on:click={() => { 
      abrirFormularioEgreso(eg, "baja"); 
      mostrarToast({ 
        mensaje: `Eliminando egreso - Código: ${masked_cod(eg.Codigo)}`, 
        tipo: "danger" 
      });
    }}>
    <Trash2 class="w-5 h-5" />
  </button>

  <!-- Editar -->
  <button class="text-blue-500 hover:scale-110" title="Editar"
    on:click={() => { 
      abrirFormularioEgreso(eg, "modificar"); 
      mostrarToast({ 
        mensaje: `Editando egreso - Código: ${masked_cod(eg.Codigo)}`, 
        tipo: "info" 
      });
    }}>
    <Pencil class="w-5 h-5" />
  </button>

  <!-- Ver -->
  <button class="text-green-500 hover:scale-110" title="Ver"
    on:click={() => { 
      abrirFormularioEgreso(eg, "consulta"); 
      mostrarToast({ 
        mensaje: `Visualizando egreso - Código: ${masked_cod(eg.Codigo)}`, 
        tipo: "success" 
      });
    }}>
    <Eye class="w-5 h-5" />
  </button>

  <!-- Presupuesto -->
  <button class="text-yellow-400 hover:scale-110" title="Dinero"
    on:click={() => { 
      abrirFormularioEgreso(eg, "presu"); 
      mostrarToast({ 
        mensaje: `Modo presupuesto - Código: ${masked_cod(eg.Codigo)}`, 
        tipo: "warning" 
      });
    }}>
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
        <button class="px-4 py-2 bg-[#323a49] rounded hover:bg-[#212631] disabled:opacity-40"
          on:click={prevPage} disabled={currentPage === 1}>
          ⬅ Anterior
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button class="px-4 py-2 bg-[#323a49] rounded hover:bg-[#212631] disabled:opacity-40"
          on:click={nextPage} disabled={currentPage === totalPages}>
          Siguiente ➡
        </button>
      </div>
    {/if}

    <!-- Formulario -->
    {#if modalEgreso && modoModalEgreso}
      <div class="mt-6">
        <EgresosForm
          egreso={modalEgreso}
          modo={modoModalEgreso}
          on:guardar={(e) => guardarEgresoModal(e.detail)}
          on:cancelar={() => { modalEgreso = null; modoModalEgreso = null; }}
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
</style>
