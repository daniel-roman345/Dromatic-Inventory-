import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Deja pasar solo con sesión. Si la contraseña es temporal, lleva primero a
 * cambiarla. {@code adminOnly} protege las pantallas de administración.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (user.mustChangePassword && location.pathname !== '/cambiar-clave') {
    return <Navigate to="/cambiar-clave" replace />
  }
  if (adminOnly && !user.admin) return <Navigate to="/" replace />
  return children
}
