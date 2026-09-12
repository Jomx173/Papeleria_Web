export function formatMoney(value) {
  return `L. ${Number(value || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}