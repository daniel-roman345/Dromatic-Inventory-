import { Navigate, useLocation } from 'react-router-dom'
import { homePathFor, useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  return children
}
