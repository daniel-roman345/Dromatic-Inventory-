import { useNavigate } from 'react-router-dom'
import '../styles/landing.css'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <>
      <header className="l-header">
        <div className="l-logo">
          <span className="l-logo-abbr">DIS</span>
          <span className="l-logo-sub">Dromatic Inventory System</span>
        </div>
        <nav className="l-nav">
          <a href="#hero">Inicio</a>
          <a href="#funcionalidades">Características</a>
          <a href="#tecnologias">Tecnologías</a>
          <a href="#contacto">Contacto</a>
          <button className="l-btn-access" onClick={() => navigate('/login')}>Acceder al sistema</button>
        </nav>
      </header>

      <section className="l-hero" id="hero">
        <div className="l-hero-inner">
          <div>
            <span className="l-badge">Sistema de Gestión de Inventario</span>
            <h1>Dromatic<br />Inventory System</h1>
            <p>Solución web para la gestión y control del inventario de productos capilares del Laboratorio Dromatic.</p>
            <div className="l-hero-btns">
              <button className="l-btn-primary" onClick={() => document.getElementById('funcionalidades').scrollIntoView({ behavior: 'smooth' })}>Conoce más</button>
              <button className="l-btn-outline" onClick={() => navigate('/login')}>Acceder al sistema →</button>
            </div>
          </div>
          <div className="l-hero-visual">
            <div className="l-mock-bar">
              <span className="l-dot l-r"></span><span className="l-dot l-y"></span><span className="l-dot l-g"></span>
              <span style={{ marginLeft: 8 }}>DIS — Inventario</span>
            </div>
            <div className="l-mock-body">
              <div className="l-mock-stats">
                <div className="l-mock-stat"><div className="l-val">📥</div><div className="l-lbl">Entradas</div></div>
                <div className="l-mock-stat"><div className="l-val">📤</div><div className="l-lbl">Salidas</div></div>
                <div className="l-mock-stat"><div className="l-val">⚠️</div><div className="l-lbl">Alertas</div></div>
              </div>
              <table className="l-mock-table">
                <thead><tr><th>El sistema permite</th><th></th></tr></thead>
                <tbody>
                  <tr><td>Buscar productos por código o nombre</td><td className="l-stock-ok">✔</td></tr>
                  <tr><td>Registrar varios productos por movimiento</td><td className="l-stock-ok">✔</td></tr>
                  <tr><td>Conocer quién y cuándo movió el stock</td><td className="l-stock-ok">✔</td></tr>
                  <tr><td>Detectar productos con stock bajo</td><td className="l-stock-low">⚠</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="l-section l-bg" id="problema">
        <div className="l-two-col">
          <div>
            <div className="l-label">El problema</div>
            <h2 className="l-title">El problema</h2>
            <div className="l-bar"></div>
            <p className="l-text">El control manual del inventario genera pérdida de información, errores en los registros y dificultades para conocer el stock real de productos.</p>
          </div>
          <div className="l-illus l-illus-prob">🤔</div>
        </div>
      </section>

      <section className="l-section" id="solucion">
        <div className="l-two-col">
          <div className="l-illus l-illus-sol">✅</div>
          <div>
            <div className="l-label">La solución</div>
            <h2 className="l-title">La solución</h2>
            <div className="l-bar"></div>
            <p className="l-text">Dromatic Inventory System (DIS) es una aplicación web que permite gestionar el inventario de manera eficiente, segura y en tiempo real.</p>
          </div>
        </div>
      </section>

      <section className="l-section l-bg l-center" id="funcionalidades">
        <div className="l-label">Funcionalidades</div>
        <h2 className="l-title">Funcionalidades</h2>
        <div className="l-bar" style={{ margin: '0 auto 32px' }}></div>
        <div className="l-func-grid">
          <div className="l-fcard"><div className="l-ficon l-fi1">📦</div><h3>Registro de productos</h3><p>Agrega nuevos productos al inventario de forma rápida y segura.</p></div>
          <div className="l-fcard"><div className="l-ficon l-fi2">🔍</div><h3>Consulta de inventario</h3><p>Visualiza y busca productos para conocer existencias en tiempo real.</p></div>
          <div className="l-fcard"><div className="l-ficon l-fi3">🔄</div><h3>Actualización de stock</h3><p>Registra entradas y salidas para mantener el stock actualizado.</p></div>
          <div className="l-fcard"><div className="l-ficon l-fi4">👤</div><h3>Gestión de usuarios</h3><p>Control de acceso por roles para proteger la información.</p></div>
          <div className="l-fcard"><div className="l-ficon l-fi5">📄</div><h3>Reportes y estadísticas</h3><p>Genera reportes filtrados y exportables en PDF para análisis.</p></div>
        </div>
      </section>

      <section className="l-section l-center" id="tecnologias">
        <div className="l-label">Stack tecnológico</div>
        <h2 className="l-title">Tecnologías</h2>
        <div className="l-bar" style={{ margin: '0 auto 32px' }}></div>
        <div className="l-tech-grid">
          <div className="l-titem"><div className="l-tlogo">☕</div><span>Java<br />Spring Boot</span></div>
          <div className="l-titem"><div className="l-tlogo">⚛️</div><span>React</span></div>
          <div className="l-titem"><div className="l-tlogo">🗄️</div><span>MySQL</span></div>
          <div className="l-titem"><div className="l-tlogo">🐙</div><span>GitHub</span></div>
        </div>
      </section>

      <section className="l-section l-bg" id="contacto">
        <div className="l-contact-box">
          <div>
            <h2>¿Tienes dudas o sugerencias?</h2>
            <p>Contáctame para más información.</p>
            <ul className="l-clist">
              <li>✉️ danielsalasroman@gmail.com</li>
              <li>🐙 github.com/daniel-roman345/Dromatic-Inventory-</li>
              <li>📍 Colombia</li>
            </ul>
          </div>
          <div className="l-cillus">✉️</div>
        </div>
      </section>

      <footer className="l-footer">
        <div className="l-logo">
          <span className="l-logo-abbr" style={{ fontSize: '1.2rem' }}>DIS</span>
          <span className="l-logo-sub">Dromatic Inventory System</span>
        </div>
        <span className="l-footer-copy">© {new Date().getFullYear()} Dromatic Inventory System. Todos los derechos reservados.</span>
      </footer>
    </>
  )
}
