import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaMicrophone, FaTimes } from "react-icons/fa";

function AssistantInput({ onSend, disabled, placeholder = "Escribe tu mensaje..." }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <form className="assistant-input-form" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="assistant-textarea"
          aria-label="Mensaje para el asistente"
        />
        <div className="input-actions">
          {text.trim() ? (
            <button
              type="submit"
              className="send-btn"
              disabled={disabled}
              aria-label="Enviar mensaje"
            >
              <FaPaperPlane />
            </button>
          ) : (
            <button
              type="button"
              className="mic-btn"
              disabled={disabled}
              aria-label="Entrada de voz (no implementado)"
            >
              <FaMicrophone />
            </button>
          )}
          {text.trim() && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setText("")}
              disabled={disabled}
              aria-label="Limpiar"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
      <p className="input-hint">
        Ejemplos: "Tengo 30 cuadernos a 45" · "Agrega 20 lápices" · "Entraron 15 borradores a 8"
      </p>
    </form>
  );
}

export default AssistantInput;