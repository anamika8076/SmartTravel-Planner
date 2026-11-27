import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = process.env.VITE_ALLOWED_HOSTS
  ?.split(',')
  .map((host) => host.trim())
  .filter(Boolean)

// Production is served under /smarttravel/ behind Tailscale Funnel with a
// relative asset base, so the page needs a <base href>. Override with
// VITE_BASE_HREF (set it to "" to omit); dev servers never get one.
function baseHref(mode) {
  return {
    name: 'inject-base-href',
    transformIndexHtml() {
      const href = process.env.VITE_BASE_HREF ?? (mode === 'production' ? '/smarttravel/' : '')
      return href ? [{ tag: 'base', attrs: { href }, injectTo: 'head-prepend' }] : []
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH || (mode === 'production' ? './' : '/'),
  plugins: [react(), baseHref(mode)],
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
}))
