import { ApiError, type CareCenter, type MedicalProfile, type Role, type Session, type Specialty } from './api'

// Todos los valores de este archivo son ficticios y se cargan únicamente en desarrollo.
const STORAGE_KEY = 'directorio-medico-sprint2-demo-v1'
const FIXED_USERS = {
  'medico.demo@prueba.local': { password: 'MedicoDemo2026!', rol: 'ROLE_MEDICO' as Role },
  'admin.demo@prueba.local': { password: 'AdminDemo2026!', rol: 'ROLE_ADMIN' as Role },
  'paciente.demo@prueba.local': { password: 'PacienteDemo2026!', rol: 'ROLE_PACIENTE' as Role },
}
const registered = new Map<string, { password: string; colegiatura: string }>()

interface DemoStore {
  specialties: Specialty[]
  profiles: Record<string, MedicalProfile>
  centers: Record<string, CareCenter[]>
  nextSpecialtyId: number
  nextCenterId: number
  nextUserId: number
}

function initialStore(): DemoStore {
  return {
    specialties: [
      { id: 1, nombre: 'Medicina general', habilitada: true },
      { id: 2, nombre: 'Cardiología', habilitada: true },
      { id: 3, nombre: 'Pediatría', habilitada: true },
      { id: 4, nombre: 'Medicina interna', habilitada: false },
    ],
    profiles: {
      'medico.demo@prueba.local': {
        biografia: 'Perfil ficticio para revisar la presentación profesional.',
        aniosExperiencia: 5,
        fotoUrl: null,
        colegiatura: 'CMP-DEMO-001',
        estadoColegiatura: 'PENDIENTE_VERIFICACION',
        especialidadIds: [1],
      },
    },
    centers: { 'medico.demo@prueba.local': [{ id: 1, nombre: 'Centro de prueba', direccion: 'Av. Ejemplo 100', ciudad: 'Lima' }] },
    nextSpecialtyId: 5, nextCenterId: 2, nextUserId: 2,
  }
}

