import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { service, isDemoMode } from '../data/service'
import { AppShell, Notice, fieldClass, primaryClass } from '../components/AppShell'
import { useSession } from '../session/SessionContext'
import { rolePath } from '../session/roles'

export function AuthPage({ mode }: { mode: 'login' | 'registerDoctor' | 'registerPatient' }) {
  const { session, restoring, login } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [colegiatura, setColegiatura] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (restoring) return <main className="grid min-h-screen place-items-center bg-[#f4f9f9] text-[#173454]" role="status">Restaurando sesión…</main>
  if (session) return <Navigate to={rolePath(session.rol)} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setSuccess('')
    if (mode !== 'login' && password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setBusy(true)
    try {
      if (mode !== 'login') {
        const email = username.trim().toLowerCase()
        if (mode === 'registerDoctor') await service.register(email, password, colegiatura.trim())
        else await service.registerPatient(email, password)
        setSuccess(isDemoMode ? 'Cuenta de prueba creada. Inicia sesión antes de recargar esta página.' : 'Cuenta creada. Ya puedes iniciar sesión.')
        setPassword(''); setConfirm('')
      } else {
        const result = await login(username.trim(), password)
        navigate(rolePath(result.rol), { replace: true })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.')
    } finally { setBusy(false) }
  }

  const registering = mode !== 'login'
  const doctorRegistration = mode === 'registerDoctor'
  const patientRegistration = mode === 'registerPatient'
  return <AppShell eyebrow="ACCESO A LA PLATAFORMA" title={doctorRegistration ? 'Crea tu cuenta médica' : patientRegistration ? 'Crea tu cuenta de paciente' : 'Ingresa a tu cuenta'}>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
      <section className="rounded-[24px] border border-[#dce9e9] bg-white p-6 shadow-sm sm:p-9">
        <p className="mb-6 text-sm leading-6 text-[#607785]">{doctorRegistration ? 'Completa tus datos para iniciar la solicitud de registro profesional.' : patientRegistration ? 'Regístrate con tu correo. Tu cuenta comienza sin historia clínica en la aplicación.' : 'Accede con las credenciales de tu cuenta.'}</p>
        <form className="space-y-5" onSubmit={submit}>
          <div><label htmlFor="username" className="mb-2 block text-sm font-bold">{registering ? 'Correo electrónico' : 'Correo o usuario'}</label><input id="username" type={registering ? 'email' : 'text'} className={fieldClass} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required maxLength={100} /></div>
          {doctorRegistration && <div><label htmlFor="colegiatura" className="mb-2 block text-sm font-bold">Número de colegiatura</label><input id="colegiatura" className={fieldClass} value={colegiatura} onChange={(event) => setColegiatura(event.target.value)} required maxLength={40} /><p className="mt-2 text-xs text-[#6c8490]">Quedará pendiente de verificación; el registro no otorga un sello de aprobación.</p></div>}
          <div><label htmlFor="password" className="mb-2 block text-sm font-bold">Contraseña</label><input id="password" type="password" className={fieldClass} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={registering ? 'new-password' : 'current-password'} required minLength={8} maxLength={registering ? 72 : undefined} /></div>
          {registering && <div><label htmlFor="confirm" className="mb-2 block text-sm font-bold">Repite la contraseña</label><input id="confirm" type="password" className={fieldClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={72} /></div>}
          {error && <Notice tone="error">{error}</Notice>}
          {success && <Notice tone="success">{success}</Notice>}
          <button className={primaryClass} type="submit" disabled={busy}>{busy ? 'Procesando…' : doctorRegistration ? 'Crear cuenta médica' : patientRegistration ? 'Crear cuenta de paciente' : 'Ingresar'}</button>
        </form>
        <div className="mt-7 space-y-2 border-t border-[#e3eeee] pt-5 text-sm text-[#607785]">{registering ? <p>¿Ya tienes cuenta? <Link className="font-bold text-[#0F8B8D] underline underline-offset-4" to="/ingresar">Inicia sesión</Link></p> : <><p>¿Buscas atención? <Link className="font-bold text-[#0F8B8D] underline underline-offset-4" to="/registro/paciente">Regístrate como paciente</Link></p><p>¿Eres profesional de salud? <Link className="font-bold text-[#0F8B8D] underline underline-offset-4" to="/registro/medico">Regístrate como médico</Link></p></>}</div>
      </section>
      <aside className="self-start rounded-[24px] bg-[#1E3A5F] p-7 text-white sm:p-9"><h2 className="text-xl font-bold">Tu información, bajo tu control</h2><p className="mt-3 text-sm leading-7 text-[#d5e6eb]">Médicos y administradores pueden revisar sus áreas de trabajo; pacientes pueden acceder a su espacio personal.</p>{isDemoMode && <div className="mt-6 rounded-xl border border-white/20 bg-white/10 p-4 text-xs leading-6 text-[#d5e6eb]"><p className="font-bold text-white">Cuentas de prueba</p><p>Médico: medico.demo@prueba.local / MedicoDemo2026!</p><p>Admin: admin.demo@prueba.local / AdminDemo2026!</p><p>Paciente: paciente.demo@prueba.local / PacienteDemo2026!</p><p className="mt-2">Usa solo información ficticia. Las cuentas fijas conservan la sesión durante esta pestaña; las cuentas nuevas duran hasta recargar.</p></div>}<p className="mt-5 text-xs leading-6 text-[#a8d5d8]">La búsqueda pública y las solicitudes de contacto pertenecen a etapas posteriores.</p></aside>
    </div>
  </AppShell>
}
