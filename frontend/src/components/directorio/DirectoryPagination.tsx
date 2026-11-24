import { secondaryClass } from '../AppShell'

/** Paginación de la lista. `page` es el índice desde 0 que entrega el backend. */
export function DirectoryPagination({ page, size, total, disabled = false, onPageChange }: {
  page: number; size: number; total: number; disabled?: boolean; onPageChange: (next: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / size))
  if (total <= size) return null
  return <nav className="mt-8 flex flex-wrap items-center justify-between gap-3" aria-label="Paginación del directorio">
    <button type="button" className={secondaryClass} disabled={disabled || page === 0} onClick={() => onPageChange(page - 1)}>Anterior</button>
    <span className="text-sm text-[#607785]">Página {page + 1} de {pageCount} · {total} médicos</span>
    <button type="button" className={secondaryClass} disabled={disabled || page + 1 >= pageCount} onClick={() => onPageChange(page + 1)}>Siguiente</button>
  </nav>
}
