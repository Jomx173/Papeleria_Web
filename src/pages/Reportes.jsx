import { useCallback, useEffect, useState } from "react";
import {
  FaChartBar,
  FaBoxOpen,
  FaBoxes,
  FaDollarSign,
  FaExclamationTriangle,
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaStar,
  FaPaperclip,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  getSummary,
  getProducts,
  getByCategory,
  getMonthlyMovements,
  getLowStockProducts,
  getMovements,
} from "../services/api";
import { getCategoryColor } from "../utils/categoryColors";
import { getCssVar } from "../theme.js";

const fmtMoney = (value) =>
  `$${Number(value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Reportes() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    Promise.all([
      getSummary(),
      getProducts(),
      getByCategory(),
      getMonthlyMovements(9),
      getLowStockProducts(),
      getMovements(),
    ])
      .then(([resumen, prods, porCat, mensuales, alertasList, movs]) => {
        setError("");
        setSummary(resumen);
        setProducts(prods);
        setByCategory(porCat);
        setMonthly(mensuales);
        setAlertas(alertasList);
        setMovements(movs);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalUnidades = products.reduce((acc, p) => acc + Number(p.cantidad || 0), 0);
  const pieData = byCategory
    .filter((c) => Number(c.totalProductos) > 0)
    .map((c) => ({ name: c.nombre, value: Number(c.totalProductos) }));
  const valorData = byCategory
    .filter((c) => Number(c.valorInventario) > 0)
    .map((c) => ({
      name: c.nombre,
      valor: Number(c.valorInventario),
      color: getCategoryColor(c.nombre).fg,
    }));
  const recentMovements = movements.slice(0, 10);

  const exportRows = products.map((p) => ({
    Nombre: p.nombre,
    Cantidad: Number(p.cantidad),
    Precio: Number(p.precio).toFixed(2),
    Categoria: p.categoria || "Sin categoría",
  }));

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte de productos - Papelería", 14, 18);
    autoTable(doc, {
      startY: 26,
      head: [["Nombre", "Cantidad", "Precio", "Categoría"]],
      body: exportRows.map((r) => [r.Nombre, r.Cantidad, r.Precio, r.Categoria]),
    });
    doc.save(`productos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, `productos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const stats = [
    { label: "Total de productos", value: summary ? summary.totalProductos : "…", icon: <FaBoxOpen />, cls: "violet" },
    { label: "Total de unidades", value: summary ? totalUnidades : "…", icon: <FaBoxes />, cls: "blue" },
    { label: "Valor del inventario", value: summary ? fmtMoney(summary.valorInventario) : "…", icon: <FaDollarSign />, cls: "green" },
    { label: "Productos con stock bajo", value: summary ? summary.stockBajo : "…", icon: <FaExclamationTriangle />, cls: "orange" },
  ];

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-text">
          <span className="page-banner-icon">
            <FaChartBar />
          </span>
          <div>
            <h1>Reportes</h1>
            <p>Consulta estadísticas y genera reportes de tu inventario.</p>
          </div>
        </div>
        <div className="page-banner-art" aria-hidden="true">
          <FaBoxes className="art art-book" />
          <FaFileExcel className="art art-ruler" />
          <FaDollarSign className="art art-pen" />
          <FaStar className="art art-star" />
          <FaPaperclip className="art art-clip" />
        </div>
        <div className="banner-note">
          <span className="banner-note-text handwritten">Tus números, siempre claros 📊</span>
        </div>
      </div>

      <div className="container reportes-container">
        {error && <div className="error-banner">{error}</div>}

      <div className="row g-3 mb-4 reportes-stats">
        {stats.map((stat) => (
          <div className="col-6 col-lg-3" key={stat.label}>
            <div className="stat-card">
              <span className={`stat-icon ${stat.cls}`}>{stat.icon}</span>
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <div className="page-card h-100">
            <h2 className="page-card-title">Entradas vs Salidas por mes</h2>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="salidas" name="Salidas" fill={getCssVar("--color-secondary") || "#ec4899"} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="page-card h-100">
            <h2 className="page-card-title">Productos por categoría</h2>
            <div className="chart-box">
              {pieData.length === 0 ? (
                <p className="chart-empty">Sin productos registrados</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={getCategoryColor(entry.name).fg} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="page-card">
            <h2 className="page-card-title">Valor del inventario por categoría</h2>
            <div className="chart-box chart-box-wide">
              {valorData.length === 0 ? (
                <p className="chart-empty">Sin productos registrados</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valorData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={130} stroke="#64748b" fontSize={11} />
                    <Tooltip formatter={(value) => fmtMoney(value)} />
                    <Legend />
                    <Bar dataKey="valor" name="Valor del inventario" radius={[0, 4, 4, 0]}>
                      {valorData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="page-card h-100">
            <h2 className="page-card-title">Productos con stock bajo</h2>
            <div className="table-responsive">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock actual</th>
                    <th>Stock mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        Sin productos en alerta
                      </td>
                    </tr>
                  ) : (
                    alertas.map((p) => (
                      <tr key={p.id} className="stock-bajo">
                        <td className="product-name">{p.nombre}</td>
                        <td>{p.categoria || "Sin categoría"}</td>
                        <td className="cantidad-baja">{p.cantidad}</td>
                        <td>{p.stock_minimo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="page-card h-100">
            <h2 className="page-card-title">Movimientos recientes</h2>
            <div className="table-responsive">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        Sin movimientos registrados
                      </td>
                    </tr>
                  ) : (
                    recentMovements.map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.created_at).toLocaleDateString("es-MX")}</td>
                        <td className="product-name">{m.producto}</td>
                        <td>
                          <span className={`mov-badge ${m.tipo}`}>
                            {m.tipo === "entrada" ? "Entrada" : "Salida"}
                          </span>
                        </td>
                        <td className={m.tipo === "entrada" ? "" : "cantidad-baja"}>
                          {m.tipo === "entrada" ? "+" : "-"}
                          {m.cantidad}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="page-card">
        <h2 className="page-card-title">Generar reporte</h2>
        <p className="report-hint">Exporta el reporte del inventario actual de productos.</p>
        <div className="report-actions">
          <button onClick={exportPdf}>
            <FaFilePdf /> Exportar PDF
          </button>
          <button onClick={exportExcel}>
            <FaFileExcel /> Exportar Excel
          </button>
          <button onClick={() => window.print()}>
            <FaPrint /> Imprimir
          </button>
</div>
        </div>
      </div>
    </>
  );
}

export default Reportes;