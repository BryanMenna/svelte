<script>
// @ts-nocheck
export let modo = "alta"; // alta | editar | ver | eliminar
export let formData = {};
export let opcionesTipo = [];
export let minVigencia = "";
export let minPromulgacion = "";
export let maxFecha = "";
export let masked_cod;
// svelte-ignore export_let_unused
export let getPadre;
export let guardarPresupuesto;
export let cerrarFormulario;
export let cargarRegistros;
export let mostrarToast;
// svelte-ignore export_let_unused
export let onCancelar;
// svelte-ignore export_let_unused
export let picIG = "9.9.99.99.99";
export let anioSeleccionado;

// 🔹 estado local para hover del botón Cancelar
let hoverCancelar = false;

// Colores dinámicos según modo
$: colorHeader = modo === "alta" ? "#450786" 
                : modo === "editar" ? "#21a9fd"
                : modo === "eliminar" ? "#fb2c36"
                : "#666";

$: colorBoton = colorHeader;

function onNumeroInput(e) {
  const digits = String(e.target.value || '').replace(/\D/g, '');
  // masked_cod espera la cadena sin separadores y aplica picIG
  formData.numero = masked_cod(digits);
}

async function handleSubmit(e) {
  e.preventDefault();

  const fechaV = new Date(formData.fecha_vig);
  const fechaP = new Date(formData.fecha_pro);

  const limiteMinVig = new Date(minVigencia);
  const limiteMinPro = new Date(minPromulgacion);
  const limiteMax = new Date(`${anioSeleccionado}-12-31`);

  // Validación de Vigencia
  if (fechaV < limiteMinVig || fechaV > limiteMax) {
    mostrarToast({
      mensaje: `⚠️ La fecha de Vigencia debe estar entre ${minVigencia} y ${maxFecha}.`,
      tipo: "danger"
    });
    return;
  }

  // Validación de Promulgación
  if (fechaP < limiteMinPro || fechaP > limiteMax) {
    mostrarToast({
      mensaje: `⚠️ La fecha de Promulgación debe estar entre ${minPromulgacion} y ${maxFecha}.`,
      tipo: "danger"
    });
    return;
  }

  try {
    const result = await guardarPresupuesto(formData, modo);
    if (result) {
      mostrarToast({
        mensaje: modo === "alta"
          ? "Presupuesto creado con éxito ✅"
          : modo === "editar"
          ? "Presupuesto actualizado con éxito ✏️"
          : modo === "eliminar"
          ? "Presupuesto eliminado ❌"
          : "Operación completada",
        tipo: "success"
      });

      cerrarFormulario();
      await cargarRegistros();
    }
  } catch (err) {
    console.error("❌ Error en handleSubmit:", err);
    mostrarToast({
      mensaje: "Error al guardar el presupuesto",
      tipo: "danger"
    });
  }
}


</script>

<div class="flex items-center justify-center min-h-screen">
<section class="w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6 ">
  <!-- 🔹 Encabezado -->
  <div class="px-5 py-3 text-white font-semibold text-lg flex items-center justify-between"
       style="background-color: {colorHeader}">
    <span class="uppercase">
      {modo === "alta"
        ? "Nuevo Presupuesto"
        : modo === "editar"
        ? "Editar Presupuesto"
        : modo === "ver"
        ? "Ver Presupuesto"
        : "Eliminar Presupuesto"}
    </span>
    <button class="text-white text-2xl px-2 py-1" on:click={cerrarFormulario}>×</button>
  </div>

  <!-- 🔹 Contenido -->
  <div class="p-4 sm:p-6 bg-[#212631] rounded-b-xl">
    <div class="mb-4 text-red-400 font-semibold text-sm sm:text-base">
      CREDENCIALES DEL PRESUPUESTO
    </div>

    <form on:submit={handleSubmit} class="grid grid-cols-1 md:grid-cols-2 gap-4 ">
      
      <!-- Tipo -->
<div>
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="block text-sm text-gray-300 mb-1">Tipo:</label>
  <select
    bind:value={formData.tipo}
    disabled={modo !== "alta"}  
    class="w-full bg-[#2a2f3a] text-white rounded-md px-3 py-2 text-sm sm:text-base"
  >
    {#each opcionesTipo as opcion}
      <option value={opcion}>{opcion}</option>
    {/each}
  </select>
</div>


      <!-- Número -->
<div>
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="block text-sm text-gray-300 mb-1">Número:</label>
  <input
    type="text"
    bind:value={formData.numero}
    placeholder="Ingrese número de ordenanza"
    class="w-full bg-[#2a2f3a] text-white rounded-md px-3 py-2 text-sm sm:text-base"
    disabled={modo === "ver" || modo === "eliminar"}
  />
</div>

<!-- Fecha Vigencia -->
<input
  type="date"
  bind:value={formData.fecha_vig}
  class="w-full bg-[#2a2f3a] text-white rounded-md px-3 py-2 text-sm sm:text-base"
  disabled={modo === "ver" || modo === "eliminar" || formData.fechasBloqueadas}
/>

<!-- Fecha Promulgación -->
<input
  type="date"
  bind:value={formData.fecha_pro}
  class="w-full bg-[#2a2f3a] text-white rounded-md px-3 py-2 text-sm sm:text-base"
  disabled={modo === "ver" || modo === "eliminar" || formData.fechasBloqueadas}
/>


      <!-- Botones -->
      {#if modo !== "ver"}
        <div class="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-3 justify-end mt-4">
          <!-- svelte-ignore a11y_mouse_events_have_key_events -->
          <button
  type="submit"
  class="px-4 py-2 rounded-lg font-medium transition-colors"
  style="
    background: {modo === 'alta' ? '#450786'
               : modo === 'editar' ? '#0d6efd'
               : modo === 'eliminar' ? '#dc3545'
               : '#6c757d'};
    color: #fff;
    border: 1px solid transparent;
  "
  on:mouseover={(e) => {
    e.currentTarget.style.opacity = '0.85';
  }}
  on:mouseout={(e) => {
    e.currentTarget.style.opacity = '1';
  }}
>
  {modo === 'alta' ? 'Guardar'
   : modo === 'editar' ? 'Guardar'
   : modo === 'eliminar' ? 'Eliminar'
   : 'Cerrar'}
</button>

          <!-- svelte-ignore a11y_mouse_events_have_key_events -->
       
<!-- Botón Cancelar -->
<button
  type="button"
  class="px-4 py-2 rounded-lg font-medium transition-colors"
  style="
    background: transparent;
    color: {modo === 'alta' ? '#450786'
           : modo === 'editar' ? '#0d6efd'
           : modo === 'eliminar' ? '#dc3545'
           : '#666'};
    border: 1px solid {modo === 'alta' ? '#450786'
                     : modo === 'editar' ? '#0d6efd'
                     : modo === 'eliminar' ? '#dc3545'
                     : '#666'};
  "
  on:click={cerrarFormulario}
  on:mouseover={(e) => {
    e.currentTarget.style.background = (modo === 'alta' ? '#450786'
                                : modo === 'editar' ? '#0d6efd'
                                : modo === 'eliminar' ? '#dc3545'
                                : '#666');
    e.currentTarget.style.color = '#fff';
  }}
  on:mouseout={(e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = (modo === 'alta' ? '#450786'
                             : modo === 'editar' ? '#0d6efd'
                             : modo === 'eliminar' ? '#dc3545'
                             : '#666');
  }}
>
  Cancelar
</button>



        </div>
      {/if}
    </form>
  </div>
</section>
</div>