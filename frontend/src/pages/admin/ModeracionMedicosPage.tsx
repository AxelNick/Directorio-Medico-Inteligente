import { useEffect, useState } from 'react'
import type { AdminDoctor, DoctorProfileStatus, LicenseStatus, PageResponse } from '../../data/api'
import { service } from '../../data/service'
import { AdminSection } from '../../components/admin/AdminSection'
import { ConfirmActionDialog } from '../../components/admin/ConfirmActionDialog'
import { ModerationTable, rowActionClass, rowDangerActionClass, type ModerationColumn } from '../../components/admin/ModerationTable'
import { Pager } from '../../components/admin/Pager'
import { StatusBadge, type BadgeTone } from '../../components/admin/UserStatusBadge'
import { Notice, secondaryClass } from '../../components/AppShell'
import { useSession } from '../../session/SessionContext'

const PAGE_SIZE = 10
type Filter = DoctorProfileStatus | 'TODOS'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'PENDIENTE_REVISION', label: 'Pendientes' },
  { value: 'APROBADO', label: 'Aprobados' },
  { value: 'SUSPENDIDO', label: 'Suspendidos' },
  { value: 'DESHABILITADO', label: 'Deshabilitados' },
  { value: 'TODOS', label: 'Todos' },
]
const PROFILE: Record<DoctorProfileStatus, { label: string; tone: BadgeTone }> = {
  PENDIENTE_REVISION: { label: 'Pendiente de revisión', tone: 'warning' },
  APROBADO: { label: 'Aprobado', tone: 'positive' },
  SUSPENDIDO: { label: 'Suspendido', tone: 'negative' },
  DESHABILITADO: { label: 'Deshabilitado', tone: 'neutral' },
}
const LICENSE: Record<LicenseStatus, { label: string; tone: BadgeTone }> = {
  PENDIENTE_VERIFICACION: { label: 'Pendiente', tone: 'warning' },
  VERIFICADA: { label: 'Verificada', tone: 'positive' },
  RECHAZADA: { label: 'Rechazada', tone: 'negative' },
}

/** Cambio que el administrador quiere aplicar; se confirma antes de llamar al backend. */
type Change =
  | { kind: 'perfil'; doctor: AdminDoctor; value: DoctorProfileStatus }
  | { kind: 'colegiatura'; doctor: AdminDoctor; value: LicenseStatus }

interface Copy { title: string; body: string; confirm: string; done: string; danger: boolean }
function copyFor(change: Change): Copy {
  if (change.kind === 'colegiatura') {
    return change.value === 'VERIFICADA'
      ? { title: '¿Verificar esta colegiatura?', body: 'Confirmas que el número de CMP corresponde a este profesional.', confirm: 'Verificar CMP', done: 'Colegiatura verificada.', danger: false }
      : { title: '¿Rechazar esta colegiatura?', body: 'El perfil no podrá publicarse mientras la colegiatura esté rechazada.', confirm: 'Rechazar CMP', done: 'Colegiatura rechazada.', danger: true }
  }
  switch (change.value) {
    case 'APROBADO': return { title: '¿Aprobar este perfil?', body: 'El perfil aparecerá en el directorio público si su colegiatura está verificada.', confirm: 'Aprobar perfil', done: 'Perfil aprobado.', danger: false }
    case 'SUSPENDIDO': return { title: '¿Suspender este perfil?', body: 'Dejará de mostrarse en el directorio público hasta que vuelva a aprobarse.', confirm: 'Suspender perfil', done: 'Perfil suspendido: ya no se muestra en el directorio.', danger: true }
    case 'DESHABILITADO': return { title: '¿Deshabilitar este perfil?', body: 'Dejará de mostrarse en el directorio público.', confirm: 'Deshabilitar perfil', done: 'Perfil deshabilitado: ya no se muestra en el directorio.', danger: true }
    default: return { title: '¿Devolver a revisión?', body: 'El perfil quedará pendiente de revisión.', confirm: 'Devolver a revisión', done: 'Perfil devuelto a revisión.', danger: false }
  }
}

