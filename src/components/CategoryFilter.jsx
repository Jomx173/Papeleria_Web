import { useEffect, useState } from "react";
import { getCategories } from "../services/api";

function CategoryFilter({ value, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return (
    <label className="category-filter">
      Filtrar por categoría:
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todas</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export default CategoryFilter;