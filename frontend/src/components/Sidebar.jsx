import { NavLink, useNavigate } from 'react-router-dom'
import { ROLE_LABELS, useAuth } from '../context/AuthContext.jsx'

const LINKS = [
  { to: '/dashboard', icon: '🏠', label: 'Inicio', roles: ['ADMINISTRADOR', 'OPERADOR'] },
  { to: '/entries', icon: '📥', label: 'Registrar entrada', roles: ['ADMINISTRADOR', 'OPERADOR'] },
  { to: '/exits', icon: '📤', label: 'Registrar salida', roles: ['ADMINISTRADOR', 'OPERADOR'] },
  { to: '/inventory', icon: '📦', label: 'Inventario' },
  { to: '/alerts', icon: '⚠️', label: 'Alertas de stock' },
  { to: '/movements', icon: '🕘', label: 'Historial', roles: ['ADMINISTRADOR', 'OPERADOR'] },
  { to: '/locations', icon: '📍', label: 'Ubicaciones', roles: ['ADMINISTRADOR', 'OPERADOR'] },
  { to: '/reports', icon: '📄', label: 'Reportes PDF', roles: ['ADMINISTRADOR'] },
  { to: '/users', icon: '👥', label: 'Usuarios', roles: ['ADMINISTRADOR'] },
]

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-abbr">DIS</span>
        <span className="brand-sub">Dromatic Inventory System</span>
      </div>

      <div className="sidebar-user">
        <span className="sidebar-avatar">{user?.username?.[0]?.toUpperCase()}</span>
        <div>
          <strong>{user?.username}</strong>
          <small>{ROLE_LABELS[user?.role]}</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {LINKS.filter((link) => !link.roles || hasRole(...link.roles)).map((link) => (
          <NavLink key={link.to} to={link.to}>
            <span className="nav-icon" aria-hidden="true">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        <span aria-hidden="true">🚪</span> Cerrar sesión
      </button>
    </aside>
  )
}