let state: DemoStore | null = null
function store() {
  if (state) return state
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed: DemoStore = JSON.parse(saved)
      if (Array.isArray(parsed.specialties) && parsed.profiles && parsed.centers) return (state = parsed)
    }
  } catch { /* Navegación privada o datos de prueba corruptos: usar ejemplos iniciales. */ }
  return (state = initialStore())
}
function save() {
  try {
    const persisted = copy(store())
    for (const username of registered.keys()) {
      delete persisted.profiles[username]
      delete persisted.centers[username]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  }
  catch { /* El demo sigue funcionando en memoria cuando el almacenamiento está lleno. */ }
}
const copy = <T,>(value: T): T => structuredClone(value)
const pause = () => new Promise((resolve) => setTimeout(resolve, 180))

function userFromToken(token: string, expected: Role): string {
  const prefix = `demo:${expected}:`
  if (!token.startsWith(prefix)) throw new ApiError(403, 'No tienes permiso para realizar esta acción.')
  const username = decodeURIComponent(token.slice(prefix.length))
  if (expected === 'ROLE_ADMIN' && username !== 'admin.demo@prueba.local') throw new ApiError(403, 'Acceso denegado.')
  if (expected === 'ROLE_MEDICO' && !store().profiles[username]) throw new ApiError(401, 'Sesión de prueba vencida.')
  if (expected === 'ROLE_PACIENTE' && username !== 'paciente.demo@prueba.local') throw new ApiError(403, 'Acceso denegado.')
  return username
}

function profileFor(token: string) {
  return store().profiles[userFromToken(token, 'ROLE_MEDICO')]
}

export const mockApi = {
  async resume(token: string): Promise<Session> {
    await pause()
    const roles: Role[] = ['ROLE_MEDICO', 'ROLE_ADMIN', 'ROLE_PACIENTE']
    for (const rol of roles) {
      if (!token.startsWith(`demo:${rol}:`)) continue
      try {
        const username = userFromToken(token, rol)
        const fixed = FIXED_USERS[username as keyof typeof FIXED_USERS]
        if (fixed?.rol === rol || (rol === 'ROLE_MEDICO' && registered.has(username))) return { token, username, rol }
      } catch { break }
    }
    throw new ApiError(401, 'Sesión de prueba vencida.')
  },
  async login(username: string, password: string): Promise<Session> {
    await pause()
    const fixed = FIXED_USERS[username as keyof typeof FIXED_USERS]
    const role = fixed?.password === password ? fixed.rol
      : registered.get(username)?.password === password ? 'ROLE_MEDICO' : null
    if (!role) throw new ApiError(401, 'Credenciales de prueba inválidas.')
    return { token: `demo:${role}:${encodeURIComponent(username)}`, username, rol: role }
  },
  async register(username: string, password: string, colegiatura: string) {
    await pause()
    const s = store()
    if (!username || !colegiatura || password.length < 8) throw new ApiError(400, 'Completa los datos de registro.')
    if (username in FIXED_USERS || registered.has(username)) throw new ApiError(409, 'Ese usuario ya existe en los datos de prueba.')
    if (Object.values(s.profiles).some((item) => item.colegiatura.toLowerCase() === colegiatura.toLowerCase())) throw new ApiError(409, 'Esa colegiatura ya existe en los datos de prueba.')
    // La contraseña de una cuenta creada aquí solo vive en memoria; nunca se guarda en localStorage.
    registered.set(username, { password, colegiatura })
    s.profiles[username] = { biografia: '', aniosExperiencia: null, fotoUrl: null, colegiatura, estadoColegiatura: 'PENDIENTE_VERIFICACION', especialidadIds: [] }
    s.centers[username] = []
    s.nextUserId += 1
    save()
  },
  async getProfile(token: string) { await pause(); return copy(profileFor(token)) },
  async updateProfile(token: string, value: Pick<MedicalProfile, 'biografia' | 'aniosExperiencia' | 'colegiatura' | 'especialidadIds'>) {
    await pause()
    const username = userFromToken(token, 'ROLE_MEDICO')
    const s = store()
    if (Object.entries(s.profiles).some(([user, item]) => user !== username && item.colegiatura.toLowerCase() === value.colegiatura.toLowerCase())) throw new ApiError(409, 'Esa colegiatura ya está registrada.')
    if (value.especialidadIds.some((id) => !s.specialties.some((item) => item.id === id && item.habilitada))) throw new ApiError(400, 'Selecciona solo especialidades activas.')
    s.profiles[username] = { ...s.profiles[username], ...copy(value) }
    save()
    return copy(s.profiles[username])
  },
  async uploadPhoto(token: string, file: File) {
    await pause()
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) throw new ApiError(400, 'Usa JPG, PNG o WebP de hasta 1 MB.')
    const username = userFromToken(token, 'ROLE_MEDICO')
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new ApiError(400, 'No se pudo leer la imagen.'))
      reader.readAsDataURL(file)
    })
    store().profiles[username].fotoUrl = url
    save()
    return copy(store().profiles[username])
  },
  async listSpecialties(token: string) { await pause(); userFromToken(token, 'ROLE_MEDICO'); return copy(store().specialties.filter((item) => item.habilitada)) },
  async listAdminSpecialties(token: string) { await pause(); userFromToken(token, 'ROLE_ADMIN'); return copy(store().specialties) },
  async createSpecialty(token: string, nombre: string) {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    const s = store()
    if (!nombre.trim()) throw new ApiError(400, 'Indica un nombre.')
    if (s.specialties.some((item) => item.nombre.toLowerCase() === nombre.trim().toLowerCase())) throw new ApiError(409, 'Esa especialidad ya existe.')
    const item = { id: s.nextSpecialtyId++, nombre: nombre.trim(), habilitada: true }
    s.specialties.push(item); save(); return copy(item)
  },
  async updateSpecialty(token: string, id: number, value: Pick<Specialty, 'nombre' | 'habilitada'>) {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    const s = store()
    const item = s.specialties.find((entry) => entry.id === id)
    if (!item) throw new ApiError(404, 'Especialidad no encontrada.')
    if (s.specialties.some((entry) => entry.id !== id && entry.nombre.toLowerCase() === value.nombre.trim().toLowerCase())) throw new ApiError(409, 'Ese nombre ya existe.')
    Object.assign(item, { nombre: value.nombre.trim(), habilitada: value.habilitada }); save(); return copy(item)
  },
  async listCenters(token: string) { await pause(); const user = userFromToken(token, 'ROLE_MEDICO'); return copy(store().centers[user] ?? []) },
  async createCenter(token: string, value: Omit<CareCenter, 'id'>) {
    await pause(); const user = userFromToken(token, 'ROLE_MEDICO')
    const s = store(); const item = { ...copy(value), id: s.nextCenterId++ }
    s.centers[user] ??= []; s.centers[user].push(item); save(); return copy(item)
  },
  async updateCenter(token: string, id: number, value: Omit<CareCenter, 'id'>) {
    await pause(); const user = userFromToken(token, 'ROLE_MEDICO')
    const item = store().centers[user]?.find((entry) => entry.id === id)
    if (!item) throw new ApiError(404, 'Centro no encontrado.')
    Object.assign(item, copy(value)); save(); return copy(item)
  },
  async deleteCenter(token: string, id: number) {
    await pause(); const user = userFromToken(token, 'ROLE_MEDICO')
    const items = store().centers[user] ?? []
    if (!items.some((item) => item.id === id)) throw new ApiError(404, 'Centro no encontrado.')
    store().centers[user] = items.filter((item) => item.id !== id); save()
  },
}
