import { useState, type FormEvent } from 'react'
import { ApiError } from '../../data/api'
import { service } from '../../data/service'
import { Notice, fieldClass, primaryClass } from '../AppShell'
import { StarRatingInput } from './StarRating'

const MAX_COMMENT = 500

/**
 * Formulario de reseña del paciente autenticado. La validación local solo ayuda a la persona: el servidor
 * siempre valida (400) y es quien garantiza una única reseña por paciente y médico (409).
 */
export function ReviewForm({ token, medicoId, onCreated }: { token: string; medicoId: number; onCreated: () => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState<'created' | 'duplicate' | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (rating < 1) { setError('Elige una puntuación de 1 a 5 estrellas.'); return }
    setBusy(true); setError('')
    try {
      await service.createReview(token, medicoId, { puntuacion: rating, comentario: comment.trim() })
      setOutcome('created'); setRating(0); setComment('')
      onCreated()
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) setOutcome('duplicate')
      else if (cause instanceof ApiError && cause.status === 401) setError('Tu sesión venció. Vuelve a ingresar para dejar tu opinión.')
      else setError(cause instanceof Error ? cause.message : 'No se pudo enviar tu opinión.')
    } finally { setBusy(false) }
  }

  if (outcome === 'created') return <Notice tone="success">Gracias: tu reseña se registró correctamente.</Notice>
  if (outcome === 'duplicate') return <Notice>Ya calificaste a este médico. Solo se permite una reseña por paciente.</Notice>
  return <form className="space-y-4" onSubmit={submit} noValidate>
    <div><p id={`rating-label-${medicoId}`} className="mb-2 text-sm font-bold">Tu puntuación</p><StarRatingInput value={rating} onChange={setRating} disabled={busy} labelledBy={`rating-label-${medicoId}`} /></div>
    <div><label htmlFor={`review-comment-${medicoId}`} className="mb-2 block text-sm font-bold">Comentario (opcional)</label>
      <textarea id={`review-comment-${medicoId}`} className={`${fieldClass} min-h-28`} value={comment} maxLength={MAX_COMMENT} disabled={busy} onChange={(event) => setComment(event.target.value)} />
      <p className="mt-1 text-right text-xs text-[#78909a]">{comment.length}/{MAX_COMMENT}</p></div>
    {error && <Notice tone="error">{error}</Notice>}
    <button type="submit" className={primaryClass} disabled={busy}>{busy ? 'Enviando…' : 'Enviar opinión'}</button>
  </form>
}
