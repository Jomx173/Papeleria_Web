import { FaRobot, FaUser, FaExclamationTriangle } from "react-icons/fa";

function AssistantMessage({ message, isUser, isLoading, isError }) {
  if (isLoading) {
    return (
      <div className="assistant-message assistant-loading">
        <div className="assistant-avatar">
          <FaRobot />
        </div>
        <div className="assistant-bubble loading">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    );
  }

  return (
    <div className={`assistant-message ${isUser ? "user" : "assistant"} ${isError ? "error" : ""}`}>
      <div className="assistant-avatar">
        {isUser ? <FaUser /> : isError ? <FaExclamationTriangle /> : <FaRobot />}
      </div>
      <div className={`assistant-bubble ${isError ? "error" : ""}`}>
        <p className="assistant-text">{message}</p>
      </div>
    </div>
  );
}

export default AssistantMessage;