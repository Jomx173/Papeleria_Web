function Modal({ children, onClose, size }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-card${size === "lg" ? " modal-card-lg" : ""}${size === "xl" ? " modal-card-xl" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;