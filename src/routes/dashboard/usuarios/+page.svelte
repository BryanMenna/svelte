
<script>
// @ts-nocheck
import ToastContainer from '$lib/components/ToastContainer.svelte';
import { mostrarToast } from '$lib/utils/mostrarToast.js';
import { onMount } from 'svelte';
import { Pencil, Eye, Trash2, Search, Plus, FileText } from 'lucide-svelte';
import FormularioUsuario from '$lib/components/FormularioUsuario.svelte';

let usuarios = [];
let filtro = "";

let mostrarFormulario = false;
let accionFormulario = "";
let usuario = {};

const usuarioVacio = { 
    id: null, 
    nombre: '', 
    apellido: '', 
    username: '', 
    email: '', 
    tipo: '', 
    area: '', 
    status: '', 
    clave: '', 
    repetirClave: '', 
    telefono: '', 
    domicilio: ''
};

// Cargar usuarios
onMount(cargarUsuarios);

async function cargarUsuarios() {  //⬅ Cargar Usuarios
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    if (data.success) {
        usuarios = data.usuarios.map(u => ({
            id: u.ID,
            name: `${u.Nombre} ${u.Apellido}`,
            email: u.email,
            username: u.Usuario,
            tipo: u.tipo,
            IDarea: u.IDarea,
            area: u.areaDet,
            estado: u.Estado,
            telefono: u.Telefono,
            domicilio: u.Domicilio,
            hasta: u.Hasta
        }));
    } else {
        mostrarToast({ mensaje: "Error al cargar usuarios", tipo: "danger" });
    }
}

// Filtrado
function onFiltroInput(e) { filtro = e.target.value.toLowerCase(); }
$: usuariosFiltrados = usuarios.filter(u => u.name.toLowerCase().includes(filtro));

function getStatusClasses(status) {
    if (status === "Activo") return "bg-green-500 text-white";
    if (status === "Vacaciones") return "bg-yellow-500 text-white";
    if (status === "Bloqueado") return "bg-red-500 text-white";
    return "bg-gray-500 text-white";
}

// Funciones para abrir el formulario
const abrirFormularioNuevo = () => {
    usuario = { ...usuarioVacio };
    accionFormulario = "nuevo";
    mostrarFormulario = true;
};

function onClickEditar(u) {
    prepararUsuario(u);
    accionFormulario = 'editar';
    mostrarFormulario = true;
    mostrarToast({ mensaje: `Editando usuario: ${u.name}`, tipo: "primary" });
}

function onClickVer(u) {
    prepararUsuario(u);
    accionFormulario = 'ver';
    mostrarFormulario = true;
    mostrarToast({ mensaje: `Viendo usuario: ${u.name}`, tipo: "success" });
}

function onClickBorrar(u) {
    prepararUsuario(u);
    accionFormulario = 'borrar';
    mostrarFormulario = true;
    mostrarToast({ mensaje: `Eliminando usuario: ${u.name}`, tipo: "danger" });
}

// Preparar usuario
function prepararUsuario(u) {
    const [nombre, ...resto] = u.name.split(' ');
    usuario = {
        id: u.id,
        nombre,
        apellido: resto.join(' '),
        username: u.username,
        email: u.email,
        tipo: u.tipo,
        area: u.IDarea ? String(u.IDarea) : '',
        status: u.estado,
        clave: '',
        repetirClave: '',
        telefono: u.telefono ?? '',
        domicilio: u.domicilio ?? '',
        hasta: u.hasta ?? null 
    };
}

// Cerrar formulario
const cerrarFormulario = () => mostrarFormulario = false;

