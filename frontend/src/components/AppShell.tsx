import { Link, useNavigate } from 'react-router-dom'
import { Brand } from './SiteHeader'
import { useSession } from '../session/SessionContext'
import { isDemoMode } from '../data/service'

export function AppShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  return <div className="min-h-screen bg-[#f4f9f9]">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="border-b border-[#dce9e9] bg-white">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Brand />
        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-label="Área privada">
          <Link to="/" className="text-[#0F8B8D] underline underline-offset-4">Inicio</Link>
          {isDemoMode && <span className="rounded-full bg-[#eaf7f6] px-3 py-1.5 text-xs font-bold text-[#087c7d]">Entorno de prueba</span>}
          {session && <span className="max-w-48 truncate text-[#58717f]" title={session.username}>{session.username}</span>}
          {session && <button type="button" className="rounded-full border border-[#c9ddde] px-4 py-2 text-[#1E3A5F] hover:bg-[#eaf7f6]" onClick={() => { logout(); navigate('/') }}>Salir</button>}
        </nav>
      </div>
    </header>
    <main id="contenido" className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8 lg:py-14">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-[clamp(2rem,4vw,3.3rem)] font-bold tracking-[-.05em] text-[#173454]">{title}</h1>
      <div className="mt-8">{children}</div>
    </main>
  </div>
}

export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' | 'success' }) {
  const colors = tone === 'error' ? 'border-[#f1c6bb] bg-[#fff4f1] text-[#893f32]'
    : tone === 'success' ? 'border-[#b7dfd4] bg-[#edfaf5] text-[#175f53]'
      : 'border-[#c8dfe2] bg-[#f0f8f8] text-[#355f70]'
  return <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${colors}`}>{children}</p>
}

export const fieldClass = 'w-full rounded-xl border border-[#c9dcdf] bg-white px-4 py-3 text-[#173454] outline-none focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#a9ded9]'
export const primaryClass = 'rounded-full bg-[#1E3A5F] px-6 py-3 text-sm font-bold text-white hover:bg-[#12304f] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]'
export const secondaryClass = 'rounded-full border border-[#bcd6d8] px-5 py-2.5 text-sm font-bold text-[#1E3A5F] hover:bg-[#eaf7f6] disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]'
