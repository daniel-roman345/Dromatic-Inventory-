/** Formatos como se usan en Colombia: 12.500 · 3,5 · 28/09/2026. */
const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 })

export function fmtNum(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? numberFormat.format(n) : '—'
}

/** "690 unidades", "50 kg". */
export function fmtQty(value, unit) {
  return `${fmtNum(value)}${unit ? ` ${unit}` : ''}`
}

export function fmtDate(value) {
  if (!value) return '—'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function fmtDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Hace cuánto: "hace 5 min", "ayer", "hace 3 días". */
export function fmtAgo(value) {
  if (!value) return ''
  const diff = (Date.now() - new Date(value).getTime()) / 1000
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  const days = Math.floor(diff / 86400)
  return days === 1 ? 'ayer' : `hace ${days} días`
}

export function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Número escrito por el usuario ("1.500", "2,5") → número o null. */
export function parseNum(text) {
  if (text === null || text === undefined) return null
  let s = String(text).trim().replace(/\s/g, '')
  if (!s) return null
  // "1.500" (miles) → 1500 ; "2,5" → 2.5 ; "1.500,25" → 1500.25
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
}

export const EFFECT_LABELS = {
  ENTRADA: 'Suma al inventario',
  SALIDA: 'Resta del inventario',
  TRASLADO: 'Cambia de lugar',
  AJUSTE: 'Corrige el conteo',
}

export const QUALITY = {
  CUARENTENA: { label: 'Cuarentena', badge: 'badge-warn', color: '#facc15' },
  APROBADO: { label: 'Aprobado', badge: 'badge-ok', color: '#84cc16' },
  RECHAZADO: { label: 'Rechazado', badge: 'badge-danger', color: '#ef4444' },
}
