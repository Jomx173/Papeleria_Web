import { useCallback, useEffect, useState } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/api";

function CategoryManager({ onCategoriesChanged = () => {}, onClose }) {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      setError("El nombre de la categoría no puede estar vacío");
      return;
    }
    try {
      await createCategory({ nombre: name });
      setNewName("");
      load();
      onCategoriesChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.nombre);
    setError("");
  };

  const handleSaveEdit = async (id) => {
    const name = editingName.trim();
    if (!name) {
      setError("El nombre de la categoría no puede estar vacío");
      return;
    }
    try {
      await updateCategory(id, { nombre: name });
      setEditingId(null);
      setEditingName("");
      load();
      onCategoriesChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    try {
      await deleteCategory(id);
      load();
      onCategoriesChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="category-manager">
      <h3>Gestionar categorías</h3>

      {error && <div className="error-banner">{error}</div>}

      <div className="category-add">
        <input
          type="text"
          placeholder="Nueva categoría"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd}>Agregar</button>
      </div>

      <ul className="category-list">
        {categories.length === 0 ? (
          <li className="category-empty">No hay categorías registradas</li>
        ) : (
          categories.map((category) => (
            <li key={category.id}>
              {editingId === category.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(category.id)}
                  />
                  <button onClick={() => handleSaveEdit(category.id)}>Guardar</button>
                  <button className="btn-secondary" onClick={() => setEditingId(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="category-name">{category.nombre}</span>
                  <button onClick={() => startEdit(category)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(category.id)}>
                    Eliminar
                  </button>
                </>
              )}
            </li>
          ))
        )}
      </ul>

      <div className="form-actions">
        {onClose && (
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}

export default CategoryManager;