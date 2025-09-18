<script>
// @ts-nocheck
import { createEventDispatcher } from "svelte";
import { masked_cod } from '$lib/utils/format.js';
import { mostrarToast } from '$lib/utils/mostrarToast.js';

const dispatch = createEventDispatcher();

export let modo = 'alta'; // 'alta', 'modificar', 'baja', 'consulta', 'presu'
export let egreso = { Codigo: '', Detalle: '', Presu: '', IT: '' };

let hoverGuardar = false;
let hoverCancelar = false;

function getTipoIT(it) {
  const txt = (it || '').toLowerCase();
  if (txt === 'título' || txt === 'titulo') return 'Título';
  return 'Imputable';
}

async function codigoExiste(codigo) {
  return false;
}

function getPadre(codigo) {
  if (!codigo || codigo.length < 2) return null;
  return codigo.slice(0, codigo.length - 1);
}

async function validarYGuardar(e) {
  e.preventDefault();

  if (modo === 'alta') {
    if (await codigoExiste(egreso.Codigo)) {
      mostrarToast("❌ El código ya existe.", "error");
      return;
    }
    const padre = getPadre(egreso.Codigo);
    if (!padre) {
      mostrarToast("❌ El código debe tener un padre válido.", "error");
      return;
    }
  }

  if (modo === 'baja') {
    if (egreso.IT?.toLowerCase() === "título" || egreso.IT?.toLowerCase() === "titulo") {
      mostrarToast("❌ No se puede eliminar una cuenta Título.", "error");
      return;
    }
  }

  if (['alta','modificar','presu'].includes(modo)) {
    if (parseFloat(egreso.Presu) < 0) {
      mostrarToast("❌ El importe debe ser mayor o igual a cero.", "error");
      return;
    }
  }

  mostrarToast("✅ Operación realizada con éxito", "success");
  dispatch("guardar", egreso);
}

function getColorsByModo(modo) {
  switch(modo){
    case 'alta': return { base: '#2e8b57', hover: '#256d45' };
    case 'modificar': return { base: '#1e90ff', hover: '#187bcd' };
    case 'baja': return { base: '#c53030', hover: '#9b1c1c' };
    case 'consulta': return { base: '#00c950', hover: '#565e64' };
    default: return { base: '#fdc700', hover: '#d4a700' };
  }
}
</script>

<section class="w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6 max-w-2xl mx-auto">
  <!-- Encabezado -->
  <div class="px-5 py-2 text-white font-normal text-lg flex items-center justify-between"
       style="background: {getColorsByModo(modo).base}">
    <span style="text-transform: uppercase;">
      {modo === 'alta' ? 'Nuevo Egreso' 
       : modo === 'modificar' ? 'Editar Egreso' 
       : modo === 'baja' ? 'Eliminar Egreso' 
       : ' Egreso'}
    </span>
    <button class="text-white hover:text-gray-100 text-2xl px-2 py-1 rounded transition" 
      style="background: transparent;" 
      aria-label="Cerrar" 
      on:click={() => dispatch("cancelar")}>×</button>
  </div>

  <!-- Card/formulario interno -->
  <div class="p-6 bg-[#2a2f3a]">
    <div class="ingreso-card-section">
      <div class="ingreso-section-title">CREDENCIALES DEL EGRESO</div>
      <form on:submit|preventDefault={validarYGuardar} class="ingreso-form-grid">
        
        <!-- Código -->
        <div class="ingreso-form-col">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="ingreso-label">Código:</label>
          {#if modo === 'alta'}
            <input type="text" maxlength="8" class="ingreso-input"
              bind:value={egreso.Codigo}
              placeholder="Código"
              style="font-family: monospace"
              on:input={(e) => egreso.Codigo = masked_cod(e.target.value)} />
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
            disabled={modo === 'consulta' || modo === 'baja'}
            style={(egreso.IT?.toLowerCase() === 'título' || egreso.IT?.toLowerCase() === 'titulo') 
              ? 'font-weight:bold;font-style:italic' : ''}/>
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
          <button 
  type="submit"
  class="px-4 py-2 rounded text-white transition font-medium"
  style="background: {hoverGuardar ? getColorsByModo(modo).hover : getColorsByModo(modo).base};"
  on:mouseover={() => hoverGuardar = true}
  on:mouseout={() => hoverGuardar = false}>
  {modo === 'consulta' ? 'Cerrar' 
    : modo === 'baja' ? 'Eliminar' 
    : 'Guardar'}
</button>

          <!-- svelte-ignore a11y_mouse_events_have_key_events -->
         <!-- Botón Cancelar -->
          {#if modo !== 'consulta'}
<button
  type="button"
  class="px-4 py-2 rounded font-medium transition-colors ml-2"
  style="
    background: transparent;
    color: {getColorsByModo(modo).base};
    border: 1px solid {getColorsByModo(modo).base};
  "
  on:mouseover={(e) => {
    e.currentTarget.style.background = getColorsByModo(modo).base;
    e.currentTarget.style.color = '#fff';
  }}
  on:mouseout={(e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = getColorsByModo(modo).base;
  }}
  on:click={() => dispatch("cancelar")}
>
  Cancelar
</button>
{/if}

        </div>

      </form>
    </div>
  </div>
</section>

<style>
.ingreso-card-section { background: transparent; border-radius: 12px; box-shadow: none; padding: 0; }
.ingreso-section-title { color: #e07676; font-size: 1.05rem; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; }
.ingreso-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 26px 28px; margin-bottom: 16px; }
.ingreso-form-col { display: flex; flex-direction: column; }
.ingreso-label { color: #fff; font-weight: 500; margin-bottom: 7px; }
.ingreso-input { background-color: #2b3242; color: #fff; border-radius: 6px; border: 1px solid #777; padding: 10px 16px; font-size: 1rem; }
.ingreso-input:focus { border-color: #3585fd; }
.ingreso-btn-actions { grid-column: span 2; display: flex; justify-content: flex-end; gap: 18px; margin-top: 8px; }


</style>
