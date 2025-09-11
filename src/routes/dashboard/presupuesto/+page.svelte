<script>
// @ts-nocheck
import { onMount } from 'svelte';
import ToastContainer from '$lib/components/ToastContainer.svelte';
import IngresosModal from '$lib/components/IngresosModal.svelte';
import { mostrarToast } from '$lib/utils/mostrarToast.js';
import { Pencil, Eye, Trash2, Search, Plus, FileText } from 'lucide-svelte';

let anios = [];
let filtroAnio = "todos";
let registros = [];
let itemsPerPage = 5;
let filtro = "";
let currentPage = 1;

let modo = "alta"; // "alta" | "editar" | "ver"
let mostrarFormulario = false;
let formData = {
  id_presu: null,
  tipo: "Anual",
  numero: "",
  fecha_vig: "",
  fecha_pro: ""
};
let opcionesTipo = ["Anual"];
let anioSeleccionado = new Date().getFullYear();
let minVigencia = "";
let minPromulgacion = "";
let maxFecha = "";

// --- Modal de Ingresos ---
let mostrarIngresos = false;
let ingresos = [];
let ingresosNumero = "";
let ingresosIdPresu = "";
let ingresosTitulo = "";
let tituloActual = "Presupuesto";

// --- Nueva: Confirmación de eliminación ---
let mostrarConfirmacion = false;
let registroAEliminar = null;

// Funciones Modal
async function abrirIngresos(r) {
  ingresosIdPresu = r.id_presu;
  ingresosNumero = r.numero;
  let fechaPartes = r.fecha_vig.split('/');
  let mes = fechaPartes.length === 3 ? fechaPartes[1] : '??';
  let anio = fechaPartes.length === 3 ? fechaPartes[5] : r.anio;
  ingresosTitulo = `Ingresos - Presupuesto ${mes}/${anio}`;
  tituloActual = ingresosTitulo;
  mostrarIngresos = true;

  try {
    const res = await fetch(`/api/ingresos/${ingresosIdPresu}?numero=${ingresosNumero}`);
    if (!res.ok) throw new Error("Error al cargar ingresos");
    ingresos = await res.json();
  } catch (e) {
    mostrarToast({ mensaje: 'Error cargando ingresos', tipo: 'danger' });
    ingresos = [];
  }
}

function cerrarIngresos() {
  mostrarIngresos = false;
  ingresos = [];
  tituloActual = "Presupuesto";
}

// Filtrado y paginación
$: registrosFiltrados = registros.filter(r => {
  let coincideAnio = filtroAnio === "todos" || r.anio.toString() === filtroAnio;
  let coincideVigencia = r.fecha_vig.includes(filtro);
  return coincideAnio && (filtro === "" || coincideVigencia);
});
$: totalPages = Math.max(Math.ceil(registrosFiltrados.length / itemsPerPage), 1);
$: registrosPaginados = registrosFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

async function cargarRegistros() {
  try {
    const res = await fetch('/api/presupuesto');
    if (!res.ok) throw new Error('Error al cargar registros');
    const data = await res.json();
    registros = data.map(r => ({
      ...r,
      fecha_vig: convertirISOaDDMMYYYY(r.fecha_vig),
      fecha_pro: convertirISOaDDMMYYYY(r.fecha_pro)
    }));
    anios = [...new Set(registros.map(r => r.anio.toString()))].sort((a, b) => a - b);
    filtroAnio = "todos";
    filtro = "";
    currentPage = Math.max(Math.ceil(registros.length / itemsPerPage), 1);
  } catch (err) {
    console.error(err);
    mostrarToast({ mensaje: 'Error cargando presupuestos', tipo: 'danger' });
  }
}

