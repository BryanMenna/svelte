<script>
// @ts-nocheck
  export let modo = 'alta'; // 'alta', 'modificar', 'baja', 'consulta'
  export let ingreso = { Codigo: '', Detalle: '', Presu: '', IT: '' };
  export let onGuardar = () => {};
  export let onCancelar = () => {};

  import { masked_cod } from '$lib/utils/format.js';
  import { mostrarToast } from '$lib/utils/mostrarToast.js';
  import { IconName } from 'svelte-hero-icons';

  function getTipoIT(it) {
    const txt = (it || '').toLowerCase();
    if (txt === 'título' || txt === 'titulo') return 'Título';
    return 'Imputable';
  }

  // 🚨 Simulación de función para verificar existencia de código (backend real debería validar)
  async function codigoExiste(codigo) {
    // Ejemplo de fetch real:
    // const res = await fetch(`/api/ingresos/check/${codigo}`);
    // const data = await res.json();
    // return data.exists;
    return false; // simulo que no existe
  }

  // 🚨 Simulación de función getPadre (en backend real deberías validar contra BD)
  function getPadre(codigo) {
    if (!codigo || codigo.length < 2) return null;
    return codigo.slice(0, codigo.length - 1);
  }

  async function validarYGuardar(e) {
    e.preventDefault();

    // 🚨 VALIDACIONES
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

    // ✅ Si todo está OK
    mostrarToast("✅ Operación realizada con éxito", "success");
    onGuardar(ingreso);
  }
</script>

<section class="w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6 max-w-2xl mx-auto">
  <!-- Encabezado -->
  <div class="px-5 py-2 bg-[#fdc700] text-white font-normal text-lg flex items-center justify-between">
    <span style="text-transform: uppercase;">
      {modo === 'alta' ? 'Nuevo Ingreso' : 'Ingreso'}
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
          <button type="submit" class="ingreso-submit" tabindex="0">
            {modo === 'alta' ? 'Guardar' 
              : modo === 'modificar' ? 'Modificar' 
              : modo === 'baja' ? 'Eliminar' 
              : 'Cerrar'}
          </button>
          <button type="button" class="ingreso-cancel" on:click={onCancelar} tabindex="0">
            Cancelar
          </button>
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
.ingreso-submit {
  background: #fdc700;
  color: #fff;
  font-size: 1.04rem;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background 0.16s;
  box-shadow: 0 0 0 1.5px #fdc700;
}
.ingreso-submit:hover {
  background: #c2a300;
}
.ingreso-cancel {
  background: #212631;
  color: #fdc700;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 5px;
  border: 1.5px solid #fdc700;
  padding: 10px 20px;
  cursor: pointer;
  box-shadow: 0 0 0 1.5px #212631;
  opacity: 0.54;
  transition: background 0.18s, color 0.18s;
}
.ingreso-cancel:hover:not(:disabled) {
  background: #c2a300;
  color: #fff;
  opacity: 1;
}
</style>
