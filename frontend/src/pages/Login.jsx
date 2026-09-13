import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { homePathFor, useAuth } from '../context/AuthContext.jsx'
import Alert from '../components/Alert.jsx'
import { errorMessage } from '../utils/format'
import '../styles/auth.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (user) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLocked(false)
    setLoading(true)
    try {
      const logged = await login(username.trim(), password)
      const from = location.state?.from
      navigate(from && from !== '/login' ? from : homePathFor(logged.role), { replace: true })
    } catch (err) {
      setLocked(err.response?.status === 423)
      setError(errorMessage(err, 'Usuario o contraseña incorrectos.'))
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-logo" aria-hidden="true">📦</div>
        <h1 className="auth-title">DIS</h1>
        <p className="auth-subtitle">Dromatic Inventory System<br />Bodega principal · Laboratorio DròMatic</p>

        <Alert type={locked ? 'warning' : 'error'} message={error} />

        <div className="form-group">
          <label htmlFor="username">Usuario</label>
          <input id="username" value={username} autoComplete="username" autoFocus required
            onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <div className="password-field">
            <input id="password" type={showPassword ? 'text' : 'password'} value={password}
              autoComplete="current-password" required onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="link-btn" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" type="submit"
          disabled={loading || !username.trim() || !password}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <p className="auth-help">
          Después de 5 intentos fallidos la cuenta se bloquea temporalmente.<br />
          ¿Olvidó su contraseña? Pídale al administrador que la cambie.
        </p>
        <Link to="/" className="auth-back">← Volver a la página principal</Link>
      </form>
    </div>
  )
}
