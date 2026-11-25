import { useEffect, useState } from 'react'
import type { AdminUser, PageResponse, Role } from '../../data/api'
import { service } from '../../data/service'
import { AdminSection } from '../../components/admin/AdminSection'
import { ConfirmActionDialog } from '../../components/admin/ConfirmActionDialog'
import { ModerationTable, rowActionClass, rowDangerActionClass, type ModerationColumn } from '../../components/admin/ModerationTable'
import { Pager } from '../../components/admin/Pager'
import { UserStatusBadge } from '../../components/admin/UserStatusBadge'
import { Notice, secondaryClass } from '../../components/AppShell'
import { useSession } from '../../session/SessionContext'

const PAGE_SIZE = 10
const ROLE_LABEL: Record<Role, string> = { ROLE_ADMIN: 'Administrador', ROLE_MEDICO: 'Médico', ROLE_PACIENTE: 'Paciente' }

const columns: ModerationColumn<AdminUser>[] = [
  { id: 'usuario', header: 'Usuario', cell: (user) => <span className="break-all">{user.username}</span> },
  { id: 'rol', header: 'Rol', cell: (user) => ROLE_LABEL[user.rol] ?? user.rol },
  { id: 'estado', header: 'Estado', cell: (user) => <UserStatusBadge habilitado={user.habilitado} /> },
]

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: PageResponse<AdminUser> }

/**
 * Administración de cuentas (GET /api/v1/admin/usuarios y PATCH .../{id}/estado vía el cliente API compartido).
 * La interfaz no ofrece bloquear la cuenta propia; el backend también lo impide y es quien decide.
 */
export function UsuariosPage() {
  const { session } = useSession()
  const token = session!.token
  const ownUsername = session!.username
  const [query, setQuery] = useState({ page: 0, attempt: 0 })
  const [state, setState] = useState<State>({ status: 'loading' })
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    service.listAdminUsers(token, query.page, PAGE_SIZE).then((data) => {
      if (active) setState({ status: 'ready', data })
    }).catch((cause: unknown) => {
      if (active) setState({ status: 'error', message: cause instanceof Error ? cause.message : 'No se pudieron cargar las cuentas.' })
    })
    return () => { active = false }
  }, [token, query])

  function load(page = query.page) {
    setState({ status: 'loading' })
    setQuery((current) => ({ page, attempt: current.attempt + 1 }))
  }

  async function confirm() {
    if (!target) return
    const enable = !target.habilitado
    setBusy(true); setDialogError('')
    try {
      await service.updateUserStatus(token, target.id, enable)
      setNotice(enable ? `La cuenta ${target.username} fue habilitada.` : `La cuenta ${target.username} fue bloqueada: ya no puede iniciar sesión.`)
      setTarget(null)
      load()
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado de la cuenta.')
    } finally { setBusy(false) }
  }

  const blocking = target?.habilitado === true
  return <AdminSection title="Cuentas de usuario">
    <p className="mb-7 max-w-2xl text-sm leading-7 text-[#607785]">Bloquea o habilita cuentas. Una cuenta bloqueada no puede iniciar sesión ni usar una sesión que ya tenía abierta.</p>
    {notice && <div className="mb-5"><Notice tone="success">{notice}</Notice></div>}
    <section className="overflow-hidden rounded-[22px] border border-[#dce9e9] bg-white shadow-sm" aria-labelledby="users-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5eeee] px-5 py-5 sm:px-7">
        <h2 id="users-title" className="text-lg font-bold text-[#173454]">Cuentas</h2>
        <button type="button" className={secondaryClass} disabled={state.status === 'loading'} onClick={() => load()}>Actualizar</button>
      </div>
      <div aria-live="polite">
        {state.status === 'loading' && <div role="status" className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center"><span className="h-9 w-9 animate-spin rounded-full border-3 border-[#b8dfdc] border-t-[#0F8B8D]" aria-hidden="true" /><p className="text-sm font-semibold text-[#607685]">Cargando cuentas…</p></div>}
        {state.status === 'error' && <div role="alert" className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center"><div><p className="font-bold text-[#173454]">No se pudieron cargar las cuentas</p><p className="mt-2 text-sm text-[#893f32]">{state.message}</p></div><button type="button" className={secondaryClass} onClick={() => load()}>Reintentar</button></div>}
        {state.status === 'ready' && state.data.items.length === 0 && <p className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm font-semibold text-[#607685]">No hay cuentas para mostrar.</p>}
        {state.status === 'ready' && state.data.items.length > 0 && <ModerationTable caption="Cuentas de usuario" columns={columns} rows={state.data.items} rowKey={(user) => user.id}
          actions={(user) => user.username === ownUsername
            ? <span className="text-xs font-semibold text-[#78909a]">Tu cuenta</span>
            : <button type="button" className={user.habilitado ? rowDangerActionClass : rowActionClass} disabled={busy}
              onClick={() => { setNotice(''); setDialogError(''); setTarget(user) }}>{user.habilitado ? 'Bloquear' : 'Habilitar'}</button>} />}
      </div>
      {state.status === 'ready' && state.data.total > 0 && <Pager page={query.page} size={PAGE_SIZE} total={state.data.total} noun={['cuenta', 'cuentas']} onPageChange={(page) => load(page)} />}
    </section>

    <ConfirmActionDialog open={target !== null} title={blocking ? '¿Bloquear esta cuenta?' : '¿Habilitar esta cuenta?'}
      confirmLabel={blocking ? 'Bloquear cuenta' : 'Habilitar cuenta'} tone={blocking ? 'danger' : 'default'} busy={busy} error={dialogError}
      onConfirm={() => void confirm()} onCancel={() => setTarget(null)}>
      {target && <>
        <p>{blocking ? 'No podrá iniciar sesión y su sesión actual dejará de ser válida.' : 'Podrá volver a iniciar sesión.'}</p>
        <p className="mt-2 break-all"><strong className="text-[#173454]">{target.username}</strong> · {ROLE_LABEL[target.rol] ?? target.rol}</p>
      </>}
    </ConfirmActionDialog>
  </AdminSection>
}
