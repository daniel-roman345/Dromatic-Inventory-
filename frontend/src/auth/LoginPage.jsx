import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { errorMessage } from '../api/client'
import Icon from '../shared/Icon'
import { Notice } from '../shared/ui'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.mustChangePassword ? '/cambiar-clave' : '/'} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(form.username.trim(), form.password)
      const back = location.state?.from?.pathname
      navigate(u.mustChangePassword ? '/cambiar-clave' : back || '/', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'No se pudo iniciar sesión.'))
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-art">
        <div className="row">
          <div className="brand-mark">DIS</div>
          <div>
            <div className="brand-name">Laboratorios Dromatic</div>
            <div className="brand-sub">Sistema de inventario</div>
          </div>
        </div>
        <div>
          <h1>Todo el inventario de la planta, ubicado en su estantería.</h1>
          <ul>
            <li><Icon name="map" /> Mapas de la bodega 1 y del cuarto de etiquetas</li>
            <li><Icon name="rotulo" /> Entradas con el mismo rótulo de identificación</li>
            <li><Icon name="bell" /> Avisos de stock bajo por correo y WhatsApp</li>
          </ul>
        </div>
        <div className="small" style={{ color: '#9fd8cf' }}>Medellín · Colombia</div>
      </aside>

      <main className="auth-form">
        <form onSubmit={submit} className="stack">
          <div>
            <h1>Iniciar sesión</h1>
            <p className="muted" style={{ marginTop: 6 }}>Entre con el usuario que le dio el administrador.</p>
          </div>
          <Notice type="error">{error}</Notice>
          <div>
            <label htmlFor="username">Usuario</label>
            <input id="username" autoComplete="username" autoFocus value={form.username}
                   onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
              <button type="button" className="icon-btn" onClick={() => setShow(!show)}
                      style={{ position: 'absolute', right: 4, top: 3 }} aria-label={show ? 'Ocultar contraseña' : 'Ver contraseña'}>
                <Icon name="eye" />
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          <p className="small muted center">¿Olvidó su contraseña? Pídale al administrador una nueva contraseña temporal.</p>
        </form>
      </main>
    </div>
  )
}
