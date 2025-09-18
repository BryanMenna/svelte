<script>
// @ts-nocheck
import { onMount } from 'svelte';
import ToastContainer from '$lib/components/ToastContainer.svelte';
import IngresosModal from '../ingresos/+page.svelte';
import { mostrarToast } from '$lib/utils/mostrarToast.js';
import { Pencil, Eye, Trash2, Search, Plus, FileText } from 'lucide-svelte';
import PresupuestoForm from '../../../lib/components/PresupuestoForm.svelte';

let anios = [];
let filtroAnio = "todos";
let registros = [];
let itemsPerPage = 5;
let filtro = "";
let currentPage = 1;

let modo = "alta"; // "alta" | "editar" | "ver" | "eliminar"
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

function abrirIngresos(r) {
  ingresosIdPresu = r.id_presu;
  ingresosNumero = r.numero;
  let fechaPartes = r.fecha_vig.split('/');
  let mes = fechaPartes.length === 3 ? fechaPartes[1] : '??';
  let anio = fechaPartes.length === 3 ? fechaPartes[2] : r.anio;
  ingresosTitulo = `Ingresos - Ordenanza Nº ${r.numero} - ${mes}/${anio}`;
  tituloActual = ingresosTitulo;
  mostrarIngresos = true;

  

  fetch(`/api/ingresos/${ingresosIdPresu}?numero=${ingresosNumero}`)
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => ingresos = data)
    .catch(() => {
      mostrarToast({ mensaje: 'Error cargando ingresos', tipo: 'danger' });
      ingresos = [];
    });
}

function cerrarIngresos() {
  mostrarIngresos = false;
  ingresos = [];
  tituloActual = "Presupuesto";
}

// Guardar presupuesto (alta, editar, eliminar)
async function guardarPresupuesto(e) {
  e.preventDefault();

  if (modo === "eliminar") {
    const res = await fetch("/api/presupuesto", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_presu: formData.id_presu })
    });
    if (!res.ok) {
      mostrarToast({ mensaje: "Error al eliminar", tipo: "danger" });
      return;
    }
    mostrarToast({ mensaje: `Presupuesto eliminado`, tipo: "danger" });
    mostrarFormulario = false;
    await cargarRegistros();
    return;
  }

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

// Máscara de códigos de partida
export let picIG = "9.9.99.99.99"; // ejemplo
function masked_cod(partIN) {
  let posPart = 0;
  let resultado = "";
  for (let i = 0; i < picIG.length && posPart < partIN.length; i++) {
    if (picIG[i] === ".") resultado += ".";
    else {
      resultado += partIN[posPart];
      posPart++;
    }
  }
  return resultado;
}

export function getPadre(partIN) {
  const conMascara = masked_cod(partIN);
  if (!conMascara.includes(".")) return "";
  const partes = conMascara.split(".");
  partes.pop(); 
  return partes.join(".");
}
</script>

<ToastContainer />

