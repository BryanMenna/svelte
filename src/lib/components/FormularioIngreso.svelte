<script>
// @ts-nocheck
import { createEventDispatcher } from "svelte";
import { mostrarToast } from "$lib/utils/mostrarToast.js";

export let modo = "alta"; // 'alta' | 'modificar' | 'baja' | 'consulta' | 'presu'
export let ingreso = { Codigo: "", Detalle: "", Presu: 0, IT: "", TP: "" };
export let picIG = "9.9.99.99.99";   // máscara de código
export let onGuardar = () => {};
export let onCancelar = () => {};
export let ingresosIdPresu = null;   // ⚡ necesario para validar contra la BD

const dispatch = createEventDispatcher();
let errores = {};

// 🔹 Enmascarar el código
function masked_cod(partIN) {
  if (!partIN) return "";
  let posPart = 0;
  let resultado = "";
  for (let i = 0; i < picIG.length && posPart < partIN.length; i++) {
    if (picIG[i] === ".") {
      resultado += ".";
    } else {
      resultado += partIN[posPart];
      posPart++;
    }
  }
  return resultado;
}

// 🔹 Obtener padre
function getPadre(partIN) {
  const conMascara = masked_cod(partIN);
  if (!conMascara.includes(".")) return "";
  const partes = conMascara.split(".");
  partes.pop();
  return partes.join(".");
}

// 🔹 Formatear presupuesto
function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
  }).format(value);
}

// 🔹 Validaciones
async function validar() {
  errores = {};

  // ⚡ En alta
  if (modo === "alta") {
    if (!ingreso.Codigo) {
      errores.Codigo = "Debe ingresar un código";
    } else {
      try {
        const res = await fetch(`/api/ingresos?idPresu=${ingresosIdPresu}`);
        if (res.ok) {
          const lista = await res.json();
          const existe = lista.some(item => String(item.Codigo) === String(ingreso.Codigo));
          if (existe) {
            errores.Codigo = "El código ya existe en este presupuesto";
          }

          // Verificar que tenga padre
          const padre = getPadre(ingreso.Codigo);
          if (!padre) {
            errores.Codigo = "El código debe tener un padre válido";
          } else {
            const padreExiste = lista.some(item => masked_cod(item.Codigo) === padre);
            if (!padreExiste) {
              errores.Codigo = `El código padre (${padre}) no existe en este presupuesto`;
            }
          }
        }
      } catch (err) {
        console.error("Error validando código:", err);
        mostrarToast({ mensaje: "Error validando código", tipo: "danger" });
      }
    }
  }

  // ⚡ En baja: no se puede eliminar un TÍTULO
  if (modo === "baja" && ingreso.IT?.toUpperCase() === "TÍTULO") {
    errores.IT = "No se puede eliminar una cuenta Título";
  }

  // ⚡ En todos los modos menos consulta: detalle obligatorio
  if (!ingreso.Detalle && modo !== "consulta") {
    errores.Detalle = "Debe ingresar un detalle";
  }

  // ⚡ En alta, modificar o presu: presupuesto >= 0
  if ((modo === "alta" || modo === "modificar" || modo === "presu") && ingreso.Presu < 0) {
    errores.Presu = "El importe debe ser mayor o igual a 0";
  }

  return Object.keys(errores).length === 0;
}

async function guardar() {
  if (!(await validar())) {
    mostrarToast({ mensaje: "Errores en el formulario", tipo: "danger" });
    return;
  }
  onGuardar(ingreso);
  dispatch("guardar", ingreso);
}

// 🔹 Colores dinámicos según modo
function getColorsByModo(modo) {
  switch(modo){
    case 'alta': return { base: '#2e8b57', hover: '#256d45' };      // verde
    case 'modificar': return { base: '#1e90ff', hover: '#187bcd' }; // azul
    case 'baja': return { base: '#c53030', hover: '#9b1c1c' };      // rojo
    case 'consulta': return { base: '#00c950', hover: 'bg-green-500' };  // gris
    default: return { base: '#fdc700', hover: '#d4a700' };          // amarillo
  }
}

function getTipoIT(it) {
  const txt = (it || '').toLowerCase();
  return (txt === 'título' || txt === 'titulo') ? 'Título' : 'Imputable';
}
</script>

