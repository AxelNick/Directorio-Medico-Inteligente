import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { DoctorSummary, PageResponse, Specialty } from '../data/api'
import { service, isDemoMode } from '../data/service'
import { AppShell, Notice } from '../components/AppShell'
import { DoctorSearchFilters, emptyFilters, type FilterValues } from '../components/directorio/DoctorSearchFilters'
import { DoctorResults } from '../components/directorio/DoctorResults'
import { DirectoryPagination } from '../components/directorio/DirectoryPagination'

const PAGE_SIZE = 9
const FILTER_KEYS = Object.keys(emptyFilters) as Array<keyof FilterValues>

/** Los filtros viven en la URL (?especialidadId=2&pagina=2): se pueden compartir y el asistente enlaza con ellos. */
function filtersFromParams(params: URLSearchParams): FilterValues {
  const values = { ...emptyFilters }
  for (const key of FILTER_KEYS) values[key] = params.get(key) ?? ''
  return values
}
function pageFromParams(params: URLSearchParams) {
  const value = Number(params.get('pagina'))
  return Number.isInteger(value) && value >= 1 ? value - 1 : 0
}
function buildParams(values: FilterValues, page: number) {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) if (values[key] !== '') params.set(key, values[key])
  if (page > 0) params.set('pagina', String(page + 1))
  return params
}
const toId = (value: string) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : undefined }
const toRating = (value: string) => { const n = Number(value); return value !== '' && Number.isFinite(n) && n >= 0 && n <= 5 ? n : undefined }

export function DirectoryPage() {
  const [params, setParams] = useSearchParams()
  const searchKey = params.toString()
  const applied = useMemo(() => filtersFromParams(new URLSearchParams(searchKey)), [searchKey])
  const page = useMemo(() => pageFromParams(new URLSearchParams(searchKey)), [searchKey])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [catalogError, setCatalogError] = useState(false)
  const [result, setResult] = useState<PageResponse<DoctorSummary> | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    service.listSpecialties().then((items) => { if (active) setSpecialties(items.filter((item) => item.habilitada)) })
      .catch(() => { if (active) setCatalogError(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setStatus('loading')
    // La búsqueda y el promedio los calcula el backend; aquí solo se serializan los filtros.
    service.searchDoctors({
      nombre: applied.nombre, especialidadId: toId(applied.especialidadId), ciudad: applied.ciudad,
      colegiatura: applied.colegiatura, calificacionMinima: toRating(applied.calificacionMinima), page, size: PAGE_SIZE,
    }).then((data) => { if (active) { setResult(data); setStatus('ready') } })
      .catch((cause: unknown) => {
        if (active) { setError(cause instanceof Error ? cause.message : 'No se pudo consultar el directorio.'); setStatus('error') }
      })
    return () => { active = false }
  }, [applied, page, attempt])

  const clear = () => setParams(new URLSearchParams())
  return <AppShell eyebrow={isDemoMode ? 'DIRECTORIO PÚBLICO · DEMOSTRACIÓN' : 'DIRECTORIO PÚBLICO'} title="Encuentra a tu especialista">
    <p className="mb-3 max-w-2xl text-sm leading-7 text-[#607785]">Se muestran profesionales con perfil aprobado y colegiatura verificada. Combina los filtros para acotar la búsqueda.</p>
    <p className="mb-7 text-sm"><Link to="/asistente" className="font-bold text-[#0F8B8D] underline underline-offset-4">¿No sabes qué especialidad buscar? Prueba el asistente.</Link></p>
    {catalogError && <div className="mb-4"><Notice tone="error">No se pudo cargar el catálogo de especialidades; puedes seguir buscando por los demás filtros.</Notice></div>}
    <DoctorSearchFilters values={applied} specialties={specialties} disabled={status === 'loading'} onApply={(next) => setParams(buildParams(next, 0))} onClear={clear} />
    <section id="resultados" className="mt-8" aria-label="Resultados de la búsqueda" aria-live="polite">
      {status === 'ready' && result && <p className="mb-4 text-sm font-semibold text-[#4b6573]">{result.total} {result.total === 1 ? 'médico encontrado' : 'médicos encontrados'}</p>}
      <DoctorResults status={status} items={result?.items ?? []} error={error} onRetry={() => setAttempt((value) => value + 1)} onClear={clear} />
      {status === 'ready' && result && <DirectoryPagination page={result.page} size={result.size} total={result.total}
        onPageChange={(next) => { setParams(buildParams(applied, next)); window.scrollTo({ top: 0 }) }} />}
    </section>
  </AppShell>
}