{#if mostrarIngresos}
  <IngresosModal
    {mostrarIngresos}
    {ingresos}
    {ingresosNumero}
    ingresosIdPresu={ingresosIdPresu}
    ingresosTitulo={ingresosTitulo}
    {cerrarIngresos}
  />
{:else}
  <!-- Título -->
  <div class="w-full flex items-center justify-center mt-8 mb-8">
    <h1 class="text-3xl font-bold text-white px-6 py-3 rounded-lg shadow-lg" style="background: #2a2f3a">
      {tituloActual}
    </h1>
  </div>

  <!-- Formulario -->
  {#if mostrarFormulario}
    <PresupuestoForm
      {modo}
      {formData}
      {opcionesTipo}
      {minVigencia}
      {minPromulgacion}
      {maxFecha}
      {masked_cod}
      {getPadre}
      {guardarPresupuesto}
      {cerrarFormulario}
    />
  {:else}
    <!-- Tabla y filtros -->
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
        <button class="flex items-center justify-center p-2 rounded-full text-white hover:scale-110 transition"
          style="background-color: #21A9FD; width: 32px; height: 32px;"
          title="Nuevo presupuesto"
          on:click={agregarPresupuesto}
        >
          <Plus class="w-6 h-6" />
        </button>
        <button class="p-2 rounded-full text-white hover:scale-110 transition"
          style="background-color: #323a49; width: 35px; height: 35px;"
          title="Descargar PDF"
          on:click={() => mostrarToast({mensaje:"PDF pendiente", tipo:"info"})}>
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

    <div class="w-full overflow-x-auto rounded-lg shadow-lg">
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
              <td colspan="5" class="text-center py-4 text-gray-400">No hay registros para mostrar</td>
            </tr>
          {:else}
            {#each registrosPaginados as r, i (`${r.id_presu}-${i}`)}
              <tr class="border-b border-surface-700">
                <td class="px-4 py-2 font-bold">{r.anio}</td>
                <td class="px-4 py-2">
                  <div class="font-bold">{r.tipo}</div>
                  <div class="ordenanza">{disp_legal(r.numero)}</div>
                  <small class="user-subinfo">{masked_cod(r.numero)} y su padre es: {getPadre(r.numero)}</small>
                </td>
                <td class="px-4 py-2">Vigencia: {r.fecha_vig}<br /><span class="promulgacion">Promulgación: {r.fecha_pro}</span></td>
                <td class="px-4 py-2">
                 <span class="px-3 py-1 rounded text-xs font-semibold"
  style:background-color={
    r.tipo.toLowerCase() === 'anual' ? '#00c950' :
    r.tipo.toLowerCase() === 'compensación' ? '#21A9FD' :
    r.tipo.toLowerCase() === 'rectificación' ? '#fb2c36' : '#666'
  }>
  {r.tipo.toUpperCase()}
</span>
                </td>
                <td class="px-4 py-2 text-center">
  <div class="flex gap-3">
   <!-- Trash -->
<button
  class="text-red-500 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
  title="Eliminar"
  disabled={r !== registrosFiltrados[registrosFiltrados.length - 1]}
  on:click={() => {
    modo = "eliminar";
    formData = {
      ...r,
      fecha_vig: convertirDDMMYYYYaISO(r.fecha_vig),
      fecha_pro: convertirDDMMYYYYaISO(r.fecha_pro),
    };
    mostrarFormulario = true;
    mostrarToast({ mensaje: `Preparando eliminación de ${r.numero}`, tipo: "danger" });
  }}
>
  <Trash2 class="w-4.3 h-5" />
</button>

<!-- Pencil -->
<button
  class="text-blue-500 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
  title="Editar"
  disabled={r !== registrosFiltrados[registrosFiltrados.length - 1]}
  on:click={() => {
    modo = "editar";
    formData = {
      ...r,
      fecha_vig: convertirDDMMYYYYaISO(r.fecha_vig),
      fecha_pro: convertirDDMMYYYYaISO(r.fecha_pro),
    };
    mostrarFormulario = true;
    mostrarToast({ mensaje: `Editando presupuesto ${r.numero}`, tipo: "primary" });
  }}
>
  <Pencil class="w-4.3 h-5" />
</button>

    <!-- Eye -->
    <button
      class="text-green-500 hover:scale-110"
      title="Ingresos"
      on:click={() => {
        abrirIngresos(r);
        mostrarToast({ mensaje: `Abriendo ingresos de ${r.numero}`, tipo: "success" });
      }}
    >
      <Eye class="w-4.3 h-5" />
    </button>
  </div>
</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-center mt-4 text-white">
      <button class="px-3 py-1 bg-[#323a49] rounded disabled:opacity-50" on:click={prevPage} disabled={currentPage === 1}>⬅ Anterior</button>
      <span>Página {currentPage} de {totalPages}</span>
      <button class="px-3 py-1 bg-[#323a49] rounded disabled:opacity-50" on:click={nextPage} disabled={currentPage === totalPages}>Siguiente ➡</button>
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


</style>
