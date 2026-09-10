import { useEffect, useRef, useState } from "react";

function Modal({ children, onClose, size }) {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(null);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    timerRef.current = setTimeout(onClose, reducedMotion ? 0 : 190);
  };

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (e.target.closest && e.target.closest("[data-close-modal]")) {
      requestClose();
    }
  };

  return (
    <div className={`modal-overlay${closing ? " closing" : ""}`} onClick={requestClose}>
      <div
        className={`modal-card${size === "lg" ? " modal-card-lg" : ""}${size === "xl" ? " modal-card-xl" : ""}${closing ? " closing" : ""}`}
        onClick={handleCardClick}
      >
        <button type="button" className="modal-close" onClick={requestClose} aria-label="Cerrar">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;