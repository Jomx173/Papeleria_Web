import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaBoxes, FaTag, FaDollarSign, FaWarehouse } from "react-icons/fa";

function ConfirmationCard({ preview, onConfirm, onCancel, isConfirming }) {
  if (!preview) return null;

  if (preview.accion === "crear" && !preview.sugerido) {
    return (
      <div className="confirmation-card new-product p-6 rounded-lg border">
        <div className="confirmation-header pb-4 border-b">
          <FaExclamationTriangle className="warning-icon" />
          <h3>Producto nuevo</h3>
        </div>
        <p className="confirmation-message mb-4">{preview.mensaje}</p>
        <div className="confirmation-details space-y-3">
          <div className="detail-row"><span className="label">Producto:</span> <span className="value">{preview.interpretacion.producto_buscar}</span></div>
          <div className="detail-row"><span className="label">Cantidad:</span> <span className="value">{preview.interpretacion.cantidad} unidades</span></div>
          {preview.interpretacion.precio && (
            <div className="detail-row"><span className="label">Precio:</span> <span className="value">L{Number(preview.interpretacion.precio).toFixed(2)}</span></div>
          )}
          <div className="detail-row"><span className="label">Categoría:</span> <span className="value">Por definir</span></div>
        </div>
        <p className="confirmation-note text-xs text-gray-500">Se creará como nuevo producto.</p>
        <div className="confirmation-actions">
          <button type="button" className="btn-secondary w-full" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn-primary w-full" onClick={onConfirm}>Crear y registrar</button>
        </div>
      </div>
    );
  }

  if (!preview.sugerido) {
    return (
      <div className="confirmation-card error p-6 rounded-lg border">
        <FaTimesCircle className="error-icon" />
        <p>No se encontró ningún producto coincidente.</p>
      </div>
    );
  }

  const { sugerido, advertencia_precio: advertenciaPrecio } = preview;
  const { existencia_actual, precio_actual, precio_nuevo } = sugerido || {};
  const { cantidad, tipo } = preview.interpretacion;

  return (
    <div className="confirmation-card p-6 rounded-lg border">
      <div className="confirmation-header pb-4 border-b">
        <FaCheckCircle className="success-icon" />
        <h3>{preview.accion === "salida" ? "Confirmar salida" : "Confirmar entrada"}</h3>
      </div>

      <p className="confirmation-message mb-4">{preview.mensaje}</p>

      <div className="confirmation-details space-y-3 mb-4">
        <div className="detail-row"><span className="label">Producto:</span> <span className="value">{sugerido.nombre}</span></div>
        <div className="detail-row"><span className="label">Categoría:</span> <span className="value">{sugerido.categoria || "Sin categoría"}</span></div>
        <div className="detail-row"><span className="label">{tipo === "salida" ? "Cantidad a retirar" : "Cantidad a ingresar"}:</span> <span className="value">{cantidad} unidades</span></div>
        <div className="detail-row"><span className="label">Precio unitario:</span> <span className="value">L{Number(precio_nuevo || precio_actual).toFixed(2)}</span></div>
        <div className="detail-row total"><span className="label">Total:</span> <span className="value">L{Number(Number(cantidad ?? 0) * Number(precio_nuevo || precio_actual || 0)).toFixed(2)}</span></div>
      </div>

      {advertenciaPrecio && (
        <div className="price-warning"><FaExclamationTriangle className="warning-icon" /> <p>{advertenciaPrecio}</p></div>
      )}

      <div className="confirmation-actions justify-between">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isConfirming}>Cancelar</button>
        <button type="button" className="btn-primary" onClick={() => onConfirm({ actualizar_precio: false })} disabled={isConfirming}>
          Registrar
        </button>
      </div>
    </div>
  );
}

export default ConfirmationCard;