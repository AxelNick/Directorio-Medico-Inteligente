import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { CareCenter, MedicalProfile, Specialty } from '../data/api'
import { service } from '../data/service'
import { AppShell, Notice, fieldClass, primaryClass, secondaryClass } from '../components/AppShell'
import { useSession } from '../session/SessionContext'

type CenterInput = Omit<CareCenter, 'id'>
const emptyCenter: CenterInput = { nombre: '', direccion: '', ciudad: '' }

export function DoctorPage() {
  const { session } = useSession()
  const token = session!.token
  const [profile, setProfile] = useState<MedicalProfile | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [centers, setCenters] = useState<CareCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [centerForm, setCenterForm] = useState<CenterInput>(emptyCenter)
  const [editingCenter, setEditingCenter] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [nextProfile, nextSpecialties, nextCenters] = await Promise.all([
        service.getProfile(token), service.listSpecialties(token), service.listCenters(token),
      ])
      setProfile(nextProfile)
      setSpecialties(nextSpecialties)
      setCenters(nextCenters)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus datos.') }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { void load() }, [load])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    setBusy(true); setError(''); setNotice('')
    try {
      const saved = await service.updateProfile(token, {
        biografia: profile.biografia.trim(), aniosExperiencia: profile.aniosExperiencia,
        colegiatura: profile.colegiatura.trim(), especialidadIds: profile.especialidadIds,
      })
      setProfile(saved); setNotice('Perfil guardado correctamente.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el perfil.') }
    finally { setBusy(false) }
  }

  async function savePhoto(file: File | undefined) {
    if (!file) return
    setBusy(true); setError(''); setNotice('')
    try { setProfile(await service.uploadPhoto(token, file)); setNotice('Fotografía guardada.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la fotografía.') }
    finally { setBusy(false) }
  }

  async function saveCenter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    const value = { nombre: centerForm.nombre.trim(), direccion: centerForm.direccion.trim(), ciudad: centerForm.ciudad.trim() }
    try {
      if (editingCenter === null) await service.createCenter(token, value)
      else await service.updateCenter(token, editingCenter, value)
      setCenters(await service.listCenters(token))
      setCenterForm(emptyCenter); setEditingCenter(null); setNotice('Centro guardado correctamente.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el centro.') }
    finally { setBusy(false) }
  }

  async function removeCenter(id: number) {
    if (!window.confirm('¿Retirar este centro de atención?')) return
    setBusy(true); setError(''); setNotice('')
    try { await service.deleteCenter(token, id); setCenters((items) => items.filter((item) => item.id !== id)); setNotice('Centro retirado.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo retirar el centro.') }
    finally { setBusy(false) }
  }

  const active = specialties.filter((item) => item.habilitada)
  return <AppShell eyebrow="ÁREA MÉDICA · SPRINT 2" title="Tu perfil profesional">
    <p className="mb-7 max-w-2xl text-sm leading-7 text-[#607785]">Administra la información que presentarás a los pacientes cuando el directorio público esté disponible. Tu colegiatura requiere verificación administrativa.</p>
    {loading && <Notice>Cargando perfil, especialidades y centros…</Notice>}
    {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}
    {notice && <div className="mb-5"><Notice tone="success">{notice}</Notice></div>}
    {!loading && !profile && <button type="button" className={secondaryClass} onClick={() => void load()}>Reintentar</button>}
    {profile && <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-[22px] border border-[#dce9e9] bg-white p-6 shadow-sm sm:p-8" aria-labelledby="perfil-title">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 id="perfil-title" className="text-xl font-bold">Carta de presentación</h2><span className="rounded-full bg-[#eaf7f6] px-3 py-2 text-xs font-bold text-[#0F8B8D]">{profile.estadoColegiatura.replaceAll('_', ' ')}</span></div>
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-[#f2f8f8] p-4">{profile.fotoUrl ? <img src={profile.fotoUrl} alt="Fotografía de perfil" className="h-20 w-20 rounded-xl object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#dceeed] text-xs font-bold text-[#54717a]">Sin foto</span>}<div><label htmlFor="photo" className="block text-sm font-bold">Fotografía de perfil</label><p className="mt-1 text-xs text-[#6c8490]">JPG, PNG o WebP · máximo 1 MB</p><input id="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="mt-2 max-w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-[#1E3A5F] file:px-3 file:py-2 file:font-bold file:text-white" onChange={(event) => { void savePhoto(event.target.files?.[0]); event.target.value = '' }} /></div></div>
        <form className="space-y-5" onSubmit={saveProfile}>
          <div><label htmlFor="bio" className="mb-2 block text-sm font-bold">Biografía</label><textarea id="bio" className={`${fieldClass} min-h-36`} value={profile.biografia} onChange={(event) => setProfile({ ...profile, biografia: event.target.value })} maxLength={1500} /><p className="mt-1 text-right text-xs text-[#78909a]">{profile.biografia.length}/1500</p></div>
          <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="years" className="mb-2 block text-sm font-bold">Años de experiencia</label><input id="years" type="number" min="0" max="80" className={fieldClass} value={profile.aniosExperiencia ?? ''} onChange={(event) => setProfile({ ...profile, aniosExperiencia: event.target.value === '' ? null : Number(event.target.value) })} /></div><div><label htmlFor="license" className="mb-2 block text-sm font-bold">Colegiatura</label><input id="license" className={fieldClass} value={profile.colegiatura} onChange={(event) => setProfile({ ...profile, colegiatura: event.target.value })} required maxLength={40} /></div></div>
          <div><p className="mb-2 text-sm font-bold">Especialidades activas</p>{active.length === 0 ? <p className="text-sm text-[#708591]">El catálogo aún no tiene especialidades disponibles.</p> : <div className="grid gap-3 sm:grid-cols-2">{active.map((item) => <label key={item.id} className="flex items-start gap-3 rounded-xl border border-[#dce9e9] p-3 text-sm"><input type="checkbox" className="mt-1 accent-[#0F8B8D]" checked={profile.especialidadIds.includes(item.id)} onChange={(event) => setProfile({ ...profile, especialidadIds: event.target.checked ? [...profile.especialidadIds, item.id] : profile.especialidadIds.filter((id) => id !== item.id) })} /><span>{item.nombre}</span></label>)}</div>}</div>
          <button type="submit" className={primaryClass} disabled={busy}>Guardar perfil</button>
        </form>
      </section>
      <section className="rounded-[22px] border border-[#dce9e9] bg-white p-6 shadow-sm sm:p-8" aria-labelledby="centros-title">
        <h2 id="centros-title" className="text-xl font-bold">Centros de atención</h2>
        <p className="mt-2 text-sm leading-6 text-[#6b808c]">Indica dónde atiendes. Los horarios y las citas se definirán en otra etapa.</p>
        {centers.length === 0 ? <p className="mt-6 rounded-xl bg-[#f2f8f8] p-4 text-sm text-[#617986]">Todavía no hay centros registrados.</p> : <ul className="mt-6 space-y-3">{centers.map((center) => <li key={center.id} className="rounded-xl border border-[#dce9e9] p-4"><h3 className="font-bold">{center.nombre}</h3><p className="mt-1 text-sm text-[#68808b]">{center.direccion} · {center.ciudad}</p><div className="mt-3 flex gap-3"><button type="button" disabled={busy} className="text-sm font-bold text-[#0F8B8D] underline" onClick={() => { setEditingCenter(center.id); setCenterForm({ nombre: center.nombre, direccion: center.direccion, ciudad: center.ciudad }) }}>Editar</button><button type="button" disabled={busy} className="text-sm font-bold text-[#9a544d] underline" onClick={() => void removeCenter(center.id)}>Retirar</button></div></li>)}</ul>}
        <form className="mt-7 space-y-4 border-t border-[#e5eeee] pt-6" onSubmit={saveCenter}><h3 className="font-bold">{editingCenter === null ? 'Añadir centro' : 'Editar centro'}</h3><div><label htmlFor="center-name" className="mb-2 block text-sm font-bold">Nombre</label><input id="center-name" className={fieldClass} value={centerForm.nombre} onChange={(event) => setCenterForm({ ...centerForm, nombre: event.target.value })} required maxLength={120} /></div><div><label htmlFor="center-address" className="mb-2 block text-sm font-bold">Dirección</label><input id="center-address" className={fieldClass} value={centerForm.direccion} onChange={(event) => setCenterForm({ ...centerForm, direccion: event.target.value })} required maxLength={200} /></div><div><label htmlFor="center-city" className="mb-2 block text-sm font-bold">Ciudad</label><input id="center-city" className={fieldClass} value={centerForm.ciudad} onChange={(event) => setCenterForm({ ...centerForm, ciudad: event.target.value })} required maxLength={100} /></div><div className="flex flex-wrap gap-3"><button type="submit" className={primaryClass} disabled={busy}>Guardar centro</button>{editingCenter !== null && <button type="button" className={secondaryClass} onClick={() => { setEditingCenter(null); setCenterForm(emptyCenter) }}>Cancelar</button>}</div></form>
      </section>
    </div>}
  </AppShell>
}
