import PrivateLayout from '../components/PrivateLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Profile() {
  const { user } = useAuth()

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>Mi perfil</h2>
      <div className="card" style={{ maxWidth: 420 }}>
        <p><strong>Usuario:</strong> {user?.username}</p>
        <p><strong>Correo:</strong> {user?.email}</p>
        <p><strong>Rol:</strong> {user?.role}</p>
      </div>
    </PrivateLayout>
  )
}
