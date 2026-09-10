export const validateProduct = (values) => {
  const errors = {};

  const nombre = values.nombre?.trim() ?? "";
  if (!nombre) {
    errors.nombre = "El nombre es obligatorio.";
  }

  const categoriaId = Number(values.categoria_id);
  if (!values.categoria_id || Number.isNaN(categoriaId)) {
    errors.categoria_id = "Selecciona una categoría.";
  }

  const cantidad = Number(values.cantidad);
  if (values.cantidad === "" || values.cantidad == null || Number.isNaN(cantidad) || !Number.isInteger(cantidad)) {
    errors.cantidad = "La cantidad debe ser un número entero.";
  } else if (cantidad < 0) {
    errors.cantidad = "La cantidad debe ser mayor o igual a 0.";
  }

  const precio = Number(values.precio);
  if (values.precio === "" || values.precio == null || Number.isNaN(precio)) {
    errors.precio = "El precio es obligatorio.";
  } else if (precio <= 0) {
    errors.precio = "El precio debe ser mayor que 0.";
  }

  const stockMinimo =
    values.stock_minimo === "" || values.stock_minimo == null
      ? 5
      : Number(values.stock_minimo);
  if (Number.isNaN(stockMinimo) || !Number.isInteger(stockMinimo)) {
    errors.stock_minimo = "El stock mínimo debe ser un número entero.";
  } else if (stockMinimo < 0) {
    errors.stock_minimo = "El stock mínimo debe ser mayor o igual a 0.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, data: null };
  }

  return {
    errors: {},
    data: {
      nombre,
      categoria_id: categoriaId,
      cantidad,
      precio,
      stock_minimo: stockMinimo,
    },
  };
};