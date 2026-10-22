import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Specialty } from '../data/api'
import { service, isDemoMode } from '../data/service'
import { AppShell, Notice, fieldClass, primaryClass, secondaryClass } from '../components/AppShell'
import { useSession } from '../session/SessionContext'

export function AdminPage() {
  const { session } = useSession()
  const token = session!.token
  const [items, setItems] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setItems(await service.listAdminSpecialties(token)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo.') }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { void load() }, [load])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (editing === null) await service.createSpecialty(token, name.trim())
      else {
        const current = items.find((item) => item.id === editing)!
        await service.updateSpecialty(token, editing, { nombre: name.trim(), habilitada: current.habilitada })
      }
      setItems(await service.listAdminSpecialties(token))
      setName(''); setEditing(null); setNotice('Catálogo actualizado.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la especialidad.') }
    finally { setBusy(false) }
  }

  async function toggle(item: Specialty) {
    setBusy(true); setError(''); setNotice('')
    try {
      await service.updateSpecialty(token, item.id, { nombre: item.nombre, habilitada: !item.habilitada })
      setItems(await service.listAdminSpecialties(token))
      setNotice(item.habilitada ? 'Especialidad deshabilitada.' : 'Especialidad habilitada.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado.') }
    finally { setBusy(false) }
  }

  return <AppShell eyebrow="ADMINISTRACIÓN · SPRINT 2" title="Catálogo de especialidades">
    <p className="mb-7 max-w-2xl text-sm leading-7 text-[#607785]">Gestiona las especialidades disponibles para los perfiles médicos. Deshabilitar una entrada evita nuevas asignaciones sin borrar las existentes.</p>
    {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}
    {notice && <div className="mb-5"><Notice tone="success">{notice}</Notice></div>}
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <section className="overflow-hidden rounded-[22px] border border-[#dce9e9] bg-white shadow-sm" aria-labelledby="catalog-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6eeee] px-6 py-5"><h2 id="catalog-title" className="text-xl font-bold">Especialidades</h2><button type="button" className={secondaryClass} disabled={loading} onClick={() => void load()}>Actualizar</button></div>
        {loading ? <p role="status" className="p-6 text-sm text-[#607785]">Cargando catálogo…</p> : items.length === 0 ? <p className="p-6 text-sm text-[#607785]">No hay especialidades registradas.</p> : <ul className="divide-y divide-[#e9f0f0]">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"><div><p className="font-bold">{item.nombre}</p><p className={`mt-1 text-xs font-semibold ${item.habilitada ? 'text-[#0F8B8D]' : 'text-[#9a6a48]'}`}>{item.habilitada ? 'Activa' : 'Deshabilitada'}</p></div><div className="flex flex-wrap gap-3"><button type="button" className="text-sm font-bold text-[#0F8B8D] underline" disabled={busy} onClick={() => { setEditing(item.id); setName(item.nombre) }}>Editar</button><button type="button" className="text-sm font-bold text-[#1E3A5F] underline" disabled={busy} onClick={() => void toggle(item)}>{item.habilitada ? 'Deshabilitar' : 'Habilitar'}</button></div></li>)}</ul>}
      </section>
      <section className="self-start rounded-[22px] border border-[#dce9e9] bg-white p-6 shadow-sm" aria-labelledby="specialty-form-title"><h2 id="specialty-form-title" className="text-xl font-bold">{editing === null ? 'Nueva especialidad' : 'Editar especialidad'}</h2><form className="mt-6 space-y-5" onSubmit={save}><div><label htmlFor="specialty-name" className="mb-2 block text-sm font-bold">Nombre</label><input id="specialty-name" className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></div><div className="flex flex-wrap gap-3"><button type="submit" className={primaryClass} disabled={busy}>Guardar</button>{editing !== null && <button type="button" className={secondaryClass} onClick={() => { setEditing(null); setName('') }}>Cancelar</button>}</div></form></section>
    </div>
    {isDemoMode && <section className="mt-6 rounded-[22px] border border-[#c8dfe2] bg-[#edf7f6] p-6"><h2 className="font-bold">Auditoría de prueba</h2><p className="mt-2 text-sm leading-6 text-[#55717d]">Explora eventos ficticios y los estados de la tabla.</p><a href="/demo/auditoria" className="mt-4 inline-block text-sm font-bold text-[#0F8B8D] underline underline-offset-4">Abrir auditoría de prueba</a></section>}
  </AppShell>
}
