// Enmascarar código (mostrar solo la última parte)
// @ts-ignore
export function masked_cod(codigo) {
  if (!codigo) return "";
  const parts = codigo.split(".");
  return parts
    // @ts-ignore
    .map((p, i) => (i < parts.length - 1 ? "***" : p))
    .join(".");
}

// Formato de moneda
// @ts-ignore
export function formatCurrency(value) {
  if (!value) return "$ 0,00";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
  }).format(value);
}
