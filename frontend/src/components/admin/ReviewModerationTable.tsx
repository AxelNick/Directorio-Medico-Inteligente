import type { AdminReview, ReviewStatus } from '../../data/api'
import { StarRating } from '../resenas/StarRating'
import { ModerationTable, rowActionClass, rowDangerActionClass, type ModerationColumn } from './ModerationTable'
import { StatusBadge, type BadgeTone } from './UserStatusBadge'

const STATUS: Record<ReviewStatus, { label: string; tone: BadgeTone }> = {
  PENDIENTE_REVISION: { label: 'Pendiente', tone: 'warning' },
  VISIBLE: { label: 'Visible', tone: 'positive' },
  OCULTA: { label: 'Oculta', tone: 'negative' },
}

const dateFormat = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric' })
function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date)
}

const columns: ModerationColumn<AdminReview>[] = [
  { id: 'medico', header: 'Médico', cell: (review) => review.medicoNombre },
  { id: 'paciente', header: 'Paciente', cell: (review) => review.paciente },
  { id: 'puntuacion', header: 'Puntuación', cell: (review) => <StarRating value={review.puntuacion} className="text-base" /> },
  {
    id: 'comentario', header: 'Comentario',
    // El comentario se muestra como texto: nunca se interpreta como HTML.
    cell: (review) => review.comentario
      ? <span className="block max-w-[320px] whitespace-pre-line break-words">{review.comentario}</span>
      : <span className="italic text-[#78909a]">Sin comentario</span>,
  },
  { id: 'fecha', header: 'Fecha', cell: (review) => <time dateTime={review.fechaCreacion} className="whitespace-nowrap">{formatDate(review.fechaCreacion)}</time> },
  { id: 'estado', header: 'Estado', cell: (review) => <StatusBadge tone={STATUS[review.estado].tone}>{STATUS[review.estado].label}</StatusBadge> },
]

/** Tabla de moderación de reseñas. Las acciones solo avisan al padre, que confirma y llama al backend. */
export function ReviewModerationTable({ items, disabled = false, onHide, onPublish }: {
  items: AdminReview[]
  disabled?: boolean
  onHide: (review: AdminReview) => void
  onPublish: (review: AdminReview) => void
}) {
  return <ModerationTable caption="Reseñas para moderación" columns={columns} rows={items} rowKey={(review) => review.id}
    actions={(review) => <>
      {review.estado !== 'VISIBLE' && <button type="button" className={rowActionClass} disabled={disabled} onClick={() => onPublish(review)}>Publicar</button>}
      {review.estado !== 'OCULTA' && <button type="button" className={rowDangerActionClass} disabled={disabled} onClick={() => onHide(review)}>Ocultar</button>}
    </>} />
}
