<script>
// @ts-nocheck

import { createEventDispatcher, onMount } from "svelte";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

const dispatch = createEventDispatcher();

let usuarioLocal = {
  rol: "",
  areas: [],
  status: "Activo",
  hasta: "",
};

let areas = [];
let mostrarAreas = false;

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

async function svgToPngBase64(url) {
  const res = await fetch(url);
  const svgText = await res.text();

  const img = new Image();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const urlBlob = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(urlBlob);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = urlBlob;
  });
}

async function imprimir() {
  const doc = new jsPDF(); //Crear PDF
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const logoBase64 = await svgToPngBase64(
    "https://upload.wikimedia.org/wikipedia/commons/2/23/Escudo_de_la_Provincia_de_C%C3%B3rdoba.svg"
  );

  // HEADER
  doc.setFillColor(50, 58, 73);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.addImage(logoBase64, "PNG", 10, 2, 20, 20); //insertar la imagen con su tamaño 
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Municipalidad de Córdoba", pageWidth / 2, 16, { align: "center" });//Agregar Texto

  // MAIN
  doc.setTextColor(0, 0, 0);//color de texto
  doc.setFontSize(14); //tamaño de letra
  doc.text("Reporte de Usuarios", pageWidth / 2, 40, { align: "center" });

  const areasTexto = usuarioLocal.areas.length  //tabla con "," y "-"
    ? usuarioLocal.areas.join(", ")
    : "-";

  autoTable(doc, {  //generando tabla
    startY: 50,
    head: [["Rol", "Áreas", "Estado", "Hasta"]],
    body: [[
      usuarioLocal.rol || "-",
      areasTexto,
      usuarioLocal.status,
      usuarioLocal.hasta || "-"
    ]],
    styles: { halign: "center" },
    headStyles: { fillColor: [50, 58, 73], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  // FOOTER
  const fecha = new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado con jsPDF - ${fecha}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.autoPrint(); // Boton para imprimir
  window.open(doc.output("bloburl"), "_blank");

  // 🔹 AVISAR AL PADRE QUE EL PDF SE GENERÓ
  dispatch("pdfGenerado");


  // 🔹 cerrar correctamente
  dispatch("cerrar");
}
</script>


<div class="p-6 bg-[#212631]">
  <form on:submit|preventDefault={imprimir} class="form-blanco w-full">
    <!-- Rol -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="block mb-2 text-white">Rol:</label>
    <div class="relative mb-4">
      <select bind:value={usuarioLocal.rol} class="select w-full">
        <option value="" disabled>Seleccione un rol</option>
        <option value="Operador">Operador</option>
        <option value="Supervisor">Supervisor</option>
        <option value="Supervisor General">Supervisor General</option>
      </select>
      <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">▼</span>
    </div>

    <!-- Áreas con checkboxes -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="block mb-2 text-white">Áreas:</label>
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
    <label class="block mb-2 text-white">Estado:</label>
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
    <label class="block mb-2 text-white">Hasta:</label>
    <div class="relative mb-4">
      <input type="date" bind:value={usuarioLocal.hasta} class="input w-full pr-10" />
      
    </div>

    <!-- Botones -->
    <div class="flex justify-end gap-2 mt-4">
      <button type="submit" class="btn btn-success">
        Imprimir
      </button>
      <button type="button" class="btn btn-outline" on:click={() => dispatch("cerrar")}>
        Cerrar
      </button>
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
