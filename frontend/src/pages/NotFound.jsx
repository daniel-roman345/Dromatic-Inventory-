import { Link } from 'react-router-dom'
import { homePathFor, useAuth } from '../context/AuthContext.jsx'
import '../styles/auth.css'

export default function NotFound() {
  const { user } = useAuth()
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden="true">🧭</div>
        <h1 className="auth-title">404</h1>
        <p className="auth-subtitle">La página que busca no existe.</p>
        <Link to={user ? homePathFor(user.role) : '/'} className="btn btn-primary btn-block">Ir al inicio</Link>
      </div>
    </div>
  )
}
