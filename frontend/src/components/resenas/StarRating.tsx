import { useRef } from 'react'

const formatter = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
export const formatRating = (value: number) => formatter.format(value)

/** Estrellas de solo lectura. Admite promedios decimales (por ejemplo 4,6) rellenando la fracción. */
export function StarRating({ value, className = '' }: { value: number; className?: string }) {
  const clamped = Math.min(5, Math.max(0, value))
  return <span role="img" aria-label={`${formatRating(clamped)} de 5 estrellas`} className={`relative inline-block whitespace-nowrap leading-none ${className}`}>
    <span aria-hidden="true" className="text-[#d3dfe1]">★★★★★</span>
    <span aria-hidden="true" className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-[#e0a526]" style={{ width: `${(clamped / 5) * 100}%` }}>★★★★★</span>
  </span>
}

/** Selector accesible de 1 a 5 estrellas (grupo de opciones con flechas del teclado). */
export function StarRatingInput({ value, onChange, disabled = false, labelledBy }: {
  value: number; onChange: (next: number) => void; disabled?: boolean; labelledBy: string
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  function move(next: number) {
    const target = Math.min(5, Math.max(1, next))
    onChange(target)
    buttons.current[target - 1]?.focus()
  }
  return <div role="radiogroup" aria-labelledby={labelledBy} className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => <button
      key={star} type="button" role="radio" aria-checked={value === star} aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
      ref={(element) => { buttons.current[star - 1] = element }} disabled={disabled}
      tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
      className={`rounded-md px-1 text-3xl leading-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D] disabled:opacity-50 ${star <= value ? 'text-[#e0a526]' : 'text-[#c7d6d8] hover:text-[#e0a526]'}`}
      onClick={() => onChange(star)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); move((value || 0) + 1) }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); move((value || 2) - 1) }
      }}
    ><span aria-hidden="true">★</span></button>)}
  </div>
}
