import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/services'
import { PASSWORD_CHANGE_EVENT, SESSION_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from '../api/client'

/**
 * Sesión del usuario: token en localStorage y datos del usuario (rol, si debe
 * cambiar la contraseña temporal). La sesión se cierra sola al vencer el token.
 */
const AuthContext = createContext(null)

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function readStoredSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const session = JSON.parse(localStorage.getItem(USER_KEY))
    if (token && session?.expiresAt > Date.now()) return session
  } catch {
    // datos dañados: se descartan
  }
  clearStorage()
  return null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  const logout = useCallback(() => {
    clearStorage()
    setSession(null)
  }, [])

  const saveUser = useCallback((user) => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, user }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  async function login(username, password) {
    const data = await authApi.login(username, password)
    const next = { user: data.user, expiresAt: Date.now() + data.expiresInMs }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(next))
    setSession(next)
    return data.user
  }

  async function changePassword(currentPassword, newPassword) {
    const user = await authApi.changePassword(currentPassword, newPassword)
    saveUser(user)
    return user
  }

  // Al abrir la aplicación se actualizan los datos del usuario (rol, nombre...).
  useEffect(() => {
    if (!session) return
    authApi.me().then(saveUser).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!session) return undefined
    const timer = setTimeout(logout, Math.max(0, session.expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [session, logout])

  useEffect(() => {
    const onExpired = () => logout()
    const onMustChange = () => setSession((s) => (s ? { ...s, user: { ...s.user, mustChangePassword: true } } : s))
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    window.addEventListener(PASSWORD_CHANGE_EVENT, onMustChange)
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
      window.removeEventListener(PASSWORD_CHANGE_EVENT, onMustChange)
    }
  }, [logout])

  const user = session?.user || null
  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isAdmin: Boolean(user?.admin) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
