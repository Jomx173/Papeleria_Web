import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaExchangeAlt, FaBook, FaPencilAlt, FaHighlighter, FaCalendarAlt, FaPaperclip, FaStar, FaEye, FaTrash } from "react-icons/fa";
import Modal from "../components/Modal";
import { LoadingBlock, ErrorBlock } from "../components/PageStates";
import { getMovements, createMovement, deleteMovement, getProducts } from "../services/api";

const emptyForm = { producto_id: "", tipo: "entrada", cantidad: "", motivo: "" };

function formatDate(iso) {
  return new Date(iso).toLocaleString("es-HN", { dateStyle: "short", timeStyle: "short" });
}

const tipoLabel = (tipo) => (tipo === "entrada" ? "Entrada" : tipo === "salida" ? "Salida" : "Ajuste");

const movimientoCantidad = (movement) => {
  if (movement.tipo === "entrada") return `+${movement.cantidad}`;
  if (movement.tipo === "salida") return `−${movement.cantidad}`;
  return movement.cantidad > 0 ? `+${movement.cantidad}` : `${movement.cantidad}`;
};

const movimientoEsBaja = (movement) =>
  movement.tipo === "salida" || (movement.tipo === "ajuste" && movement.cantidad < 0);

function Movimientos() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getMovements()
      .then(setMovements)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openForm = async () => {
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
    try {
      setProducts(await getProducts());
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        producto_id: Number(form.producto_id),
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        motivo: form.motivo.trim() || null,
      };
      await createMovement(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movement) => {
    if (!window.confirm(`¿Deseas eliminar el movimiento de "${movement.producto}"? El stock se ajustará automáticamente.`)) {
      return;
    }
    try {
      await deleteMovement(movement.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-text">
          <span className="page-banner-icon">
            <FaExchangeAlt />
          </span>
          <div>
            <h1>Movimientos</h1>
            <p>Historial de entradas, salidas y ajustes de stock.</p>
          </div>
        </div>
        <div className="page-banner-art" aria-hidden="true">
          <FaBook className="art art-book" />
          <FaPencilAlt className="art art-pencil" />
          <FaHighlighter className="art art-ruler" />
          <FaCalendarAlt className="art art-pen" />
          <FaPaperclip className="art art-clip" />
          <FaStar className="art art-star" />
        </div>
        <div className="banner-note">
          <span className="banner-note-text handwritten">Cada entrada y salida, contada ✅</span>
        </div>
      </div>

      <div className="container">
      <div className="toolbar mx-0">
        <div className="toolbar-actions">
          <button onClick={openForm}>
            <FaPlus /> Registrar movimiento
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Cargando movimientos" />
      ) : error ? (
        <ErrorBlock
          message={`No se pudieron cargar los movimientos: ${error}`}
          onRetry={load}
        />
      ) : (
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Stock anterior</th>
              <th>Stock actual</th>
              <th>Motivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  No hay movimientos registrados
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{formatDate(movement.created_at)}</td>
                  <td className="product-name">{movement.producto || "Producto eliminado"}</td>
                  <td>
                    <span className={`mov-badge ${movement.tipo}`}>
                      {tipoLabel(movement.tipo)}
                    </span>
                  </td>
                  <td className={movimientoEsBaja(movement) ? "cantidad-baja" : ""}>
                    {movimientoCantidad(movement)}
                  </td>
                  <td>{movement.stock_anterior ?? "—"}</td>
                  <td>{movement.stock_actual ?? "—"}</td>
                  <td>{movement.motivo || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-edit"
                        onClick={() => setViewing(movement)}
                        title="Ver detalles del movimiento"
                      >
                        <FaEye /> Ver
                      </button>
                      <button
                        className="btn-danger btn-delete"
                        onClick={() => handleDelete(movement)}
                        title="Eliminar movimiento"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} size="lg">
          <form className="product-form movement-form" onSubmit={handleSubmit}>
            <h3>Registrar movimiento</h3>

            {formError && <div className="error-banner">{formError}</div>}

            <label>
              Producto
              <select name="producto_id" value={form.producto_id} onChange={handleChange} required>
                <option value="">Selecciona un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nombre} (stock: {product.cantidad})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tipo
              <div className="mov-type-toggle">
                <button
                  type="button"
                  className={form.tipo === "entrada" ? "seg-btn seg-btn-entrada active" : "seg-btn seg-btn-entrada"}
                  onClick={() => setForm((prev) => ({ ...prev, tipo: "entrada" }))}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  className={form.tipo === "salida" ? "seg-btn seg-btn-salida active" : "seg-btn seg-btn-salida"}
                  onClick={() => setForm((prev) => ({ ...prev, tipo: "salida" }))}
                >
                  Salida
                </button>
              </div>
            </label>

            <label>
              Cantidad
              <input
                type="number"
                name="cantidad"
                min="1"
                step="1"
                value={form.cantidad}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Motivo (opcional)
              <input
                type="text"
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                placeholder="Ej. Reposición de mercadería"
              />
            </label>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Registrar movimiento"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                data-close-modal
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal onClose={() => setViewing(null)} size="md">
          <div className="detail-view">
            <h3>Detalles del movimiento</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Fecha</span>
                <span className="detail-value">{formatDate(viewing.created_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Producto</span>
                <span className="detail-value">{viewing.producto || "Producto eliminado"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tipo</span>
                <span className="detail-value">
                  <span className={`mov-badge ${viewing.tipo}`}>
                    {tipoLabel(viewing.tipo)}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cantidad</span>
                <span className="detail-value">{movimientoCantidad(viewing)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stock anterior</span>
                <span className="detail-value">{viewing.stock_anterior ?? "—"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stock actual</span>
                <span className="detail-value">{viewing.stock_actual ?? "—"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Motivo</span>
                <span className="detail-value">{viewing.motivo || "—"}</span>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" data-close-modal>
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </>
  );
}

export default Movimientos;