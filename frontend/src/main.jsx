import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { AppDataProvider } from './app/AppDataContext.jsx'
import { applyPreferences, readPreferences } from './app/preferences.js'
import { ToastProvider } from './shared/ui.jsx'
import './styles/global.css'
import './styles/map.css'
import './styles/rotulo.css'

// La apariencia escogida por la persona se aplica antes de dibujar.
applyPreferences(readPreferences())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
