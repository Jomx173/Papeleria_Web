import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaExchangeAlt, FaBook, FaPencilAlt, FaHighlighter, FaCalendarAlt, FaPaperclip, FaStar, FaEdit, FaTrash } from "react-icons/fa";
import Modal from "../components/Modal";
import { getMovements, createMovement, updateMovement, deleteMovement, getProducts } from "../services/api";

const emptyForm = { producto_id: "", tipo: "entrada", cantidad: "", motivo: "" };

function formatDate(iso) {
  return new Date(iso).toLocaleString("es-HN", { dateStyle: "short", timeStyle: "short" });
}

function Movimientos() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getMovements()
      .then(setMovements)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openForm = async (movement = null) => {
    setEditing(movement);
    setForm(
      movement
        ? {
            producto_id: movement.producto_id,
            tipo: movement.tipo,
            cantidad: movement.cantidad,
            motivo: movement.motivo || "",
          }
        : emptyForm
    );
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
      if (editing) {
        await updateMovement(editing.id, payload);
      } else {
        await createMovement(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movement) => {
    if (!window.confirm(`¿Eliminar el movimiento de "${movement.producto}"? El stock se ajustará automáticamente.`)) {
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
            <p>Historial de entradas y salidas de productos.</p>
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
        {error && <div className="error-banner">{error}</div>}

      <div className="toolbar mx-0">
        <div className="toolbar-actions">
          <button onClick={openForm}>
            <FaPlus /> Registrar movimiento
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Motivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
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
                      {movement.tipo === "entrada" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className={movement.tipo === "salida" ? "cantidad-baja" : ""}>
                    {movement.tipo === "entrada" ? "+" : "−"}
                    {movement.cantidad}
                  </td>
                  <td>{movement.motivo || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-edit"
                        onClick={() => openForm(movement)}
                        title="Editar movimiento"
                      >
                        <FaEdit /> Editar
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

      {showForm && (
        <Modal onClose={() => setShowForm(false)} size="lg">
          <form className="product-form movement-form" onSubmit={handleSubmit}>
            <h3>{editing ? "Editar movimiento" : "Registrar movimiento"}</h3>

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
              <select name="tipo" value={form.tipo} onChange={handleChange} required>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
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
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar movimiento"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
      </div>
    </>
  );
}

export default Movimientos;