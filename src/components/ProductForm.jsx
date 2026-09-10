import { useEffect, useState } from "react";
import { getCategories } from "../services/api";
import { validateProduct } from "../utils/productValidation";

function ProductForm({ initialProduct, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    initialProduct
      ? {
          nombre: initialProduct.nombre,
          cantidad: initialProduct.cantidad,
          precio: initialProduct.precio,
          stock_minimo: initialProduct.stock_minimo ?? 5,
          categoria_id: initialProduct.categoria_id ?? "",
        }
      : { nombre: "", cantidad: "", precio: "", stock_minimo: 5, categoria_id: "" }
  );
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errors: errs, data } = validateProduct(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(data);
  };

  return (
    <form className="product-form product-form-compact" onSubmit={handleSubmit} noValidate>
      <h3 className="modal-title">
        {initialProduct ? "Editar producto" : "Nuevo producto"}
      </h3>

      <label className="span-2">
        Nombre
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre del producto"
          autoFocus
        />
        {errors.nombre && <span className="field-error">{errors.nombre}</span>}
      </label>

      <label className="span-2">
        Categoría
        <select name="categoria_id" value={form.categoria_id} onChange={handleChange}>
          <option value="">Seleccionar categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>
        {errors.categoria_id && <span className="field-error">{errors.categoria_id}</span>}
      </label>

      <label>
        Cantidad
        <input
          type="number"
          name="cantidad"
          min="0"
          step="1"
          value={form.cantidad}
          onChange={handleChange}
          placeholder="0"
        />
        {errors.cantidad && <span className="field-error">{errors.cantidad}</span>}
      </label>

      <label>
        Precio
        <input
          type="number"
          name="precio"
          min="0.01"
          step="0.01"
          value={form.precio}
          onChange={handleChange}
          placeholder="0.00"
        />
        {errors.precio && <span className="field-error">{errors.precio}</span>}
      </label>

      <label className="span-2">
        Stock mínimo
        <input
          type="number"
          name="stock_minimo"
          min="0"
          step="1"
          value={form.stock_minimo}
          onChange={handleChange}
          placeholder="5"
        />
        {errors.stock_minimo && <span className="field-error">{errors.stock_minimo}</span>}
      </label>

      <div className="form-actions">
        <button type="submit">
          {initialProduct ? "Guardar cambios" : "Registrar producto"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default ProductForm;