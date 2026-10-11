import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Unlike VITE_* variables, these stay in the Vite server process.
  const env = loadEnv(mode, '.', '')
  const hasTfLKey = Boolean(env.TFL_APP_KEY)

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 800,
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api/tfl': {
          target: 'https://api.tfl.gov.uk',
          changeOrigin: true,
          headers: hasTfLKey ? { 'Ocp-Apim-Subscription-Key': env.TFL_APP_KEY } : undefined,
          rewrite: (path) => {
            const [pathname, query = ''] = path.replace(/^\/api\/tfl/, '').split('?')
            const params = new URLSearchParams(query)
            if (hasTfLKey) params.set('app_key', env.TFL_APP_KEY)
            return `${pathname}?${params.toString()}`
          },
        },
      },
    },
  }
})