// Colores por acción
function getColorClasses(acc) {
    if (acc === 'borrar') 
        return { header: 'bg-red-500', btn: 'bg-red-500 hover:bg-red-600', outline: 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' };
    if (acc === 'ver') 
        return { header: 'bg-green-500', btn: 'bg-green-500 hover:bg-green-600', outline: 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white' };
    if (acc === 'editar') 
        return { 
            header: 'bg-[#21A9FD]',  
            btn: 'bg-[#21A9FD] hover:bg-[#1b8fd6]',  
            outline: 'border-[#21A9FD] text-[#21A9FD] hover:bg-[#21A9FD] hover:text-white' 
        };
    if (acc === 'nuevo') 
        return {   
            header: 'bg-[#450786]',  
            btn: 'bg-[#450786] hover:bg-[#5b0aa7]',  
            outline: 'border-[#450786] text-[#450786] hover:bg-[#450786] hover:text-white' 
        };
    return { header: 'bg-gray-500', btn: 'bg-gray-500 hover:bg-gray-600', outline: 'border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white' };
}

$: colores = getColorClasses(accionFormulario);

function formularioTitulo(acc) {
    if (acc === "editar") return "Editar Usuario";
    if (acc === "ver") return "Información del Usuario";
    if (acc === "borrar") return "Eliminar Usuario";
    return "Nuevo Usuario";
}

// Guardar usuario
async function guardarUsuario(e) {
    const datos = e.detail;
    const payload = {
        Apellido: datos.apellido,
        Nombre: datos.nombre,
        Domicilio: datos.domicilio ?? '',
        Telefono: datos.telefono ?? '',
        Correo: datos.email,
        Usuario: datos.username,
        Clave: datos.clave,
        Tipo: datos.tipo,
        Area: parseInt(datos.area),
        Estado: datos.status,
        Hasta: datos.hasta ?? null,
        ID: datos.id
    };

    let method = 'POST';
    let url = '/api/usuarios';
    if (accionFormulario === 'editar') method = 'PUT';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
        mostrarToast({ mensaje: data.mensaje, tipo: "success" });
        cerrarFormulario();
        await cargarUsuarios();// ⬅ Aquí se recargan los datos de la tabla
    } else {
        mostrarToast({ mensaje: data.error, tipo: "danger" });
    }
}

// Eliminar usuario
async function eliminarUsuario() {
    const res = await fetch('/api/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: usuario.id })
    });
    const data = await res.json();

    if (data.success) {
        mostrarToast({ mensaje: data.mensaje, tipo: "success" });
        cerrarFormulario();
        await cargarUsuarios();
    } else {
        mostrarToast({ mensaje: data.error, tipo: "danger" });
    }
}

//   botón PDF (por ahora placeholder)
function descargarPDF() {
    console.log("Función DESCARGAR PDF aún no implementada");
    mostrarToast({
        mensaje: "Función de exportar PDF aún no implementada",
        tipo: "warning"
    });
}
</script>


<ToastContainer />


