import type { DoctorSummary } from '../../data/api'
import { Notice, secondaryClass } from '../AppShell'
import { DoctorCard } from './DoctorCard'

/** Estados de la lista: cargando, error con reintento, sin resultados y resultados. */
export function DoctorResults({ status, items, error, onRetry, onClear }: {
  status: 'loading' | 'ready' | 'error'
  items: DoctorSummary[]
  error: string
  onRetry: () => void
  onClear: () => void
}) {
  if (status === 'loading') return <Notice>Buscando médicos…</Notice>
  if (status === 'error') return <div className="space-y-3"><Notice tone="error">{error}</Notice><button type="button" className={secondaryClass} onClick={onRetry}>Reintentar</button></div>
  if (items.length === 0) return <div className="rounded-[22px] border border-dashed border-[#bcd6d8] bg-white p-8 text-center">
    <p className="font-bold text-[#173454]">No encontramos médicos con esos filtros.</p>
    <p className="mt-2 text-sm text-[#607785]">Prueba con menos filtros o una calificación mínima menor.</p>
    <button type="button" className={`mt-5 ${secondaryClass}`} onClick={onClear}>Limpiar filtros</button>
  </div>
  return <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((doctor) => <li key={doctor.id} className="flex"><DoctorCard doctor={doctor} /></li>)}</ul>
}
