export interface ModerationColumn<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
}

interface Props<T> {
  /** Descripción de la tabla para lectores de pantalla. */
  caption: string
  columns: ModerationColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  /** Botones de acción de la fila (aprobar, suspender, bloquear…). Si se omite no hay columna de acciones. */
  actions?: (row: T) => React.ReactNode
}

/**
 * Tabla genérica de los paneles de moderación (médicos, usuarios, reseñas): tabla en escritorio y tarjetas en móvil.
 * Solo presenta filas ya cargadas; la paginación, los filtros y las llamadas al backend viven en cada página.
 */
export function ModerationTable<T>({ caption, columns, rows, rowKey, actions }: Props<T>) {
  const [first, ...rest] = columns
  return <>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#f6fafa] text-[10px] font-bold uppercase tracking-[.12em] text-[#708894]"><tr>
          {columns.map((column) => <th key={column.id} scope="col" className="px-5 py-4 first:pl-6">{column.header}</th>)}
          {actions && <th scope="col" className="px-5 py-4 pr-6 text-right">Acciones</th>}
        </tr></thead>
        <tbody>{rows.map((row) => <tr key={rowKey(row)} className="border-t border-[#ebf1f1] align-top text-[#4b6574]">
          {columns.map((column, index) => index === 0
            ? <th key={column.id} scope="row" className="px-5 py-5 pl-6 text-left font-bold text-[#173454]">{column.cell(row)}</th>
            : <td key={column.id} className="px-5 py-5">{column.cell(row)}</td>)}
          {actions && <td className="px-5 py-5 pr-6"><div className="flex flex-wrap justify-end gap-2">{actions(row)}</div></td>}
        </tr>)}</tbody>
      </table>
    </div>
    <ul className="divide-y divide-[#e7eeee] md:hidden" aria-label={caption}>{rows.map((row) => <li key={rowKey(row)} className="p-5">
      {first && <p className="text-sm font-bold text-[#173454]">{first.cell(row)}</p>}
      <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-2 text-xs leading-5">{rest.map((column) => <div key={column.id} className="contents">
        <dt className="font-semibold text-[#718895]">{column.header}</dt><dd className="break-words text-[#36536c]">{column.cell(row)}</dd>
      </div>)}</dl>
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions(row)}</div>}
    </li>)}</ul>
  </>
}

/** Estilo de los botones de acción dentro de una fila. */
export const rowActionClass = 'rounded-full border border-[#cfe1e2] px-3.5 py-1.5 text-xs font-bold text-[#1E3A5F] enabled:hover:bg-[#eaf7f6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]'
export const rowDangerActionClass = 'rounded-full border border-[#e6b8b1] px-3.5 py-1.5 text-xs font-bold text-[#8e281e] enabled:hover:bg-[#fdecea] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-[#0F8B8D]'
