import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()

  return (
    <aside className="sidebar">
      <div className="brand">DIS</div>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/inventory">Inventario</NavLink>
      {hasRole('ADMINISTRADOR', 'OPERADOR') && <NavLink to="/entries">Entradas</NavLink>}
      {hasRole('ADMINISTRADOR', 'OPERADOR') && <NavLink to="/exits">Salidas</NavLink>}
      <NavLink to="/movements">Movimientos</NavLink>
      {hasRole('ADMINISTRADOR') && <NavLink to="/reports">Reportes</NavLink>}
      {hasRole('ADMINISTRADOR') && <NavLink to="/users">Usuarios</NavLink>}
      {hasRole('ADMINISTRADOR', 'OPERADOR') && <NavLink to="/locations">Ubicaciones</NavLink>}
      <NavLink to="/profile">Perfil</NavLink>
      <a onClick={logout} style={{ cursor: 'pointer', marginTop: 20, color: '#ff8a80' }}>
        Cerrar sesión ({user?.username})
      </a>
    </aside>
  )
}
