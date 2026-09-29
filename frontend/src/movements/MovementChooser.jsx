import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuggestions } from '../app/AppDataContext'
import Icon from '../shared/Icon'
import { Modal } from '../shared/ui'

/**
 * "¿Qué movimiento va a registrar?": el tipo se escribe libre ("Préstamo",
 * "Devolución", "Despacho a maquila"...). Si ya se conoce, el sistema sabe si
 * suma o resta; si es nuevo, pregunta una sola cosa: qué le pasa al inventario.
 */
export const EFFECTS = [
  { code: 'ENTRADA', label: 'Suma al inventario', hint: 'Llega mercancía', icon: 'entry', path: '/entrada', className: 'text-ok' },
  { code: 'SALIDA', label: 'Resta del inventario', hint: 'Sale mercancía', icon: 'exit', path: '/salida', className: 'text-danger' },
  { code: 'TRASLADO', label: 'Cambia de lugar', hint: 'De un piso a otro', icon: 'swap', path: '/traslado', className: '' },
  { code: 'AJUSTE', label: 'Corrige el conteo', hint: 'Lo contado no cuadra', icon: 'adjust', path: '/ajuste', className: 'text-warn' },
]

export default function MovementChooser({ onClose }) {
  const navigate = useNavigate()
  const suggestions = useSuggestions(null)
  const [type, setType] = useState('')

  const known = useMemo(() => {
    const map = new Map()
    for (const e of EFFECTS) {
      for (const t of suggestions[`TIPO_${e.code}`] || []) {
        const key = t.toLowerCase()
        map.set(key, map.has(key) && map.get(key) !== e.code ? 'AMBIGUO' : e.code)
      }
    }
    return map
  }, [suggestions])

  const typed = type.trim()
  const inferred = typed ? known.get(typed.toLowerCase()) : null
  const effect = inferred && inferred !== 'AMBIGUO' ? EFFECTS.find((e) => e.code === inferred) : null

  function go(e) {
    const params = typed ? `?tipo=${encodeURIComponent(typed)}` : ''
    onClose()
    navigate(e.path + params)
  }

  const quick = EFFECTS.flatMap((e) => (suggestions[`TIPO_${e.code}`] || []).slice(0, 3).map((t) => ({ t, e })))

  return (
    <Modal title="Registrar movimiento" onClose={onClose}>
      <div className="stack">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="mv-type">Tipo de movimiento</label>
          <input id="mv-type" value={type} onChange={(e) => setType(e.target.value)} autoFocus maxLength={60}
                 placeholder="Escriba el que sea: entrada, préstamo, devolución…"
                 onKeyDown={(e) => e.key === 'Enter' && effect && go(effect)} />
          <div className="chips" style={{ marginTop: 8 }}>
            {quick.map(({ t, e }) => (
              <button type="button" key={`${e.code}-${t}`} className="chip" onClick={() => go(e)}>{t}</button>
            ))}
          </div>
        </div>

        {effect ? (
          <button className="btn btn-primary btn-lg" onClick={() => go(effect)}>
            <Icon name={effect.icon} /> Continuar: {effect.label.toLowerCase()}
          </button>
        ) : (
          <div>
            <div className="label">{typed ? `"${typed}" es nuevo. ¿Qué le pasa al inventario?` : '¿Qué le pasa al inventario?'}</div>
            <div className="option-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {EFFECTS.map((e) => (
                <button type="button" key={e.code} className="option" onClick={() => go(e)}>
                  <span className={e.className}><Icon name={e.icon} size={24} /></span>
                  <b>{e.label}</b>
                  <span>{e.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
