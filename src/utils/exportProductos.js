import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const ESTADO_LABELS = {
  en_stock: "En stock",
  stock_bajo: "Stock bajo",
  agotado: "Agotado",
};

export const estadoLabel = (estado) => ESTADO_LABELS[estado] || "—";

export const buildProductRows = (products) =>
  products.map((p) => ({
    Nombre: p.nombre,
    Cantidad: Number(p.cantidad),
    Precio: Number(p.precio).toFixed(2),
    Estado: estadoLabel(p.estado),
    Categoria: p.categoria || "Sin categoría",
  }));

const fechaArchivo = () => new Date().toISOString().slice(0, 10);

export const exportProductosExcel = (products, baseName = "productos") => {
  const ws = XLSX.utils.json_to_sheet(buildProductRows(products));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, `${baseName}_${fechaArchivo()}.xlsx`);
};

export const exportProductosPdf = (
  products,
  baseName = "productos",
  title = "Reporte de productos - Papelería"
) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  autoTable(doc, {
    startY: 26,
    head: [["Nombre", "Cantidad", "Precio", "Estado", "Categoría"]],
    body: buildProductRows(products).map((r) => [
      r.Nombre,
      r.Cantidad,
      r.Precio,
      r.Estado,
      r.Categoria,
    ]),
  });
  doc.save(`${baseName}_${fechaArchivo()}.pdf`);
};

export const printProductos = (products, title = "Productos seleccionados") => {
  const rows = buildProductRows(products)
    .map(
      (r) =>
        `<tr><td>${esc(r.Nombre)}</td><td>${r.Cantidad}</td><td>${r.Precio}</td><td>${esc(
          r.Estado
        )}</td><td>${esc(r.Categoria)}</td></tr>`
    )
    .join("");

  const ventana = window.open("", "_blank", "width=820,height=600");
  if (!ventana) return;

  ventana.document.write(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p.sub { color: #64748b; margin: 0 0 16px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 13px; }
    th { background: #f1f5f9; }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="sub">${products.length} producto${products.length === 1 ? "" : "s"} · ${new Date().toLocaleString("es")}</p>
  <table>
    <thead>
      <tr><th>Nombre</th><th>Cantidad</th><th>Precio</th><th>Estado</th><th>Categoría</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`
  );
  ventana.document.close();
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}