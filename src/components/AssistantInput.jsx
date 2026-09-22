import { FaPaperPlane, FaTimes } from "react-icons/fa";

function AssistantInput({ onSend, disabled, placeholder = "Escribe un mensaje..." }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form className="assistant-input-form" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full rounded-md border px-3 py-2 resize-none"
          aria-label="Mensaje para el asistente"
        />
        <div className="input-actions">
          {text.trim() ? (
            <button type="submit" className="send-btn" disabled={disabled} aria-label="Enviar">
              <FaPaperPlane />
            </button>
          ) : null}
        </div>
      </div>
      <p className="input-hint text-xs text-gray-500 mt-2">
        Ejemplos: "Tengo 30 cuadernos a 45" · "Agrega 20 lápices" · "Entraron 15 borradores a 8"
      </p>
    </form>
  );
}

export default AssistantInput;