<section class="w-full max-w-[1100px] rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6 mx-auto">
  <!-- Encabezado -->
  <div class="px-5 py-2 text-white font-normal text-lg flex items-center justify-between"
       style="background: {getColorsByModo(modo).base}">
    <span style="text-transform: uppercase;">
      {modo === "alta" ? "Nueva Partida de Ingreso" :
       modo === "modificar" ? "Editar Partida de Ingreso" :
       modo === "baja" ? "Eliminar Partida de Ingreso" :
       modo === "consulta" ? "Consulta de Ingreso" :
       "Actualizar Presupuesto"}
    </span>
    <button class="text-white text-2xl px-2" on:click={onCancelar}>×</button>
  </div>

  <!-- Formulario -->
  <form class="p-6 bg-[#2a2f3a] ingreso-form-grid" on:submit|preventDefault={guardar}>
    
    <!-- Código -->
   <!-- Código -->
<div class="ingreso-form-col">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="ingreso-label">Código:</label>

  {#if modo === "alta"}
    <input
      type="text"
      maxlength="8"
      class="ingreso-input"
      bind:value={ingreso.Codigo}
      placeholder="Ej: 9.9.99.99"
      style="font-family: monospace"
      on:input={(e) => {
        const raw = e.target.value.replace(/\D/g, ""); // solo dígitos
        ingreso.Codigo = raw;
        e.target.value = masked_cod(raw); // mostrar enmascarado
      }}
    />
  {:else}
    <input
      type="text"
      class="ingreso-input"
      value={masked_cod(ingreso.Codigo)}
      disabled
      style="font-family: monospace"
    />
  {/if}

  {#if errores.Codigo}<p class="error">{errores.Codigo}</p>{/if}
</div>


    <!-- Detalle -->
    <div class="ingreso-form-col">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="ingreso-label">Detalle:</label>
      <input type="text" class="ingreso-input"
        bind:value={ingreso.Detalle}
        placeholder="Detalle del ingreso"
        disabled={modo === "consulta" || modo === "baja"} />
      {#if errores.Detalle}<p class="error">{errores.Detalle}</p>{/if}
    </div>

    <!-- Presupuesto -->
      <!-- svelte-ignore a11y_label_has_associated_control -->
    <div class="ingreso-form-col">
      <label class="ingreso-label">Presupuesto:</label>
      <input type="number" step="0.01" min="0"
        class="ingreso-input"
        bind:value={ingreso.Presu}
        placeholder="$ 0.00"
        disabled={modo === "consulta" || modo === "baja"}
        on:blur={(e) => e.target.value = formatMoney(ingreso.Presu)} />
      {#if errores.Presu}<p class="error">{errores.Presu}</p>{/if}
    </div>

    <!-- Tipo de partida -->
    {#if modo !== "alta"}
      <div class="ingreso-form-col">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="ingreso-label">Tipo de partida:</label>
        <input type="text" class="ingreso-input"
          value={getTipoIT(ingreso.IT)}
          disabled />
      </div>
    {/if}

    <!-- Botonera -->
    <div class="ingreso-btn-actions">
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
      {#if modo !== "consulta"}
        <button type="submit"
          class="px-4 py-2 rounded text-white font-medium transition"
          style="background:{getColorsByModo(modo).base}"
          on:mouseover={(e) => e.currentTarget.style.background = getColorsByModo(modo).hover}
          on:mouseout={(e) => e.currentTarget.style.background = getColorsByModo(modo).base}>
          {modo === "baja" ? "Eliminar" : "Guardar"}
        </button>
      {/if}
      <!-- svelte-ignore a11y_mouse_events_have_key_events -->
      <button type="button" class="px-4 py-2 rounded font-medium ml-2"
        style="border:1px solid {getColorsByModo(modo).base}; color:{getColorsByModo(modo).base}; background:transparent"
        on:mouseover={(e) => {
          e.currentTarget.style.background = getColorsByModo(modo).base;
          e.currentTarget.style.color = "#fff";
        }}
        on:mouseout={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = getColorsByModo(modo).base;
        }}
        on:click={onCancelar}>
        Cancelar
      </button>
    </div>
  </form>
</section>

<style>
.ingreso-form-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:5px; }
.ingreso-form-col { display:flex; flex-direction:column; }
.ingreso-label { color:#fff; margin-bottom:5px; font-weight:500; }
.ingreso-input { background:#2b3242; color:#fff; border:1px solid #777; border-radius:6px; padding:10px 16px; }
.ingreso-btn-actions { grid-column: span 2; display:flex; justify-content:flex-end; gap:12px; margin-top:12px; }
.error { font-size:0.8rem; color:#f87171; margin-top:2px; }
</style>
