import { useEffect, useRef, useState } from "react";
import { FaEllipsisV, FaEye, FaPencilAlt, FaTrash } from "react-icons/fa";
import { getCategoryColor } from "../utils/categoryColors";
import { getCategoryIcon } from "../utils/categoryIcons";
import Modal from "./Modal";

const ESTADO_BADGES = {
  en_stock: { cls: "ok", label: "En stock" },
  stock_bajo: { cls: "bajo", label: "Stock bajo" },
  agotado: { cls: "agotado", label: "Agotado" },
};

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
};

function ProductList({
  products,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  selectAllChecked,
  onSelectAll,
}) {
  const partialSelect =
    products.length > 0 && !selectAllChecked && products.some((p) => selectedIds.includes(p.id));

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
    <>
      <table className="product-table">
        <thead>
          <tr>
            <th className="check-col">
              <input
                type="checkbox"
                aria-label="Seleccionar todos"
                checked={selectAllChecked}
                ref={(el) => {
                  if (el) el.indeterminate = partialSelect;
                }}
                onChange={onSelectAll}
              />
            </th>
            <th>Imagen</th>
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
              <td colSpan="8" className="empty-row">
                No hay productos registrados
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const cat = getCategoryColor(product.categoria);
              const badge = ESTADO_BADGES[product.estado] || ESTADO_BADGES.stock_bajo;
              return (
                <tr key={product.id} className={product.stockBajo ? "stock-bajo" : ""}>
                  <td className="check-col">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => onToggleSelect(product.id)}
                    />
                  </td>
<td>
                {(function () {
                  const CatIcon = getCategoryIcon(product.categoria);
                  return (
                    <span
                      className="product-thumb"
                      style={{ background: cat.bg, color: cat.fg }}
                      title={product.categoria || "Sin categoría"}
                    >
                      <CatIcon />
                    </span>
                  );
                })()}
              </td>
                  <td className="product-name">
                    {product.stockBajo && <span title="Stock bajo">⚠️</span>} {product.nombre}
                  </td>
                  <td className={product.stockBajo ? "cantidad-baja" : ""}>{product.cantidad}</td>
                  <td>${Number(product.precio).toFixed(2)}</td>
                  <td>
                    <span className={`estado-badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td>
                    <span className="cat-pill" style={{ background: cat.bg, color: cat.fg }}>
                      {product.categoria || "Sin categoría"}
                    </span>
                  </td>
                  <td>
                    <span className="row-menu-wrap" ref={menuRef}>
                      <button
                        type="button"
                        className="dots-btn"
                        aria-label="Más opciones"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFor(menuFor === product.id ? null : product.id);
                        }}
                      >
                        <FaEllipsisV />
                      </button>
                      {menuFor === product.id && (
                        <div className="row-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="menu-edit"
                            onClick={() => {
                              setMenuFor(null);
                              onEdit(product);
                            }}
                          >
                            <FaPencilAlt /> Editar
                          </button>
                          <button
                            type="button"
                            className="menu-delete"
                            onClick={() => {
                              setMenuFor(null);
                              onDelete(product.id);
                            }}
                          >
                            <FaTrash /> Eliminar
                          </button>
                          <button
                            type="button"
                            className="menu-view"
                            onClick={() => {
                              setMenuFor(null);
                              setDetail(product);
                            }}
                          >
                            <FaEye /> Ver detalles
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
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="product-detail">
            <h3>{detail.nombre}</h3>
            <div className="product-detail-grid">
              <div className="detail-field">
                <span className="detail-label">Código</span>
                <span className="detail-value">{detail.codigo}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Estado</span>
                <span className={`estado-badge ${(ESTADO_BADGES[detail.estado] || ESTADO_BADGES.stock_bajo).cls}`}>
                  {(ESTADO_BADGES[detail.estado] || ESTADO_BADGES.stock_bajo).label}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Categoría</span>
                <span className="cat-pill" style={{ background: getCategoryColor(detail.categoria).bg, color: getCategoryColor(detail.categoria).fg }}>
                  {detail.categoria || "Sin categoría"}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Cantidad actual</span>
                <span className="detail-value">{detail.cantidad}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Stock mínimo</span>
                <span className="detail-value">{detail.stock_minimo}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Precio</span>
                <span className="detail-value">${Number(detail.precio).toFixed(2)}</span>
              </div>
              <div className="detail-field detail-field-wide">
                <span className="detail-label">Fecha de creación</span>
                <span className="detail-value">{formatFecha(detail.created_at)}</span>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default ProductList;