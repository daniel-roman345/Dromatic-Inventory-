import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import ProductForm from './pages/ProductForm.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Entries from './pages/Entries.jsx'
import Exits from './pages/Exits.jsx'
import Movements from './pages/Movements.jsx'
import StockAlerts from './pages/StockAlerts.jsx'
import Reports from './pages/Reports.jsx'
import Users from './pages/Users.jsx'
import Locations from './pages/Locations.jsx'
import NotFound from './pages/NotFound.jsx'

const ADMIN = ['ADMINISTRADOR']
const ADMIN_OPERADOR = ['ADMINISTRADOR', 'OPERADOR']

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedRoute roles={ADMIN_OPERADOR}><Dashboard /></ProtectedRoute>} />

      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/inventory/new" element={<ProtectedRoute roles={ADMIN_OPERADOR}><ProductForm /></ProtectedRoute>} />
      <Route path="/inventory/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path="/inventory/:id/edit" element={<ProtectedRoute roles={ADMIN}><ProductForm /></ProtectedRoute>} />

      <Route path="/alerts" element={<ProtectedRoute><StockAlerts /></ProtectedRoute>} />

      <Route path="/entries" element={<ProtectedRoute roles={ADMIN_OPERADOR}><Entries /></ProtectedRoute>} />
      <Route path="/exits" element={<ProtectedRoute roles={ADMIN_OPERADOR}><Exits /></ProtectedRoute>} />
      <Route path="/movements" element={<ProtectedRoute roles={ADMIN_OPERADOR}><Movements /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute roles={ADMIN_OPERADOR}><Locations /></ProtectedRoute>} />

      <Route path="/reports" element={<ProtectedRoute roles={ADMIN}><Reports /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={ADMIN}><Users /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
