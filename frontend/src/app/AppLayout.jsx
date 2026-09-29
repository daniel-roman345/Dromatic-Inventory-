import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAppData } from './AppDataContext'
import Icon from '../shared/Icon'
import { initials } from '../shared/format'
import MovementChooser from '../movements/MovementChooser'

/** Estructura de todas las pantallas internas: menú lateral y barra superior. */
export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth()
  const { modules, alertCount, canEditAny } = useAppData()
  const [menuOpen, setMenuOpen] = useState(false)
  const [chooser, setChooser] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])

  function submitSearch(e) {
    e.preventDefault()
    if (search.trim()) navigate(`/donde-esta?q=${encodeURIComponent(search.trim())}`)
  }

  const link = (to, icon, text, extra = null, end = false) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <Icon name={icon} />
      <span>{text}</span>
      {extra}
    </NavLink>
  )

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Menú principal">
        <div className="sidebar-brand">
          <div className="brand-mark">DIS</div>
          <div>
            <div className="brand-name">Dromatic</div>
            <div className="brand-sub">Sistema de inventario</div>
          </div>
        </div>

        {link('/', 'home', 'Inicio', null, true)}

        <div className="nav-section">Inventarios</div>
        {modules.map((m) => link(`/inventario/${m.code}`, m.icon, m.name,
          m.canEdit ? <span className="mod-dot" style={{ background: `var(--${m.color})` }} /> : <span className="lock" title="Solo consulta"><Icon name="eye" /></span>))}

        <div className="nav-section">Bodega</div>
        {canEditAny && link('/entrada', 'entry', 'Registrar entrada')}
        {canEditAny && link('/salida', 'exit', 'Registrar salida')}
        {link('/mapas', 'map', 'Mapas')}
        {link('/donde-esta', 'search', '¿Dónde está?')}
        {link('/movimientos', 'history', 'Movimientos')}
        {link('/alertas', 'bell', 'Alertas', alertCount > 0 ? <span className="count">{alertCount}</span> : null)}
        {link('/reportes', 'report', 'Reportes')}

        {isAdmin && (
          <>
            <div className="nav-section">Administración</div>
            {link('/admin/usuarios', 'users', 'Usuarios')}
            {link('/admin/mapas', 'layers', 'Editor de mapas')}
            {link('/admin/sugerencias', 'list', 'Sugerencias')}
          </>
        )}

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{initials(user.fullName)}</div>
            <div className="who">
              <div className="strong" style={{ color: '#fff' }}>{user.fullName}</div>
              <div className="tiny" style={{ color: '#8fbdb5' }}>{user.roleName}</div>
            </div>
          </div>
          <NavLink to="/apariencia" className="nav-link" style={{ margin: '6px 0 0' }}><Icon name="sparkles" /> Apariencia</NavLink>
          <div className="row" style={{ gap: 4, marginTop: 2 }}>
            <NavLink to="/cambiar-clave" className="nav-link" style={{ margin: 0, flex: 1 }}><Icon name="key" /> Contraseña</NavLink>
            <button className="nav-link" style={{ margin: 0, border: 'none', background: 'none' }} onClick={logout}>
              <Icon name="logout" /> Salir
            </button>
          </div>
        </div>
      </aside>
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Icon name="menu" />
          </button>
          <form className="topbar-search" onSubmit={submitSearch} role="search">
            <Icon name="search" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
                   placeholder="¿Dónde está? Busque producto, lote o proveedor…" aria-label="Buscar dónde está un producto" />
          </form>
          <div className="row" style={{ marginLeft: 'auto', gap: 6 }}>
            {canEditAny && (
              <button className="btn btn-primary" onClick={() => setChooser(true)}>
                <Icon name="plus" /> <span className="hide-sm">Movimiento</span>
              </button>
            )}
            <NavLink to="/alertas" className="icon-btn" aria-label={`Alertas: ${alertCount}`} style={{ position: 'relative' }}>
              <Icon name="bell" />
              {alertCount > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, background: '#f04438', color: '#fff', borderRadius: 999,
                  fontSize: '.62rem', fontWeight: 700, padding: '0 5px', lineHeight: '15px' }}>{alertCount}</span>
              )}
            </NavLink>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {chooser && <MovementChooser onClose={() => setChooser(false)} />}
    </div>
  )
}
