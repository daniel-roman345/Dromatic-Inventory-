import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import LoginPage from './auth/LoginPage.jsx'
import ChangePasswordPage from './auth/ChangePasswordPage.jsx'
import AppLayout from './app/AppLayout.jsx'
import AppearancePage from './app/AppearancePage.jsx'
import DashboardPage from './dashboard/DashboardPage.jsx'
import MapsPage from './maps/MapsPage.jsx'
import MapEditorPage from './admin/MapEditorPage.jsx'
import Pending from './shared/Pending.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cambiar-clave" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="inventario/:moduleCode" element={<Pending title="Inventario del módulo" />} />
        <Route path="articulos/:id" element={<Pending title="Ficha del producto" />} />
        <Route path="entrada" element={<Pending title="Registrar entrada" />} />
        <Route path="salida" element={<Pending title="Registrar salida" />} />
        <Route path="traslado" element={<Pending title="Trasladar" />} />
        <Route path="ajuste" element={<Pending title="Contar y corregir" />} />
        <Route path="mapas" element={<MapsPage />} />
        <Route path="mapas/:areaCode" element={<MapsPage />} />
        <Route path="donde-esta" element={<Pending title="¿Dónde está?" />} />
        <Route path="movimientos" element={<Pending title="Movimientos" />} />
        <Route path="alertas" element={<Pending title="Alertas" />} />
        <Route path="reportes" element={<Pending title="Reportes" />} />
        <Route path="apariencia" element={<AppearancePage />} />
        <Route path="admin/usuarios" element={<ProtectedRoute adminOnly><Pending title="Usuarios" /></ProtectedRoute>} />
        <Route path="admin/mapas" element={<ProtectedRoute adminOnly><MapEditorPage /></ProtectedRoute>} />
        <Route path="admin/mapas/:areaCode" element={<ProtectedRoute adminOnly><MapEditorPage /></ProtectedRoute>} />
        <Route path="admin/sugerencias" element={<ProtectedRoute adminOnly><Pending title="Sugerencias" /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
