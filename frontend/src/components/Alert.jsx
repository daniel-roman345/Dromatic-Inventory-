const ICONS = { error: '⛔', success: '✅', warning: '⚠️', info: 'ℹ️' }

export default function Alert({ type = 'error', message, children, onClose }) {
  if (!message && !children) return null
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="alert-icon" aria-hidden="true">{ICONS[type]}</span>
      <div className="alert-body">{message}{children}</div>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Cerrar mensaje">×</button>
      )}
    </div>
  )
}
