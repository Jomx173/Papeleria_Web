import { useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function OperationResultModal({ isOpen, type, title, message, onClose }) {
  const [closing, setClosing] = useState(false);
  const cardRef = useRef(null);
  const lastFocused = useRef(null);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (isOpen) {
      lastFocused.current = document.activeElement;
      setClosing(false);
      setTimeout(() => {
        cardRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      onClose();
      lastFocused.current?.focus?.();
    }, reducedMotion ? 0 : 180);
  };

  if (!isOpen && !closing) return null;

  const isSuccess = type === "success";
  const iconColor = isSuccess ? "var(--success-color, #16a34a)" : "var(--danger-color, #dc2626)";
  const iconBg = isSuccess ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)";

  return (
    <div className={`operation-result-overlay${closing ? " closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="operation-result-title">
      <div
        className={`operation-result-card${closing ? " closing" : ""}`}
        ref={cardRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="operation-result-icon" style={{ background: iconBg, color: iconColor }}>
          {isSuccess ? <FaCheckCircle /> : <FaTimesCircle />}
        </div>
        <h2 id="operation-result-title" className="operation-result-title">
          {title}
        </h2>
        <p className="operation-result-message">{message}</p>
        <button
          type="button"
          className="operation-result-btn"
          onClick={handleClose}
          autoFocus
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default OperationResultModal;