/** El backend puede entregar nombres y apellidos vacíos mientras el registro no los pida. */
const doctorName = (doctor: AdminDoctor) => `${doctor.nombres ?? ''} ${doctor.apellidos ?? ''}`.trim()
const NO_NAME = 'Sin nombre registrado'

const columns: ModerationColumn<AdminDoctor>[] = [
  { id: 'medico', header: 'Médico', cell: (doctor) => doctorName(doctor) || <span className="font-semibold italic text-[#78909a]">{NO_NAME}</span> },
  { id: 'cmp', header: 'CMP', cell: (doctor) => <span className="whitespace-nowrap">{doctor.colegiatura}</span> },
  { id: 'colegiatura', header: 'Colegiatura', cell: (doctor) => <StatusBadge tone={LICENSE[doctor.estadoColegiatura].tone}>{LICENSE[doctor.estadoColegiatura].label}</StatusBadge> },
  {
    id: 'perfil', header: 'Publicación',
    cell: (doctor) => <>
      <StatusBadge tone={PROFILE[doctor.estadoPerfil].tone}>{PROFILE[doctor.estadoPerfil].label}</StatusBadge>
      {doctor.estadoPerfil === 'APROBADO' && doctor.estadoColegiatura !== 'VERIFICADA' && <span className="mt-1.5 block text-xs text-[#8a5a00]">No es público hasta verificar el CMP.</span>}
    </>,
  },
]

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: PageResponse<AdminDoctor> }

/**
 * Moderación de médicos (GET y PATCH /api/v1/admin/medicos vía el cliente API compartido).
 * El estado de publicación y el de colegiatura son independientes: un CMP verificado no implica un perfil aprobado.
 */
