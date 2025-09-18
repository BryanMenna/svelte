<script>
// @ts-nocheck
export let modo = 'alta'; // 'alta', 'modificar', 'baja', 'consulta'
export let ingreso = { Codigo: '', Detalle: '', Presu: '', IT: '' };
export let onGuardar = () => {};
export let onCancelar = () => {};

import { masked_cod } from '$lib/utils/format.js';
import { mostrarToast } from '$lib/utils/mostrarToast.js';

// Variables reactivas para hover
let hoverGuardar = false;
let hoverCancelar = false;


function getTipoIT(it) {
  const txt = (it || '').toLowerCase();
  if (txt === 'título' || txt === 'titulo') return 'Título';
  return 'Imputable';
}

// Simulación de verificación de código
async function codigoExiste(codigo) {
  return false; // simula que no existe
}

// Simulación de función getPadre
function getPadre(codigo) {
  if (!codigo || codigo.length < 2) return null;
  return codigo.slice(0, codigo.length - 1);
}

async function validarYGuardar(e) {
  e.preventDefault();

  if (modo === 'alta') {
    if (await codigoExiste(ingreso.Codigo)) {
      mostrarToast("❌ El código ya existe.", "error");
      return;
    }
    const padre = getPadre(ingreso.Codigo);
    if (!padre) {
      mostrarToast("❌ El código debe tener un padre válido.", "error");
      return;
    }
  }

  if (modo === 'baja') {
    if (ingreso.IT?.toLowerCase() === "título" || ingreso.IT?.toLowerCase() === "titulo") {
      mostrarToast("❌ No se puede eliminar una cuenta Título.", "error");
      return;
    }
  }

  if (['alta','modificar','presu'].includes(modo)) {
    if (parseFloat(ingreso.Presu) < 0) {
      mostrarToast("❌ El importe debe ser mayor o igual a cero.", "error");
      return;
    }
  }

   onGuardar(ingreso);
}


function getColorsByModo(modo) {
  switch (modo) {
    case 'alta': return { base: '#2e8b57', hover: '#256d45' }; // Verde
    case 'modificar': return { base: '#1e90ff', hover: '#187bcd' }; // Azul
    case 'baja': return { base: '#c53030', hover: '#9b1c1c' }; // Rojo
    case 'consulta': return { base: '#00c950', hover: '#565e64' }; // Gris
    default: return { base: '#fdc700', hover: '#d4a700' }; // Amarillo
  }
}
</script>

<section class="w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6 max-w-2xl mx-auto">
  <!-- Encabezado -->
  <div class="px-5 py-2 text-white font-normal text-lg flex items-center justify-between"
       style="background: {getColorsByModo(modo).base}">
    <span style="text-transform: uppercase;">
      {modo === 'alta' 
        ? 'Nuevo Ingreso' 
        : modo === 'modificar' 
          ? 'Editar Ingreso' 
          : modo === 'baja' 
            ? 'Eliminar Ingreso' 
            : ' Ingreso'}
    </span>
    <button class="text-white hover:text-gray-100 text-2xl px-2 py-1 rounded transition" 
      style="background: transparent;" 
      aria-label="Cerrar" 
      on:click={onCancelar}>×</button>
  </div>

  <!-- Card/formulario interno -->
  <div class="p-6 bg-[#2a2f3a]">
    <div class="ingreso-card-section">
      <div class="ingreso-section-title">CREDENCIALES DEL INGRESO</div>
      <form on:submit|preventDefault={validarYGuardar} class="ingreso-form-grid" id="form-ingreso">
        
        <!-- Código -->
        <div class="ingreso-form-col">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="ingreso-label">Código:</label>
          {#if modo === 'alta'}
            <input
              type="text"
              maxlength="8"
              class="ingreso-input"
              bind:value={ingreso.Codigo}
              placeholder="Código"
              style="font-family: monospace"
              on:input={(e) => ingreso.Codigo = masked_cod(e.target.value)}
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
        </div>

        <!-- Detalle -->
        <div class="ingreso-form-col">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="ingreso-label">Detalle:</label>
          <input
            type="text"
            class="ingreso-input"
            bind:value={ingreso.Detalle}
            placeholder="Detalle"
            disabled={modo === 'consulta' || modo === 'baja'}
            style={(ingreso.IT?.toLowerCase() === 'título' || ingreso.IT?.toLowerCase() === 'titulo') 
              ? 'font-weight:bold;font-style:italic' : ''}
          />
        </div>

        <!-- Presupuesto -->
        <div class="ingreso-form-col">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="ingreso-label">Presupuesto:</label>
          <input
            type="number"
            step="0.01"
            min="0"
            class="ingreso-input"
            bind:value={ingreso.Presu}
            placeholder="$ 0.00"
            disabled={modo === 'consulta' || modo === 'baja'}
          />
        </div>

        <!-- Tipo de partida -->
        {#if modo !== 'alta'}
        <div class="ingreso-form-col">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="ingreso-label">Tipo de partida:</label>
          <input
            type="text"
            class="ingreso-input"
            value={getTipoIT(ingreso.IT)}
            disabled
          />
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
  {modo === 'consulta' ? 'Cerrar' : modo === 'baja' ? 'Eliminar' : 'Guardar'}
</button>
          

          <!-- svelte-ignore a11y_mouse_events_have_key_events -->
         <!-- Botón Cancelar -->
{#if modo !== 'consulta'}
  <!-- Botón Cancelar -->
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
    on:click={onCancelar}
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
.ingreso-card-section {
  background: transparent;
  border-radius: 12px;
  box-shadow: none;
  padding: 0;
  margin-bottom: 0;
  width: 100%;
  display: block;
}
.ingreso-section-title {
  color: #e07676;
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: .7px;
  text-transform: uppercase;
}
.ingreso-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 26px 28px;
  margin-bottom: 16px;
  width: 100%;
}
@media (max-width: 900px) {
  .ingreso-form-grid { grid-template-columns: 1fr; }
}
.ingreso-form-col {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.ingreso-label {
  color: #fff;
  font-weight: 500;
  margin-bottom: 7px;
  font-size: 1.09rem;
  letter-spacing: .2px;
}
.ingreso-input {
  background-color: #2b3242;
  color: #fff;
  border-radius: 6px;
  border: 1px solid #777;
  padding: 10px 16px;
  font-size: 1rem;
  width: 100%;
  outline: none;
  transition: border-color 0.2s;
  min-height: 44px;
}
.ingreso-input:focus {
  border-color: #3585fd;
}
.ingreso-btn-actions {
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  margin-top: 8px;
  width: 100%;
}
</style>
