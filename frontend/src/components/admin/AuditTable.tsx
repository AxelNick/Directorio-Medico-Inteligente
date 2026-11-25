import type { AuditEvent } from '../../data/audit'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

function displayValue(value: string | null) {
  return value ?? '—'
}

/** Tabla (escritorio) y tarjetas (móvil) de eventos de auditoría. Los valores se muestran como texto, nunca como HTML. */
export function AuditTable({ items, caption }: { items: AuditEvent[]; caption: string }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[850px] border-collapse text-left text-xs"><caption className="sr-only">{caption}</caption><thead className="bg-[#f6fafa] text-[10px] font-bold uppercase tracking-[.12em] text-[#708894]"><tr><th className="px-6 py-4" scope="col">Fecha y hora</th><th className="px-5 py-4" scope="col">Actor</th><th className="px-5 py-4" scope="col">Acción / entidad</th><th className="px-5 py-4" scope="col">Campo</th><th className="px-5 py-4" scope="col">Anterior</th><th className="px-5 py-4" scope="col">Nuevo</th></tr></thead><tbody>{items.map((event) => <tr key={event.id} className="border-t border-[#ebf1f1] align-top text-[#4b6574]"><td className="whitespace-nowrap px-6 py-5 font-semibold text-[#284760]">{formatDate(event.ocurrioEn)}</td><td className="px-5 py-5">{event.actor}</td><td className="px-5 py-5"><span className="font-bold text-[#0F8B8D]">{event.accion}</span><br /><span className="mt-1 inline-block">{event.entidad}</span></td><td className="px-5 py-5">{displayValue(event.campo)}</td><td className="max-w-[155px] break-words px-5 py-5 leading-5">{displayValue(event.valorAnterior)}</td><td className="max-w-[155px] break-words px-5 py-5 leading-5">{displayValue(event.valorNuevo)}</td></tr>)}</tbody></table>
      </div>
      <div className="divide-y divide-[#e7eeee] md:hidden">{items.map((event) => <article key={event.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[10px] font-bold text-[#0F8B8D]">{event.accion}</span><time dateTime={event.ocurrioEn} className="text-[11px] font-semibold text-[#718895]">{formatDate(event.ocurrioEn)}</time></div><h3 className="mt-3 text-sm font-bold text-[#173454]">{event.entidad}</h3><dl className="mt-3 grid grid-cols-[105px_1fr] gap-y-2 text-xs leading-5"><dt className="font-semibold text-[#718895]">Actor</dt><dd className="break-all text-[#36536c]">{event.actor}</dd><dt className="font-semibold text-[#718895]">Campo</dt><dd className="break-words text-[#36536c]">{displayValue(event.campo)}</dd><dt className="font-semibold text-[#718895]">Anterior</dt><dd className="break-words text-[#36536c]">{displayValue(event.valorAnterior)}</dd><dt className="font-semibold text-[#718895]">Nuevo</dt><dd className="break-words text-[#36536c]">{displayValue(event.valorNuevo)}</dd></dl></article>)}</div>
    </>
  )
}
