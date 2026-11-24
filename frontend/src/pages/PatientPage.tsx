import { Link } from 'react-router-dom'
import { AppShell, Notice, secondaryClass } from '../components/AppShell'
import { useSession } from '../session/SessionContext'
import { isDemoMode } from '../data/service'

export function PatientPage() {
  const { session } = useSession()
  return <AppShell eyebrow={isDemoMode ? 'ÁREA DEL PACIENTE · DEMOSTRACIÓN' : 'ÁREA DEL PACIENTE'} title="Mi espacio de paciente">
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-[24px] border border-[#dce9e9] bg-white p-6 shadow-sm sm:p-9">
        <h2 className="text-xl font-bold text-[#173454]">Bienvenido a tu espacio</h2>
        <p className="mt-3 text-sm leading-7 text-[#607785]">Sesión activa de {session?.username}. Busca médicos verificados, consulta al asistente de orientación y deja tu opinión en la ficha de quien te atendió.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={`inline-flex ${secondaryClass}`} to="/directorio">Buscar en el directorio</Link>
          <Link className={`inline-flex ${secondaryClass}`} to="/asistente">Hablar con el asistente</Link>
        </div>
      </section>
      <section className="rounded-[24px] border border-[#dce9e9] bg-white p-6 shadow-sm sm:p-9">
        <h2 className="text-xl font-bold text-[#173454]">Mi historia clínica</h2>
        <p className="mt-3 text-sm leading-7 text-[#607785]">La historia clínica estará disponible en una etapa posterior. Un paciente recién registrado empieza sin historia en la aplicación.</p>
      </section>
    </div>
    <div className="mt-6"><Notice>{isDemoMode ? 'Este espacio usa una cuenta ficticia local. ' : ''}Las citas, el contacto y la historia clínica se incorporarán en etapas posteriores.</Notice></div>
  </AppShell>
}
