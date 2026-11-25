import { useEffect, useState } from 'react'
import type { AuditPage } from '../../data/audit'
import { service } from '../../data/service'
import { AdminSection } from '../../components/admin/AdminSection'
import { AuditTable } from '../../components/admin/AuditTable'
import { secondaryClass } from '../../components/AppShell'
import { useSession } from '../../session/SessionContext'

const PAGE_SIZE = 20
const pagerClass = 'rounded-full border border-[#cfe1e2] px-4 py-2 text-xs font-bold text-[#1E3A5F] enabled:hover:bg-[#eaf7f6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AuditPage }

/**
 * Auditoría real del área administrativa (GET /admin/auditoria vía el cliente API compartido).
 * La ruta está protegida con ROLE_ADMIN en el router; la autorización efectiva la aplica el backend.
 */
export function AuditoriaPage() {
  const { session } = useSession()
  const token = session!.token
  const [query, setQuery] = useState({ page: 0, attempt: 0 })
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    service.listAdminAudit(token, query.page, PAGE_SIZE).then((data) => {
      if (active) setState({ status: 'ready', data })
    }).catch((cause: unknown) => {
      if (active) setState({ status: 'error', message: cause instanceof Error ? cause.message : 'No se pudo cargar la auditoría.' })
    })
    return () => { active = false }
  }, [token, query])

  function go(page: number) {
    setState({ status: 'loading' })
    setQuery((current) => ({ page, attempt: current.attempt + 1 }))
  }

  const total = state.status === 'ready' ? state.data.total : 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = query.page

  return <AdminSection title="Registro de auditoría">
    <p className="mb-7 max-w-2xl text-sm leading-7 text-[#607785]">Cambios registrados sobre perfiles, centros de atención y catálogo: quién los hizo, cuándo y qué valor cambió.</p>
    <section className="overflow-hidden rounded-[22px] border border-[#dce9e9] bg-white shadow-sm" aria-labelledby="events-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5eeee] px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="events-title" className="text-lg font-bold text-[#173454]">Eventos registrados</h2>
          {state.status === 'ready' && <span className="rounded-full bg-[#eef5f5] px-3 py-1.5 text-xs font-bold text-[#496779]">{total} {total === 1 ? 'evento' : 'eventos'}</span>}
        </div>
        <button type="button" className={secondaryClass} disabled={state.status === 'loading'} onClick={() => go(page)}>Actualizar</button>
      </div>
      <div aria-live="polite">
        {state.status === 'loading' && <div role="status" className="flex min-h-[270px] flex-col items-center justify-center gap-3 px-6 text-center"><span className="h-9 w-9 animate-spin rounded-full border-3 border-[#b8dfdc] border-t-[#0F8B8D]" aria-hidden="true" /><p className="text-sm font-semibold text-[#607685]">Cargando registros…</p></div>}
        {state.status === 'error' && <div role="alert" className="flex min-h-[270px] flex-col items-center justify-center gap-4 px-6 text-center"><div><p className="font-bold text-[#173454]">No se pudieron cargar los registros</p><p className="mt-2 text-sm text-[#893f32]">{state.message}</p></div><button type="button" className={secondaryClass} onClick={() => go(page)}>Reintentar</button></div>}
        {state.status === 'ready' && state.data.items.length === 0 && <div className="flex min-h-[270px] flex-col items-center justify-center gap-3 px-6 text-center"><p className="font-bold text-[#173454]">{page === 0 ? 'Aún no hay eventos registrados' : 'No hay eventos en esta página'}</p><p className="max-w-[360px] text-sm leading-6 text-[#687e89]">{page === 0 ? 'Los cambios aparecerán aquí cuando se modifiquen perfiles, centros o el catálogo.' : 'Vuelve a la página anterior para ver los registros.'}</p></div>}
        {state.status === 'ready' && state.data.items.length > 0 && <AuditTable items={state.data.items} caption="Eventos de auditoría" />}
      </div>
      {state.status === 'ready' && (total > 0 || page > 0) && <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e5eeee] px-5 py-5 sm:px-7">
        <p className="text-xs font-medium text-[#687e89]">Página {page + 1} de {pageCount} · {total} {total === 1 ? 'registro' : 'registros'}</p>
        <div className="flex gap-2">
          <button type="button" className={pagerClass} disabled={page === 0} onClick={() => go(page - 1)}>Anterior</button>
          <button type="button" className={pagerClass} disabled={page + 1 >= pageCount} onClick={() => go(page + 1)}>Siguiente</button>
        </div>
      </div>}
    </section>
  </AdminSection>
}
