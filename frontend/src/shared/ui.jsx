import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'
import { QUALITY } from './format'
import { errorMessage } from '../api/client'

/* Piezas de interfaz reutilizadas en todas las pantallas. */

export function Loading({ text = 'Cargando…' }) {
  return (
    <div className="loading" role="status">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  )
}

export function Empty({ icon = 'box', title, children }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      {title && <div className="strong" style={{ color: 'var(--ink)' }}>{title}</div>}
      {children && <div className="small" style={{ marginTop: 4 }}>{children}</div>}
    </div>
  )
}

const NOTICE_ICONS = { error: 'alert', warn: 'alert', ok: 'ok', info: 'info' }

export function Notice({ type = 'info', children }) {
  if (!children) return null
  return (
    <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon name={NOTICE_ICONS[type]} />
      <div>{children}</div>
    </div>
  )
}

/** Ventana emergente. Se cierra con Escape o clic afuera (si no está ocupada). */
export function Modal({ title, onClose, children, footer, size = '', busy = false }) {
  const titleId = useId()
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose, busy])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose?.()}>
      <div className={`modal ${size ? `modal-${size}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" onClick={onClose} disabled={busy} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/* ── Avisos flotantes ─────────────────────────────────────────────── */
const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((list) => [...list, { id, message, type }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3500)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'error' ? 'alert' : 'ok'} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

/* ── Módulos ──────────────────────────────────────────────────────── */
export function ModuleBadge({ module, code, name, color, icon }) {
  const m = module || { code, name, color, icon }
  return (
    <span className={`mod-badge mod-${m.color || 'gray'}`}>
      {m.icon && <Icon name={m.icon} />}
      {m.name || m.code}
    </span>
  )
}

export function QualityBadge({ status }) {
  if (!status) return null
  const q = QUALITY[status]
  return (
    <span className={`badge ${q.badge}`}>
      <span className="dot" style={{ background: q.color }} />
      {q.label}
    </span>
  )
}

export function Field({ label, required, hint, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

/**
 * Campo de texto libre con sugerencias. Se puede escribir cualquier cosa;
 * las sugerencias solo ayudan. Con {@code chips} se muestran como botones rápidos.
 */
export function SuggestInput({ value, onChange, suggestions = [], chips = 0, placeholder, id, autoFocus, maxLength }) {
  const listId = useId()
  const shown = chips ? suggestions.slice(0, chips) : []
  return (
    <>
      <input
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map((s) => <option key={s} value={s} />)}
      </datalist>
      {shown.length > 0 && (
        <div className="chips" style={{ marginTop: 6 }}>
          {shown.map((s) => (
            <button type="button" key={s} className={`chip ${value === s ? 'active' : ''}`} onClick={() => onChange(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/** Confirmación simple antes de acciones delicadas. */
export function ConfirmModal({ title, children, confirmText = 'Confirmar', danger, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }
  return (
    <Modal
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={run} disabled={busy}>
            {busy ? 'Un momento…' : confirmText}
          </button>
        </>
      }
    >
      <div className="stack-sm">
        {children}
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}

/** Retrasa un valor (para buscar mientras se escribe sin saturar el servidor). */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Ejecuta una carga y expone datos, error y recarga. */
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    return loaderRef.current()
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }))
  }, [])
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) }
}
