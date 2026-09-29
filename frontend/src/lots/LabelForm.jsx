import Icon from '../shared/Icon'

/**
 * RÓTULO DE IDENTIFICACIÓN con el mismo orden y apariencia del impreso de la
 * empresa. Solo la FECHA y el TIPO DE MATERIAL son obligatorios; lo demás se
 * copia si está escrito. El producto viene del paso anterior.
 */
export const MATERIAL_TYPES = [
  'Materia prima', 'Producto en proceso', 'Producto a granel',
  'Material de empaque', 'Producto intermedio', 'Producto terminado',
]

export function emptyLabel(defaultMaterial, today) {
  return {
    labelDate: today,
    materialType: defaultMaterial || '',
    lotNumber: '',
    declaredQuantity: '',
    supplier: '',
    receptionDate: '',
    analysisDate: '',
    reanalysisDate: '',
    expiryDate: '',
    analysisNumber: '',
    reanalysisNumber: '',
    qualityStickers: [],
    responsible: '',
    qcSignature: '',
    nfpaHealth: null,
    nfpaFlammability: null,
    nfpaReactivity: null,
    nfpaSpecial: '',
    notes: '',
  }
}

/** Convierte el formulario al cuerpo que espera el backend (vacíos → null). */
export function labelToRequest(label) {
  const out = {}
  for (const [k, v] of Object.entries(label)) {
    out[k] = v === '' || v === undefined ? null : v
  }
  // Los puntos pegados definen el estado (el último pegado manda).
  out.qualityStickers = label.qualityStickers || []
  out.qualityStatus = null
  return out
}

const QUALITY_OPTIONS = [
  ['CUARENTENA', 'Cuarentena', 'q-cuarentena'],
  ['APROBADO', 'Aprobado', 'q-aprobado'],
  ['RECHAZADO', 'Rechazado', 'q-rechazado'],
]

