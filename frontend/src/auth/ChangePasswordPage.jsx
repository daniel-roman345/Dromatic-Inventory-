import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { errorMessage } from '../api/client'
import { Notice } from '../shared/ui'

/** Cambio de contraseña. Obligatorio la primera vez (contraseña temporal). */
export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const forced = user?.mustChangePassword

  const rules = [
    { ok: form.next.length >= 8, text: 'Mínimo 8 caracteres' },
    { ok: /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(form.next) && /\d/.test(form.next), text: 'Letras y números' },
    { ok: form.next && form.next === form.confirm, text: 'Las dos contraseñas nuevas coinciden' },
  ]

  async function submit(e) {
    e.preventDefault()
    if (!rules.every((r) => r.ok)) {
      setError('Revise los requisitos de la contraseña nueva.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await changePassword(form.current, form.next)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="auth-form" style={{ minHeight: '100vh' }}>
      <form onSubmit={submit} className="stack card" style={{ padding: 28 }}>
        <div>
          <h1>{forced ? 'Cree su contraseña' : 'Cambiar contraseña'}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {forced
              ? `Hola, ${user?.fullName}. Está usando una contraseña temporal; cree una propia para continuar.`
              : 'Escriba su contraseña actual y la nueva.'}
          </p>
        </div>
        <Notice type="error">{error}</Notice>
        <div>
          <label htmlFor="current">{forced ? 'Contraseña temporal' : 'Contraseña actual'}</label>
          <input id="current" type="password" autoComplete="current-password" value={form.current}
                 onChange={(e) => setForm({ ...form, current: e.target.value })} required autoFocus />
        </div>
        <div>
          <label htmlFor="next">Contraseña nueva</label>
          <input id="next" type="password" autoComplete="new-password" value={form.next}
                 onChange={(e) => setForm({ ...form, next: e.target.value })} required />
        </div>
        <div>
          <label htmlFor="confirm">Repita la contraseña nueva</label>
          <input id="confirm" type="password" autoComplete="new-password" value={form.confirm}
                 onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </div>
        <ul className="stack-sm small" style={{ listStyle: 'none' }}>
          {rules.map((r) => (
            <li key={r.text} className={r.ok ? 'text-ok' : 'muted'}>{r.ok ? '✔' : '○'} {r.text}</li>
          ))}
        </ul>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
        {forced
          ? <button type="button" className="btn btn-ghost" onClick={logout}>Salir</button>
          : <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>}
      </form>
    </div>
  )
}
