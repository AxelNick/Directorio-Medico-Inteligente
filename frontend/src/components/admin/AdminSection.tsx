import { NavLink } from 'react-router-dom'
import { AppShell } from '../AppShell'

// Solo se listan secciones con página registrada en el router (main.tsx).
const SECTIONS = [
  { to: '/admin', label: 'Especialidades', end: true },
  { to: '/admin/resenas', label: 'Reseñas', end: false },
  { to: '/admin/auditoria', label: 'Auditoría', end: false },
]

/** Marco común del área administrativa: cabecera de la aplicación y menú de secciones. */
export function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <AppShell eyebrow="ADMINISTRACIÓN" title={title}>
    <nav aria-label="Secciones de administración" className="mb-8 flex flex-wrap gap-2">
      {SECTIONS.map((section) => <NavLink key={section.to} to={section.to} end={section.end}
        className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D] ${isActive ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#4e6879] ring-1 ring-[#cfe1e2] hover:bg-[#eaf7f6]'}`}>
        {section.label}
      </NavLink>)}
    </nav>
    {children}
  </AppShell>
}
