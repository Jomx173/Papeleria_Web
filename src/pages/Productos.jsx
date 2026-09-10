import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTags,
  FaBoxOpen,
  FaSearch,
  FaPencilAlt,
  FaRulerCombined,
  FaBook,
  FaPen,
  FaTrash,
  FaPlus,
  FaCut,
  FaStickyNote,
} from "react-icons/fa";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";
import ProductBulk from "../components/ProductBulk";
import CategoryFilter from "../components/CategoryFilter";
import StockAlert from "../components/StockAlert";
import Modal from "../components/Modal";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/api";

const PAGE_SIZE = 10;

function Productos() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [toast, setToast] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const toastTimer = useRef(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadProducts = useCallback(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showToast("Cambios guardados correctamente.");
      } else {
        await createProduct(data);
        showToast("Producto registrado correctamente.");
      }
      setShowForm(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkSave = async (products) => {
    try {
      await Promise.all(products.map((product) => createProduct(product)));
      setShowBulk(false);
      showToast(
        `${products.length} producto${products.length === 1 ? "" : "s"} registrado${
          products.length === 1 ? "" : "s"
        } correctamente.`
      );
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.id))) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedProducts.some((p) => p.id === id)));
    } else {
      setSelectedIds((prev) => {
        const ids = new Set(prev);
        paginatedProducts.forEach((p) => ids.add(p.id));
        return [...ids];
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`¿Eliminar ${selectedIds.length} producto(s) seleccionado(s)?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)));
      setSelectedIds([]);
      loadProducts();
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setStatusFilter("");
    setPage(1);
  };

  const filteredProducts = products.filter((product) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || product.nombre.toLowerCase().includes(q);
    const matchesCategory =
      !selectedCategory || String(product.categoria_id) === String(selectedCategory);
    const matchesStatus =
      statusFilter === "" || product.estado === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const allOnPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.includes(p.id));

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-text">
          <span className="page-banner-icon">
            <FaBoxOpen />
          </span>
          <div>
            <h1>Productos</h1>
            <p>Gestiona todos los productos de tu papelería.</p>
          </div>
        </div>
        <div className="page-banner-art" aria-hidden="true">
          <FaPencilAlt className="art art-pencil" />
          <FaRulerCombined className="art art-ruler" />
          <FaBook className="art art-book" />
          <FaPen className="art art-pen" />
          <FaCut className="art art-scissors" />
          <FaStickyNote className="art art-notes" />
        </div>
        <div className="banner-note">
          <span className="banner-note-text handwritten">Cada producto, en su lugar ✨</span>
        </div>
      </div>

      <div className="container">
        {error && <div className="error-banner">{error}</div>}
        {toast && <div className="success-banner">{toast}</div>}

        <StockAlert />

      <div className="toolbar">
        <div className="toolbar-actions">
          <Link to="/categorias" className="btn-outline page-link-btn">
            <FaTags /> Gestionar categorías
          </Link>
          <button onClick={handleNewProduct}>
            <FaPlus /> Nuevo producto
          </button>
          <button className="btn-outline" onClick={() => setShowBulk(true)}>
            <FaPlus /> Agregar varios
          </button>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <CategoryFilter value={selectedCategory} onChange={(v) => { setSelectedCategory(v); setPage(1); }} />
          <label className="category-filter">
            Estado:
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="en_stock">En stock</option>
              <option value="stock_bajo">Stock bajo</option>
              <option value="agotado">Agotado</option>
            </select>
          </label>
          <button className="btn-secondary" onClick={handleClearFilters}>
            Limpiar
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="selection-bar">
          <span>
            {selectedIds.length} producto(s) seleccionado(s)
          </span>
          <button className="btn-danger" onClick={handleDeleteSelected}>
            <FaTrash /> Eliminar seleccionados
          </button>
          <button className="btn-secondary" onClick={() => setSelectedIds([])}>
            Limpiar selección
          </button>
        </div>
      )}

      {showForm && (
        <Modal onClose={handleCancel}>
          <ProductForm
            key={editingProduct ? editingProduct.id : "new"}
            initialProduct={editingProduct}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </Modal>
      )}

      {showBulk && (
        <Modal onClose={() => setShowBulk(false)} size="lg">
          <ProductBulk
            onCancel={() => setShowBulk(false)}
            onSave={handleBulkSave}
          />
        </Modal>
      )}

      <ProductList
        products={paginatedProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelect={(id) =>
          setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
        }
        selectAllChecked={allOnPageSelected}
        onSelectAll={handleSelectAll}
      />

      {filteredProducts.length > 0 && (
        <div className="pagination-bar">
          <button
            className="btn-secondary"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="btn-secondary"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
      </div>
    </>
  );
}

export default Productos;