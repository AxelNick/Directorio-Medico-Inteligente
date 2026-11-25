import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { service } from '../../data/service'
import { AppShell } from '../../components/AppShell'
import { DoctorReputationSummary } from '../../components/resenas/DoctorReputationSummary'
import { ReviewList } from '../../components/resenas/ReviewList'
import { useSession } from '../../session/SessionContext'

/**
 * Panel de reputación del médico autenticado (GET /api/v1/medicos/me/reputacion vía el cliente API compartido).
 * Es de solo lectura: muestra promedio, número de reseñas y comentarios visibles, sin acciones de edición.
 */
export function ReputacionPage() {
  const { session } = useSession()
  const token = session!.token
  const [summary, setSummary] = useState<{ promedio: number | null; total: number } | null>(null)

  // Una sola llamada alimenta el listado y el resumen: el promedio y el total llegan con cada página.
  const loadPage = useCallback(async (page: number, size: number) => {
    const result = await service.getMyReputation(token, page, size)
    setSummary({ promedio: result.promedio, total: result.total })
    return result
  }, [token])

  return <AppShell eyebrow="ÁREA MÉDICA" title="Tu reputación">
    <p className="mb-7 max-w-2xl text-sm leading-7 text-[#607785]">Promedio y opiniones que los pacientes dejaron sobre tu atención. Solo se cuentan las reseñas visibles; no puedes editarlas ni eliminarlas.</p>
    <p className="mb-6"><Link to="/medico" className="text-sm font-bold text-[#0F8B8D] underline underline-offset-4">Volver a mi perfil profesional</Link></p>
    {summary && <div className="mb-6"><DoctorReputationSummary promedio={summary.promedio} total={summary.total} /></div>}
    <section className="rounded-[22px] border border-[#dce9e9] bg-white p-6 shadow-sm" aria-labelledby="comments-title">
      <h2 id="comments-title" className="mb-4 text-xl font-bold text-[#173454]">Comentarios recibidos</h2>
      <ReviewList loadPage={loadPage} showSummary={false} emptyMessage="Todavía no has recibido opiniones visibles." />
    </section>
  </AppShell>
}