export function ModeracionMedicosPage() {
  const { session } = useSession()
  const token = session!.token
  const [query, setQuery] = useState<{ filter: Filter; page: number; attempt: number }>({ filter: 'PENDIENTE_REVISION', page: 0, attempt: 0 })
  const [state, setState] = useState<State>({ status: 'loading' })
  const [change, setChange] = useState<Change | null>(null)
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    service.listAdminDoctors(token, {
      estadoPerfil: query.filter === 'TODOS' ? undefined : query.filter, page: query.page, size: PAGE_SIZE,
    }).then((data) => {
      if (active) setState({ status: 'ready', data })
    }).catch((cause: unknown) => {
      if (active) setState({ status: 'error', message: cause instanceof Error ? cause.message : 'No se pudieron cargar los médicos.' })
    })
    return () => { active = false }
  }, [token, query])

  function load(next: Partial<{ filter: Filter; page: number }> = {}) {
    setState({ status: 'loading' })
    setQuery((current) => ({ ...current, ...next, attempt: current.attempt + 1 }))
  }

  function ask(next: Change) {
    setNotice(''); setDialogError(''); setChange(next)
  }

  async function confirm() {
    if (!change) return
    setBusy(true); setDialogError('')
    try {
      if (change.kind === 'perfil') await service.updateDoctorProfileStatus(token, change.doctor.id, change.value)
      else await service.updateDoctorLicenseStatus(token, change.doctor.id, change.value)
      setNotice(copyFor(change).done)
      setChange(null)
      // Un cambio de publicación saca la fila del filtro actual; si era la última, se retrocede una página.
      const leavesFilter = change.kind === 'perfil' && query.filter !== 'TODOS'
      const wasLastRow = state.status === 'ready' && state.data.items.length === 1
      load({ page: leavesFilter && wasLastRow ? Math.max(0, query.page - 1) : query.page })
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'No se pudo aplicar el cambio.')
    } finally { setBusy(false) }
  }

  const copy = change ? copyFor(change) : null
  return <AdminSection title="Moderación de médicos">
    <p className="mb-7 max-w-2xl text-sm leading-7 text-[#607785]">Revisa los perfiles antes de publicarlos. Un médico aparece en el directorio solo con el perfil aprobado y la colegiatura verificada.</p>
    {notice && <div className="mb-5"><Notice tone="success">{notice}</Notice></div>}
    <section className="overflow-hidden rounded-[22px] border border-[#dce9e9] bg-white shadow-sm" aria-labelledby="doctors-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5eeee] px-5 py-5 sm:px-7">
        <h2 id="doctors-title" className="text-lg font-bold text-[#173454]">Médicos</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de publicación">
          {FILTERS.map((filter) => <button key={filter.value} type="button" aria-pressed={query.filter === filter.value}
            className={`rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D] ${query.filter === filter.value ? 'bg-[#1E3A5F] text-white' : 'bg-[#eef5f5] text-[#4e6879] hover:bg-[#e0eeee]'}`}
            onClick={() => { setNotice(''); load({ filter: filter.value, page: 0 }) }}>{filter.label}</button>)}
        </div>
      </div>
      <div aria-live="polite">
        {state.status === 'loading' && <div role="status" className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center"><span className="h-9 w-9 animate-spin rounded-full border-3 border-[#b8dfdc] border-t-[#0F8B8D]" aria-hidden="true" /><p className="text-sm font-semibold text-[#607685]">Cargando médicos…</p></div>}
        {state.status === 'error' && <div role="alert" className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center"><div><p className="font-bold text-[#173454]">No se pudieron cargar los médicos</p><p className="mt-2 text-sm text-[#893f32]">{state.message}</p></div><button type="button" className={secondaryClass} onClick={() => load()}>Reintentar</button></div>}
        {state.status === 'ready' && state.data.items.length === 0 && <p className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm font-semibold text-[#607685]">{query.filter === 'TODOS' ? 'Todavía no hay médicos registrados.' : 'No hay médicos en este estado.'}</p>}
        {state.status === 'ready' && state.data.items.length > 0 && <ModerationTable caption="Médicos para moderación" columns={columns} rows={state.data.items} rowKey={(doctor) => doctor.id}
          actions={(doctor) => <>
            {doctor.estadoPerfil !== 'APROBADO' && <button type="button" className={rowActionClass} disabled={busy} onClick={() => ask({ kind: 'perfil', doctor, value: 'APROBADO' })}>Aprobar</button>}
            {doctor.estadoPerfil === 'APROBADO' && <button type="button" className={rowDangerActionClass} disabled={busy} onClick={() => ask({ kind: 'perfil', doctor, value: 'SUSPENDIDO' })}>Suspender</button>}
            {doctor.estadoPerfil !== 'DESHABILITADO' && <button type="button" className={rowDangerActionClass} disabled={busy} onClick={() => ask({ kind: 'perfil', doctor, value: 'DESHABILITADO' })}>Deshabilitar</button>}
            {doctor.estadoColegiatura !== 'VERIFICADA' && <button type="button" className={rowActionClass} disabled={busy} onClick={() => ask({ kind: 'colegiatura', doctor, value: 'VERIFICADA' })}>Verificar CMP</button>}
            {doctor.estadoColegiatura !== 'RECHAZADA' && <button type="button" className={rowDangerActionClass} disabled={busy} onClick={() => ask({ kind: 'colegiatura', doctor, value: 'RECHAZADA' })}>Rechazar CMP</button>}
          </>} />}
      </div>
      {state.status === 'ready' && state.data.total > 0 && <Pager page={query.page} size={PAGE_SIZE} total={state.data.total} noun={['médico', 'médicos']} onPageChange={(page) => load({ page })} />}
    </section>

    <ConfirmActionDialog open={change !== null} title={copy?.title ?? ''} confirmLabel={copy?.confirm ?? ''} tone={copy?.danger ? 'danger' : 'default'}
      busy={busy} error={dialogError} onConfirm={() => void confirm()} onCancel={() => setChange(null)}>
      {change && copy && <>
        <p>{copy.body}</p>
        <p className="mt-2"><strong className="text-[#173454]">{doctorName(change.doctor) || NO_NAME}</strong> · CMP {change.doctor.colegiatura}</p>
      </>}
    </ConfirmActionDialog>
  </AdminSection>
}
