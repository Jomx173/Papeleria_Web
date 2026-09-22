import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBoxOpen, FaTags, FaExclamationTriangle, FaDollarSign, FaBook, FaPencilAlt, FaChartBar, FaStar } from "react-icons/fa";
import { getSummary, getProducts, getLowStockProducts, getMonthlyMovements } from "../services/api";
import { getCssVar } from "../theme.js";
import AnimatedNumber from "../components/AnimatedNumber";
import { formatMoney } from "../utils/formatMoney";
import { ErrorBlock } from "../components/PageStyles";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

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
    },
    {
      label: "Categorías",
      raw: summary ? Number(summary.totalCategorias) : null,
      fmt: (v) => String(Math.round(v)),
      icon: FaTags,
    },
    {
      label: "Stock bajo",
      raw: summary ? Number(summary.stockBajo) : null,
      fmt: (v) => String(Math.round(v)),
      icon: FaExclamationTriangle,
    },
    {
      label: "Valor del inventario",
      raw: summary ? Number(summary.valorInventario) : null,
      fmt: (v) => formatMoney(v),
      icon: FaDollarSign,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-gray-900">
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Inventario de Papelería</h1>
            <p className="text-sm text-gray-500">Controla y organiza tus productos</p>
          </div>

          {loading && <div className="py-8 text-center">Cargando resumen...</div>}

          {!loading && error && (
            <ErrorBlock
              message={`No se pudieron cargar los datos: ${error}`}
              onRetry={load}
            />
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card, i) => (
                <div
                  key={card.label}
                  className="rounded-lg border p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <card.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{card.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">
                      {card.raw == null ? "—" : <AnimatedNumber value={card.raw} format={card.fmt} delay={i * 90} />}
                    </span>
                    <span className="text-xs text-gray-400">{card.icon ? card.icon.type : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Productos recientes section */}
          <div className="mt-6">
            <h2 className="text-xl font-medium mb-3">Productos recientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg border">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium px-4 py-2">Nombre</th>
                    <th className="text-left text-sm font-medium px-4 py-2">Cantidad</th>
                    <th className="text-left text-sm font-medium px-4 py-2">Precio</th>
                    <th className="text-left text-sm font-medium px-4 py-2">Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400">
                        No hay productos registrados
                      </td>
                    </tr>
                  ) : (
                    recentProducts.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="px-4 py-3">
                          <FaBook className="h-5 w-5" />
                          <span>{p.nombre}</span>
                        </td>
                        <td className="px-4 py-3">{p.cantidad}</td>
                        <td className="px-4 py-3">{formatMoney(p.precio)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize">{p.categoria || "Sin categoría"}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock bajo section */}
          <div className="mt-4">
            <h2 className="text-xl font-medium mb-3">
              <FaExclamationTriangle className="mr-1 h-4 w-4" /> Productos con stock bajo
            </h2>
            {lowStockList.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin productos en alerta</p>
            ) : (
              <ul className="space-y-2">
                {lowStockList.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-1">
                    <FaExclamationTriangle className="h-3 w-3 text-orange-500" />
                    <span className="font-medium">{p.nombre}</span>
                    <span className="text-sm text-orange-600">{p.cantidad} unidades</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Movimiento mensual section */}
          <div className="mt-4">
            <h2 className="text-xl font-medium mb-3">
              <FaChartBar className="mr-1 h-4 w-4" /> Movimiento del mes
            </h2>
            <div className="relative height-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill={getCssVar("--color-primary") || "#6366f1"} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="salidas" name="Salidas" fill={getCssVar("--color-secondary") || "#ec4899"} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inicio;