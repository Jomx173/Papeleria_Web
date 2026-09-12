const API_RAW = String(
  import.meta.env.VITE_API_URL || "http://localhost:4001/api"
)
  .trim()
  .replace(/\/+$/, "");
const API_URL = /\/api$/i.test(API_RAW) ? API_RAW : `${API_RAW}/api`;

async function request(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Error ${res.status}`);
  }

  return res.json();
}

export const getProducts = () => request("/products");

export const getProduct = (id) => request(`/products/${id}`);

export const createProduct = (data) =>
  request("/products", { method: "POST", body: JSON.stringify(data) });

export const updateProduct = (id, data) =>
  request(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: "DELETE" });

export const adjustProductsStock = (payload) =>
  request("/products/adjust-stock", { method: "POST", body: JSON.stringify(payload) });

export const getLowStockProducts = () => request("/products/alertas");

export const searchProducts = (q, limit = 10) => request(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}`);

export const creaoUpsertProduct = (data) => request("/products/creao/producto", { method: "POST", body: JSON.stringify(data) });

export const getCategories = () => request("/categories");

export const createCategory = (data) =>
  request("/categories", { method: "POST", body: JSON.stringify(data) });

export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteCategory = (id) =>
  request(`/categories/${id}`, { method: "DELETE" });

export const getCategoriesSummary = () => request("/categories/summary");

export const getSummary = () => request("/reports/summary");

export const getMovements = (productoId) =>
  request(`/movements${productoId ? `?producto_id=${productoId}` : ""}`);

export const createMovement = (data) =>
  request("/movements", { method: "POST", body: JSON.stringify(data) });

export const updateMovement = (id, data) =>
  request(`/movements/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteMovement = (id) =>
  request(`/movements/${id}`, { method: "DELETE" });

export const getMovementsSummary = (desde, hasta) => {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString();
  return request(`/reports/movements${qs ? `?${qs}` : ""}`);
};

export const getTopProducts = (tipo = "salida", limite = 10) =>
  request(`/reports/top-products?tipo=${encodeURIComponent(tipo)}&limite=${limite}`);

export const getByCategory = () => request("/reports/by-category");

export const getMonthlyMovements = (meses = 9) =>
  request(`/reports/monthly-movements?meses=${meses}`);

export const exportBackup = async () => {
  const res = await fetch(`${API_URL}/backup/export`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Error ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const nombreArchivo =
    (match && match[1]) ||
    `respaldo-papeleria-${new Date().toISOString().slice(0, 10)}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { nombreArchivo };
};

export const restoreBackup = (jsonData) =>
  request("/backup/restore", { method: "POST", body: JSON.stringify(jsonData) });