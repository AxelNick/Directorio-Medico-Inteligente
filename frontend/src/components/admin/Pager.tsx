const buttonClass = 'rounded-full border border-[#cfe1e2] px-4 py-2 text-xs font-bold text-[#1E3A5F] enabled:hover:bg-[#eaf7f6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]'

/** Pie de paginación de las tablas admin. `page` es el índice desde 0 que entrega el backend. */
export function Pager({ page, size, total, noun, disabled = false, onPageChange }: {
  page: number; size: number; total: number
  /** Singular y plural del elemento listado, por ejemplo ['reseña', 'reseñas']. */
  noun: [string, string]
  disabled?: boolean
  onPageChange: (next: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / size))
  return <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e5eeee] px-5 py-5 sm:px-7">
    <p className="text-xs font-medium text-[#687e89]">Página {page + 1} de {pageCount} · {total} {total === 1 ? noun[0] : noun[1]}</p>
    <div className="flex gap-2">
      <button type="button" className={buttonClass} disabled={disabled || page === 0} onClick={() => onPageChange(page - 1)}>Anterior</button>
      <button type="button" className={buttonClass} disabled={disabled || page + 1 >= pageCount} onClick={() => onPageChange(page + 1)}>Siguiente</button>
    </div>
  </nav>
}
