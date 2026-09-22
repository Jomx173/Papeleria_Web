import { useEffect, useState } from "react";
import { getCategories } from "../services/api";
import { validateProduct } from "../utils/productValidation";

function ProductForm({ initialProduct, onSubmit }) {
  const [form, setForm] = useState(() =>
    initialProduct
      ? { nombre: initialProduct.nombre, cantidad: initialProduct.cantidad, precio: initialProduct.precio, stock_minimo: initialProduct.stock_minimo ?? 5, categoria_id: initialProduct.categoria_id ?? "" }
      : { nombre: "", cantidad: "", precio: "", stock_minimo: 5, categoria_id: "" }
  );
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errors: errs, data } = validateProduct(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(data);
  };

  return (
    <form className="product-form rounded-lg p-6 border w-full max-w-md" onSubmit={handleSubmit} noValidate>
      <h3 className="text-xl font-medium mb-4"> {initialProduct ? "Editar producto" : "Nuevo producto"} </h3>

      <div className="mb-3"><label className="block text-sm font-medium mb-2">Nombre</label> <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del producto" className="w-full rounded-md border px-3 py-2" autoFocus /> {errors.nombre && <span className="text-xs text-red-600">× nombre</span>}</div>

      <div className="mb-3"><label className="block text-sm font-medium mb-2">Categoría</label> <select name="categoria_id" value={form.categoria_id} onChange={handleChange} className="w-full rounded-md border px-3 py-2"><option value="">Seleccionar categoría</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>{errors.categoria_id && <span className="text-xs text-red-600">× categoria</span>}</div>

      <div className="mb-3"><label className="block text-sm font-medium mb-2">Cantidad</label> <input type="number" name="cantidad" min="0" step="1" value={form.cantidad} onChange={handleChange} placeholder="0" className="w-full rounded-md border px-3 py-2" /> {errors.cantidad && <span className="text-xs text-red-600">× cantidad</span>}</div>

      <div className="mb-3"><label className="block text-sm font-medium mb-2">Precio</label> <input type="number" name="precio" min="0.01" step="0.01" value={form.precio} onChange={handleChange} placeholder="0.00" className="w-full rounded-md border px-3 py-2" /> {errors.precio && <span className="text-xs text-red-600">× precio</span>}</div>

      <div className="mb-3"><label className="block text-sm font-medium mb-2">Stock mínimo</label> <input type="number" name="stock_minimo" min="0" step="1" value={form.stock_minimo} onChange={handleChange} placeholder="5" className="w-full rounded-md border px-3 py-2" /> {errors.stock_minimo && <span className="text-xs text-red-600">× stock mínimo</span>}</div>

      <div className="form-actions justify-between">
        <button type="submit" className="btn-primary"> {initialProduct ? "Guardar cambios" : "Registrar producto"} </button>
        <button type="button" className="btn-secondary" data-close-modal>Cancelar</button>
      </div>
    </form>
  );
}

export default ProductForm;