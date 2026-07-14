// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Node.js / Express — appointments, excel data
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Python / FastAPI — patients
      // Regex: matches /patient/ followed by anything, but NOT /patients (the React route)
      '^/patient/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy ABHA routes which look like /patients/123/abha/...
      '^/patients/.*/abha': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Python / FastAPI — message templates
      '^/templates/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Python / FastAPI — WhatsApp bot appointment requests
      '^/requests': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/whatsapp/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/queue-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/field-options/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/config/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/calendar-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/scheduled-appointments': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/past-appointments': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/appointments/patient/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      '^/portal-settings': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '^/backup/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Python / FastAPI — config
      '^/config': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    }
  }
})