// Filtrado
function cambiarAnio(e) {
  filtroAnio = e.target.value;
  currentPage = Math.max(Math.ceil(registrosFiltrados.length / itemsPerPage), 1);
}
function onFiltroInput(e) {
  filtro = e.target.value.toLowerCase();
  currentPage = Math.max(Math.ceil(registrosFiltrados.length / itemsPerPage), 1);
}
function nextPage() { if (currentPage < totalPages) currentPage++; }
function prevPage() { if (currentPage > 1) currentPage--; }

// Utilidades
function disp_legal(numero) { return "Ordenanza Nº " + numero; }
function parseFecha(str, anio) {
  if (!str) return new Date(`${anio}-01-01`);
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }
  return new Date(str);
}
function addDiasISO(dateObj, suma) {
  const x = new Date(dateObj.getTime() + suma * 86400000);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function convertirISOaDDMMYYYY(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
function convertirDDMMYYYYaISO(str) {
  if (!str) return "";
  if (str.includes('/')) {
    const [dd, mm, yyyy] = str.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  return str;
}

// Alta presupuesto
function prepararAlta() {
  const anio = filtroAnio !== "todos" ? parseInt(filtroAnio) : new Date().getFullYear();
  anioSeleccionado = anio;
  const fechaClave = `01/01/${anio}`;
  const existe = registros.some(r => r.fecha_vig === fechaClave || r.fecha_vig === `${anio}-01-01` || r.fecha_vig === `01/01/${anio}`);
  if (!existe) {
    opcionesTipo = ["Anual", "Reconducido"];
    formData.tipo = "Anual";
    formData.fecha_vig = `${anio}-01-01`;
    formData.fecha_pro = `${anio}-01-01`;
    minVigencia = `${anio}-01-01`;
    minPromulgacion = `${anio}-01-01`;
    maxFecha = `${anio}-12-31`;
  } else {
    opcionesTipo = ["Anual", "Compensación", "Rectificación"];
    const registrosAnio = registros.filter(r => r.anio == anio);
    const ultimaVig = registrosAnio
      .map(r => parseFecha(r.fecha_vig, anio))
      .reduce((max, d) => d > max ? d : max, new Date(`${anio}-01-01`));
    const ultimaPro = registrosAnio
      .map(r => parseFecha(r.fecha_pro, anio))
      .reduce((max, d) => d > max ? d : max, new Date(`${anio}-01-01`));
    minVigencia = addDiasISO(ultimaVig, 1);
    minPromulgacion = addDiasISO(ultimaPro, 1);
    maxFecha = `${anio}-12-31`;
    formData.tipo = "Compensación";
    formData.fecha_vig = minVigencia;
    formData.fecha_pro = minPromulgacion;
  }
}

// Acciones con Toast
function agregarPresupuesto() {
  modo = "alta";
  formData = { id_presu: null, tipo: "Anual", numero: "", fecha_vig: "", fecha_pro: "" };
  prepararAlta();
  mostrarFormulario = true;
  mostrarToast({ mensaje: "Nuevo presupuesto", tipo: "primary" });
}

function editarRegistro(r) {
  if (r.tipo === "Anual" || r.tipo === "Reconducido") return;
  modo = "editar";
  formData = {
    ...r,
    fecha_vig: convertirDDMMYYYYaISO(r.fecha_vig),
    fecha_pro: convertirDDMMYYYYaISO(r.fecha_pro),
  };
  prepararAlta();
  mostrarFormulario = true;
  mostrarToast({ mensaje: `Editando presupuesto ${r.numero}`, tipo: "primary" });
}

function verRegistro(r) {
  if (r.tipo === "Anual" || r.tipo === "Reconducido") return;
  modo = "ver";
  formData = {
    ...r,
    fecha_vig: convertirDDMMYYYYaISO(r.fecha_vig),
    fecha_pro: convertirDDMMYYYYaISO(r.fecha_pro),
  };
  prepararAlta();
  mostrarFormulario = true;
  mostrarToast({ mensaje: `Viendo presupuesto ${r.numero}`, tipo: "success" });
}

// NUEVO: Pide confirmación antes de eliminar (no usa alert)
function pedirConfirmacionEliminar(r) {
  registroAEliminar = r;
  mostrarConfirmacion = true;
}

// NUEVO: Ejecuta la eliminación
async function confirmarEliminacion() {
  mostrarConfirmacion = false;
  if (!registroAEliminar) return;
  const res = await fetch('/api/presupuesto', {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_presu: registroAEliminar.id_presu })
  });
  if (!res.ok) {
    mostrarToast({ mensaje: "Error al eliminar", tipo: "danger" });
    return;
  }
  mostrarToast({ mensaje: `Presupuesto eliminado`, tipo: 'danger' });
  registroAEliminar = null;
  await cargarRegistros();
}

// NUEVO: Cancela la eliminación
function cancelarEliminacion() {
  mostrarConfirmacion = false;
  registroAEliminar = null;
  mostrarToast({ mensaje: "Eliminación cancelada", tipo: "info" });
}

// Guardar presupuesto
async function guardarPresupuesto(e) {
  e.preventDefault();

  if (modo === "alta") {
    const res = await fetch("/api/presupuesto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      mostrarToast({ mensaje: "Error al guardar", tipo: "danger" });
      return;
    }
    mostrarToast({ mensaje: 'Presupuesto agregado con éxito', tipo: 'success' });
  }

  if (modo === "editar") {
    const res = await fetch("/api/presupuesto", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      mostrarToast({ mensaje: "Error al actualizar", tipo: "danger" });
      return;
    }
    mostrarToast({ mensaje: 'Presupuesto actualizado', tipo: 'success' });
  }

  mostrarFormulario = false;
  await cargarRegistros();
}

function cerrarFormulario() {
  mostrarFormulario = false;
}

onMount(() => {
  cargarRegistros();
});

</script>

<ToastContainer />

{#if mostrarIngresos}
  <IngresosModal
    {mostrarIngresos}
    {ingresos}
    {ingresosNumero}
    ingresosTitulo={ingresosTitulo}
    {cerrarIngresos}
  />
{:else}
  {#if mostrarFormulario}
  <section class="w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6">
    <div class="px-5 py-2 bg-[#6416a1] text-white font-normal text-lg flex items-center justify-between">
      <span style="text-transform: uppercase;">Nuevo Presupuesto</span>
      <button class="text-white hover:text-gray-100 text-2xl px-2 py-1 rounded transition"
        style="background: transparent;" aria-label="Cerrar"
        on:click={cerrarFormulario}>×</button>
    </div>
    <div class="p-6 bg-[#212631]">
      <div class="presu-card-section">
        <div class="presu-section-title">CREDENCIALES DEL PRESUPUESTO</div>
        <form on:submit={guardarPresupuesto} class="presu-form-grid" id="form-presupuesto">
          <div class="presu-form-col">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="presu-label">Tipo:</label>
            <select bind:value={formData.tipo} disabled={modo !== "alta"} class="presu-input presu-select">
              {#each opcionesTipo as opt}
                <option>{opt}</option>
              {/each}
            </select>
          </div>
          <div class="presu-form-col">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="presu-label">Número:</label>
            <input type="text" bind:value={formData.numero} class="presu-input" disabled={modo==="ver"} />
          </div>
          <div class="presu-form-col">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="presu-label">Fecha Vigencia:</label>
            <input type="date" bind:value={formData.fecha_vig} class="presu-input"
              min={minVigencia} max={maxFecha}
              disabled={modo === "ver" || formData.tipo === "Anual" || formData.tipo === "Reconducido"} />
          </div>
          <div class="presu-form-col">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="presu-label">Fecha Promulgación:</label>
            <input type="date" bind:value={formData.fecha_pro} class="presu-input"
              min={minPromulgacion} max={maxFecha}
              disabled={modo === "ver" || formData.tipo === "Anual" || formData.tipo === "Reconducido"} />
          </div>
          {#if modo !== "ver"}
          <div class="presu-btn-actions">
            <button type="submit" class="presu-submit" tabindex="0">
              Guardar
            </button>
            <button type="button" class="presu-cancel" on:click={cerrarFormulario} tabindex="0">Cerrar</button>
          </div>
          {/if}
        </form>
      </div>
    </div>
  </section>
  {:else}
    <div class="w-full flex items-center my-4 justify-between">
      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
          <input
            type="text"
            class="w-full pl-10 bg-[#2a2f3a] text-white border-none rounded focus:outline-none"
            placeholder="Buscar fecha..."
            value={filtro}
            on:input={onFiltroInput}
          />
        </div>
        <button
          class="flex items-center justify-center p-2 rounded-full text-white hover:scale-110 transition"
          style="background-color: #21A9FD; width: 32px; height: 32px;"
          title="Nuevo presupuesto"
          on:click={agregarPresupuesto}
        >
          <Plus class="w-6 h-6" />
        </button>
        <button class="p-2 rounded-full text-white hover:scale-110 transition"
          style="background-color: #323a49; width: 35px; height: 35px;"
          title="Descargar PDF" on:click={() => mostrarToast({mensaje:"PDF pendiente", tipo:"info"})}>
          <FileText class="w-5 h-5" />
        </button>
      </div>
      <div class="flex items-center">
        <label for="anio" class="text-white mr-2">Año:</label>
        <div class="select-container">
          <select id="anio" bind:value={filtroAnio} on:change={cambiarAnio}>
            <option value="todos">Todos</option>
            {#each anios as anio}
              <option value={anio}>{anio}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
    <div class="w-full">
      <table class="w-full text-white rounded overflow-hidden" style="background-color: #212631;">
        <thead style="background-color: #323a49;">
          <tr>
            <th class="encabezado">AÑO</th>
            <th class="encabezado">PRESUPUESTO</th>
            <th class="encabezado">FECHAS</th>
            <th class="encabezado">TIPO</th>
            <th class="encabezado">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {#if registrosPaginados.length === 0}
            <tr>
              <td colspan="5" class="text-center py-6 text-gray-400 italic">No se encontraron registros</td>
            </tr>
          {:else}
            {#each registrosPaginados as r, i (`${r.id_presu}-${i}`)}
              <tr class="border-b border-surface-700">
                <td class="px-4 py-2 font-bold">{r.anio}</td>
                <td class="px-4 py-2">
                  <div class="font-bold">{r.tipo}</div>
                  <div class="ordenanza">{disp_legal(r.numero)}</div>
                </td>
                <td class="px-4 py-2">
                  Vigencia: {r.fecha_vig}<br />
                  <span class="promulgacion">Promulgación: {r.fecha_pro}</span>
                </td>
                <td class="px-4 py-2">
                  <span class="px-3 py-1 rounded"
                    style:background-color={
                      r.tipo.toLowerCase() === 'anual' ? '#00c950' :
                      r.tipo.toLowerCase() === 'compensación' ? '#21A9FD' :
                      r.tipo.toLowerCase() === 'rectificación' ? '#fb2c36' : '#666'
                    }>
                    {r.tipo.toUpperCase()}
                  </span>
                </td>
              <td>
  <button
    class="text-red-500 hover:scale-110"
    title="Eliminar"
    on:click={() => { pedirConfirmacionEliminar(r); mostrarToast({ mensaje: "Eliminación pendiente de presupuesto", tipo: "danger" }); }}
    disabled={!(currentPage === totalPages && i === registrosPaginados.length - 1)}
  >
    <Trash2 class="w-4.3 h-5" />
  </button>

  <button
    class="text-blue-500 hover:scale-110"
    title="Editar"
    on:click={() => { editarRegistro(r); mostrarToast({ mensaje: `Editando presupuesto ${r.numero}`, tipo: "primary" }); }}
    disabled={!(currentPage === totalPages && i === registrosPaginados.length - 1)}
  >
    <Pencil class="w-4.3 h-5" />
  </button>

  <button
    class="text-green-500 hover:scale-110"
    title="Ver Ingresos"
    on:click={() => { abrirIngresos(r); mostrarToast({ mensaje: `Abriendo ingresos de presupuesto ${r.numero}`, tipo: "success" }); }}
  >
    <Eye class="w-4.3 h-5" />
  </button>
</td>

              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
      <div class="flex justify-between items-center mt-4 text-white">
        <button class="px-3 py-1 bg-[#323a49] rounded disabled:opacity-50"
          on:click={prevPage} disabled={currentPage === 1}>⬅ Anterior</button>
        <span>Página {currentPage} de {totalPages}</span>
        <button class="px-3 py-1 bg-[#323a49] rounded disabled:opacity-50"
          on:click={nextPage} disabled={currentPage === totalPages}>Siguiente ➡</button>
      </div>
    </div>
  {/if}
{/if}

<style>
/* (Igual que antes, sin cambios en el CSS) */
.encabezado { padding: 7px 13px; text-align: left; font-size: 0.95rem; letter-spacing: 1px; font-weight: 400; }
tbody tr:nth-child(odd) { background-color: #2a2f3a; }
tbody tr:nth-child(even) { background-color: #212631; }
tbody td { padding: 8px 12px;  }
.ordenanza { font-size: 0.85rem; color: #bbb; }
.promulgacion { font-size: 0.85rem; color: #bbb; }
select { background-color: #323a49; color: white;  border-radius: 5px; }
.select-container { border: 1px solid #323a49; border-radius: 5px; overflow: hidden; }
.presu-card-section { background: #2a2f3a; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.22); padding: 32px 28px 26px; margin-bottom: 0; width: 100%; display: block; }
.presu-section-title { color: #e07676; font-size: 1.05rem; font-weight: 700; margin-bottom: 20px; letter-spacing: .7px; text-transform: uppercase; }
.presu-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 26px 28px; margin-bottom: 16px; width: 100%; }
@media (max-width: 900px) { .presu-form-grid { grid-template-columns: 1fr; } }
.presu-form-col { display: flex; flex-direction: column; width: 100%; }
.presu-label { color: #fff; font-weight: 500; margin-bottom: 7px; font-size: 1.09rem; letter-spacing: .2px; }
.presu-input, .presu-select { background-color: #2b3242; color: #fff; border-radius: 6px; border: 1px solid #777; padding: 10px 16px; font-size: 1rem; width: 100%; outline: none; transition: border-color 0.2s; min-height: 44px; }
.presu-input:focus, .presu-select:focus { border-color: #3585fd; }
.presu-btn-actions { grid-column: span 2; display: flex; justify-content: flex-end; gap: 18px; margin-top: 8px; width: 100%; }
.presu-submit { background: #6416a1; color: #fff; font-size: 1.04rem; font-weight: 600; padding: 10px 20px; border-radius: 5px; cursor: pointer; border: none; transition: background 0.16s; box-shadow: 0 0 0 1.5px #5e1597; }
.presu-submit:hover { background: #791ed0; }
.presu-cancel { background: #212631; color: #6416a1; font-size: 1rem; font-weight: 500; border-radius: 5px; border: 1.5px solid #791ed0; padding: 10px 20px; cursor: pointer; box-shadow: 0 0 0 1.5px #212631; opacity: 0.54; transition: background 0.18s, color 0.18s; }
.presu-cancel:disabled { color: #791ed0; opacity: 0.35; cursor: not-allowed; background: #212631; border: 1.5px solid #791ed0; }
.presu-cancel:hover:not(:disabled) { background: #791ed0; color: #fff; opacity: 1; }
</style>
