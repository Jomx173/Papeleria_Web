import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaTags,
  FaExclamationTriangle,
  FaDollarSign,
  FaBook,
  FaPencilAlt,
  FaBookOpen,
  FaChartBar,
  FaStar,
  FaPaperclip,
  FaStickyNote,
  FaRulerCombined,
  FaCut,
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
} from "recharts";
import { getSummary, getProducts, getLowStockProducts, getMonthlyMovements } from "../services/api";
import { getCssVar } from "../theme.js";
import AnimatedNumber from "../components/AnimatedNumber";

const formatCurrency = (value) =>
  `L. ${Number(value || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STICKER_CATEGORIA = {
  Cuadernos: { icon: FaBook, color: "#f59e0b" },
  Escritura: { icon: FaPencilAlt, color: "#ec4899" },
  Arte: { icon: FaStar, color: "#f59e0b" },
  Oficina: { icon: FaPaperclip, color: "#3b82f6" },
  Escolar: { icon: FaRulerCombined, color: "#8b5cf6" },
  Accesorios: { icon: FaCut, color: "#f43f5e" },
  Papel: { icon: FaStickyNote, color: "#f59e0b" },
  Varios: { icon: FaBook, color: "#6366f1" },
};
const STICKER_DEFAULT = { icon: FaBook, color: "#6366f1" };

function ProductSticker({ categoria }) {
  const { icon: Icon, color } = STICKER_CATEGORIA[categoria] || STICKER_DEFAULT;
  return (
    <span
      className="product-thumb product-thumb-sticker"
      style={{ background: `${color}22`, color }}
    >
      <Icon />
    </span>
  );
}

function Inicio() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    Promise.all([getSummary(), getProducts(), getLowStockProducts(), getMonthlyMovements(1)])
      .then(([resumen, prods, alertasList, mes]) => {
        setSummary(resumen);
        setProducts(prods);
        setAlertas(alertasList);
        setMonthly(mes);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
  const lowStockList = alertas.slice(0, 5);

  const cards = [
    {
      label: "Total de productos",
      raw: summary ? Number(summary.totalProductos) : null,
      fmt: (v) => String(Math.round(v)),
      icon: FaBoxOpen,
      accent: "violet",
    },
    {
      label: "Categorías",
      raw: summary ? Number(summary.totalCategorias) : null,
      fmt: (v) => String(Math.round(v)),
      icon: FaTags,
      accent: "blue",
    },
    {
      label: "Stock bajo",
      raw: summary ? Number(summary.stockBajo) : null,
      fmt: (v) => String(Math.round(v)),
      icon: FaExclamationTriangle,
      accent: summary && summary.stockBajo > 0 ? "orange" : "green",
    },
    {
      label: "Valor del inventario",
      raw: summary ? Number(summary.valorInventario) : null,
      fmt: (v) => formatCurrency(v),
      icon: FaDollarSign,
      accent: "green",
    },
  ];

  return (
    <div>
      <div className="page-banner">
        <div className="page-banner-text">
          <span className="page-banner-icon">
            <FaBoxOpen />
          </span>
          <div>
            <h1>Inventario de Papelería</h1>
            <p>Controla y organiza tus productos de forma fácil y rápida.</p>
          </div>
        </div>
        <div className="page-banner-art" aria-hidden="true">
          <FaBook className="art art-book" />
          <FaPencilAlt className="art art-pencil" />
          <FaBookOpen className="art art-book-open" />
          <FaStar className="art art-star" />
          <FaPaperclip className="art art-clip" />
        </div>
        <div className="banner-note">
          <span className="banner-note-text handwritten">Todo listo, ¡a trabajar! 🚀</span>
        </div>
      </div>

      {loading && <div className="inicio-loading">Cargando resumen...</div>}

      {!loading && error && <div className="error-banner">{error}</div>}

      {!loading && !error && (
        <>
          <div className="row g-3 mb-4">
            {cards.map((card, i) => (
              <div key={card.label} className="col-12 col-md-6 col-xl-3">
                <div className={`inicio-card accent-${card.accent}`}>
                  <span className="inicio-card-watermark" aria-hidden="true">
                    <card.icon />
                  </span>
                  <div className="inicio-card-icon">
                    <card.icon />
                  </div>
                  <div className="inicio-card-body">
                    <span className="inicio-card-label">{card.label}</span>
                    <span className="inicio-card-value">
                      {card.raw == null ? "—" : <AnimatedNumber value={card.raw} format={card.fmt} delay={i * 90} />}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-7">
              <div className="page-card h-100">
                <h2 className="page-card-title">Productos recientes</h2>
                <div className="table-responsive">
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Categoría</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProducts.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-row">
                            Sin productos registrados
                          </td>
                        </tr>
                      ) : (
                        recentProducts.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <ProductSticker categoria={p.categoria} />
                            </td>
                            <td className="product-name">{p.nombre}</td>
                            <td>{p.cantidad}</td>
                            <td>${Number(p.precio).toFixed(2)}</td>
                            <td>{p.categoria || "Sin categoría"}</td>
                            <td>
                              <Link to="/productos" className="btn-secondary page-link-btn page-link-btn-primary">
                                Ver en Productos
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="page-card h-100">
                <div className="page-card-header">
                  <h2>
                    <FaExclamationTriangle /> Productos con stock bajo
                  </h2>
                </div>
                {lowStockList.length === 0 ? (
                  <p className="page-card-title no-margin">Sin productos en alerta</p>
                ) : (
                  <ul className="alerta-list">
                    {lowStockList.map((p) => (
                      <li key={p.id}>
                        <span className="product-name">{p.nombre}</span>
                        <span className="unidades">{p.cantidad} unidades</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="page-card">
                <div className="page-card-header">
                  <h2>
                    <FaChartBar /> Movimiento del mes
                  </h2>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="salidas" name="Salidas" fill={getCssVar("--color-secondary") || "#ec4899"} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Inicio;