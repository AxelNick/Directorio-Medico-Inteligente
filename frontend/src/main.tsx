import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LandingPage } from './pages/LandingPage'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Falta el elemento raíz de la aplicación')

if (import.meta.env.DEV && window.location.pathname === '/demo/auditoria') {
  // Vite elimina esta importación dinámica y su módulo de datos del build de producción.
  import('./demo/mountAuditDemo').then(({ mountAuditDemo }) => mountAuditDemo(root))
} else if (window.location.pathname === '/') {
  createRoot(root).render(<StrictMode><LandingPage /></StrictMode>)
} else {
  createRoot(root).render(
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f2f9f8] px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[.2em] text-[#0F8B8D]">Página no disponible</p>
      <h1 className="text-4xl font-bold tracking-tight text-[#173454]">Aún no hay contenido en esta ruta.</h1>
      <a href="/" className="rounded-full bg-[#1E3A5F] px-6 py-3 text-sm font-bold text-white">Volver al inicio</a>
    </main>,
  )
}
