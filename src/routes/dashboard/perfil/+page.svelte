<script>
  // @ts-nocheck
  import { User, Pencil } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // variables del formulario
  let nombre = '';
  let apellido = '';
  let gmail = '';
  let direccion = '';
  let password = '';
  let newPassword = '';
  let imagen = null;
  let imagenPreview = null;
  let username = '';   // se carga dinámicamente
  let telefono = '';
  let validTel = true;

  // onMount: toma sea user.username o user.Usuario, lo mismo con los demás campos
  onMount(() => {
    const user = JSON.parse(localStorage.getItem("usuario"));
    if (user) {
      username   = user.username   || user.Usuario   || '';
      nombre     = user.nombre     || user.Nombre    || '';
      apellido   = user.apellido   || user.Apellido  || '';
      direccion  = user.direccion  || user.Domicilio || '';
      telefono   = user.telefono   || user.Telefono  || '';
      gmail      = user.gmail      || user.Correo    || '';
    }
  });

  function handleImageChange(event) {
    const file = event.target.files[0];
    imagen = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      imagenPreview = null;
    }
  }

  function validarTelefono() {
    validTel = /^\+\d{8,18}$/.test(telefono) || telefono === '';
  }

  function guardarDatos() {
    validarTelefono();
    if (!validTel) {
      alert('Teléfono no válido');
      return;
    }
    alert(`Datos guardados
Usuario: ${username}
Nombre: ${nombre} ${apellido}
Correo: ${gmail}
Teléfono: ${telefono}`);
    // Aquí pondrías tu lógica real de actualización via fetch a backend
  }
</script>

<section class="p-8 bg-[#212631] min-h-screen text-white">
  <!-- Encabezado Perfil -->
  <div class="flex items-center gap-6 mb-10">
    <div class="relative group">
      {#if imagenPreview}
        <img src={imagenPreview} alt="Avatar" class="w-28 h-28 rounded-full object-cover border-2 border-blue-500 shadow-lg" />
      {:else}
        <div class="bg-[#323a49] w-28 h-28 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-lg">
          <User class="w-16 h-16 text-white" />
        </div>
      {/if}
      <label class="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-800 text-white p-2 rounded-full shadow-lg cursor-pointer" title="Cambiar imagen">
        <Pencil class="w-5 h-5" />
        <input type="file" accept="image/*" class="hidden" on:change={handleImageChange} />
      </label>
    </div>
    <div>
      <h1 class="text-4xl font-bold">{username}</h1>
      <p class="text-gray-400">Configuración de perfil</p>
    </div>
  </div>

  <!-- Formulario Perfil -->
  <form class="grid grid-cols-1 md:grid-cols-2 gap-8" on:submit|preventDefault={guardarDatos}>
    <!-- Columna izquierda -->
    <div class="flex flex-col gap-6">
      <label>
        <span class="text-gray-300">Nombre</span>
        <input type="text" bind:value={nombre} class="w-full bg-[#2b3242] text-white rounded px-4 py-3 mt-2 border border-surface-500" />
      </label>

      <label>
        <span class="text-gray-300">Apellido</span>
        <input type="text" bind:value={apellido} class="w-full bg-[#2b3242] text-white rounded px-4 py-3 mt-2 border border-surface-500" />
      </label>

      <label>
        <span class="text-gray-300">Dirección</span>
        <input type="text" bind:value={direccion} class="w-full bg-[#2b3242] text-white rounded px-4 py-3 mt-2 border border-surface-500" />
      </label>

      <label>
        <span class="text-gray-300">Teléfono</span>
        <input
          type="tel"
          bind:value={telefono}
          placeholder="+54 9 11 1234-5678"
          class="w-full bg-[#2b3242] text-white rounded px-4 py-3 mt-2 border border-surface-500"
          on:input={validarTelefono}
        />
        {#if !validTel && telefono}
          <span class="text-red-400 text-sm">Debe incluir código internacional. Ej: +5491123456789</span>
        {/if}
      </label>
    </div>

    <!-- Columna derecha -->
    <div class="flex flex-col gap-6">
      <label>
        <span class="text-gray-300">Gmail</span>
        <input type="email" bind:value={gmail} class="w-full bg-[#2b3242] text-white rounded px-4 py-3 mt-2 border border-surface-500" />
      </label>

      <label>
        <span class="text-gray-300">Contraseña</span>
        <input
          type="password"
          bind:value={password}
          class="w-full bg-[#2b3242] text-white rounded px-4 py-3 mt-2 border border-surface-500"
          autocomplete="new-password"
        />
      </label>

      <label>
        <span class="text-gray-300">Nueva contraseña</span>
        <input
          type="password"
          bind:value={newPassword}
          class="w-full bg-[#2b3242] text-white rounded px-4 py-3 mt-2 border border-surface-500"
          autocomplete="new-password"
        />
      </label>
    </div>

    <!-- Botón guardar -->
    <div class="col-span-1 md:col-span-2 flex justify-end mt-10">
      <button type="submit" class="w-52 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-800 font-bold text-lg">
        Guardar cambios
      </button>
    </div>
  </form>
</section>
