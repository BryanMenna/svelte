<script>
// @ts-nocheck
import { createEventDispatcher, onMount } from "svelte";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const dispatch = createEventDispatcher();

export let onCerrar = () => {};

let usuarioLocal = {
  rol: "",
  areas: [],
  status: "Activo",
  hasta: "",
};

let areas = [];
let mostrarAreas = false;

// 🔹 Cargar áreas desde la API
onMount(async () => {
  try {
    const res = await fetch("/api/areas");
    const data = await res.json();
    if (data.success) areas = data.areas;
  } catch (err) {
    console.error("Error cargando áreas", err);
  }
});

function toggleArea(area) {
  if (usuarioLocal.areas.includes(area)) {
    usuarioLocal.areas = usuarioLocal.areas.filter((a) => a !== area);
  } else {
    usuarioLocal.areas = [...usuarioLocal.areas, area];
  }
}

function imprimir() {
  const doc = new jsPDF();

  // ===== HEADER =====
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Provincia de Córdoba", doc.internal.pageSize.getWidth() / 2, 15, {
    align: "center",
  });

  // ===== TABLA =====
  const areasTexto = usuarioLocal.areas.length
    ? usuarioLocal.areas.join(", ")
    : "-";

  autoTable(doc, {
    startY: 30,
    head: [["Rol", "Áreas", "Estado", "Hasta"]],
    body: [[
      usuarioLocal.rol || "-",
      areasTexto,
      usuarioLocal.status,
      usuarioLocal.hasta || "-"
    ]],
  });

  // ===== FOOTER =====
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado con jsPDF - Página ${doc.internal.getNumberOfPages()}`,
    doc.internal.pageSize.getWidth() / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // ===== ABRIR IMPRESIÓN =====
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");

  onCerrar();
}
</script>

<div class="p-6 bg-[#212631]">
  <form on:submit|preventDefault={imprimir} class="form-blanco w-full">
    <!-- Rol -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="block mb-2 text-white">Rol</label>
    <div class="relative mb-4">
      <select bind:value={usuarioLocal.rol} class="select w-full">
        <option value="" disabled>Seleccione un rol</option>
        <option value="Operador">Operador</option>
        <option value="Supervisor">Supervisor</option>
        <option value="Supervisor General">Supervisor General</option>
      </select>
      <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">▼</span>
    </div>

    <!-- Áreas -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="block mb-2 text-white">Áreas</label>
    <div class="relative mb-4">
      <button 
        type="button"
        class="select-trigger w-full text-left px-4 py-2 rounded bg-[#2b3242] border border-gray-600 text-white flex justify-between items-center"
        on:click={() => mostrarAreas = !mostrarAreas}
      >
        <span>{usuarioLocal.areas.length > 0 ? usuarioLocal.areas.join(", ") : "Seleccione áreas"}</span>
        <span class="text-gray-300">▼</span>
      </button>

      {#if mostrarAreas}
        <div class="absolute w-full bg-[#2b3242] border border-gray-600 rounded mt-1 max-h-40 overflow-y-auto z-10">
          {#each areas as area}
            <label class="flex items-center px-4 py-2 cursor-pointer hover:bg-[#3b4254]">
              <input 
                type="checkbox" 
                value={area.Area} 
                checked={usuarioLocal.areas.includes(area.Area)}
                on:change={() => toggleArea(area.Area)}
                class="mr-2"
              />
              <span class="text-white">{area.Area}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Estado -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="block mb-2 text-white">Estado</label>
    <div class="relative mb-4">
      <select bind:value={usuarioLocal.status} class="select w-full">
        <option value="Activo">Activo</option>
        <option value="Vacaciones">Vacaciones</option>
        <option value="Bloqueado">Bloqueado</option>
      </select>
      <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">▼</span>
    </div>

    <!-- Hasta -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="block mb-2 text-white">Hasta</label>
    <div class="relative mb-4">
      <input type="date" bind:value={usuarioLocal.hasta} class="input w-full pr-10" />
      <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">📅</span>
    </div>

    <!-- Botones -->
    <div class="flex justify-end gap-2 mt-4">
      <button type="submit" class="btn btn-success">Imprimir</button>
      <button type="button" class="btn btn-outline" on:click={onCerrar}>Cerrar</button>
    </div>
  </form>
</div>

<style>
.input,
.select,
.select-trigger {
  background: #2b3242;
  color: white;
  border: 1px solid #666;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  appearance: none;
}
.input:focus,
.select:focus {
  outline: none;
  border-color: #3585fd;
}

/* Botones */
.btn {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
  cursor: pointer;
}
.btn-success {
  background: #16a34a;
  color: #fff;
  border: none;
}
.btn-success:hover {
  background: #15803d;
}
.btn-outline {
  background: transparent;
  color: #e5e7eb;
  border: 1px solid #9ca3af;
}
.btn-outline:hover {
  background: #4b5563;
  border-color: #cbd5e1;
}
</style>
