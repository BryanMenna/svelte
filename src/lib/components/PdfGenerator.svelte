<script>
  import jsPDF from "jspdf";
  import "jspdf-autotable";

  function generarPDF() {
    const doc = new jsPDF();

    // 📌 Encabezado con título
    doc.setFontSize(18);
    doc.text("📊 Reporte de Ejemplo", 20, 20);

    // 📌 Insertar imagen (ejemplo con base64 o URL convertida a base64)
    const logo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."; // acá iría tu imagen
    doc.addImage(logo, "PNG", 150, 10, 40, 20);

    // 📌 Tabla con datos
    // @ts-ignore
    doc.autoTable({
      startY: 40,
      head: [["ID", "Nombre", "Email"]],
      body: [
        [1, "Bryan", "bryan@email.com"],
        [2, "Lucas", "lucas@email.com"],
        [3, "Ana", "ana@email.com"],
      ],
    });

    // 📌 Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.text("Reporte generado con jsPDF", 20, pageHeight - 10);

    // 📌 Guardar
    doc.save("reporte.pdf");
  }
</script>

<button on:click={generarPDF} class="bg-blue-500 text-white px-4 py-2 rounded">
  Generar PDF
</button>
