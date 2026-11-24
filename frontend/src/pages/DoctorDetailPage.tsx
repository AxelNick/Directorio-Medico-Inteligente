import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, backendAssetUrl, type DoctorDetail } from '../data/api'
import { service, isDemoMode } from '../data/service'
import { AppShell, Notice, secondaryClass } from '../components/AppShell'
import { useSession } from '../session/SessionContext'
import { doctorInitials, doctorName } from '../components/directorio/doctorUtils'
import { StarRating, formatRating } from '../components/resenas/StarRating'
import { ReviewList } from '../components/resenas/ReviewList'
import { ReviewForm } from '../components/resenas/ReviewForm'

const card = 'rounded-[22px] border border-[#dce9e9] bg-white p-6 shadow-sm sm:p-8'

export function DoctorDetailPage() {
  const { id } = useParams()
  const medicoId = Number(id)
  const validId = Number.isInteger(medicoId) && medicoId > 0
  const { session, restoring } = useSession()
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [reviewsKey, setReviewsKey] = useState(0)

  useEffect(() => {
    if (!validId) { setStatus('missing'); return }
    let active = true
    setStatus('loading')
    service.getDoctorDetail(medicoId).then((data) => { if (active) { setDoctor(data); setStatus('ready') } })
      .catch((cause: unknown) => {
        if (!active) return
        if (cause instanceof ApiError && cause.status === 404) { setStatus('missing'); return }
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar la ficha.'); setStatus('error')
      })
    return () => { active = false }
  }, [medicoId, validId, attempt])

  const loadReviews = useCallback((page: number, size: number) => service.listReviews(medicoId, page, size), [medicoId])

  async function afterReview() {
    setReviewsKey((value) => value + 1)
    // Refresca el promedio de la cabecera; si falla, se actualizará en la próxima carga.
    try { setDoctor(await service.getDoctorDetail(medicoId)) } catch { /* sin cambios visibles */ }
  }

  const name = doctor ? doctorName(doctor) : 'Ficha del médico'
  return <AppShell eyebrow={isDemoMode ? 'FICHA PÚBLICA · DEMOSTRACIÓN' : 'FICHA PÚBLICA'} title={status === 'ready' ? name : 'Ficha del médico'}>
    <p className="mb-6"><Link to="/directorio" className="text-sm font-bold text-[#0F8B8D] underline underline-offset-4">← Volver al directorio</Link></p>
    {status === 'loading' && <Notice>Cargando ficha…</Notice>}
    {status === 'missing' && <div className="space-y-4"><Notice>Este perfil no está disponible o no es público.</Notice><Link to="/directorio" className={`inline-flex ${secondaryClass}`}>Ver el directorio</Link></div>}
    {status === 'error' && <div className="space-y-3"><Notice tone="error">{error}</Notice><button type="button" className={secondaryClass} onClick={() => setAttempt((value) => value + 1)}>Reintentar</button></div>}
    {status === 'ready' && doctor && <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-6">
        <section className={card} aria-labelledby="ficha-title">
          <div className="flex flex-wrap items-center gap-5">
            {doctor.fotoUrl
              ? <img src={backendAssetUrl(doctor.fotoUrl)} alt={`Fotografía de ${name}`} className="h-28 w-28 rounded-2xl object-cover" />
              : <span aria-hidden="true" className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[#dceeed] text-3xl font-bold text-[#54717a]">{doctorInitials(doctor)}</span>}
            <div>
              <h2 id="ficha-title" className="text-2xl font-bold text-[#173454]">{name}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span className="rounded-full bg-[#eaf7f6] px-3 py-1.5 text-xs font-bold text-[#087c7d]">CMP verificado</span><span className="text-[#68808b]">{doctor.colegiatura}</span></p>
              {doctor.promedioCalificacion != null && !!doctor.totalResenas && <p className="mt-2 flex items-center gap-2 text-sm text-[#4b6573]"><StarRating value={doctor.promedioCalificacion} className="text-lg" /><span>{formatRating(doctor.promedioCalificacion)} · {doctor.totalResenas} {doctor.totalResenas === 1 ? 'reseña' : 'reseñas'}</span></p>}
            </div>
          </div>
          {doctor.especialidades.length > 0 && <ul className="mt-5 flex flex-wrap gap-2" aria-label="Especialidades">{doctor.especialidades.map((item) => <li key={item.id} className="rounded-full border border-[#bcd6d8] px-3 py-1.5 text-xs font-bold text-[#1E3A5F]">{item.nombre}</li>)}</ul>}
          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-[#0F8B8D]">Acerca del profesional</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#47606e]">{doctor.biografia || 'El profesional todavía no agregó una biografía.'}</p>
          <p className="mt-4 text-sm text-[#47606e]"><strong className="text-[#173454]">Experiencia:</strong> {doctor.aniosExperiencia === null ? 'No indicada' : `${doctor.aniosExperiencia} ${doctor.aniosExperiencia === 1 ? 'año' : 'años'}`}</p>
        </section>
        <section className={card} aria-labelledby="centros-title">
          <h2 id="centros-title" className="text-xl font-bold text-[#173454]">Centros de atención</h2>
          {doctor.centros.length === 0 ? <p className="mt-4 rounded-xl bg-[#f2f8f8] p-4 text-sm text-[#617986]">Este profesional aún no publicó centros de atención.</p>
            : <ul className="mt-4 space-y-3">{doctor.centros.map((center) => <li key={center.id} className="rounded-xl border border-[#dce9e9] p-4"><h3 className="font-bold text-[#173454]">{center.nombre}</h3><p className="mt-1 text-sm text-[#68808b]">{center.direccion} · {center.ciudad}</p></li>)}</ul>}
        </section>
      </div>
      <div className="space-y-6">
        <section className={card} aria-labelledby="opiniones-title">
          <h2 id="opiniones-title" className="mb-4 text-xl font-bold text-[#173454]">Opiniones de pacientes</h2>
          <ReviewList key={reviewsKey} loadPage={loadReviews} />
        </section>
        <section className={card} aria-labelledby="calificar-title">
          <h2 id="calificar-title" className="mb-4 text-xl font-bold text-[#173454]">Deja tu opinión</h2>
          {restoring ? <Notice>Comprobando tu sesión…</Notice>
            : session?.rol === 'ROLE_PACIENTE' ? <ReviewForm token={session.token} medicoId={medicoId} onCreated={() => void afterReview()} />
              : session ? <Notice>Solo las cuentas de paciente pueden calificar a un médico.</Notice>
                : <Notice>Para opinar, <Link to="/ingresar" className="font-bold underline">ingresa como paciente</Link> o <Link to="/registro/paciente" className="font-bold underline">crea tu cuenta</Link>.</Notice>}
        </section>
      </div>
    </div>}
  </AppShell>
}
