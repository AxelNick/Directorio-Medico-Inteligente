import { useState } from 'react'
import { Icon } from './Icons'
import { isDemoMode } from '../data/service'
import { Link } from 'react-router-dom'
import { useSession } from '../session/SessionContext'
import { rolePath } from '../session/roles'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className={`inline-flex items-center gap-3 font-bold tracking-tight ${light ? 'text-white' : 'text-[#173454]'}`} aria-label="Directorio Médico Inteligente, ir al inicio">
      <span className="brand-symbol" aria-hidden="true"><span /></span>
      <span className="text-[15px] leading-[1.05] sm:text-[16px]">Directorio<br /><span className={light ? 'text-[#8ce2de]' : 'text-[#0F8B8D]'}>Médico Inteligente</span></span>
    </a>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { session } = useSession()

  const close = () => setOpen(false)

  return (
    <header className="relative z-30 border-b border-[#e2eced] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 text-[14px] font-semibold text-[#38516a] md:flex" aria-label="Navegación principal">
          <a className="nav-link" href="#como-funciona">Cómo funciona</a>
          <a className="nav-link" href="#especialidades">Especialidades</a>
          <a className="nav-link" href="#para-medicos">Para médicos</a>
        </nav>
        <div className="hidden items-center gap-4 md:flex">{isDemoMode && <span className="rounded-full bg-[#eaf7f6] px-3 py-1.5 text-xs font-bold text-[#087c7d]">Entorno de prueba</span>}{session ? <Link to={rolePath(session.rol)} className="inline-flex items-center gap-2 rounded-full bg-[#1E3A5F] px-5 py-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#12304f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]">Mi área <Icon name="arrow" className="h-4 w-4" /></Link> : <><Link to="/ingresar" className="text-[13px] font-bold text-[#1E3A5F] underline underline-offset-4">Ingresar</Link><Link className="inline-flex items-center gap-2 rounded-full bg-[#1E3A5F] px-5 py-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#12304f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]" to="/registro/medico">Regístrate como médico <Icon name="arrow" className="h-4 w-4" /></Link></>}</div>
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#1E3A5F] focus-visible:outline-3 focus-visible:outline-[#0F8B8D] md:hidden" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="flex flex-col gap-1 border-t border-[#e2eced] bg-white px-5 py-4 text-sm font-semibold text-[#1E3A5F] md:hidden" aria-label="Navegación móvil">
          {isDemoMode && <span className="px-3 py-2 text-xs font-bold text-[#0F8B8D]">Entorno de prueba</span>}
          <a className="rounded-lg px-3 py-3 hover:bg-[#eef8f7]" href="#como-funciona" onClick={close}>Cómo funciona</a>
          <a className="rounded-lg px-3 py-3 hover:bg-[#eef8f7]" href="#especialidades" onClick={close}>Especialidades</a>
          <a className="rounded-lg px-3 py-3 hover:bg-[#eef8f7]" href="#para-medicos" onClick={close}>Para médicos</a>
          {session ? <Link className="rounded-lg px-3 py-3 hover:bg-[#eef8f7]" to={rolePath(session.rol)} onClick={close}>Mi área</Link> : <><Link className="rounded-lg px-3 py-3 hover:bg-[#eef8f7]" to="/ingresar" onClick={close}>Ingresar</Link><Link className="rounded-lg px-3 py-3 hover:bg-[#eef8f7]" to="/registro/medico" onClick={close}>Regístrate como médico</Link></>}
        </nav>
      )}
    </header>
  )
}
