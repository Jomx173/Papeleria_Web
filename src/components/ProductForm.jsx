import { useEffect, useState } from "react";
import { getCategories } from "../services/api";

const emptyProduct = {
  nombre: "",
  cantidad: "",
  precio: "",
  stock_minimo: 5,
  categoria_id: "",
};

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
      : emptyProduct
  );
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const stockMinimo = form.stock_minimo === "" || form.stock_minimo == null
      ? 5
      : Number(form.stock_minimo);
    const data = {
      nombre: form.nombre.trim(),
      cantidad: Number(form.cantidad),
      precio: Number(form.precio),
      stock_minimo: stockMinimo,
      categoria_id: form.categoria_id === "" ? null : Number(form.categoria_id),
    };
    onSubmit(data);
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h3>{initialProduct ? "Editar producto" : "Nuevo producto"}</h3>

      <label>
        Nombre
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />
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
          required
        />
      </label>

      <label>
        Stock mínimo
        <input
          type="number"
          name="stock_minimo"
          min="0"
          step="1"
          value={form.stock_minimo}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Precio
        <input
          type="number"
          name="precio"
          min="0"
          step="0.01"
          value={form.precio}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Categoría
        <select name="categoria_id" value={form.categoria_id} onChange={handleChange}>
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button type="submit">{initialProduct ? "Guardar cambios" : "Crear producto"}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default ProductForm;