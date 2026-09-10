import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { getCategories } from "../services/api";
import { validateProduct } from "../utils/productValidation";

let nextRowId = 0;

const newRow = () => ({
  id: ++nextRowId,
  nombre: "",
  categoria_id: "",
  cantidad: "",
  precio: "",
  stock_minimo: 5,
});

function ProductBulk({ onSave }) {
  const [rows, setRows] = useState([newRow()]);
  const [leaving, setLeaving] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const removeTimers = useRef({});

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => () => {
    Object.values(removeTimers.current).forEach((t) => clearTimeout(t));
  }, []);

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    setRowErrors((prev) => {
      if (!prev[rows[index].id]) return prev;
      const next = { ...prev };
      delete next[rows[index].id];
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, newRow()]);
  };

  const removeRow = (id) => {
    if (rows.length === 1 || leaving.includes(id)) return;
    setLeaving((prev) => [...prev, id]);
    removeTimers.current[id] = setTimeout(() => {
      setRows((prev) => prev.filter((r) => r.id !== id));
      setRowErrors((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setLeaving((prev) => prev.filter((x) => x !== id));
    }, 200);
  };

  const handleSave = () => {
    const errs = {};
    const data = [];
    let hasErrors = false;

    rows.forEach((row) => {
      const result = validateProduct(row);
      if (Object.keys(result.errors).length > 0) {
        errs[row.id] = result.errors;
        hasErrors = true;
      }
      data.push(result.data ?? {});
    });

    if (hasErrors) {
      setRowErrors(errs);
      return;
    }

    onSave(data);
  };

  const errorCount = Object.values(rowErrors).reduce(
    (acc, fieldErrors) => acc + Object.keys(fieldErrors).length,
    0
  );

  return (
    <div className="bulk-modal">
      <h3 className="modal-title">Agregar varios productos</h3>
      <p className="bulk-hint">
        Completa la información de cada fila y guarda todos los productos a la vez.
      </p>

      {errorCount > 0 && (
        <div className="error-banner">Revisa los campos marcados en rojo ({errorCount}).</div>
      )}

      <div className="bulk-table-wrap">
        <table className="bulk-table">
          <thead>
            <tr>
              <th className="col-nombre">Nombre</th>
              <th className="col-categoria">Categoría</th>
              <th className="col-cantidad">Cantidad</th>
              <th className="col-precio">Precio</th>
              <th className="col-stock">Stock mínimo</th>
              <th className="col-accion">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={leaving.includes(row.id) ? "row-removing" : ""}>
                <td className="col-nombre">
                  <input
                    type="text"
                    value={row.nombre}
                    onChange={(e) => updateRow(index, "nombre", e.target.value)}
                    placeholder="Ej. Bolígrafo azul"
                  />
                  {rowErrors[row.id]?.nombre && (
                    <span className="field-error">{rowErrors[row.id].nombre}</span>
                  )}
                </td>
                <td className="col-categoria">
                  <select
                    value={row.categoria_id}
                    onChange={(e) => updateRow(index, "categoria_id", e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                  {rowErrors[row.id]?.categoria_id && (
                    <span className="field-error">{rowErrors[row.id].categoria_id}</span>
                  )}
                </td>
                <td className="col-cantidad">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={row.cantidad}
                    onChange={(e) => updateRow(index, "cantidad", e.target.value)}
                    placeholder="0"
                  />
                  {rowErrors[row.id]?.cantidad && (
                    <span className="field-error">{rowErrors[row.id].cantidad}</span>
                  )}
                </td>
                <td className="col-precio">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={row.precio}
                    onChange={(e) => updateRow(index, "precio", e.target.value)}
                    placeholder="0.00"
                  />
                  {rowErrors[row.id]?.precio && (
                    <span className="field-error">{rowErrors[row.id].precio}</span>
                  )}
                </td>
                <td className="col-stock">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={row.stock_minimo}
                    onChange={(e) => updateRow(index, "stock_minimo", e.target.value)}
                    placeholder="5"
                  />
                  {rowErrors[row.id]?.stock_minimo && (
                    <span className="field-error">{rowErrors[row.id].stock_minimo}</span>
                  )}
                </td>
                <td className="col-accion">
                  <button
                    type="button"
                    className="bulk-remove-btn"
                    aria-label="Quitar fila"
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bulk-footer">
        <button type="button" className="btn-outline" onClick={addRow}>
          <FaPlus /> Agregar fila
        </button>
        <div className="bulk-footer-actions">
          <button type="button" className="btn-secondary" data-close-modal>
            Cancelar
          </button>
          <button type="button" onClick={handleSave}>
            Guardar <span key={rows.length} className="bulk-count">{rows.length}</span> producto
            {rows.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductBulk;