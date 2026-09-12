import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaBoxes, FaTag, FaDollarSign, FaWarehouse } from "react-icons/fa";

function ConfirmationCard({ preview, onConfirm, onCancel, isConfirming }) {
  if (!preview) return null;

  if (preview.accion === "crear" && !preview.sugerido) {
    // Producto nuevo
    return (
      <div className="confirmation-card new-product">
        <div className="confirmation-header">
          <FaExclamationTriangle className="warning-icon" />
          <h3>Producto nuevo</h3>
        </div>
        <p className="confirmation-message">{preview.mensaje}</p>
        <div className="confirmation-details new-product-details">
          <div className="detail-row">
            <span className="label">Producto:</span>
            <span className="value">{preview.interpretacion.producto_buscar}</span>
          </div>
          <div className="detail-row">
            <FaBoxes className="icon" />
            <span className="label">Cantidad:</span>
            <span className="value">{preview.interpretacion.cantidad} unidades</span>
          </div>
          {preview.interpretacion.precio && (
            <div className="detail-row">
              <FaDollarSign className="icon" />
              <span className="label">Precio unitario:</span>
              <span className="value">L{Number(preview.interpretacion.precio).toFixed(2)}</span>
            </div>
          )}
          <div className="detail-row">
            <FaTag className="icon" />
            <span className="label">Categoría:</span>
            <span className="value">Por definir</span>
          </div>
        </div>
        <p className="confirmation-note">Se creará como nuevo producto. Se solicitarán los datos faltantes antes de confirmar.</p>
        <div className="confirmation-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={false}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={onConfirm} disabled={false}>Crear y registrar</button>
        </div>
      </div>
    );
  }

  if (!preview.sugerido) {
    return (
      <div className="confirmation-card error">
        <FaTimesCircle className="error-icon" />
        <p>No se encontró ningún producto coincidente.</p>
      </div>
    );
  }

  const { sugerido, existencia_actual, precio_actual, precio_nuevo, entrada, nueva_existencia, advertencia_precio: advertenciaPrecio } = preview;

  return (
    <div className="confirmation-card">
      <div className="confirmation-header">
        <FaCheckCircle className="success-icon" />
        <h3>Confirmar entrada</h3>
      </div>
      
      <p className="confirmation-message">{mensaje}</p>
      
      <div className="confirmation-details">
        <div className="detail-row">
          <FaTag className="icon" />
          <span className="label">Producto:</span>
          <span className="value">{sugerido.nombre}</span>
        </div>
        <div className="detail-row">
          <FaWarehouse className="icon" />
          <span className="label">Categoría:</span>
          <span className="value">{sugerido.categoria || "Sin categoría"}</span>
        </div>
        <div className="detail-row">
          <FaBoxes className="icon" />
          <span className="label">Cantidad a ingresar:</span>
          <span className="value">{entrada} unidades</span>
        </div>
        <div className="detail-row">
          <FaDollarSign className="icon" />
          <span className="label">Precio unitario:</span>
          <span className="value">L{Number(precio_nuevo || precio_actual).toFixed(2)}</span>
        </div>
        <div className="detail-row total">
          <FaDollarSign className="icon" />
          <span className="label">Total:</span>
          <span className="value">L{Number(entrada * (precio_nuevo || precio_actual)).toFixed(2)}</span>
        </div>
      </div>

      <div className="stock-preview">
        <div className="stock-bar">
          <div className="stock-before">
            <span className="label">Stock actual</span>
            <span className="value">{existencia_actual}</span>
          </div>
          <div className="stock-arrow">
            <span className="arrow">→</span>
            <span className="added">+{entrada}</span>
          </div>
          <div className="stock-after">
            <span className="label">Stock nuevo</span>
            <span className="value">{nueva_existencia}</span>
          </div>
        </div>
      </div>

      {advertencia_precio && (
        <div className="price-warning">
          <FaExclamationTriangle className="warning-icon" />
          <p>{advertenciaPrecio}</p>
        </div>
      )}

      <div className="confirmation-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isConfirming}>
          Cancelar
        </button>
        {preview.requiere_confirmacion_precio && preview.requiere_confirmacion_precio === true ? (
          <>
            <button type="button" className="btn-warning" onClick={() => onConfirm({ actualizar_precio: true })} disabled={isConfirming}>
              Actualizar precio y registrar
            </button>
            <button type="button" className="btn-primary" onClick={() => onConfirm({ actualizar_precio: false })} disabled={isConfirming}>
              Registrar manteniendo precio actual
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={() => onConfirm({ actualizar_precio: false })} disabled={isConfirming}>
            Registrar
          </button>
        )}
      </div>
    </div>
  );
}

export default ConfirmationCard;