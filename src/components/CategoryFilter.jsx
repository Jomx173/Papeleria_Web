import { useEffect, useState } from "react";
import { getCategories } from "../services/api";

function CategoryFilter({ value, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Filtrar por categoría</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border px-3 py-2">
        <option value="">Todas</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
      </select>
    </div>
  );
}

export default CategoryFilter;