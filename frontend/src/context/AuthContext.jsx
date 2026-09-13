import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as loginRequest } from '../services/authService'
import { SESSION_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from '../services/api'

const AuthContext = createContext(null)

export const ROLE_LABELS = {
  ADMINISTRADOR: 'Administrador',
  OPERADOR: 'Operador de inventario',
  CONSULTA: 'Usuario de consulta',
}

/** Página de inicio según el rol. */
export function homePathFor(role) {
  return role === 'CONSULTA' ? '/inventory' : '/dashboard'
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function readStoredSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY))
    if (token && user?.expiresAt > Date.now()) {
      return user
    }
  } catch {
    // datos corruptos: se descartan
  }
  clearStorage()
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredSession)

  const logout = useCallback(() => {
    clearStorage()
    setUser(null)
  }, [])

  async function login(username, password) {
    const data = await loginRequest(username, password)
    const userData = { username: data.username, role: data.role, expiresAt: Date.now() + data.expiresIn }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  // Cierra la sesión automáticamente cuando vence el token.
  useEffect(() => {
    if (!user) return undefined
    const timer = setTimeout(logout, Math.max(0, user.expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [user, logout])

  // El interceptor de Axios avisa cuando el backend responde 401.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  const hasRole = useCallback((...roles) => Boolean(user && roles.includes(user.role)), [user])

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
