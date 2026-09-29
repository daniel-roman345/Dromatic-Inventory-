import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import LoginPage from './auth/LoginPage.jsx'
import ChangePasswordPage from './auth/ChangePasswordPage.jsx'
import AppLayout from './app/AppLayout.jsx'
import AppearancePage from './app/AppearancePage.jsx'
import DashboardPage from './dashboard/DashboardPage.jsx'
import InventoryPage from './inventory/InventoryPage.jsx'
import ItemDetailPage from './items/ItemDetailPage.jsx'
import EntryPage from './movements/EntryPage.jsx'
import ExitPage from './movements/ExitPage.jsx'
import StockPickPage from './movements/StockPickPage.jsx'
import MovementsPage from './movements/MovementsPage.jsx'
import MapsPage from './maps/MapsPage.jsx'
import LocatePage from './locate/LocatePage.jsx'
import AlertsPage from './alerts/AlertsPage.jsx'
import ReportsPage from './reports/ReportsPage.jsx'
import UsersPage from './admin/UsersPage.jsx'
import MapEditorPage from './admin/MapEditorPage.jsx'
import SuggestionsPage from './admin/SuggestionsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cambiar-clave" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="inventario/:moduleCode" element={<InventoryPage />} />
        <Route path="articulos/:id" element={<ItemDetailPage />} />
        <Route path="entrada" element={<EntryPage />} />
        <Route path="salida" element={<ExitPage />} />
        <Route path="traslado" element={<StockPickPage mode="TRASLADO" />} />
        <Route path="ajuste" element={<StockPickPage mode="AJUSTE" />} />
        <Route path="mapas" element={<MapsPage />} />
        <Route path="mapas/:areaCode" element={<MapsPage />} />
        <Route path="donde-esta" element={<LocatePage />} />
        <Route path="movimientos" element={<MovementsPage />} />
        <Route path="alertas" element={<AlertsPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="apariencia" element={<AppearancePage />} />
        <Route path="admin/usuarios" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
        <Route path="admin/mapas" element={<ProtectedRoute adminOnly><MapEditorPage /></ProtectedRoute>} />
        <Route path="admin/mapas/:areaCode" element={<ProtectedRoute adminOnly><MapEditorPage /></ProtectedRoute>} />
        <Route path="admin/sugerencias" element={<ProtectedRoute adminOnly><SuggestionsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
