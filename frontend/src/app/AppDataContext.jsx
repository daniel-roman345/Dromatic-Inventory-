import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { alertsApi, modulesApi, suggestionsApi } from '../api/services'
import { useAuth } from '../auth/AuthContext'

/**
 * Datos que usan muchas pantallas: los módulos con el permiso del usuario,
 * el número de alertas abiertas y las sugerencias para autocompletar.
 */
const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const suggestionCache = useRef(new Map())

  const reloadModules = useCallback(() => modulesApi.list().then((list) => {
    setModules(list)
    setLoaded(true)
    return list
  }), [])

  const refreshAlerts = useCallback(() => {
    alertsApi.count().then((r) => setAlertCount(r.open)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user || user.mustChangePassword) return undefined
    reloadModules().catch(() => setLoaded(true))
    refreshAlerts()
    const timer = setInterval(refreshAlerts, 60000)
    return () => clearInterval(timer)
  }, [user, reloadModules, refreshAlerts])

  /** Sugerencias de un módulo (o de todos con NULL); se guardan un minuto. */
  const getSuggestions = useCallback(async (moduleId = null) => {
    const key = moduleId ?? 'all'
    const cached = suggestionCache.current.get(key)
    if (cached && Date.now() - cached.at < 60000) return cached.data
    const data = await suggestionsApi.forModule(moduleId ?? undefined)
    suggestionCache.current.set(key, { data, at: Date.now() })
    return data
  }, [])

  /** Después de registrar un movimiento: sugerencias y alertas nuevas. */
  const afterChange = useCallback(() => {
    suggestionCache.current.clear()
    setTimeout(refreshAlerts, 1500)
  }, [refreshAlerts])

  const value = useMemo(() => {
    const byCode = Object.fromEntries(modules.map((m) => [m.code, m]))
    const byId = Object.fromEntries(modules.map((m) => [m.id, m]))
    return {
      modules,
      modulesLoaded: loaded,
      moduleByCode: (code) => byCode[code],
      moduleById: (id) => byId[id],
      editableModules: modules.filter((m) => m.canEdit),
      canEditAny: modules.some((m) => m.canEdit),
      alertCount,
      refreshAlerts,
      getSuggestions,
      afterChange,
      reloadModules,
    }
  }, [modules, loaded, alertCount, refreshAlerts, getSuggestions, afterChange, reloadModules])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  return useContext(AppDataContext)
}

/** Sugerencias de un módulo, listas para los campos de texto libre. */
export function useSuggestions(moduleId) {
  const { getSuggestions } = useAppData()
  const [data, setData] = useState({})
  useEffect(() => {
    let alive = true
    getSuggestions(moduleId).then((d) => alive && setData(d)).catch(() => {})
    return () => { alive = false }
  }, [moduleId, getSuggestions])
  return data
}
