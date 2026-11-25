import { Link } from 'react-router-dom'
import type { TriageResponse } from '../../data/api'
import { EmergencyAlert } from './EmergencyAlert'
import { TriageFallback } from './TriageFallback'

export type ChatMsg =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; text?: string; triage?: TriageResponse; error?: string }

const bubble = 'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6'
const manualLink = 'mt-3 inline-flex rounded-full border border-current px-4 py-2 text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-[#0F8B8D]'

/**
 * Una burbuja del chat. Solo muestra lo que el backend decidió (emergencia, fallback, especialidad y orientación):
 * el cliente no interpreta síntomas ni diagnostica. Los textos se renderizan como texto, nunca como HTML.
 */
export function ChatMessage({ message }: { message: ChatMsg }) {
  if (message.role === 'user') {
    return <li className="flex justify-end"><p className={`${bubble} whitespace-pre-wrap bg-[#1E3A5F] text-white`}><span className="sr-only">Tú: </span>{message.text}</p></li>
  }
  const { triage, error, text } = message
  return <li className="flex justify-start"><div className={`${bubble} border border-[#dce9e9] bg-white text-[#173454]`}>
    <span className="sr-only">Asistente: </span>
    {text && <p>{text}</p>}
    {error && <div role="alert"><p className="text-[#893f32]">{error}</p><Link to="/directorio" className={`${manualLink} text-[#0F8B8D]`}>Buscar manualmente</Link></div>}
    {triage?.emergencia && <EmergencyAlert orientacion={triage.orientacion} />}
    {triage && !triage.emergencia && triage.fallback && <TriageFallback orientacion={triage.orientacion} especialidad={triage.especialidad} />}
    {triage && !triage.emergencia && !triage.fallback && <div>
      {triage.orientacion && <p>{triage.orientacion}</p>}
      {triage.especialidad
        ? <><p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#0F8B8D]">Especialidad sugerida</p>
          <p className="text-base font-bold">{triage.especialidad.nombre}</p>
          <Link to={`/directorio?especialidadId=${triage.especialidad.id}`} className={`${manualLink} text-[#0F8B8D]`}>Ver médicos de {triage.especialidad.nombre}</Link></>
        : <><p className="mt-2 text-[#607785]">No pude sugerir una especialidad con esa descripción.</p><Link to="/directorio" className={`${manualLink} text-[#0F8B8D]`}>Buscar manualmente</Link></>}
    </div>}
  </div></li>
}
