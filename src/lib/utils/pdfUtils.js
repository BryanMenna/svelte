// @ts-nocheck
import jsPDF from "jspdf";
import "jspdf-autotable";

// 🔹 Función que genera el PDF
export function generarPDF(usuarios = []) {
  const doc = new jsPDF();

  // Logo opcional (cargalo en base64 o url convertida a base64)
  const logo =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."; // tu imagen

  // 🔹 Header/Footer en todas las páginas
  doc.autoTable({
    startY: 30,
    head: [["ID", "Nombre", "Email"]],
    body:
      usuarios.length > 0
        ? usuarios.map((u, i) => [i + 1, u.name, u.email])
        : [
            [1, "Bryan", "bryan@email.com"],
            [2, "Lucas", "lucas@email.com"],
            [3, "Ana", "ana@email.com"],
          ],
    margin: { top: 40, bottom: 20 },
    didDrawPage: function () {
      // ===== HEADER =====
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.setFont("helvetica", "bold");
      doc.text("Provincia de Córdoba", doc.internal.pageSize.getWidth() / 2, 15, {
        align: "center",
      });

      if (logo) {
        doc.addImage(logo, "PNG", doc.internal.pageSize.getWidth() - 50, 5, 30, 15);
      }

      // ===== FOOTER =====
      let str = "Página " + doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(str, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.height - 10, {
        align: "center",
      });
    },
  });

  // Abrir directamente en el diálogo de impresión de Windows
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}
