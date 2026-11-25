import { useEffect, useState } from 'react'
import type { AdminReview, PageResponse, ReviewStatus } from '../../data/api'
import { service } from '../../data/service'
import { AdminSection } from '../../components/admin/AdminSection'
import { ConfirmActionDialog } from '../../components/admin/ConfirmActionDialog'
import { Pager } from '../../components/admin/Pager'
import { ReviewModerationTable } from '../../components/admin/ReviewModerationTable'
import { Notice, secondaryClass } from '../../components/AppShell'
import { useSession } from '../../session/SessionContext'

const PAGE_SIZE = 10
type Filter = ReviewStatus | 'TODAS'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'PENDIENTE_REVISION', label: 'Pendientes' },
  { value: 'VISIBLE', label: 'Visibles' },
  { value: 'OCULTA', label: 'Ocultas' },
  { value: 'TODAS', label: 'Todas' },
]
const EMPTY: Record<Filter, string> = {
  PENDIENTE_REVISION: 'No hay reseñas pendientes de revisión.',
  VISIBLE: 'No hay reseñas visibles.',
  OCULTA: 'No hay reseñas ocultas.',
  TODAS: 'Todavía no hay reseñas registradas.',
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: PageResponse<AdminReview> }

/**
 * Moderación de reseñas (GET y PATCH /api/v1/admin/resenas vía el cliente API compartido).
 * Ocultar una reseña la retira de la ficha pública y del promedio; ese cálculo lo hace el backend.
 */
export function ModeracionResenasPage() {
  const { session } = useSession()
  const token = session!.token
  const [query, setQuery] = useState<{ filter: Filter; page: number; attempt: number }>({ filter: 'PENDIENTE_REVISION', page: 0, attempt: 0 })
  const [state, setState] = useState<State>({ status: 'loading' })
  const [pending, setPending] = useState<{ review: AdminReview; estado: 'VISIBLE' | 'OCULTA' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    service.listAdminReviews(token, {
      estado: query.filter === 'TODAS' ? undefined : query.filter, page: query.page, size: PAGE_SIZE,
    }).then((data) => {
      if (active) setState({ status: 'ready', data })
    }).catch((cause: unknown) => {
      if (active) setState({ status: 'error', message: cause instanceof Error ? cause.message : 'No se pudieron cargar las reseñas.' })
    })
    return () => { active = false }
  }, [token, query])

  function load(next: Partial<{ filter: Filter; page: number }> = {}) {
    setState({ status: 'loading' })
    setQuery((current) => ({ ...current, ...next, attempt: current.attempt + 1 }))
  }

  function ask(review: AdminReview, estado: 'VISIBLE' | 'OCULTA') {
    setNotice(''); setDialogError(''); setPending({ review, estado })
  }

  async function confirm() {
    if (!pending) return
    setBusy(true); setDialogError('')
    try {
      await service.updateReviewStatus(token, pending.review.id, pending.estado)
      setNotice(pending.estado === 'OCULTA'
        ? 'Reseña ocultada: ya no se muestra en la ficha pública ni cuenta para el promedio.'
        : 'Reseña publicada: ahora se muestra en la ficha pública y cuenta para el promedio.')
      setPending(null)
      // Si era la última fila de la página, se retrocede una para no dejar la vista vacía.
      const wasLastRow = state.status === 'ready' && state.data.items.length === 1 && query.filter !== 'TODAS'
      load({ page: wasLastRow ? Math.max(0, query.page - 1) : query.page })
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado de la reseña.')
    } finally { setBusy(false) }
  }

  const hiding = pending?.estado === 'OCULTA'
  return <AdminSection title="Moderación de reseñas">
    <p className="mb-7 max-w-2xl text-sm leading-7 text-[#607785]">Revisa las opiniones de los pacientes. Una reseña oculta deja de mostrarse en la ficha del médico y no cuenta para su promedio.</p>
    {notice && <div className="mb-5"><Notice tone="success">{notice}</Notice></div>}
    <section className="overflow-hidden rounded-[22px] border border-[#dce9e9] bg-white shadow-sm" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5eeee] px-5 py-5 sm:px-7">
        <h2 id="reviews-title" className="text-lg font-bold text-[#173454]">Reseñas</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((filter) => <button key={filter.value} type="button" aria-pressed={query.filter === filter.value}
            className={`rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D] ${query.filter === filter.value ? 'bg-[#1E3A5F] text-white' : 'bg-[#eef5f5] text-[#4e6879] hover:bg-[#e0eeee]'}`}
            onClick={() => { setNotice(''); load({ filter: filter.value, page: 0 }) }}>{filter.label}</button>)}
        </div>
      </div>
      <div aria-live="polite">
        {state.status === 'loading' && <div role="status" className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center"><span className="h-9 w-9 animate-spin rounded-full border-3 border-[#b8dfdc] border-t-[#0F8B8D]" aria-hidden="true" /><p className="text-sm font-semibold text-[#607685]">Cargando reseñas…</p></div>}
        {state.status === 'error' && <div role="alert" className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center"><div><p className="font-bold text-[#173454]">No se pudieron cargar las reseñas</p><p className="mt-2 text-sm text-[#893f32]">{state.message}</p></div><button type="button" className={secondaryClass} onClick={() => load()}>Reintentar</button></div>}
        {state.status === 'ready' && state.data.items.length === 0 && <p className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm font-semibold text-[#607685]">{EMPTY[query.filter]}</p>}
        {state.status === 'ready' && state.data.items.length > 0 && <ReviewModerationTable items={state.data.items} disabled={busy}
          onHide={(review) => ask(review, 'OCULTA')} onPublish={(review) => ask(review, 'VISIBLE')} />}
      </div>
      {state.status === 'ready' && state.data.total > 0 && <Pager page={query.page} size={PAGE_SIZE} total={state.data.total} noun={['reseña', 'reseñas']} onPageChange={(page) => load({ page })} />}
    </section>

    <ConfirmActionDialog open={pending !== null} title={hiding ? '¿Ocultar esta reseña?' : '¿Publicar esta reseña?'}
      confirmLabel={hiding ? 'Ocultar reseña' : 'Publicar reseña'} tone={hiding ? 'danger' : 'default'} busy={busy} error={dialogError}
      onConfirm={() => void confirm()} onCancel={() => setPending(null)}>
      {pending && <>
        <p>{hiding
          ? 'Dejará de mostrarse en la ficha pública del médico y no contará para su promedio.'
          : 'Se mostrará en la ficha pública del médico y contará para su promedio.'}</p>
        <p className="mt-2">Reseña de <strong className="text-[#173454]">{pending.review.puntuacion} de 5</strong> para <strong className="text-[#173454]">{pending.review.medicoNombre}</strong>.</p>
      </>}
    </ConfirmActionDialog>
  </AdminSection>
}
