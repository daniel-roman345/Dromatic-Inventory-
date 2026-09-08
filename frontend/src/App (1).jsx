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
import Reports from './pages/Reports.jsx'
import Users from './pages/Users.jsx'
import Locations from './pages/Locations.jsx'
import Profile from './pages/Profile.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/inventory/new" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}><ProductForm /></ProtectedRoute>
      } />
      <Route path="/inventory/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path="/inventory/:id/edit" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}><ProductForm /></ProtectedRoute>
      } />

      <Route path="/entries" element={
        <ProtectedRoute roles={['ADMINISTRADOR', 'OPERADOR']}><Entries /></ProtectedRoute>
      } />
      <Route path="/exits" element={
        <ProtectedRoute roles={['ADMINISTRADOR', 'OPERADOR']}><Exits /></ProtectedRoute>
      } />

      <Route path="/movements" element={<ProtectedRoute><Movements /></ProtectedRoute>} />

      <Route path="/reports" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}><Reports /></ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}><Users /></ProtectedRoute>
      } />

      <Route path="/locations" element={
        <ProtectedRoute roles={['ADMINISTRADOR', 'OPERADOR']}><Locations /></ProtectedRoute>
      } />

      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  )
}
