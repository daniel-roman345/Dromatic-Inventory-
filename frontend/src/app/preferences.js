import { useCallback, useEffect, useState } from 'react'

/**
 * Apariencia a gusto de cada persona (se guarda en este navegador).
 * Cada opción cambia variables CSS, así el cambio se ve al instante.
 */
export const PREFERENCE_OPTIONS = {
  accent: {
    label: 'Color principal',
    options: [
      { value: 'teal', label: 'Verde azulado', swatch: '#0f766e' },
      { value: 'blue', label: 'Azul', swatch: '#2563eb' },
      { value: 'green', label: 'Verde', swatch: '#15803d' },
      { value: 'purple', label: 'Morado', swatch: '#7c3aed' },
      { value: 'orange', label: 'Naranja', swatch: '#c2410c' },
    ],
  },
  tileShape: {
    label: 'Forma de las estanterías en el mapa',
    options: [
      { value: 'rounded', label: 'Redondeadas' },
      { value: 'square', label: 'Cuadradas' },
      { value: 'pill', label: 'Muy redondas' },
    ],
  },
  letterSize: {
    label: 'Tamaño de las letras del mapa',
    options: [
      { value: 'small', label: 'Pequeñas' },
      { value: 'normal', label: 'Normales' },
      { value: 'large', label: 'Grandes' },
    ],
  },
  signs: {
    label: 'Letrero del número de pasillo',
    options: [
      { value: 'circle', label: 'Círculo' },
      { value: 'square', label: 'Cuadro' },
      { value: 'off', label: 'Sin letrero' },
    ],
  },
  emptyTiles: {
    label: 'Estanterías vacías',
    options: [
      { value: 'light', label: 'Color suave' },
      { value: 'faded', label: 'Más apagadas' },
    ],
  },
  fontSize: {
    label: 'Tamaño de la letra del sistema',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'large', label: 'Grande' },
      { value: 'xlarge', label: 'Muy grande' },
    ],
  },
  density: {
    label: 'Espacio entre elementos',
    options: [
      { value: 'comfortable', label: 'Cómodo' },
      { value: 'compact', label: 'Compacto' },
    ],
  },
}

export const DEFAULT_PREFERENCES = {
  accent: 'teal',
  tileShape: 'rounded',
  letterSize: 'normal',
  signs: 'circle',
  emptyTiles: 'light',
  fontSize: 'normal',
  density: 'comfortable',
}

const ACCENTS = {
  teal: ['#0f766e', '#115e59', '#e6f4f1'],
  blue: ['#2563eb', '#1d4ed8', '#e8efff'],
  green: ['#15803d', '#166534', '#e7f6ec'],
  purple: ['#7c3aed', '#6d28d9', '#f1eaff'],
  orange: ['#c2410c', '#9a3412', '#fff1e8'],
}
const RADIUS = { rounded: '9px', square: '3px', pill: '16px' }
const LETTER = { small: '12px', normal: '15px', large: '19px' }
const FONT = { normal: '15px', large: '17px', xlarge: '19px' }

const KEY = 'dis_prefs'
const EVENT = 'dis:prefs'

export function readPreferences() {
  try {
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function applyPreferences(p) {
  const root = document.documentElement
  const [brand, dark, soft] = ACCENTS[p.accent] || ACCENTS.teal
  root.style.setProperty('--brand', brand)
  root.style.setProperty('--brand-dark', dark)
  root.style.setProperty('--brand-soft', soft)
  root.style.setProperty('--map-radius', RADIUS[p.tileShape] || RADIUS.rounded)
  root.style.setProperty('--map-letter', LETTER[p.letterSize] || LETTER.normal)
  root.style.setProperty('--map-empty-opacity', p.emptyTiles === 'faded' ? '.5' : '1')
  root.style.fontSize = FONT[p.fontSize] || FONT.normal
  const body = document.body.classList
  body.toggle('map-signs-square', p.signs === 'square')
  body.toggle('map-signs-off', p.signs === 'off')
  body.toggle('compact', p.density === 'compact')
}

export function usePreferences() {
  const [prefs, setPrefs] = useState(readPreferences)
  useEffect(() => {
    const sync = () => setPrefs(readPreferences())
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])
  const save = useCallback((next) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* sin almacenamiento: se aplica solo ahora */ }
    applyPreferences(next)
    setPrefs(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])
  return [prefs, save]
}
