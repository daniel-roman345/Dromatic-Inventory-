import { createContext, useContext, useState } from 'react'
import { login as loginRequest } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('dis_user')
    return stored ? JSON.parse(stored) : null
  })

  async function login(username, password) {
    const data = await loginRequest(username, password)
    const userData = { username: data.username, email: data.email, role: data.role }
    localStorage.setItem('dis_token', data.token)
    localStorage.setItem('dis_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  function logout() {
    localStorage.removeItem('dis_token')
    localStorage.removeItem('dis_user')
    setUser(null)
  }

  function hasRole(...roles) {
    return user && roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
