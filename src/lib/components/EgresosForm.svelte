<script>
// @ts-nocheck
import { createEventDispatcher } from "svelte";
import { masked_cod } from '$lib/utils/format.js';
import { mostrarToast } from '$lib/utils/mostrarToast.js';

const dispatch = createEventDispatcher();

export let modo = 'alta'; // 'alta' | 'modificar' | 'baja' | 'consulta' | 'presu'
export let egreso = { Codigo: '', Detalle: '', Presu: '', IT: '' };

let hoverGuardar = false;

function getTipoIT(it) {
  const txt = (it || '').toLowerCase();
  return (txt === 'título' || txt === 'titulo') ? 'Título' : 'Imputable';
}


async function codigoExiste(codigo) {
  // Aquí deberías consultar tu API/BD
  return false;
}

function getPadre(codigo) {
  if (!codigo || codigo.length < 2) return null;
  return codigo.slice(0, codigo.length - 1);
}

async function validarYGuardar(e) {
  e.preventDefault();

  // 🔹 Validaciones en ALTA
  if (modo === 'alta') {
    // 1. Verificar código repetido
    if (await codigoExiste(egreso.Codigo)) {
      mostrarToast("❌ El código ya existe.", "error");
      return;
    }

    // 2. Verificar padre
    const padre = getPadre(egreso.Codigo);
    if (!padre) {
      mostrarToast("❌ El código debe tener un padre válido.", "error");
      return;
    }
  }

  // 🔹 Validaciones en BAJA
  if (modo === 'baja') {
    if (egreso.IT?.toLowerCase() === "título" || egreso.IT?.toLowerCase() === "titulo") {
      mostrarToast("❌ No se puede eliminar una cuenta Título.", "error");
      return;
    }
  }

  // 🔹 Validaciones en ALTA, MODIFICAR y PRESU
  if (['alta','modificar','presu'].includes(modo)) {
    if (parseFloat(egreso.Presu) < 0) {
      mostrarToast("❌ El importe debe ser mayor o igual a cero.", "error");
      return;
    }
  }

  // ✅ Si pasó todas las validaciones, guardamos
  dispatch("guardar", egreso);
}




function getColorsByModo(modo) {
  switch(modo){
    case 'alta': return { base: '#2e8b57', hover: '#256d45' };
    case 'modificar': return { base: '#1e90ff', hover: '#187bcd' };
    case 'baja': return { base: '#c53030', hover: '#9b1c1c' };
    case 'consulta': return { base: '#6b7280', hover: '#565e64' };
    default: return { base: '#fdc700', hover: '#d4a700' };
  }
}
</script>

<section class="w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6 mx-auto">
  <!-- Encabezado -->
  <div class="px-5 py-2 text-white font-normal text-lg flex items-center justify-between"
       style="background: {getColorsByModo(modo).base}">
    <span style="text-transform: uppercase;">
      {modo === 'alta' ? 'Nuevo Egreso'
       : modo === 'modificar' ? 'Editar Egreso'
       : modo === 'baja' ? 'Eliminar Egreso'
       : 'Detalle de Egreso'}
    </span>
    <button class="text-white text-2xl px-2" on:click={() => dispatch("cancelar")}>×</button>
  </div>

  <!-- Formulario -->
  <form class="p-6 bg-[#2a2f3a] ingreso-form-grid" on:submit|preventDefault={validarYGuardar}>
    
    <!-- Código -->
    <div class="ingreso-form-col">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="ingreso-label">Código:</label>
      {#if modo === 'alta'}
        <input type="text" maxlength="8" class="ingreso-input"
          bind:value={egreso.Codigo}
          placeholder="Código"
          style="font-family: monospace" />
      {:else}
        <input type="text" class="ingreso-input"
          value={masked_cod(egreso.Codigo)}
          disabled
          style="font-family: monospace" />
      {/if}
    </div>

    <!-- Detalle -->
    <div class="ingreso-form-col">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="ingreso-label">Detalle:</label>
      <input type="text" class="ingreso-input"
        bind:value={egreso.Detalle}
        placeholder="Detalle"
        disabled={modo === 'consulta' || modo === 'baja'} />
    </div>

    <!-- Presupuesto -->
    <div class="ingreso-form-col">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="ingreso-label">Presupuesto:</label>
      <input type="number" step="0.01" min="0"
        class="ingreso-input"
        bind:value={egreso.Presu}
        placeholder="$ 0.00"
        disabled={modo === 'consulta' || modo === 'baja'} />
    </div>

    
    <!-- Tipo de partida -->
{#if modo !== 'alta'}
<div class="ingreso-form-col">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="ingreso-label">Tipo de partida:</label>
  <input type="text" class="ingreso-input"
    value={getTipoIT(egreso.IT)}
    disabled />
</div>
{/if}


    <!-- Botonera -->
    <div class="ingreso-btn-actions">
      <!-- svelte-ignore a11y_mouse_events_have_key_events -->
      <button type="submit"
        class="px-4 py-2 rounded text-white font-medium transition"
        style="background: {hoverGuardar ? getColorsByModo(modo).hover : getColorsByModo(modo).base}"
        on:mouseover={() => hoverGuardar = true}
        on:mouseout={() => hoverGuardar = false}>
        {modo === 'consulta' ? 'Cerrar'
          : modo === 'baja' ? 'Eliminar'
          : 'Guardar'}
      </button>
      {#if modo !== 'consulta'}
      <button type="button" class="px-4 py-2 rounded font-medium ml-2"
        style="border:1px solid {getColorsByModo(modo).base}; color:{getColorsByModo(modo).base}; background:transparent"
        on:click={() => dispatch("cancelar")}>
        Cancelar
      </button>
      {/if}
    </div>
  </form>
</section>

<style>
.ingreso-form-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:5px; }
.ingreso-form-col { display:flex; flex-direction:column; }
.ingreso-label { color:#fff; margin-bottom:5px; font-weight:500; }
.ingreso-input { background:#2b3242; color:#fff; border:1px solid #777; border-radius:6px; padding:10px 16px; }
.ingreso-btn-actions { grid-column: span 2; display:flex; justify-content:flex-end; gap:12px; margin-top:12px; }
</style>
