import { useCallback, useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaTags,
  FaExclamationTriangle,
  FaDollarSign,
  FaBook,
  FaPencilAlt,
  FaRulerCombined,
  FaStar,
  FaPaperclip,
} from "react-icons/fa";
import { getSummary, getProducts, getLowStockProducts, getMonthlyMovements } from "../services/api";
import { getCssVar } from "../theme.js";
import AnimatedNumber from "../components/AnimatedNumber";
import { formatMoney } from "../utils/formatMoney";
import { LoadingBlock, ErrorBlock } from "../components/PageStates";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

function Inicio() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    Promise.all([getSummary(), getProducts(), getLowStockProducts(), getMonthlyMovements(6)])
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
      icon: <FaBoxOpen />,
      cls: "violet",
    },
    {
      label: "Categorías",
      raw: summary ? Number(summary.totalCategorias) : null,
      fmt: (v) => String(Math.round(v)),
      icon: <FaTags />,
      cls: "blue",
    },
    {
      label: "Stock bajo",
      raw: summary ? Number(summary.stockBajo) : null,
      fmt: (v) => String(Math.round(v)),
      icon: <FaExclamationTriangle />,
      cls: "orange",
    },
    {
      label: "Valor del inventario",
      raw: summary ? Number(summary.valorInventario) : null,
      fmt: (v) => formatMoney(v),
      icon: <FaDollarSign />,
      cls: "green",
    },
  ];

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-text">
          <span className="page-banner-icon">
            <FaBook />
          </span>
          <div>
            <h1>Inventario de Papelería</h1>
            <p>Controla y organiza tus productos.</p>
          </div>
        </div>
        <div className="page-banner-art" aria-hidden="true">
          <FaPencilAlt className="art art-pencil" />
          <FaRulerCombined className="art art-ruler" />
          <FaBook className="art art-book" />
          <FaStar className="art art-star" />
          <FaPaperclip className="art art-clip" />
        </div>
        <div className="banner-note">
          <span className="banner-note-text handwritten">Todo bajo control ✍️</span>
        </div>
      </div>

      <div className="container">
        {loading && <LoadingBlock label="Cargando resumen" />}
        {!loading && error && (
          <ErrorBlock
            message={`No se pudieron cargar los datos: ${error}`}
            onRetry={load}
          />
        )}
        {!loading && !error && (
          <>
            <div className="row g-3 mb-4 reportes-stats">
              {cards.map((card, i) => (
                <div className="col-6 col-lg-3" key={card.label}>
                  <div className="stat-card">
                    <span className={`stat-icon ${card.cls}`}>{card.icon}</span>
                    <div>
                      <p className="stat-label">{card.label}</p>
                      <p className="stat-value">
                        {card.raw == null ? "…" : <AnimatedNumber value={card.raw} format={card.fmt} delay={i * 90} />}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-lg-7">
                <div className="page-card h-100">
                  <h2 className="page-card-title">Entradas vs salidas por mes</h2>
                  <div className="chart-box">
                    {monthly.length === 0 ? (
                      <p className="chart-empty">Sin movimientos registrados</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                          <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="entradas" name="Entradas" fill={getCssVar("--color-primary") || "#6366f1"} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="salidas" name="Salidas" fill={getCssVar("--color-secondary") || "#ec4899"} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-5">
                <div className="page-card h-100">
                  <h2 className="page-card-title">Productos con stock bajo</h2>
                  {lowStockList.length === 0 ? (
                    <p className="chart-empty">Sin productos en alerta</p>
                  ) : (
                    <ul className="alerta-list">
                      {lowStockList.map((p) => (
                        <li key={p.id}>
                          <span>{p.nombre}</span>
                          <span className="unidades">{p.cantidad} uds.</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <div className="page-card">
                  <h2 className="page-card-title">Productos recientes</h2>
                  <div className="table-responsive">
                    <table className="product-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Categoría</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProducts.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="empty-row">
                              No hay productos registrados
                            </td>
                          </tr>
                        ) : (
                          recentProducts.map((p) => (
                            <tr key={p.id}>
                              <td className="product-name">{p.nombre}</td>
                              <td>{p.cantidad}</td>
                              <td>{formatMoney(p.precio)}</td>
                              <td>{p.categoria || "Sin categoría"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Inicio;