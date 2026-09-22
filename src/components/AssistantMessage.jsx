import { FaRobot, FaUser, FaExclamationTriangle } from "react-icons/fa";

function AssistantMessage({ message, isUser, isLoading, isError }) {
  if (isLoading) {
    return (
      <div className="assistant-message assistant-loading">
        <FaRobot className="h-5 w-5" />
        <span className="text-sm text-gray-400">Procesando...</span>
      </div>
    );
  }

  const bubbleStyle = isError ? { borderColor: "#f87171", background: "#fef3f3" } : {};
  const avatar = isUser ? <FaUser className="h-4 w-4" /> : isError ? <FaExclamationTriangle className="h-4 w-4 text-orange-500" /> : <FaRobot className="h-4 w-4" />;

  return (
    <div className={`assistant-message ${isUser ? "user" : "assistant"}`}>
      <div className="assistant-avatar">{avatar}</div>
      <div className="assistant-bubble p-3 rounded-lg" style={bubbleStyle}>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

export default AssistantMessage;