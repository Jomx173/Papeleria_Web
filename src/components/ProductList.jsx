import { useEffect, useRef, useState } from "react";
import { FaEllipsisV, FaPencilAlt, FaTrash } from "react-icons/fa";
import { formatMoney } from "../utils/formatMoney";

const ESTADO_BADGES = {
  en_stock: { cls: "ok", label: "En stock" },
  stock_bajo: { cls: "bajo", label: "Stock bajo" },
  agotado: { cls: "agotado", label: "Agotado" },
};

function ProductList({ products, onEdit, onDelete, selectedIds, onToggleSelect, selectAllChecked, onSelectAll }) {
  const partialSelect = products.length > 0 && !selectAllChecked && products.some((p) => selectedIds.includes(p.id));

  const [menuFor, setMenuFor] = useState(null);
  const [detail, setDetail] = useState(null);
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
      <table className="product-table products-table w-full rounded-lg border">
        <thead>
          <tr className="border-b">
            <th className="check-col text-left px-4 py-2">
              <input type="checkbox" aria-label="Seleccionar todos" checked={selectAllChecked} onChange={onSelectAll} />
            </th>
            <th className="text-left px-4 py-2">Nombre</th>
            <th className="text-left px-4 py-2">Cantidad</th>
            <th className="text-left px-4 py-2">Precio</th>
            <th className="text-left px-4 py-2">Estado</th>
            <th className="text-left px-4 py-2">Categoría</th>
            <th className="text-left px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-row text-center py-8 text-gray-400">
                No hay productos registrados
              </td>
            </tr>
          ) : (
            products.map((product) => {
              return (
                <tr key={product.id} className="border-b">
                  <td className="check-col px-4 py-2">
                    <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => onToggleSelect(product.id)} />
                  </td>
                  <td className="product-name px-4 py-3">
                    {product.nombre}
                  </td>
                  <td className="px-4 py-3">{product.cantidad}</td>
                  <td className="px-4 py-3">{formatMoney(product.precio)}</td>
                  <td>
                    <span className={`estado-badge ${ESTADO_BADGES.en_stock.cls}`}>En stock</span>
                  </td>
                  <td>
                    <span className="cat-pill text-xs capitalize" style={{ background: "#e5e7eb", color: "#6b7280" }}>
                      {product.categoria || "Sin categoría"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
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