export default function LabelForm({ value, onChange, productName, userName, supplierSuggestions = [], responsibleSuggestions = [] }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e?.target ? e.target.value : e })
  const isOther = value.materialType && !MATERIAL_TYPES.includes(value.materialType)

  return (
    <div>
      <div className="rotulo">
        <div className="rotulo-row rotulo-head">
          <div className="rotulo-cell rotulo-logo">
            <span className="lab">LABORATORIOS</span>
            <span className="name"><i>✱</i>Dromatic<i>✱</i></span>
          </div>
          <div className="rotulo-cell rotulo-title">RÓTULO DE IDENTIFICACIÓN</div>
          <div className="rotulo-cell rotulo-nfpa" style={{ flexDirection: 'column' }}>
            <Nfpa value={value} onChange={onChange} />
            <span className="nfpa-hint">Toque cada color: 0 a 4</span>
          </div>
        </div>

        <div className="rotulo-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="rotulo-cell">
            <span className="rotulo-key">Producto:</span>
            <span className="readonly-hand grow">{productName || '—'}</span>
          </div>
        </div>

        <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="rotulo-cell">
            <span className="rotulo-key">Fecha:<span className="req">*</span></span>
            <input type="date" value={value.labelDate || ''} onChange={set('labelDate')} required aria-label="Fecha del rótulo" />
          </div>
          <div className="rotulo-cell">
            <span className="rotulo-key">Cantidad:</span>
            <input value={value.declaredQuantity} onChange={set('declaredQuantity')} maxLength={40} placeholder="como está escrita" aria-label="Cantidad escrita en el rótulo" />
          </div>
          <div className="rotulo-cell">
            <span className="rotulo-key">Nº. de lote:</span>
            <input value={value.lotNumber} onChange={set('lotNumber')} maxLength={50} aria-label="Número de lote" />
          </div>
        </div>

        <div className="rotulo-row rotulo-types" role="radiogroup" aria-label="Tipo de material">
          {MATERIAL_TYPES.map((t) => {
            const on = value.materialType === t
            return (
              <div key={t} className="rotulo-type" role="radio" aria-checked={on} tabIndex={0}
                   onClick={() => onChange({ ...value, materialType: on ? '' : t })}
                   onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onChange({ ...value, materialType: on ? '' : t }))}>
                <span>{t}</span>
                <span className="rotulo-box">{on && <Icon name="check" />}</span>
              </div>
            )
          })}
          <div className="rotulo-other">
            <span className="rotulo-key">Otro tipo:</span>
            <input value={isOther ? value.materialType : ''} onChange={set('materialType')} maxLength={60}
                   placeholder="escríbalo si no es ninguno de los anteriores" aria-label="Otro tipo de material" />
            {!value.materialType && <span className="tiny text-danger nowrap">* Marque el tipo</span>}
          </div>
        </div>

        <div className="rotulo-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="rotulo-cell">
            <span className="rotulo-key">Proveedor:</span>
            <input value={value.supplier} onChange={set('supplier')} maxLength={120} list="rotulo-suppliers" aria-label="Proveedor" />
            <datalist id="rotulo-suppliers">{supplierSuggestions.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
        </div>

        <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="rotulo-cell"><span className="rotulo-key">Fecha de recepción:</span><input type="date" value={value.receptionDate} onChange={set('receptionDate')} /></div>
          <div className="rotulo-cell"><span className="rotulo-key">Fecha de reanálisis:</span><input type="date" value={value.reanalysisDate} onChange={set('reanalysisDate')} /></div>
        </div>
        <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="rotulo-cell"><span className="rotulo-key">Fecha de análisis:</span><input type="date" value={value.analysisDate} onChange={set('analysisDate')} /></div>
          <div className="rotulo-cell"><span className="rotulo-key">Fecha de vencimiento:</span><input type="date" value={value.expiryDate} onChange={set('expiryDate')} /></div>
        </div>
        <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="rotulo-cell"><span className="rotulo-key">No. de análisis:</span><input value={value.analysisNumber} onChange={set('analysisNumber')} maxLength={40} /></div>
          <div className="rotulo-cell"><span className="rotulo-key">Nº reanálisis:</span><input value={value.reanalysisNumber} onChange={set('reanalysisNumber')} maxLength={40} /></div>
        </div>

        <div className="rotulo-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="rotulo-cell rotulo-quality-title">
            <span className="rotulo-key">Estado de calidad</span>
            <span className="tiny muted">· toque para pegar o quitar el punto (el amarillo puede quedarse al pegar el verde)</span>
          </div>
        </div>
        <div className="rotulo-row rotulo-quality" role="group" aria-label="Estado de calidad">
          {QUALITY_OPTIONS.map(([code, text, cls]) => {
            const stickers = value.qualityStickers || []
            const on = stickers.includes(code)
            return (
              <button type="button" key={code} className={`rotulo-cell quality-opt ${cls} ${on ? 'active' : ''}`}
                      aria-pressed={on}
                      onClick={() => onChange({ ...value, qualityStickers: on ? stickers.filter((s) => s !== code) : [...stickers, code] })}>
                <span className="q-label">{text.toUpperCase()}: <span className="rotulo-box">{on && <Icon name="check" />}</span></span>
                <span className="quality-dot" />
              </button>
            )
          })}
        </div>

        <div className="rotulo-row rotulo-sign">
          <div className="rotulo-cell">
            <input value={value.responsible} onChange={set('responsible')} maxLength={80} list="rotulo-responsibles" aria-label="Responsable" style={{ textAlign: 'center' }} />
            <datalist id="rotulo-responsibles">{responsibleSuggestions.map((s) => <option key={s} value={s} />)}</datalist>
            <span className="rotulo-key">Responsable</span>
          </div>
          <div className="rotulo-cell">
            <input value={value.qcSignature} onChange={set('qcSignature')} maxLength={80} aria-label="Firma control de calidad" style={{ textAlign: 'center' }} />
            <span className="rotulo-key">Firma control de calidad</span>
          </div>
        </div>
      </div>

      <div className="rotulo-foot">
        <span><span className="text-danger">*</span> Obligatorios: fecha y tipo de material. Lo demás, solo si está escrito en el rótulo.</span>
        {userName && <span>Registra: <b>{userName}</b></span>}
      </div>
      <div className="field" style={{ maxWidth: 860, marginTop: 10 }}>
        <label htmlFor="rotulo-notes">Observaciones (no van en el rótulo)</label>
        <textarea id="rotulo-notes" value={value.notes} onChange={set('notes')} maxLength={500} rows={2} />
      </div>
    </div>
  )
}

/** Rombo NFPA 704 interactivo: cada toque sube el número (vacío → 0 → … → 4 → vacío). */
function Nfpa({ value, onChange }) {
  const next = (n) => (n === null || n === undefined ? 0 : n >= 4 ? null : n + 1)
  const cycle = (field) => onChange({ ...value, [field]: next(value[field]) })
  const quad = (field, points, fill, tx, ty, label, textColor = '#111') => (
    <g onClick={() => cycle(field)} role="button" aria-label={`${label}: ${value[field] ?? 'vacío'}`}>
      <polygon points={points} fill={fill} />
      <text x={tx} y={ty} textAnchor="middle" fill={textColor}>{value[field] ?? ''}</text>
    </g>
  )
  return (
    <div className="nfpa">
      <svg viewBox="0 0 100 100">
        {quad('nfpaFlammability', '50,2 74,26 50,50 26,26', '#e03131', 50, 33, 'Inflamabilidad', '#fff')}
        {quad('nfpaHealth', '26,26 50,50 26,74 2,50', '#1c7ed6', 26, 57, 'Salud', '#fff')}
        {quad('nfpaReactivity', '74,26 98,50 74,74 50,50', '#fcc419', 74, 57, 'Reactividad')}
        <polygon points="50,50 74,74 50,98 26,74" fill="#fff" />
      </svg>
      <input className="special" value={value.nfpaSpecial || ''} maxLength={10} aria-label="Riesgo especial"
             onChange={(e) => onChange({ ...value, nfpaSpecial: e.target.value })} />
    </div>
  )
}
