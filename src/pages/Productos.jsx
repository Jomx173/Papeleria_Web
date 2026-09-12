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
  FaBoxes,
  FaFileExcel,
  FaPrint,
  FaEllipsisH,
  FaChevronDown,
} from "react-icons/fa";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";
import ProductBulk from "../components/ProductBulk";
import CategoryFilter from "../components/CategoryFilter";
import StockAlert from "../components/StockAlert";
import Modal from "../components/Modal";
import OperationResultModal from "../components/OperationResultModal";
import { LoadingBlock, ErrorBlock } from "../components/PageStates";
import { getProducts, createProduct, updateProduct, deleteProduct, adjustProductsStock } from "../services/api";
import { exportProductosExcel, printProductos } from "../utils/exportProductos";

const PAGE_SIZE = 10;

const ADJUST_DESCRIPTIONS = {
  aumentar: "Suma esta cantidad al stock actual de cada producto seleccionado.",
  disminuir: "Resta esta cantidad al stock actual de cada producto seleccionado.",
  establecer:
    "Fija el stock de cada producto seleccionado a la cantidad exacta indicada (ideal para conteo físico).",
};

function Productos() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustModo, setAdjustModo] = useState("aumentar");
  const [adjustCantidad, setAdjustCantidad] = useState("");
  const [adjustError, setAdjustError] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [stockStamp, setStockStamp] = useState(0);
  const [opResult, setOpResult] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const moreRef = useRef(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showMore) return undefined;
    function handleClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showMore]);

  const showOpResult = (type, title, message) => {
    setOpResult({ type, title, message });
  };

  const loadProducts = useCallback(() => {
    setLoading(true);
    getProducts()
      .then((data) => {
        setProducts(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowBulk(true);
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
        showOpResult("success", "Producto actualizado", "Producto actualizado correctamente.");
      } else {
        await createProduct(data);
        showOpResult("success", "Producto registrado", "Producto registrado correctamente.");
      }
      setShowForm(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      showOpResult("error", "Error", err.message);
    }
  };

  const handleBulkSave = async (products) => {
    try {
      await Promise.all(products.map((product) => createProduct(product)));
      setShowBulk(false);
      const n = products.length;
      showOpResult(
        "success",
        "Productos registrados",
        `${n} producto${n === 1 ? "" : "s"} registrad${n === 1 ? "o" : "os"} correctamente.`
      );
      loadProducts();
    } catch (err) {
      showOpResult("error", "Error", err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await deleteProduct(id);
      loadProducts();
      showOpResult("success", "Producto eliminado", "Producto eliminado correctamente.");
    } catch (err) {
      showOpResult("error", "Error", err.message);
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
    setShowDeleteConfirm(false);
    try {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)));
      const n = selectedIds.length;
      setSelectedIds([]);
      loadProducts();
      setPage(1);
      setStockStamp((v) => v + 1);
      showOpResult(
        "success",
        "Productos eliminados",
        `${n} producto${n === 1 ? "" : "s"} eliminad${n === 1 ? "o" : "os"} correctamente.`
      );
    } catch (err) {
      showOpResult("error", "Error", err.message);
    }
  };

  const openAdjust = () => {
    setAdjustError("");
    setAdjustCantidad("");
    setAdjustModo("aumentar");
    setShowAdjust(true);
  };

  const handleApplyAdjust = async () => {
    const cantidad = Number(adjustCantidad);
    if (adjustCantidad === "" || !Number.isInteger(cantidad) || cantidad < 0) {
      setAdjustError("Ingresa una cantidad válida (número entero no negativo).");
      return;
    }
    if (adjustModo !== "establecer" && cantidad < 1) {
      setAdjustError("La cantidad debe ser al menos 1.");
      return;
    }
    if (adjustModo === "disminuir") {
      const negativo = selectedProducts.some((p) => Number(p.cantidad) - cantidad < 0);
      if (negativo) {
        setAdjustError("No se puede disminuir esa cantidad porque el stock resultaría negativo.");
        return;
      }
    }
    setAdjusting(true);
    setAdjustError("");
    try {
      await adjustProductsStock({
        items: selectedIds.map((id) => ({ producto_id: id, tipo: adjustModo, cantidad })),
        motivo: "Ajuste de inventario",
      });
      setShowAdjust(false);
      setSelectedIds([]);
      setAdjustCantidad("");
      setAdjustModo("aumentar");
      loadProducts();
      setStockStamp((v) => v + 1);
      showOpResult("success", "Stock actualizado", "Stock actualizado correctamente.");
    } catch (err) {
      showOpResult("error", "Error", err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleExportSelected = () => {
    setShowMore(false);
    exportProductosExcel(selectedProducts, "productos_seleccionados");
  };

  const handlePrintSelected = () => {
    setShowMore(false);
    printProductos(selectedProducts, "Productos seleccionados");
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

  const selectedProducts = products.filter((product) => selectedIds.includes(product.id));

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
        <OperationResultModal
          isOpen={!!opResult}
          type={opResult?.type}
          title={opResult?.title}
          message={opResult?.message}
          onClose={() => setOpResult(null)}
        />
        <StockAlert key={stockStamp} />

      <div className="toolbar">
        <div className="toolbar-actions">
          <Link to="/categorias" className="btn-outline page-link-btn">
            <FaTags /> Gestionar categorías
          </Link>
          <button onClick={handleNewProduct}>
            <FaPlus /> Nuevo producto
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
          <span className="selection-count">
            {selectedIds.length} producto{selectedIds.length === 1 ? "" : "s"} seleccionado
            {selectedIds.length === 1 ? "" : "s"}
          </span>
          <div className="selection-actions">
            <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              <FaTrash /> Eliminar seleccionados
            </button>
            <button onClick={openAdjust}>
              <FaBoxes /> Ajustar stock
            </button>
            <div className="menu-wrap" ref={moreRef}>
              <button
                className="btn-secondary"
                aria-haspopup="menu"
                aria-expanded={showMore}
                onClick={() => setShowMore((v) => !v)}
              >
                <FaEllipsisH /> Más acciones <FaChevronDown className="caret-icon" />
              </button>
              {showMore && (
                <div className="dropdown-menu" role="menu">
                  <button type="button" role="menuitem" onClick={handleExportSelected}>
                    <FaFileExcel /> Exportar seleccionados
                  </button>
                  <button type="button" role="menuitem" onClick={handlePrintSelected}>
                    <FaPrint /> Imprimir seleccionados
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <div className="confirm-box">
            <h3>Eliminar productos</h3>
            <p>
              ¿Deseas eliminar los {selectedIds.length} producto{selectedIds.length === 1 ? "" : "s"} seleccionado
              {selectedIds.length === 1 ? "" : "s"}?
            </p>
            <div className="form-actions">
              <button type="button" className="btn-secondary" data-close-modal>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteSelected}>
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAdjust && (
        <Modal onClose={() => setShowAdjust(false)}>
          <div className="adjust-box">
            <h3>Ajustar inventario</h3>
            <p className="adjust-hint">
              Has seleccionado {selectedIds.length} producto{selectedIds.length === 1 ? "" : "s"}.
            </p>
            {adjustError && <div className="error-banner">{adjustError}</div>}
            <div className="form-group">
              <span className="adjust-field-label">Tipo de ajuste</span>
              <div className="adjust-type-toggle">
                <button
                  type="button"
                  className={adjustModo === "aumentar" ? "active" : ""}
                  onClick={() => setAdjustModo("aumentar")}
                >
                  Aumentar
                </button>
                <button
                  type="button"
                  className={`disminuir ${adjustModo === "disminuir" ? "active" : ""}`}
                  onClick={() => setAdjustModo("disminuir")}
                >
                  Disminuir
                </button>
                <button
                  type="button"
                  className={adjustModo === "establecer" ? "active" : ""}
                  onClick={() => setAdjustModo("establecer")}
                >
                  Establecer cantidad
                </button>
              </div>
              <p className="adjust-desc">{ADJUST_DESCRIPTIONS[adjustModo]}</p>
            </div>
            <label>
              Cantidad
              <input
                type="number"
                name="ajusteCantidad"
                min="0"
                step="1"
                value={adjustCantidad}
                onChange={(e) => setAdjustCantidad(e.target.value)}
                placeholder={adjustModo === "establecer" ? "Ej. 22" : "Ej. 5"}
              />
            </label>
            <div className="form-actions">
              <button type="button" onClick={handleApplyAdjust} disabled={adjusting}>
                {adjusting ? "Aplicando..." : "Aplicar ajuste"}
              </button>
              <button type="button" className="btn-secondary" data-close-modal>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
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
        <Modal onClose={() => setShowBulk(false)} size="xl">
          <ProductBulk
            onCancel={() => setShowBulk(false)}
            onSave={handleBulkSave}
          />
        </Modal>
      )}

      {loading ? (
        <LoadingBlock label="Cargando productos" />
      ) : error ? (
        <ErrorBlock
          message={`No se pudieron cargar los productos: ${error}`}
          onRetry={loadProducts}
        />
      ) : (
        <>
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
        </>
      )}
      </div>
    </>
  );
}

export default Productos;