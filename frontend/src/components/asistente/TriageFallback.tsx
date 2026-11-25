import { Link } from 'react-router-dom'
import type { SpecialtyRef } from '../../data/api'

/**
 * Aviso cuando el backend responde `fallback: true`: el asistente no está disponible y se ofrece la búsqueda manual.
 * Si el backend entregó una especialidad sugerida válida, el enlace la conserva como filtro del directorio.
 */
export function TriageFallback({ orientacion, especialidad }: { orientacion: string | null; especialidad: SpecialtyRef | null }) {
  const valid = especialidad !== null && Number.isInteger(especialidad.id) && especialidad.id > 0
  return <div role="status" className="rounded-xl border border-[#ecd29a] bg-[#fff8e6] p-4 text-[#6b4b00]">
    <p className="font-bold">El asistente no está disponible en este momento.</p>
    {orientacion && <p className="mt-1">{orientacion}</p>}
    {valid && <p className="mt-1">El directorio se abrirá filtrado por <span className="font-bold">{especialidad.nombre}</span>.</p>}
    <Link to={valid ? `/directorio?especialidadId=${especialidad.id}` : '/directorio'}
      className="mt-3 inline-flex rounded-full border border-current px-4 py-2 text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-[#0F8B8D]">
      Buscar manualmente
    </Link>
  </div>
}