<div class="flex flex-col items-center w-full mt-16 transition-all duration-300"> 
    <!-- Barra de búsqueda + botones -->
    {#if !mostrarFormulario}
    <div class="w-full flex items-center my-4">
        <div class="flex items-center gap-2">
            <!-- Campo de búsqueda -->
            <div class="relative w-64">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                <input
                    type="text"
                    class="w-full pl-10 bg-surface-700 text-onSurface border-none focus:outline-none focus:ring-0"
                    placeholder="Buscar..."
                    title="Buscar..."
                    value={filtro}
                    style="color: white; background:#2a2f3a; border: none; box-shadow: none;"
                    oninput={onFiltroInput}
                />
            </div>

            <!-- Botón Agregar Usuario -->
            <button
                class="flex items-center justify-center p-2 rounded-full text-white hover:scale-110 transition"
                style="background-color: #21A9FD; width: 32px; height: 32px;"
                title="Nuevo Usuario"
                onclick={abrirFormularioNuevo}
            >
                <Plus class="w-5 h-5" />
            </button>

            <!-- Botón Descargar PDF (placeholder por ahora) -->
            <button
                class="flex items-center justify-center p-2 rounded-full text-white hover:scale-110 transition"
                style="background-color: #323a49; width: 35px; height: 35px;"
                title="Descargar PDF"
                onclick={descargarPDF}
            >
                <FileText class="w-5 h-5" />
            </button>
        </div>
    </div>
    {/if}



    <!-- Formulario expandible -->
    {#if mostrarFormulario}
    <section class="w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-6">
<!-- HEADING FORMULARIO -->
        <div class={`px-5 py-2 ${colores.header} text-white font-normal text-lg flex items-center justify-between`}>

           <span style="text-transform: uppercase;">{formularioTitulo(accionFormulario)}</span>

            <button
                class="text-white hover:text-gray-100 text-2xl px-2 py-1 rounded transition"
                style="background: transparent;"
                aria-label="Cerrar"
                onclick={cerrarFormulario}
                >x</button>
            </div>

        <div class="p-6 bg-[#212631]">
            <FormularioUsuario 
            {usuario} 
            accionModal={accionFormulario}
            disabled={(accionFormulario === "ver" || accionFormulario === "borrar")} 
            mostrarUsername={true}   
            ordenAgregar={accionFormulario === 'nuevo'} 
            on:submit={guardarUsuario}
            />
            <div class="flex justify-end gap-2 mt-4">
                {#if accionFormulario === 'nuevo' || accionFormulario === 'editar'}
                    <button type="submit" form="form-usuario" class={`px-4 py-2 rounded text-white ${colores.btn}`}>Guardar</button>
                {/if}
                {#if accionFormulario === 'borrar'}
                    <button class={`px-4 py-2 rounded text-white ${colores.btn}`} onclick={eliminarUsuario}>Eliminar</button>
                {/if}
                {#if accionFormulario === 'ver'}
                    <button class={`px-4 py-2 rounded text-white ${colores.btn}`} onclick={cerrarFormulario}>Cerrar</button>
                {:else}
                    <button class={`px-4 py-2 rounded border ${colores.outline}`} onclick={cerrarFormulario}>Cerrar</button>
                {/if}
            </div>
        </div>
    </section>
    {/if}


    <!-- Tabla -->
    {#if !mostrarFormulario}
    <div class="w-full">
        <table class="w-full text-white rounded overflow-hidden" style="background-color: #212631; table-layout: auto;">
            <thead style="background-color: #323a49;">
                <tr>
                    <th class="encabezado">NOMBRE Y APELLIDO</th>
                    <th class="encabezado">ROL</th>
                    <th class="encabezado">ESTADO</th>
                    <th class="encabezado">ACCIONES</th>
                </tr>
            </thead>
            <tbody>
                {#if usuariosFiltrados.length === 0}
                    <tr>
                        <td colspan="4" class="text-center py-6 text-gray-400 italic">No se encontraron usuarios</td>
                    </tr>
                {:else}
                    {#each usuariosFiltrados as u}
                        <tr class="border-b border-surface-700">
                            <td class="px-4 py-2 flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-base" style="background-color: #4b4d56; color: #000000cc;">{u.name.charAt(0)}</div>
                                <!--  NOMBRE Y APELLIDO  -->
                                <div>
                                    <span>{u.name}</span><br />
                                    <small class="user-subinfo">{u.email}</small>
                                </div>
                            </td>
                            <!--  ROL  -->
                            <td class="px-4 py-2">
                                <span>{u.tipo}</span><br />
                                <small class="user-subinfo">{u.area}</small>
                            </td>
                            <!--  ESTADO  -->
                            <td class="px-4 py-2">
                                <span class={`px-4 py-1 rounded text-xs ${getStatusClasses(u.estado)}`}>{u.estado}</span>
                            </td>
                            <!-- BOTON DE ACCIONES -->
                            <td class="px-4 py-2 flex gap-2">
                                <button class="text-red-500 hover:scale-110" title="Eliminar Usuario" onclick={() => onClickBorrar(u)}><Trash2 class="w-4.3 h-5" /></button>
                                <button class="text-blue-500 hover:scale-110" title="Editar Usuario" onclick={() => onClickEditar(u)}><Pencil class="w-4.3 h-5" /></button>
                                <button class="text-green-500 hover:scale-110" title="Información del Usuario" onclick={() => onClickVer(u)}><Eye class="w-4.3  h-5" /></button>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>
    {/if}
</div>


<style>
input::placeholder { color: #b0b0b0; opacity: 1; }
input:focus { outline: none; box-shadow: none; border-color: inherit; }
.bg-green-600 { background-color: #16a34a; }
.bg-red-600 { background-color: #dc2626; }
.bg-yellow-400 { background-color: #facc15; }
.text-white { color: #fff; }
.text-black { color: #111; }
.shadow-lg { box-shadow: 0 4px 14px rgba(0,0,0,0.15);}
.rounded-lg { border-radius: 0.5rem;}
.user-subinfo { font-style: italic; color: #777 !important; }
.encabezado { padding: 7px 18px; text-align: left;  font-size: 0.95rem; letter-spacing: 1px; font-weight: 400;  background: transparent; }
tbody tr:nth-child(odd) {
  background-color: #2a2f3a; /* gris oscuro */
}
tbody tr:nth-child(even) {
  background-color: #212631; /* un poco más claro */
}
</style>
