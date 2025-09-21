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
  partes.pop(); // saco el último nivel
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
// 🔹 Validaciones
async function validar() {
  errores = {};

  // ⚡ En alta
  if (modo === "alta") {
    if (!ingreso.Codigo) {
      errores.Codigo = "Debe ingresar un código";
    } else {
      // Verificar que no exista en BD
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
            // Revisar si el padre existe en la BD
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
    <div class="grid">
      <!-- Código -->
      <div class="campo">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>Código:</label>
        <input
          type="text"
          placeholder="Ej: 9.9.99.99"
          bind:value={ingreso.Codigo}
          disabled={modo !== "alta"}
          on:input={(e) => ingreso.Codigo = e.target.value.replace(/\D/g, "")}
        />
        {#if modo !== "alta"}
          <small class="info">{masked_cod(ingreso.Codigo)}</small>
        {/if}
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
          on:blur={(e) => e.target.value = formatMoney(ingreso.Presu)}
        />
        {#if errores.Presu}<p class="error">{errores.Presu}</p>{/if}
      </div>

      <!-- Tipo de partida: solo mostrar en baja / modificar / consulta -->
      {#if modo !== "alta"}
        <div class="campo">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label>Tipo de partida:</label>
          <input 
            type="text" 
            value={ingreso.IT?.toUpperCase() === "TÍTULO" ? "Título" : "Imputable"} 
            disabled 
          />
        </div>
      {/if}
    </div>
  </div>

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
.info {
  font-size: 0.8rem;
  color: #ccc;
  margin-top: 4px;
}
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
