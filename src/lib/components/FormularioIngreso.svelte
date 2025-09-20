<script>
// @ts-nocheck
import { createEventDispatcher } from "svelte";
import { mostrarToast } from "$lib/utils/mostrarToast.js";

export let modo = "alta"; // 'alta' | 'modificar' | 'baja' | 'consulta' | 'presu'
export let ingreso = { Codigo: "", Detalle: "", Presu: 0, IT: "", TP: "" };
// svelte-ignore export_let_unused
export let picIG = "";
export let onGuardar = () => {};
export let onCancelar = () => {};

const dispatch = createEventDispatcher();
let errores = {};

// Validaciones
function validar() {
  errores = {};

  if (modo === "alta") {
    if (!ingreso.Codigo) errores.Codigo = "Debe ingresar un código";
    if (!ingreso.Detalle) errores.Detalle = "Debe ingresar un detalle";
    if (ingreso.Presu < 0) errores.Presu = "El presupuesto no puede ser negativo";
  }

  if (modo === "baja" && ingreso.IT?.toUpperCase() === "TÍTULO") {
    errores.IT = "No se puede eliminar una cuenta Título";
  }

  if (modo === "presu" && ingreso.Presu < 0) {
    errores.Presu = "El importe debe ser mayor o igual a 0";
  }

  return Object.keys(errores).length === 0;
}

async function guardar() {
  if (!validar()) {
    mostrarToast({ mensaje: "Errores en el formulario", tipo: "danger" });
    return;
  }
  onGuardar(ingreso);
  dispatch("guardar", ingreso);
}

// 🔹 Colores dinámicos igual que egresos
function getColorsByModo(modo) {
  switch(modo){
    case 'alta': return { base: '#2e8b57', hover: '#256d45' };      // verde
    case 'modificar': return { base: '#1e90ff', hover: '#187bcd' }; // azul
    case 'baja': return { base: '#c53030', hover: '#9b1c1c' };      // rojo
    case 'consulta': return { base: '#00c950', hover: '#028c46' };  // verde claro
    default: return { base: '#fdc700', hover: '#d4a700' };          // amarillo
  }
}
</script>

<!-- Contenedor principal -->
<div class="modal">
  <div class="modal-header" style="background: {getColorsByModo(modo).base}">
    <h3>
      {modo === "alta" ? "ALTA PARTIDA DE INGRESO" :
       modo === "modificar" ? "EDITAR PARTIDA DE INGRESO" :
       modo === "baja" ? "ELIMINAR PARTIDA DE INGRESO" :
       modo === "consulta" ? "CONSULTA DE INGRESO" :
       "ACTUALIZAR PRESUPUESTO"}
    </h3>
    <button class="cerrar" on:click={onCancelar}>×</button>
  </div>

  <div class="modal-body">
    <!-- Grid 2 columnas -->
    <div class="grid">
      <!-- Código -->
      <div class="campo">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>Código:</label>
        <input
          type="text"
          bind:value={ingreso.Codigo}
          placeholder="Ej: 9.9.99.99"
          disabled={modo !== "alta"}
        />
        {#if errores.Codigo}<p class="error">{errores.Codigo}</p>{/if}
      </div>

      <!-- Detalle -->
      <div class="campo">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>Detalle:</label>
        <input
          type="text"
          bind:value={ingreso.Detalle}
          placeholder="Detalle del ingreso"
          disabled={modo === "consulta" || modo === "baja"}
        />
        {#if errores.Detalle}<p class="error">{errores.Detalle}</p>{/if}
      </div>

      <!-- Presupuesto -->
      <div class="campo">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>Presupuesto:</label>
        <input
          type="number"
          min="0"
          step="0.01"
          bind:value={ingreso.Presu}
          disabled={modo === "consulta" || modo === "baja"}
        />
        {#if errores.Presu}<p class="error">{errores.Presu}</p>{/if}
      </div>

      <!-- Tipo de partida -->
      <div class="campo">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>Tipo de partida:</label>
        <input type="text" bind:value={ingreso.IT} disabled />
      </div>
    </div>
  </div>

  <!-- Footer botones -->
 <!-- Footer botones -->
<div class="modal-footer">
  {#if modo !== "consulta"}
    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
    <button on:click={guardar} class="guardar"
      style="background: {getColorsByModo(modo).base};"
      on:mouseover={(e) => e.currentTarget.style.background = getColorsByModo(modo).hover}
      on:mouseout={(e) => e.currentTarget.style.background = getColorsByModo(modo).base}>
      {modo === "baja" ? "Eliminar" : "Guardar"}
    </button>
  {/if}

  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <button on:click={onCancelar} class="cancelar"
    style="color: {getColorsByModo(modo).base}; border: 1px solid {getColorsByModo(modo).base};"
    on:mouseover={(e) => {
      e.currentTarget.style.background = getColorsByModo(modo).base;
      e.currentTarget.style.color = '#fff';
    }}
    on:mouseout={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = getColorsByModo(modo).base;
    }}>
    Cancelar
  </button>
</div>

</div>

<style>
.modal {
  background: #2a2f3a;
  border-radius: 8px;
  overflow: hidden;
  color: white;
  width: 100%;
  max-width: none;
  margin: 0 auto;
  height: auto;
}

.modal-header {
  color: white;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 { margin: 0; font-size: 1rem; text-transform: uppercase; }
.cerrar {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.4rem;
  cursor: pointer;
}

.modal-body { padding: 24px; }
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  width: 100%;
}
.campo { display: flex; flex-direction: column; width: 100%; }
.campo label { font-weight: bold; margin-bottom: 6px; }
.campo input {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: none;
  background: #212631;
  color: white;
  font-size: 1rem;
  border: 1px solid #777;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
}
.guardar {
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
}
.cancelar {
  background: transparent;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}
.error {
  font-size: 0.8rem;
  color: #f87171;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
