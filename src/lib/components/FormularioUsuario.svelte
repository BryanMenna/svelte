<script>
// @ts-nocheck

import { createEventDispatcher, onMount } from 'svelte';
import { Eye, EyeOff } from 'lucide-svelte';
import { mostrarToast } from '$lib/utils/mostrarToast.js';

export let usuario = {};
export let disabled = false;
export let mostrarUsername = true;
// svelte-ignore export_let_unused
// svelte-ignore export_let_unused
export let ordenAgregar = false; 
let verPassword = false;
let verRepetir = false;
const dispatch = createEventDispatcher();

const defaultUsuario = {
  nombre: '',
  apellido: '',
  username: '',
  email: '',
  clave: '',
  repetirClave: '',
  tipo: '',
  area: '',
  status: '',
  hasta: "",
  telefono: '',   
  domicilio: ''   
};

let areas = [];
let usuarioLocal = { ...defaultUsuario };
let errores = {};

// Formatear fecha para <input type="datetime-local">
function formatFechaForInput(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d - tzOffset);
  return localDate.toISOString().slice(0,16);
}

onMount(async () => {
  const res = await fetch('/api/areas');
  const data = await res.json();
  if (data.success) {
    areas = data.areas;
  }
});

$: usuarioLocal = (usuario && usuario.id)
  ? { ...defaultUsuario, ...usuario, hasta: formatFechaForInput(usuario.hasta) }
  : { ...defaultUsuario };

function manejarSubmit(e) {
  e.preventDefault();
  errores = {};

  let camposRequeridos = ['nombre','apellido','email','clave','repetirClave','tipo','area','status'];
  if (mostrarUsername) camposRequeridos.push('username');

  const incompletos = camposRequeridos.filter(c => {
    const valor = usuarioLocal[c];
    return !valor || (typeof valor === 'string' && valor.trim() === '');
  });

  if (incompletos.length) {
    incompletos.forEach(campo => errores[campo] = true);
    mostrarToast && mostrarToast({
      mensaje: `Faltan campos por completar: ${incompletos.join(', ')}`,
      tipo: "danger"
    });
    return;
  }

  if (usuarioLocal.clave !== usuarioLocal.repetirClave) {
    errores.clave = true;
    errores.repetirClave = true;
    mostrarToast && mostrarToast({
      mensaje: "Las contraseñas no coinciden.",
      tipo: "danger"
    });
    return;
  }

  dispatch('submit', usuarioLocal);
}
</script>

{#if areas.length > 0}
<form id="form-usuario" on:submit={manejarSubmit} class="form-blanco w-full" autocomplete="off">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Nombre</label>
      <input class="input w-full {errores.nombre ? 'input-error' : ''}"
        bind:value={usuarioLocal.nombre} {disabled} placeholder="Nombre"/>
    </div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Gmail</label>
      <!-- svelte-ignore a11y_autocomplete_valid -->
      <input class="input w-full {errores.email ? 'input-error' : ''}"
        bind:value={usuarioLocal.email} {disabled} placeholder="Ej: correo@gmail.com"
        type="email" autocomplete="new-email" />
    </div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Apellido</label>
      <input class="input w-full {errores.apellido ? 'input-error' : ''}"
        bind:value={usuarioLocal.apellido} {disabled} placeholder="Apellido"/>
    </div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Contraseña</label>
      <div class="relative">
        <input
          type={verPassword ? "text" : "password"}
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
      <label>Dirección</label>
      <input type="text" class="input w-full {errores.domicilio ? 'input-error' : ''}"
        bind:value={usuarioLocal.domicilio} {disabled} placeholder="Dirección"/>
    </div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Nueva contraseña</label>
      <div class="relative">
        <input
          type={verRepetir ? "text" : "password"}
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
  <div>
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label>Teléfono</label>
  <input
    type="tel"
    class="input w-full {errores.telefono ? 'input-error' : ''}"
    bind:value={usuarioLocal.telefono}
    {disabled}
    placeholder="+54 9 11 1234-5678"
  />
</div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Rol</label>
      <select bind:value={usuarioLocal.tipo} required {disabled}
        class="select w-full {errores.tipo ? 'input-error' : ''}">
        <option value="" disabled selected hidden>Seleccione un rol</option>
        <option value="Operador">Operador</option>
        <option value="Supervisor">Supervisor</option>
        <option value="Supervisor General">Supervisor General</option>
      </select>
    </div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Área</label>
      <select bind:value={usuarioLocal.area} required {disabled}
        class="select w-full {errores.area ? 'input-error' : ''}">
        <option value="" disabled selected hidden>Seleccione un área</option>
        {#each areas as area}
          <option value={String(area.ID)}>{area.Area}</option>
        {/each}
      </select>
    </div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Estado</label>
      <select bind:value={usuarioLocal.status} required {disabled}
        class="select w-full {errores.status ? 'input-error' : ''}">
        <option value="" disabled selected hidden>Seleccione un estado</option>
        <option value="Activo">Activo</option>
        <option value="Vacaciones">Vacaciones</option>
        <option value="Bloqueado">Bloqueado</option>
      </select>
    </div>
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Hasta</label>
      <input type="datetime-local" class="input w-full"
        bind:value={usuarioLocal.hasta} {disabled} />
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
  padding: 0.45rem 1rem;
  border-radius: 6px;
  border: 1px solid #2d2d30;
  background-color: #1a1a1e;
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

input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  -webkit-filter: invert(1);
  opacity: 1;
}
</style>
