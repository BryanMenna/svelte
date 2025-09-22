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
let itemsPerPage = 3;
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
   // Normaliza texto de búsqueda
  const busqueda = filtro.toLowerCase();

  // Filtra por fecha_vig o número de ordenanza
  const coincideTexto = 
    r.fecha_vig.toLowerCase().includes(busqueda) || 
    String(r.numero).toLowerCase().includes(busqueda);

  return coincideAnio && (busqueda === "" || coincideTexto);
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

let todasOpciones = ["Anual", "Reconducido", "Compensación", "Rectificación"];
// Alta presupuesto
function prepararAlta() {
  const anio = filtroAnio !== "todos" ? parseInt(filtroAnio) : new Date().getFullYear();
  anioSeleccionado = anio;

  // 🔎 Buscar si ya existe un presupuesto inicial del 01/01/YYYY
  const existeInicial = registros.some(r => 
    r.fecha_vig === `01/01/${anio}` || r.fecha_vig === `${anio}-01-01`
  );

  if (!existeInicial) {
    // 👉 Caso 1: NO existe inicial
    opcionesTipo = ["Anual", "Reconducido"];
    formData.tipo = "Anual";

    const fija = `${anio}-01-01`;
    formData.fecha_vig = fija;
    formData.fecha_pro = fija;

    // Fechas fijas y bloqueadas
    minVigencia = fija;
    minPromulgacion = fija;
    maxFecha = fija;

    formData.fechasBloqueadas = true;
  } else {
    // 👉 Caso 2: SÍ existe inicial
    opcionesTipo = ["Anual", "Compensación", "Rectificación"];

    const registrosAnio = registros.filter(r => r.anio == anio);

    // Última Vigencia y Promulgación registradas en el año
    const ultimaVig = registrosAnio
      .map(r => parseFecha(r.fecha_vig, anio))
      .reduce((max, d) => d > max ? d : max, new Date(`${anio}-01-01`));

    const ultimaPro = registrosAnio
      .map(r => parseFecha(r.fecha_pro, anio))
      .reduce((max, d) => d > max ? d : max, new Date(`${anio}-01-01`));

    // 🔹 Mínimo absoluto siempre = 02/01/YYYY
    const minAbs = new Date(`${anio}-01-02`);

    // Vigencia mínima = última vigencia o 02/01/YYYY (lo que sea más tarde)
    const minVigDate = ultimaVig < minAbs ? minAbs : ultimaVig;

    // Promulgación mínima = última promulgación o 02/01/YYYY (lo que sea más tarde)
    const minProDate = ultimaPro < minAbs ? minAbs : ultimaPro;

    // Guardamos los rangos como string ISO (yyyy-mm-dd)
    minVigencia = addDiasISO(minVigDate, 0);
    minPromulgacion = addDiasISO(minProDate, 0);
    maxFecha = `${anio}-12-31`;

    // Valores iniciales para el formulario
    formData.tipo = "Compensación";
    formData.fecha_vig = minVigencia;
    formData.fecha_pro = minPromulgacion;

    formData.fechasBloqueadas = false;
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

  // Opciones (puede ser todas, o filtrar según lógica de negocio)
  opcionesTipo = [...todasOpciones];

  // 🔹 Recalcular límites igual que en alta
  const anio = r.anio;
  const registrosAnio = registros.filter(reg => reg.anio == anio);

  const ultimaVig = registrosAnio
    .map(reg => parseFecha(reg.fecha_vig, anio))
    .reduce((max, d) => d > max ? d : max, new Date(`${anio}-01-01`));

  const ultimaPro = registrosAnio
    .map(reg => parseFecha(reg.fecha_pro, anio))
    .reduce((max, d) => d > max ? d : max, new Date(`${anio}-01-01`));

  const minAbs = new Date(`${anio}-01-02`);

  const minVigDate = ultimaVig < minAbs ? minAbs : ultimaVig;
  const minProDate = ultimaPro < minAbs ? minAbs : ultimaPro;

  minVigencia = addDiasISO(minVigDate, 0);
  minPromulgacion = addDiasISO(minProDate, 0);
  maxFecha = `${anio}-12-31`;

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

  // ❌ no prepararAlta()
  opcionesTipo = [...todasOpciones];

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
  moduloActual = "ingresos";
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
   moduloActual = "presupuesto";
}

// Guardar presupuesto (alta, editar, eliminar)
// utils/guardarPresupuesto.js

// ⚡ Función de guardado del presupuesto
export async function guardarPresupuesto(formData, modo) {
  try {
    const data = {
      id_presu: formData.id_presu ?? null,
      tipo: formData.tipo,
      numero:  parseInt(formData.numero, 10),
      fecha_vig: formData.fecha_vig,
      fecha_pro: formData.fecha_pro
    };

    let response;

    if (modo === "alta") {
      response = await fetch("/api/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } 
    else if (modo === "editar") {
      response = await fetch("/api/presupuesto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } 
    else if (modo === "eliminar") {
      response = await fetch("/api/presupuesto", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_presu: formData.id_presu })
      });
    }

    if (!response.ok) {
      throw new Error("Error al guardar el presupuesto");
    }

    const result = await response.json();

    // ✅ Toasts
    if (modo === "alta") {
      mostrarToast({ mensaje: "Presupuesto creado con éxito", tipo: "success" });
    } else if (modo === "editar") {
      mostrarToast({ mensaje: "Presupuesto actualizado con éxito", tipo: "success" });
    } else if (modo === "eliminar") {
      mostrarToast({ mensaje: "Presupuesto eliminado con éxito", tipo: "success" });
    }

    return result;
  } catch (error) {
    console.error(error);
    mostrarToast({ mensaje: "Hubo un error al guardar el presupuesto", tipo: "danger" });
    return null;
  }
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
  if (!partIN) return "";
  let posPart = 0;
  let resultado = "";
  for (let i = 0; i < picIG.length; i++) {
    if (picIG[i] === ".") resultado += ".";
    else {
      if (posPart < partIN.length) resultado += partIN[posPart++];
      else resultado += "0"; // rellena con 0 si falta
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

function prepararEliminar(r) {
  const ultimo = registrosFiltrados[registrosFiltrados.length - 1];
  if (r.id_presu !== ultimo.id_presu) {
    mostrarToast({ mensaje: "Solo puede eliminar el último presupuesto", tipo: "danger" });
    return;
  }
  modo = "eliminar";
  formData = { ...r, fecha_vig: convertirDDMMYYYYaISO(r.fecha_vig), fecha_pro: convertirDDMMYYYYaISO(r.fecha_pro) };
  mostrarFormulario = true;
}
import { coloresModulo } from '$lib/utils/coloresModulo.js';
let moduloActual = "presupuesto"; // presupuesto | ingresos | egresos



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
      {mostrarToast}
      {picIG}
      {cargarRegistros}
       anioSeleccionado={anioSeleccionado}
    />
  {:else}    
 <div class="w-full flex items-center justify-center mt-4 mb-4">
  <h1
    class="text-3xl font-bold text-white px-6 py-3 rounded-lg shadow-lg"
    style="background: linear-gradient(90deg, {coloresModulo[moduloActual].start}, {coloresModulo[moduloActual].end});"
  >
    {tituloActual}
  </h1>
</div>

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

    <div class="w-full overflow-x-auto rounded-lg shadow-lg ">
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
<!-- Botón Eliminar -->
<button
  class="text-red-500 hover:scale-110 disabled:opacity-40"
  title="Eliminar"
  disabled={r.id_presu !== registros[registros.length - 1]?.id_presu}
  on:click={() => prepararEliminar(r)}
>
  <Trash2 class="w-4.3 h-5" />
</button>


<!-- Pencil -->
<button
  class="text-blue-500 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
  title="Editar"
  disabled={r.id_presu !== registros[registros.length - 1]?.id_presu}
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
