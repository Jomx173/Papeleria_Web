import { useCallback, useEffect, useState } from "react";
import {
  FaTags,
  FaBoxOpen,
  FaCheckCircle,
  FaSearch,
  FaPlus,
  FaPencilAlt,
  FaPalette,
  FaRulerCombined,
  FaBook,
  FaPen,
  FaStar,
  FaStickyNote,
} from "react-icons/fa";
import Modal from "../components/Modal";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesSummary,
} from "../services/api";
import { getCategoryIcon } from "../utils/categoryIcons";
import { getCategoryColor } from "../utils/categoryColors";
import AnimatedNumber from "../components/AnimatedNumber";

function Categorias() {
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, []);

  const loadSummary = useCallback(() => {
    getCategoriesSummary()
      .then(setSummary)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    loadSummary();
  }, [load, loadSummary]);

  const openNew = () => {
    setEditing(null);
    setFormName("");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setFormName(category.nombre);
    setFormError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormName("");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombre = formName.trim();
    if (!nombre) {
      setFormError("El campo 'nombre' es obligatorio");
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, { nombre });
      } else {
        await createCategory({ nombre });
      }
      handleCancel();
      load();
      loadSummary();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (category) => {
    const count = Number(category.totalProductos) || 0;
    const message =
      count > 0
        ? `La categoría "${category.nombre}" tiene ${count} producto(s) asociado(s). ¿Eliminarla de todas formas?`
        : `¿Eliminar la categoría "${category.nombre}"?`;
    if (!window.confirm(message)) return;
    try {
      await deleteCategory(category.id);
      load();
      loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const q = search.trim().toLowerCase();
  const visibleCategories = categories
    .filter((c) => !q || c.nombre.toLowerCase().includes(q))
    .sort((a, b) =>
      sortDir === "asc"
        ? a.nombre.localeCompare(b.nombre, "es")
        : b.nombre.localeCompare(a.nombre, "es")
    );

  const stats = [
    {
      label: "Categorías registradas",
      raw: summary ? Number(summary.totalCategorias) : null,
      fmt: (v) => String(Math.round(v)),
      icon: <FaTags />,
      cls: "violet",
    },
    {
      label: "Productos en total",
      raw: summary ? Number(summary.totalProductos) : null,
      fmt: (v) => String(Math.round(v)),
      icon: <FaBoxOpen />,
      cls: "blue",
    },
    {
      label: "Categorías con productos",
      raw: summary ? Number(summary.categoriasConProductos) : null,
      fmt: (v) => String(Math.round(v)),
      icon: <FaCheckCircle />,
      cls: "green",
    },
  ];

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-text">
          <span className="page-banner-icon">
            <FaTags />
          </span>
          <div>
            <h1>Categorías</h1>
            <p>Organiza tus productos por categorías.</p>
          </div>
        </div>
        <div className="page-banner-art" aria-hidden="true">
          <FaPalette className="art art-pencil" />
          <FaRulerCombined className="art art-ruler" />
          <FaBook className="art art-book" />
          <FaPen className="art art-pen" />
          <FaStar className="art art-star" />
          <FaStickyNote className="art art-notes" />
        </div>
        <div className="banner-note">
          <span className="banner-note-text handwritten">Organiza y encuentra todo rápido 🗂️</span>
        </div>
      </div>

      <div className="container">
        {error && <div className="error-banner">{error}</div>}

      <div className="row g-3 mb-3">
        {stats.map((stat, i) => (
          <div className="col-12 col-md-4" key={stat.label}>
            <div className="stat-card">
              <span className={`stat-icon ${stat.cls}`}>{stat.icon}</span>
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.raw == null ? "—" : <AnimatedNumber value={stat.raw} format={stat.fmt} delay={i * 90} />}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-actions">
          <button onClick={openNew}>
            <FaPlus /> Nueva categoría
          </button>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="category-filter">
            Ordenar por:
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Nombre A-Z</option>
              <option value="desc">Nombre Z-A</option>
            </select>
          </label>
        </div>
      </div>

      {showForm && (
        <Modal onClose={handleCancel}>
          <form className="product-form category-form" onSubmit={handleSubmit}>
            <h2 className="modal-title">
              {editing ? "Editar categoría" : "Nueva categoría"}
            </h2>
            {formError && <div className="error-banner">{formError}</div>}
            <div>
              <label htmlFor="category-name">Nombre</label>
              <input
                id="category-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej. Escolar"
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" data-close-modal>
                Cancelar
              </button>
              <button type="submit">{editing ? "Guardar" : "Crear"}</button>
            </div>
          </form>
        </Modal>
      )}

      {visibleCategories.length === 0 ? (
        <div className="page-card empty-card">
          <p className="page-card-title">No hay categorías registradas</p>
        </div>
      ) : (
        <div className="row g-3">
          {visibleCategories.map((category) => {
            const Icon = getCategoryIcon(category.nombre);
            const color = getCategoryColor(category.nombre);
            const count = Number(category.totalProductos) || 0;
            return (
              <div className="col-12 col-md-6 col-xl-3" key={category.id}>
                <div className="categoria-card">
                  <span className="categoria-card-icon" style={{ background: color.bg, color: color.fg }}>
                    <Icon />
                  </span>
                  <h3 className="categoria-card-title">{category.nombre}</h3>
                  <p className="categoria-card-subtitle">
                    {count === 1 ? "1 producto" : `${count} productos`}
                  </p>
                  <div className="categoria-card-actions">
                    <button className="btn-secondary" onClick={() => openEdit(category)}>
                      <FaPencilAlt /> Editar
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(category)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
}

export default Categorias;