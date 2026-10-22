import { useEffect, useMemo, useState } from 'react'
import { Brand } from '../components/SiteHeader'
import { Icon } from '../components/Icons'
import type { AuditEvent, AuditPage } from '../data/audit'
import { createMockAuditRepository, type DemoScenario } from './mockAuditRepository'

const PAGE_SIZE = 5

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))
}

function displayValue(value: string | null) {
  return value ?? '—'
}

export function AuditDemoPage() {
  const [scenario, setScenario] = useState<DemoScenario>('normal')
  const [page, setPage] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [result, setResult] = useState<AuditPage | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const repository = useMemo(() => createMockAuditRepository(scenario), [scenario])

  useEffect(() => {
    let active = true
    repository.list({ page, size: PAGE_SIZE }).then((data) => {
      if (active) { setResult(data); setStatus('ready') }
    }).catch(() => {
      if (active) { setResult(null); setStatus('error') }
    })
    return () => { active = false }
  }, [repository, page, refresh])

  function selectScenario(next: DemoScenario) {
    setStatus('loading')
    setResult(null)
    setPage(0)
    setScenario(next)
    setRefresh((value) => value + 1)
  }

  const count = result?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <>
      <a className="skip-link" href="#auditoria">Saltar a la auditoría</a>
      <div className="min-h-screen bg-[#f5f9f9]">
        <header className="border-b border-[#dce8e9] bg-white">
          <div className="mx-auto flex max-w-[1260px] flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
            <Brand />
            <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#0F8B8D] underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]"><Icon name="arrow" className="h-4 w-4 rotate-180" /> Volver a la portada</a>
          </div>
        </header>
        <main id="auditoria" className="mx-auto max-w-[1260px] px-5 py-10 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">SPRINT 1 · DEMOSTRACIÓN LOCAL</p>
              <h1 className="mt-3 text-[clamp(2.2rem,4vw,3.7rem)] font-bold tracking-[-.055em] text-[#173454]">Registro de auditoría</h1>
              <p className="mt-3 max-w-[650px] text-sm leading-7 text-[#5f7683]">Explora cambios ficticios en perfiles para revisar la tabla, su paginación y sus estados.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#a9ded9] bg-[#eaf8f6] px-4 py-2 text-xs font-bold text-[#087c7d]"><Icon name="shield" className="h-4 w-4" /> Datos de demostración</div>
          </div>

          <section className="mt-9 rounded-[22px] border border-[#dce9e9] bg-white p-5 shadow-[0_15px_45px_-35px_#1E3A5F] sm:p-6" aria-label="Escenarios de demostración">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-sm font-bold text-[#173454]">Prueba los estados de la tabla</h2><p className="mt-1 text-xs leading-5 text-[#708793]">Estos controles solo existen en la ruta local de desarrollo.</p></div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Escenario de auditoría">
                <ScenarioButton active={scenario === 'normal'} onClick={() => selectScenario('normal')}>Con datos</ScenarioButton>
                <ScenarioButton active={scenario === 'empty'} onClick={() => selectScenario('empty')}>Sin registros</ScenarioButton>
                <ScenarioButton active={scenario === 'error'} onClick={() => selectScenario('error')}>Error simulado</ScenarioButton>
              </div>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-[22px] border border-[#dce9e9] bg-white shadow-[0_20px_55px_-40px_#1E3A5F]" aria-labelledby="events-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5eeee] px-5 py-5 sm:px-7"><div><h2 id="events-title" className="text-lg font-bold text-[#173454]">Eventos registrados</h2><p className="mt-1 text-xs text-[#778c98]">Cambios de ejemplo en perfiles y centros de atención</p></div><span className="rounded-full bg-[#eef5f5] px-3 py-1.5 text-xs font-bold text-[#496779]">{status === 'ready' ? `${count} eventos` : 'Vista de ejemplo'}</span></div>
            <div role="status" aria-live="polite">
              {status === 'loading' && <div className="flex min-h-[270px] flex-col items-center justify-center gap-3 px-6 text-center"><span className="h-9 w-9 animate-spin rounded-full border-3 border-[#b8dfdc] border-t-[#0F8B8D]" aria-hidden="true" /><p className="text-sm font-semibold text-[#607685]">Cargando registros de ejemplo…</p></div>}
              {status === 'error' && <div className="flex min-h-[270px] flex-col items-center justify-center gap-4 px-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fef0ec] text-[#bd5e4c]"><Icon name="file" /></span><div><p className="font-bold text-[#173454]">No se pudieron cargar los registros</p><p className="mt-2 text-sm text-[#687e89]">Este fallo fue provocado para probar el estado de error.</p></div><button type="button" onClick={() => selectScenario('normal')} className="rounded-full bg-[#1E3A5F] px-5 py-2.5 text-sm font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]">Volver a cargar</button></div>}
              {status === 'ready' && result?.items.length === 0 && <div className="flex min-h-[270px] flex-col items-center justify-center gap-3 px-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7f6] text-[#0F8B8D]"><Icon name="file" /></span><p className="font-bold text-[#173454]">No hay eventos para mostrar</p><p className="max-w-[340px] text-sm leading-6 text-[#687e89]">Este estado aparece cuando la consulta devuelve una lista vacía.</p></div>}
              {status === 'ready' && result && result.items.length > 0 && <AuditResults items={result.items} />}
            </div>
            {status === 'ready' && count > 0 && <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e5eeee] px-5 py-5 sm:px-7"><p className="text-xs font-medium text-[#687e89]">Página {page + 1} de {pageCount} · {count} registros de ejemplo</p><div className="flex gap-2"><button type="button" onClick={() => { setStatus('loading'); setPage(page - 1) }} disabled={page === 0} className="rounded-full border border-[#cfe1e2] px-4 py-2 text-xs font-bold text-[#1E3A5F] enabled:hover:bg-[#eaf7f6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]">Anterior</button><button type="button" onClick={() => { setStatus('loading'); setPage(page + 1) }} disabled={page + 1 >= pageCount} className="rounded-full border border-[#cfe1e2] px-4 py-2 text-xs font-bold text-[#1E3A5F] enabled:hover:bg-[#eaf7f6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]">Siguiente</button></div></div>}
          </section>
          <p className="mt-6 max-w-[800px] text-xs leading-6 text-[#738994]">Todos los eventos de esta vista son inventados y permanecen en el navegador.</p>
        </main>
      </div>
    </>
  )
}

function ScenarioButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D] ${active ? 'bg-[#1E3A5F] text-white' : 'bg-[#eef5f5] text-[#4e6879] hover:bg-[#e0eeee]'}`}>{children}</button>
}

function AuditResults({ items }: { items: AuditEvent[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[850px] border-collapse text-left text-xs"><caption className="sr-only">Eventos ficticios de auditoría</caption><thead className="bg-[#f6fafa] text-[10px] font-bold uppercase tracking-[.12em] text-[#708894]"><tr><th className="px-6 py-4" scope="col">Fecha y hora</th><th className="px-5 py-4" scope="col">Actor</th><th className="px-5 py-4" scope="col">Acción / entidad</th><th className="px-5 py-4" scope="col">Campo</th><th className="px-5 py-4" scope="col">Anterior</th><th className="px-5 py-4" scope="col">Nuevo</th></tr></thead><tbody>{items.map((event) => <tr key={event.id} className="border-t border-[#ebf1f1] align-top text-[#4b6574]"><td className="whitespace-nowrap px-6 py-5 font-semibold text-[#284760]">{formatDate(event.ocurrioEn)}</td><td className="px-5 py-5">{event.actor}</td><td className="px-5 py-5"><span className="font-bold text-[#0F8B8D]">{event.accion}</span><br /><span className="mt-1 inline-block">{event.entidad}</span></td><td className="px-5 py-5">{displayValue(event.campo)}</td><td className="max-w-[155px] px-5 py-5 leading-5">{displayValue(event.valorAnterior)}</td><td className="max-w-[155px] px-5 py-5 leading-5">{displayValue(event.valorNuevo)}</td></tr>)}</tbody></table>
      </div>
      <div className="divide-y divide-[#e7eeee] md:hidden">{items.map((event) => <article key={event.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[10px] font-bold text-[#0F8B8D]">{event.accion}</span><time dateTime={event.ocurrioEn} className="text-[11px] font-semibold text-[#718895]">{formatDate(event.ocurrioEn)}</time></div><h3 className="mt-3 text-sm font-bold text-[#173454]">{event.entidad}</h3><dl className="mt-3 grid grid-cols-[105px_1fr] gap-y-2 text-xs leading-5"><dt className="font-semibold text-[#718895]">Actor</dt><dd className="break-all text-[#36536c]">{event.actor}</dd><dt className="font-semibold text-[#718895]">Campo</dt><dd className="break-words text-[#36536c]">{displayValue(event.campo)}</dd><dt className="font-semibold text-[#718895]">Anterior</dt><dd className="break-words text-[#36536c]">{displayValue(event.valorAnterior)}</dd><dt className="font-semibold text-[#718895]">Nuevo</dt><dd className="break-words text-[#36536c]">{displayValue(event.valorNuevo)}</dd></dl></article>)}</div>
    </>
  )
}
