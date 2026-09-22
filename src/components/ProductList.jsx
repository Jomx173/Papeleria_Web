import { useEffect, useRef, useState } from "react";
import { FaEllipsisV, FaPencilAlt, FaTrash } from "react-icons/fa";
import { formatMoney } from "../utils/formatMoney";

const ESTADO_BADGES = {
  en_stock: { cls: "ok", label: "En stock" },
  stock_bajo: { cls: "bajo", label: "Stock bajo" },
  agotado: { cls: "agotado", label: "Agotado" },
};

const getEstado = (product) =>
  product.estado ??
  (Number(product.cantidad) === 0
    ? "agotado"
    : Number(product.cantidad) <= Number(product.stock_minimo ?? 5)
      ? "stock_bajo"
      : "en_stock");

function ProductList({ products, onEdit, onDelete, selectedIds, onToggleSelect, selectAllChecked, onSelectAll }) {
  const [menuFor, setMenuFor] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuFor === null) return undefined;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuFor(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuFor]);

  return (
    <div className="table-responsive">
      <table className="product-table products-table">
        <thead>
          <tr>
            <th className="check-col">
              <input type="checkbox" aria-label="Seleccionar todos" checked={selectAllChecked} onChange={onSelectAll} />
            </th>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-row">
                No hay productos registrados
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const estado = getEstado(product);
              const badge = ESTADO_BADGES[estado] ?? ESTADO_BADGES.en_stock;
              const esBajo = estado !== "en_stock";
              return (
                <tr key={product.id} className={esBajo ? "stock-bajo" : ""}>
                  <td className="check-col">
                    <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => onToggleSelect(product.id)} />
                  </td>
                  <td className="product-name">
                    {product.nombre}
                  </td>
                  <td className={esBajo ? "cantidad-baja" : ""}>{product.cantidad}</td>
                  <td>{formatMoney(product.precio)}</td>
                  <td>
                    <span className={`estado-badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td>
                    <span className="cat-pill" style={{ background: "#e5e7eb", color: "#6b7280" }}>
                      {product.categoria || "Sin categoría"}
                    </span>
                  </td>
                  <td>
                    <span className="row-menu-wrap">
                      <button type="button" className="dots-btn" aria-label="Más opciones" onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor(menuFor === product.id ? null : product.id);
                      }}>
                        <FaEllipsisV />
                      </button>
                      {menuFor === product.id && (
                        <div className="row-menu" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="menu-edit" onClick={() => { setMenuFor(null); onEdit(product); }}>
                            <FaPencilAlt /> Editar
                          </button>
                          <button type="button" className="menu-delete" onClick={() => { setMenuFor(null); onDelete(product.id); }}>
                            <FaTrash /> Eliminar
                          </button>
                        </div>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProductList;