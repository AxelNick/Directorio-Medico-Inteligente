import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8080'
  return {
    plugins: [react(), tailwindcss()],
    server: { host: '127.0.0.1', port: 5173, proxy: {
      '/api': { target: apiTarget, changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api/, '') },
      '/uploads': { target: apiTarget, changeOrigin: true },
    } },
  }
})
