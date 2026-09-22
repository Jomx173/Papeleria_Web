export function LoadingBlock({ label = "Cargando" }) {
  return (
    <div className="skeleton-card" role="status" aria-live="polite">
      <div className="skeleton-line skeleton-line-title" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <span className="visually-hidden">{label}...</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="error-block" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>Reintentar</button>
      )}
    </div>
  );
}