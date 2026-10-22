import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { DoctorPage } from './pages/DoctorPage'
import { AdminPage } from './pages/AdminPage'
import { PatientPage } from './pages/PatientPage'
import { SessionProvider, useSession } from './session/SessionContext'
import { rolePath } from './session/roles'
import type { Role } from './data/api'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Falta el elemento raíz de la aplicación')

if (import.meta.env.DEV && window.location.pathname === '/demo/auditoria') {
  // Vite elimina esta importación dinámica y su módulo de datos del build de producción.
  import('./demo/mountAuditDemo').then(({ mountAuditDemo }) => mountAuditDemo(root))
} else {
  createRoot(root).render(<StrictMode><BrowserRouter><SessionProvider><ScrollToTop /><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/ingresar" element={<AuthPage mode="login" />} />
    <Route path="/registro/medico" element={<AuthPage mode="register" />} />
    <Route path="/medico" element={<Protected role="ROLE_MEDICO"><DoctorPage /></Protected>} />
    <Route path="/admin" element={<Protected role="ROLE_ADMIN"><AdminPage /></Protected>} />
    <Route path="/paciente" element={<Protected role="ROLE_PACIENTE"><PatientPage /></Protected>} />
    <Route path="*" element={<main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f2f9f8] px-6 text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#0F8B8D]">Página no disponible</p><h1 className="text-4xl font-bold tracking-tight text-[#173454]">Aún no hay contenido en esta ruta.</h1><a href="/" className="rounded-full bg-[#1E3A5F] px-6 py-3 text-sm font-bold text-white">Volver al inicio</a></main>} />
  </Routes></SessionProvider></BrowserRouter></StrictMode>)
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session, restoring } = useSession()
  if (restoring) return <main className="grid min-h-screen place-items-center bg-[#f4f9f9] text-[#173454]" role="status">Restaurando sesión…</main>
  if (!session) return <Navigate to="/ingresar" replace />
  if (session.rol !== role) return <Navigate to={rolePath(session.rol)} replace />
  return children
}
