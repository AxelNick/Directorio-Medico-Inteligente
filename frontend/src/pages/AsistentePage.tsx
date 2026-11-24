import { Link } from 'react-router-dom'
import { AppShell, Notice } from '../components/AppShell'
import { AsistenteChat } from '../components/asistente/AsistenteChat'
import { isDemoMode } from '../data/service'

export function AsistentePage() {
  return <AppShell eyebrow={isDemoMode ? 'ASISTENTE · DEMOSTRACIÓN' : 'ASISTENTE'} title="Asistente de orientación">
    <p className="mb-5 max-w-2xl text-sm leading-7 text-[#607785]">Describe tus molestias y el asistente te sugerirá una especialidad para buscar en el directorio. Es una orientación operativa: no reemplaza una consulta médica.</p>
    <div className="mx-auto max-w-3xl space-y-5">
      {isDemoMode && <Notice>En el entorno de prueba las respuestas son simuladas. Escribe «simular caída» para ver el aviso de asistente no disponible.</Notice>}
      <AsistenteChat />
      <p className="text-sm text-[#607785]">¿Prefieres buscar por tu cuenta? <Link to="/directorio" className="font-bold text-[#0F8B8D] underline underline-offset-4">Ir al directorio</Link></p>
    </div>
  </AppShell>
}
