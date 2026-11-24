import { useEffect, useState } from 'react'
import type { ReviewPage } from '../../data/api'
import { Notice, secondaryClass } from '../AppShell'
import { StarRating, formatRating } from './StarRating'

const dateFormat = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'long', year: 'numeric' })
const formatDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date) }

/**
 * Listado paginado de reseñas visibles con promedio y total. Es reutilizable: recibe cómo cargar cada página
 * (`loadPage`, estable con useCallback). Para recargar desde cero (por ejemplo tras publicar una reseña) el
 * padre cambia la prop `key`.
 */
export function ReviewList({ loadPage, pageSize = 5, emptyMessage = 'Todavía no hay opiniones visibles.' }: {
  loadPage: (page: number, size: number) => Promise<ReviewPage>
  pageSize?: number
  emptyMessage?: string
}) {
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [data, setData] = useState<ReviewPage | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setStatus('loading')
    loadPage(page, pageSize).then((result) => {
      if (active) { setData(result); setStatus('ready') }
    }).catch((cause: unknown) => {
      if (active) { setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las opiniones.'); setStatus('error') }
    })
    return () => { active = false }
  }, [loadPage, page, pageSize, attempt])

  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1
  return <div aria-live="polite">
    {status === 'loading' && <Notice>Cargando opiniones…</Notice>}
    {status === 'error' && <div className="space-y-3"><Notice tone="error">{error}</Notice><button type="button" className={secondaryClass} onClick={() => setAttempt((value) => value + 1)}>Reintentar</button></div>}
    {status === 'ready' && data && <>
      <p className="flex flex-wrap items-center gap-3 text-sm text-[#4b6573]">
        {data.promedio !== null && data.total > 0
          ? <><StarRating value={data.promedio} className="text-xl" /><span><strong className="text-[#173454]">{formatRating(data.promedio)}</strong> de 5 · {data.total} {data.total === 1 ? 'opinión' : 'opiniones'}</span></>
          : <span>Sin calificación todavía</span>}
      </p>
      {data.items.length === 0 ? <p className="mt-4 rounded-xl bg-[#f2f8f8] p-4 text-sm text-[#617986]">{emptyMessage}</p>
        : <ul className="mt-4 space-y-3">{data.items.map((review) => <li key={review.id} className="rounded-xl border border-[#dce9e9] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><StarRating value={review.puntuacion} className="text-lg" /><time dateTime={review.fechaCreacion} className="text-xs text-[#78909a]">{formatDate(review.fechaCreacion)}</time></div>
          {review.comentario ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#2f4a5d]">{review.comentario}</p> : <p className="mt-2 text-sm italic text-[#78909a]">Sin comentario.</p>}
        </li>)}</ul>}
      {data.total > data.size && <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginación de opiniones">
        <button type="button" className={secondaryClass} disabled={page === 0} onClick={() => setPage(page - 1)}>Anteriores</button>
        <span className="text-xs text-[#687e89]">Página {page + 1} de {pageCount}</span>
        <button type="button" className={secondaryClass} disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Siguientes</button>
      </nav>}
    </>}
  </div>
}
