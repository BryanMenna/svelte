<script>
// @ts-nocheck
import { createEventDispatcher, onMount, tick } from 'svelte';
import { Eye, EyeOff, X } from 'lucide-svelte';
import { mostrarToast } from '$lib/utils/mostrarToast.js';

let fechaRef;
let fp;

export let usuario = {};
export let disabled = false;
export let mostrarUsername = true;
// svelte-ignore export_let_unused
export let ordenAgregar = false;
let verPassword = false;
let verRepetir = false;
const dispatch = createEventDispatcher();

const defaultUsuario = {
  nombre: '', apellido: '', username: '', email: '', clave: '', nuevaClave: '',
  tipo: '', area: '', status: 'Activo', hasta: "", telefono: '', domicilio: ''
};

let areas = [];
let usuarioLocal = { ...defaultUsuario };
let errores = {};

function formatFechaFlatpickr(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  const pad = (n) => String(n).padStart(2, '0');
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${Y}-${M}-${D} ${h}:${m}`;
}

onMount(async () => {
  try {
    const res = await fetch('/api/areas');
    const data = await res.json();
    if (data.success) areas = data.areas;
  } catch (e) { console.error(e); }
  await tick();
  if (fechaRef) {
    await initCalendar();
  }
});

$: usuarioLocal = (usuario && usuario.id)
  ? { ...defaultUsuario, ...usuario, hasta: formatFechaFlatpickr(usuario.hasta) }
  : { ...defaultUsuario };

async function initCalendar() {
  if (fp) {
    fp.destroy();
    fp = null;
  }

  const [{ default: flatpickr }] = await Promise.all([
    import('flatpickr'),
    import('flatpickr/dist/flatpickr.min.css'),
    import('flatpickr/dist/plugins/confirmDate/confirmDate.css'),
    import('flatpickr/dist/themes/dark.css')
  ]);
  const { default: confirmDatePlugin } = await import('flatpickr/dist/plugins/confirmDate/confirmDate');

  fp = flatpickr(fechaRef, {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    time_24hr: true,
    allowInput: true,
    disableMobile: true,
    defaultDate: usuarioLocal.hasta || undefined,
    plugins: [
      confirmDatePlugin({
        confirmText: "OK",
        confirmIcon: "",
        showAlways: false,
        theme: "dark"
      })
    ],
    onChange: (selectedDates, dateStr) => {
      usuarioLocal.hasta = dateStr;
    },
    onReady: [injectCustomButtons]
  });
}

// -- Agrega los botones "Borrar" y "Hoy" al panel del calendario --
function injectCustomButtons(selectedDates, dateStr, instance) {
  const panel = instance.calendarContainer?.querySelector('.flatpickr-confirm');
  if (!panel) return;

  // Evitar duplicados
  if (instance.calendarContainer.querySelector('.flatpickr-clear')) return;

  // Botón Borrar
  const btnClear = document.createElement('button');
  btnClear.type = 'button';
  btnClear.innerHTML = `
    <span style="vertical-align:middle;margin-right:6px;">Borrar</span>`;
  btnClear.className = 'flatpickr-clear';
  btnClear.style.cssText = `
    margin-left:8px;
    background:#dc2626;
    color:#fff;
    border-radius:6px;
    padding:6px 14px;
    font-weight:bold;
    border:none;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
  `;
  btnClear.onmouseenter = () => btnClear.style.background = '#b91c1c';
  btnClear.onmouseleave = () => btnClear.style.background = '#dc2626';

  btnClear.onclick = () => {
    usuarioLocal.hasta = "";
    instance.clear();
    instance.close();
  };

  // Botón Hoy
  const btnHoy = document.createElement('button');
  btnHoy.type = 'button';
  btnHoy.innerHTML = `<span style="vertical-align:middle;margin-right:6px;">Hoy</span>`;
  btnHoy.className = 'flatpickr-today';
  btnHoy.style.cssText = `
    margin-left:8px;
    background:#2563eb;
    color:#fff;
    border-radius:6px;
    padding:6px 14px;
    font-weight:bold;
    border:none;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
  `;
  btnHoy.onmouseenter = () => btnHoy.style.background = '#1d4ed8';
  btnHoy.onmouseleave = () => btnHoy.style.background = '#2563eb';

  btnHoy.onclick = () => {
    const now = new Date();
    const Y = now.getFullYear();
    const M = String(now.getMonth() + 1).padStart(2, '0');
    const D = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const hoyStr = `${Y}-${M}-${D} ${h}:${m}`;
    usuarioLocal.hasta = hoyStr;
    instance.setDate(hoyStr);   // flatpickr lo muestra y selecciona
    instance.close();
  };

  panel.parentNode?.appendChild(btnHoy);
  panel.parentNode?.appendChild(btnClear);
}

function manejarSubmit(e) {
  e.preventDefault();
  errores = {};

  // Campos obligatorios generales
  let camposRequeridos = ['nombre', 'apellido', 'email', 'clave', 'repetirClave', 'tipo', 'area', 'status'];
  if (mostrarUsername) camposRequeridos.push('username');

  // Verificar campos vacíos
  const incompletos = camposRequeridos.filter(campo => {
    const valor = usuarioLocal[campo];
    return !valor || (typeof valor === 'string' && valor.trim() === '');
  });

  if (incompletos.length) {
    incompletos.forEach(campo => errores[campo] = true);
    mostrarToast({
      mensaje: `Faltan campos por completar: ${incompletos.join(', ')}`,
      tipo: "danger"
    });
    return;
  }

  // Validación de 'hasta' según estado
  if ((usuarioLocal.status === 'Vacaciones' || usuarioLocal.status === 'Bloqueado') && !usuarioLocal.hasta) {
    errores.hasta = true;
    mostrarToast({
      mensaje: "Debe ingresar la fecha 'Hasta' para usuarios en Vacaciones o Bloqueados.",
      tipo: "danger"
    });
    return;
  }

  // Validar coincidencia de contraseñas
  if (usuarioLocal.clave !== usuarioLocal.repetirClave) {
    errores.clave = true;
    errores.repetirClave = true;
    mostrarToast({
      mensaje: "Las contraseñas no coinciden.",
      tipo: "danger"
    });
    return;
  }

  // Si todo está OK, despachar evento submit
  dispatch('submit', usuarioLocal);
}

</script>



{#if areas.length > 0}
<form id="form-usuario" on:submit={manejarSubmit} class="form-blanco w-full" autocomplete="off">

  <!-- CARD: CREDENCIALES -->
  
  <div class="card">
    <h2 class="card-title">Credenciales</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Username -->
       <div>
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Username:</label>
    <input
      type="text"
      title="Username"
      class="input w-full {errores.username ? 'input-error' : ''}"
      bind:value={usuarioLocal.username}
      {disabled}
      placeholder="Nombre de usuario"
    />
  </div>


  <div>
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Contraseña:</label>
    <div class="relative">
      <input
        type={verPassword ? "text" : "password"}
        title="Contraseña"
        class="input w-full {errores.clave ? 'input-error' : ''} pr-10"
        bind:value={usuarioLocal.clave}
        {disabled}
        autocomplete="new-password"
        placeholder="Contraseña"/>
      <button type="button" tabindex="-1"
        class="absolute right-3 top-1/2 -translate-y-1/2"
        on:click={() => verPassword = !verPassword}
        style="background: none; border: none; padding: 0; cursor: pointer; color: #6c6c74;">
        {#if verPassword}<EyeOff class="w-5 h-5" />{:else}<Eye class="w-5 h-5" />{/if}
      </button>
    </div>
  </div>

  <div>
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Nueva contraseña:</label>
    <div class="relative">
      <input
        type={verRepetir ? "text" : "password"}
        title="Nueva Contraseña"
        class="input w-full {errores.repetirClave ? 'input-error' : ''} pr-10"
        bind:value={usuarioLocal.repetirClave}
        {disabled}
        placeholder="Nueva contraseña"/>
      <button type="button" tabindex="-1"
        class="absolute right-3 top-1/2 -translate-y-1/2"
        on:click={() => verRepetir = !verRepetir}
        style="background: none; border: none; padding: 0; cursor: pointer; color: #6c6c74;">
        {#if verRepetir}<EyeOff class="w-5 h-5" />{:else}<Eye class="w-5 h-5" />{/if}
      </button>
    </div>
  </div>

    </div>
  </div>
 

  <!-- CARD: DATOS PERSONALES -->
  <div class="card">
    <h2 class="card-title">Datos Personales</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Nombre:</label>
        <input class="input w-full {errores.nombre ? 'input-error' : ''}" bind:value={usuarioLocal.nombre} {disabled} placeholder="Nombre"/>
      </div>

      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Apellido:</label>
        <input class="input w-full {errores.apellido ? 'input-error' : ''}" bind:value={usuarioLocal.apellido} {disabled} placeholder="Apellido"/>
      </div>

      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Correo:</label>
        <input type="email" class="input w-full {errores.email ? 'input-error' : ''}" bind:value={usuarioLocal.email} {disabled} placeholder="Correo"/>
      </div>

      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Dirección:</label>
        <input type="text" class="input w-full {errores.domicilio ? 'input-error' : ''}" bind:value={usuarioLocal.domicilio} {disabled} placeholder="Dirección"/>
      </div>

      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Teléfono:</label>
        <input type="tel" class="input w-full {errores.telefono ? 'input-error' : ''}" bind:value={usuarioLocal.telefono} {disabled} placeholder="Teléfono"/>
      </div>

    </div>
  </div>

  <!-- CARD: CONFIGURACIÓN -->
  <div class="card">
    <h2 class="card-title">Configuración</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Rol:</label>
        <select bind:value={usuarioLocal.tipo} {disabled} class="select w-full {errores.tipo ? 'input-error' : ''}">
          <option value="" disabled>Seleccione un rol</option>
          <option value="Operador">Operador</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Supervisor General">Supervisor General</option>
        </select>
      </div>

      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Área:</label>
        <select bind:value={usuarioLocal.area} {disabled} class="select w-full {errores.area ? 'input-error' : ''}">
          <option value="" disabled>Seleccione un área</option>
          {#each areas as area}
            <option value={String(area.ID)}>{area.Area}</option>
          {/each}
        </select>
      </div>

      <!-- svelte-ignore a11y_label_has_associated_control -->
     <div>
  <label>Estado:</label>
  <select bind:value={usuarioLocal.status} {disabled} class="select w-full {errores.status ? 'input-error' : ''}">
    <option value="Activo">Activo</option>
    <option value="Vacaciones">Vacaciones</option>
    <option value="Bloqueado">Bloqueado</option>
  </select>
</div>


      <!-- svelte-ignore a11y_label_has_associated_control -->
      <div><label>Hasta:</label>
        <input
        type="text"
        bind:this={fechaRef}
        bind:value={usuarioLocal.hasta}
        class="input w-full {errores.hasta ? 'input-error' : ''}"
        placeholder="Hasta"
        disabled={disabled || usuarioLocal.status === 'Activo'} />
      </div>

    </div>
  </div>

</form>

{:else}
<div class="flex justify-center items-center h-40">
  <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
</div>
{/if}

<style>
.form-blanco label {
  color: white;
  display: block;
  margin-bottom: 0.25rem;
}
.form-blanco input,
.form-blanco select {
  width: 100%;
  padding: 0.89rem 1rem;
  border-radius: 6px;
  border: 1px solid #666;
  background-color: #2b3242;
  color: white;
  font-size: 0.95rem;
  outline: none;
  box-shadow: none;
  transition: border-color 0.2s;
}
.form-blanco input:focus,
.form-blanco select:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: #3585fd;
}
.form-blanco input::placeholder,
.form-blanco select option[disabled] {
  color: #9ca3af;
}
.form-blanco select option {
  background-color: #1a1a1e;
  color: white;
}
.input-error,
.select.input-error {
  border: 1px solid #dc2626 !important;
  background-color: #1a1a1e !important;
  outline: none !important;
}
.input-error:focus,
.select.input-error:focus {
  border-color: #dc2626 !important;
  box-shadow: none !important;
  outline: none !important;
}
.form-blanco .grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .form-blanco .grid {
    grid-template-columns: 1fr 1fr;
  }
}


  :global(.flatpickr-confirm) {
    background-color: #2563eb !important;
    color: #fff !important;
    border-radius: 6px;
    padding: 6px 14px;
    font-weight: bold;
    border: none;
    cursor: pointer;
  }

  :global(.flatpickr-confirm:hover) {
    background-color: #1d4ed8 !important;
  }


:global(.flatpickr-clear) {
  background: #dc2626 !important;
  color: #fff !important;
  border-radius: 6px;
  padding: 6px 14px;
  margin-left: 8px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  display:inline-flex;
  align-items: center;
}

:global(.flatpickr-clear:hover) {
  background: #b91c1c !important;
}
:global(.flatpickr-today) {
  background: #2563eb !important;
  color: #fff !important;
  border-radius: 6px;
  padding: 6px 14px;
  margin-left: 8px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  display:inline-flex;
  align-items: center;
}
:global(.flatpickr-today:hover) {
  background: #1d4ed8 !important;
}
:global(.flatpickr-confirm) {
  margin-bottom: 3px; /* espacio debajo de OK */
}

.card {
  background: #2a2f3a;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #DD8888;
  margin-bottom: 1rem;
  text-transform: uppercase;
}


:global(.flatpickr-calendar) {
  background: #1f2937 !important;
  border: 1px solid #374151 !important;
  color: #f9fafb !important;
}

:global(.flatpickr-day) {
  color: #e5e7eb !important;
}

:global(.flatpickr-day:hover),
:global(.flatpickr-day.today) {
  background: #2563eb !important;
  color: white !important;
}
/* Mes (header) */
:global(.flatpickr-months .flatpickr-month) {
  color: #ffffff !important;
}

/* Días de la semana (Sun, Mon, etc.) */
:global(.flatpickr-weekday) {
  color: #ffffff !important;
  font-weight: 500;
}
/* Números de la hora (time picker) */
:global(.flatpickr-time input) {
  background: #1f2937 !important;  /* gris oscuro */
  color: #ffffff !important;       /* texto blanco */
  border: 1px solid #374151 !important;
  border-radius: 4px;
  text-align: center;
}

:global(.flatpickr-time .flatpickr-am-pm) {
  color: #ffffff !important;
}
</style>



