/**
 * Alerta prioritaria cuando el backend responde `emergencia: true`. La interfaz no decide si hay una emergencia:
 * solo muestra el indicador recibido y nunca lo acompaña de una sugerencia ordinaria de especialidad.
 */
export function EmergencyAlert({ orientacion }: { orientacion: string | null }) {
  return <div role="alert" className="rounded-xl border-2 border-[#c0392b] bg-[#fdecea] p-4 text-[#7b1e14]">
    <p className="flex items-start gap-2 text-base font-bold leading-6">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><path d="M12 17.5v.01" /></svg>
      Posible emergencia: busca atención de urgencia ahora.
    </p>
    {orientacion && <p className="mt-2">{orientacion}</p>}
    <p className="mt-2 text-xs font-semibold">Este asistente no reemplaza la atención médica de urgencia.</p>
  </div>
}
