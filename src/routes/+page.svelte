<script>
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { tick } from 'svelte';
  import { XCircle, CheckCircle, Eye, EyeOff } from 'lucide-svelte';

  let username = '';
  let password = '';
  let error = '';
  let success = '';
  let verPassword = false; // 👈 Nuevo estado para mostrar o no el password

  // @ts-ignore
  async function mostrarError(msg) {
    error = msg;
    success = '';
    await tick();
    setTimeout(() => (error = ''), 3000);
  }

  // @ts-ignore
  async function mostrarSuccess(msg) {
    success = msg;
    error = '';
    await tick();
    setTimeout(() => (success = ''), 3000);
  }

  async function login() {
    if (username.trim() === '' || password.trim() === '') {
      mostrarError('Falta poner username o password.');
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nombreCompleto = `${data.user.nombre} ${data.user.apellido}`;
        localStorage.setItem('usuarioNombre', nombreCompleto);
        localStorage.setItem('usuarioId', data.user.id);
        localStorage.setItem('usuarioTipo', data.user.tipo);
        mostrarSuccess('¡Login exitoso!');
        setTimeout(() => goto('/dashboard'), 1500);
      } else {
        localStorage.removeItem('usuarioNombre');
        localStorage.removeItem('usuarioId');
        localStorage.removeItem('usuarioTipo');
        mostrarError(data.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      console.error(err);
      mostrarError('Error al intentar conectarse.');
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-surface-900 p-4" style="background-color: #1d222b;">
  <div class="w-full max-w-sm p-6 rounded-lg bg-surface-800 shadow-lg text-white" style="background-color: #212631; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);">
    <h2 class="text-xl font-bold text-center mb-6 text-onSurface" style=" font-family: 'Segoe UI', sans-serif;">Login</h2>

    <!-- Username -->
    <div class="mb-4">
      <label class="block text-onSurface font-semibold mb-2" for="username">Username</label>
      <div class="relative">
        <input
          id="username"
          type="text"
          placeholder="username"
          class="input input-solid w-full pl-10 bg-surface-700 text-onSurface border-none"
          style="background-color: #1a1a1e;"
          bind:value={username}
          disabled={!!(error && error.includes('bloqueado'))}
        />
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-onSurface/60" style="color: #6c6c74;">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
          </svg>
        </span>
      </div>
    </div>

<!-- Password con candado a la izquierda + ojito a la derecha -->
<div class="mb-4">
  <label class="block text-onSurface font-semibold mb-2" for="password">Password</label>
  <div class="relative">
    <input
      id="password"
      type={verPassword ? 'text' : 'password'}
      placeholder="password"
      class="input input-solid w-full pl-10 pr-10 text-white placeholder-gray-400 border-none"
      style="background-color: #1a1a1e;"
      bind:value={password}
      disabled={!!(error && error.includes('bloqueado'))}
    />

    <!-- Ícono candado fijo a la izquierda -->
    <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color: #6c6c74;">
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 8V6a5 5 0 1110 0v2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm2-2v2h6V6a3 3 0 00-6 0z" />
      </svg>
    </span>

    <!-- Ojito a la derecha -->
    <button
       type="button"
       class="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-blue-400"
       tabindex="-1"
       on:click={() => verPassword = !verPassword}
       style="background: none; border: none; padding: 0; cursor: pointer; color: #6c6c74;"
    >
      {#if verPassword}
        <EyeOff class="w-5 h-5" />
      {:else}
        <Eye class="w-5 h-5" />
      {/if}
    </button>
  </div>
</div>




    <!-- Botón login -->
    <button
      class="btn btn-primary w-full mt-2"
      on:click={login}
      style="background-color: #27bafd; color: #111;  font-family: var(--sl-font-sans);"
      disabled={!!(error && error.includes('bloqueado'))}
    >
      Login
    </button>
  </div>

  <!-- Toast -->
{#if error || success}
    <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50" transition:fade>
      <div
         class="max-w-xs w-full px-4 py-6 rounded shadow-lg text-white font-semibold flex items-center justify-center gap-2 text-center"
         style={success ? 'background-color: #2ecc71;' : 'background-color: #e74c3c;'}
      >
        {#if error}
          <XCircle class="w-5 h-5" />
        {:else if success}
          <CheckCircle class="w-5 h-5" />
        {/if}
        <span class="w-full text-center">{error || success}</span>
      </div>
    </div>
  {/if}
</div>

<style>
input {
  border-radius: 6px;
  border: 1px solid #2d2d30;
  background-color: #1a1a1e;
  color: white;
  font-size: 0.95rem;
  outline: none;            
  box-shadow: none;         
  transition: border-color 0.2s;
}
input:focus {
  outline: none !important;
  border-color: #21A9FD !important;
  box-shadow: none !important;
}
input::placeholder {
  color: #6c6c74 !important;
  opacity: 1 !important;
}
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear,
input[type="password"]::-webkit-textfield-decoration-container {
  display: none !important;
}

</style>