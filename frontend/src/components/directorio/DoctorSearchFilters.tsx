import { useEffect, useState, type FormEvent } from 'react'
import type { Specialty } from '../../data/api'
import { fieldClass, primaryClass, secondaryClass } from '../AppShell'

/** Valores de los campos como texto: así se sincronizan tal cual con la URL (?nombre=Ana&especialidadId=2). */
export interface FilterValues {
  nombre: string
  especialidadId: string
  ciudad: string
  colegiatura: string
  calificacionMinima: string
}
export const emptyFilters: FilterValues = { nombre: '', especialidadId: '', ciudad: '', colegiatura: '', calificacionMinima: '' }

const RATING_OPTIONS = [
  { value: '', label: 'Cualquier calificación' },
  { value: '3', label: '3 estrellas o más' },
  { value: '4', label: '4 estrellas o más' },
  { value: '4.5', label: '4,5 estrellas o más' },
]

/**
 * Formulario de filtros. No filtra nada por su cuenta: al aplicar entrega los valores a la página, que los envía
 * al backend (la búsqueda se ejecuta en PostgreSQL, no en React).
 */
export function DoctorSearchFilters({ values, specialties, disabled = false, onApply, onClear }: {
  values: FilterValues
  specialties: Specialty[]
  disabled?: boolean
  onApply: (next: FilterValues) => void
  onClear: () => void
}) {
  const [draft, setDraft] = useState(values)
  useEffect(() => { setDraft(values) }, [values])
  const set = (key: keyof FilterValues) => (event: { target: { value: string } }) => setDraft({ ...draft, [key]: event.target.value })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply({ ...draft, nombre: draft.nombre.trim(), ciudad: draft.ciudad.trim(), colegiatura: draft.colegiatura.trim() })
  }

  return <form onSubmit={submit} className="rounded-[22px] border border-[#dce9e9] bg-white p-5 shadow-sm sm:p-6" aria-label="Filtros del directorio">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div><label htmlFor="f-nombre" className="mb-2 block text-sm font-bold">Nombre o apellido</label><input id="f-nombre" className={fieldClass} value={draft.nombre} onChange={set('nombre')} maxLength={80} autoComplete="off" /></div>
      <div><label htmlFor="f-especialidad" className="mb-2 block text-sm font-bold">Especialidad</label><select id="f-especialidad" className={fieldClass} value={draft.especialidadId} onChange={set('especialidadId')}>
        <option value="">Todas las especialidades</option>
        {specialties.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
      </select></div>
      <div><label htmlFor="f-ciudad" className="mb-2 block text-sm font-bold">Ciudad</label><input id="f-ciudad" className={fieldClass} value={draft.ciudad} onChange={set('ciudad')} maxLength={100} autoComplete="off" /></div>
      <div><label htmlFor="f-colegiatura" className="mb-2 block text-sm font-bold">Número de colegiatura</label><input id="f-colegiatura" className={fieldClass} value={draft.colegiatura} onChange={set('colegiatura')} maxLength={40} autoComplete="off" /></div>
      <div><label htmlFor="f-calificacion" className="mb-2 block text-sm font-bold">Calificación mínima</label><select id="f-calificacion" className={fieldClass} value={draft.calificacionMinima} onChange={set('calificacionMinima')}>
        {RATING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></div>
    </div>
    <div className="mt-5 flex flex-wrap gap-3">
      <button type="submit" className={primaryClass} disabled={disabled}>Aplicar filtros</button>
      <button type="button" className={secondaryClass} disabled={disabled} onClick={onClear}>Limpiar</button>
    </div>
  </form>
}
