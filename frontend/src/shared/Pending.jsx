import { Link } from 'react-router-dom'
import Icon from './Icon'

/** Pantalla que todavía se está construyendo. */
export default function Pending({ title }) {
  return (
    <div>
      <div className="page-header"><h1>{title}</h1></div>
      <div className="card empty">
        <Icon name="sparkles" />
        <div className="strong" style={{ color: 'var(--ink)' }}>Esta pantalla se está terminando</div>
        <div className="small">Mientras tanto puede ver los <Link to="/mapas" className="btn-link">mapas</Link>.</div>
      </div>
    </div>
  )
}
