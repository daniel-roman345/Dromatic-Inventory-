import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Si el puerto ya está ocupado (el frontend ya está abierto) muestra error en vez de usar otro puerto,
    // porque el backend solo acepta peticiones desde el puerto 5173.
    strictPort: true,
  },
})
