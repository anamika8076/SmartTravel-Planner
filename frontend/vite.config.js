import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = process.env.VITE_ALLOWED_HOSTS
  ?.split(',')
  .map((host) => host.trim())
  .filter(Boolean)

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    ...(allowedHosts?.length ? { allowedHosts } : {}),
    // In development, API calls go to /api/... on the Vite server and are
    // forwarded to Django, so the backend doesn't need CORS set up locally.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    ...(allowedHosts?.length ? { allowedHosts } : {}),
  },
})
