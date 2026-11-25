import { useEffect, useId, useRef } from 'react'
import { primaryClass, secondaryClass } from '../AppShell'

const dangerClass = 'rounded-full bg-[#a93226] px-6 py-3 text-sm font-bold text-white hover:bg-[#8e281e] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]'

interface Props {
  open: boolean
  title: string
  /** Explicación de la consecuencia de la acción. */
  children: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** `danger` para acciones restrictivas: bloquear, suspender, ocultar. */
  tone?: 'default' | 'danger'
  /** Mientras la solicitud está en vuelo: bloquea los botones y el cierre con Escape. */
  busy?: boolean
  /** Mensaje del backend si la acción falló; el diálogo permanece abierto para reintentar. */
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmación modal para acciones administrativas. Usa <dialog> nativo: el navegador atrapa el foco,
 * cierra con Escape y devuelve el foco al control que lo abrió. El foco inicial queda en «Cancelar».
 */
export function ConfirmActionDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancelar', tone = 'default', busy = false, error, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return <dialog ref={ref} aria-labelledby={titleId} aria-describedby={bodyId}
    className="m-auto w-[min(92vw,460px)] rounded-[22px] border border-[#dce9e9] bg-white p-0 text-[#173454] shadow-[0_30px_80px_-30px_#1E3A5F] backdrop:bg-[#173454]/45"
    onCancel={(event) => { event.preventDefault(); if (!busy) onCancel() }}>
    {open && <div className="p-6 sm:p-7">
      <h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2>
      <div id={bodyId} className="mt-3 text-sm leading-6 text-[#55717d]">{children}</div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-[#f1c6bb] bg-[#fff4f1] px-4 py-3 text-sm leading-6 text-[#893f32]">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" autoFocus className={secondaryClass} disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className={tone === 'danger' ? dangerClass : primaryClass} disabled={busy} onClick={onConfirm}>{busy ? 'Procesando…' : confirmLabel}</button>
      </div>
    </div>}
  </dialog>
}
