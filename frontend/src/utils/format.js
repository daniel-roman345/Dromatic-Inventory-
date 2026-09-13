function pad(n) {
  return String(n).padStart(2, '0')
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Fecha de hoy en formato yyyy-mm-dd (hora local). */
export function todayISO() {
  return toISODate(new Date())
}

export function firstDayOfMonthISO() {
  const d = new Date()
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function daysAgoISO(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return toISODate(d)
}

/** yyyy-mm-dd → dd/mm/yyyy */
export function formatDate(value) {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return `${formatDate(value)} ${formatTime(value)}`
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-CO').format(value ?? 0)
}

/** Quita parámetros vacíos antes de enviarlos al backend. */
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
}

/** Mensaje entendible a partir de un error de Axios. */
export function errorMessage(err, fallback = 'Ocurrió un error. Intente nuevamente.') {
  if (!err?.response) {
    return 'No hay conexión con el servidor. Verifique que el backend esté encendido.'
  }
  if (err.response.status === 403) {
    return 'No tiene permisos para realizar esta acción.'
  }
  return err.response.data?.message || fallback
}
