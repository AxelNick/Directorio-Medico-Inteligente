import { Link } from 'react-router-dom'
import { backendAssetUrl, type DoctorSummary } from '../../data/api'
import { StarRating, formatRating } from '../resenas/StarRating'
import { doctorInitials, doctorName } from './doctorUtils'

/** Tarjeta pública: solo datos que el backend autoriza publicar (sin correo ni datos de la cuenta). */
export function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  const name = doctorName(doctor)
  const hasRatingData = doctor.totalResenas !== undefined
  return <article className="flex w-full flex-col rounded-[22px] border border-[#dce9e9] bg-white p-5 shadow-sm">
    <div className="flex items-center gap-4">
      {doctor.fotoUrl
        ? <img src={backendAssetUrl(doctor.fotoUrl)} alt={`Fotografía de ${name}`} className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
        : <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#dceeed] text-lg font-bold text-[#54717a]">{doctorInitials(doctor)}</span>}
      <div className="min-w-0">
        <h3 className="text-lg font-bold leading-tight text-[#173454]">{name}</h3>
        <p className="mt-1 text-sm text-[#54717a]">{doctor.especialidades.length ? doctor.especialidades.map((item) => item.nombre).join(' · ') : 'Especialidad por confirmar'}</p>
      </div>
    </div>
    <p className="mt-4 flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full bg-[#eaf7f6] px-3 py-1.5 font-bold text-[#087c7d]">CMP verificado</span>
      <span className="text-[#68808b]">{doctor.colegiatura}</span>
    </p>
    {hasRatingData && <p className="mt-3 flex items-center gap-2 text-sm text-[#4b6573]">
      {doctor.promedioCalificacion != null && doctor.totalResenas
        ? <><StarRating value={doctor.promedioCalificacion} className="text-base" /><span>{formatRating(doctor.promedioCalificacion)} · {doctor.totalResenas} {doctor.totalResenas === 1 ? 'reseña' : 'reseñas'}</span></>
        : <span className="text-[#78909a]">Sin reseñas todavía</span>}
    </p>}
    {doctor.ciudades.length > 0 && <p className="mt-3 text-sm text-[#68808b]">{doctor.ciudades.join(' · ')}</p>}
    <Link to={`/directorio/medico/${doctor.id}`} className="mt-5 inline-flex w-fit items-center rounded-full border border-[#bcd6d8] px-5 py-2.5 text-sm font-bold text-[#1E3A5F] hover:bg-[#eaf7f6] focus-visible:outline-3 focus-visible:outline-[#0F8B8D]" aria-label={`Ver perfil de ${name}`}>Ver perfil</Link>
  </article>
}
