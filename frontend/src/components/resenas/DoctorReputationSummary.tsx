import { StarRating, formatRating } from './StarRating'

/**
 * Resumen de reputación del médico: promedio general y número de reseñas visibles.
 * Solo lectura: el médico no puede editar ni alterar la puntuación recibida.
 */
export function DoctorReputationSummary({ promedio, total }: { promedio: number | null; total: number }) {
  const hasRating = promedio !== null && total > 0
  return <dl className="grid gap-4 sm:grid-cols-2">
    <div className="rounded-[22px] border border-[#dce9e9] bg-white p-6 shadow-sm">
      <dt className="text-xs font-bold uppercase tracking-[.12em] text-[#708894]">Promedio general</dt>
      <dd className="mt-3">
        {hasRating
          ? <><p className="flex items-baseline gap-2"><span className="text-5xl font-bold tracking-tight text-[#173454]">{formatRating(promedio)}</span><span className="text-sm font-semibold text-[#607785]">de 5</span></p>
            <StarRating value={promedio} className="mt-2 text-2xl" /></>
          : <><p className="text-5xl font-bold tracking-tight text-[#9fb3ba]" aria-hidden="true">—</p><p className="mt-2 text-sm text-[#607785]">Sin calificación todavía</p></>}
      </dd>
    </div>
    <div className="rounded-[22px] border border-[#dce9e9] bg-white p-6 shadow-sm">
      <dt className="text-xs font-bold uppercase tracking-[.12em] text-[#708894]">Reseñas recibidas</dt>
      <dd className="mt-3">
        <p className="text-5xl font-bold tracking-tight text-[#173454]">{total}</p>
        <p className="mt-2 text-sm text-[#607785]">{total === 1 ? 'opinión visible de un paciente' : 'opiniones visibles de pacientes'}</p>
      </dd>
    </div>
  </dl>
}
