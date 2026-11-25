import {
  ApiError, type AdminDoctor, type AdminReview, type AdminUser, type CareCenter, type DoctorDetail,
  type DoctorProfileStatus, type DoctorSearchFilters, type DoctorSummary, type LicenseStatus, type MedicalProfile,
  type PageResponse, type Review, type ReviewInput, type ReviewPage, type ReviewStatus, type Role, type Session,
  type Specialty, type TriageResponse,
} from './api'
import { createMockAuditRepository } from '../demo/mockAuditRepository'

// Todos los valores de este archivo son ficticios y se cargan únicamente en desarrollo.
const STORAGE_KEY = 'directorio-medico-sprint2-demo-v1'
const FIXED_USERS = {
  'medico.demo@prueba.local': { password: 'MedicoDemo2026!', rol: 'ROLE_MEDICO' as Role },
  'admin.demo@prueba.local': { password: 'AdminDemo2026!', rol: 'ROLE_ADMIN' as Role },
  'paciente.demo@prueba.local': { password: 'PacienteDemo2026!', rol: 'ROLE_PACIENTE' as Role },
}
const registered = new Map<string, { password: string; rol: Role; colegiatura?: string }>()

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
  if (expected === 'ROLE_PACIENTE' && username !== 'paciente.demo@prueba.local' && registered.get(username)?.rol !== 'ROLE_PACIENTE') throw new ApiError(401, 'Sesión de prueba vencida.')
  return username
}

function profileFor(token: string) {
  return store().profiles[userFromToken(token, 'ROLE_MEDICO')]
}

// ---- Directorio, triage y reseñas (Sprints 3 a 5): médicos y opiniones inventados, solo en memoria. ----
interface DemoDoctor { id: number; nombres: string; apellidos: string; colegiatura: string; especialidadIds: number[]; biografia: string; aniosExperiencia: number; centros: CareCenter[] }
interface DemoReview extends Review { medicoId: number; paciente: string }

const DEMO_NAMES = ['Ana María', 'Luis Fernando', 'Carla', 'Jorge', 'Rosa', 'Miguel', 'Lucía', 'Pedro', 'Elena', 'Diego', 'Marta', 'Raúl']
const DEMO_SURNAMES = ['Demo Quispe', 'Prueba Rojas', 'Ficticia Mendoza', 'Simulado Paredes', 'Ejemplo Valdivia', 'Muestra Salazar', 'Modelo Cárdenas', 'Piloto Huamán', 'Ficticio Torres', 'Demo Vargas', 'Prueba Ccori', 'Ejemplo Rivas']
const DEMO_CITIES = ['Lima', 'Arequipa', 'Cusco', 'Lima', 'Trujillo', 'Lima']
const DEMO_DOCTORS: DemoDoctor[] = DEMO_NAMES.map((nombres, index) => ({
  id: 101 + index, nombres, apellidos: DEMO_SURNAMES[index], colegiatura: `CMP-DEMO-${101 + index}`,
  especialidadIds: index % 4 === 3 ? [2, 1] : [(index % 3) + 1],
  biografia: 'Perfil ficticio para revisar la ficha pública. Ninguna persona real corresponde a estos datos.',
  aniosExperiencia: 3 + ((index * 7) % 20),
  centros: [{ id: 200 + index, nombre: `Centro de prueba ${index + 1}`, direccion: `Av. Ejemplo ${100 + index * 10}`, ciudad: DEMO_CITIES[index % DEMO_CITIES.length] }],
}))

const seedReview = (medicoId: number, puntuacion: number, day: number): DemoReview => ({
  id: medicoId * 100 + day, medicoId, paciente: `semilla-${medicoId}-${day}`, puntuacion,
  comentario: 'Comentario ficticio de ejemplo.', fechaCreacion: new Date(Date.UTC(2026, 10, day, 15, 0)).toISOString(),
})
// Las reseñas creadas en la demo viven solo en memoria; no se guardan correos ni textos en localStorage.
const demoReviews: DemoReview[] = [
  seedReview(101, 5, 1), seedReview(101, 4, 2), seedReview(101, 5, 3), seedReview(102, 4, 4), seedReview(102, 4, 5),
  seedReview(103, 3, 6), seedReview(104, 5, 7), seedReview(104, 5, 8), seedReview(104, 4, 9), seedReview(104, 5, 10),
]
let nextReviewId = 90000

// ---- Administración y reputación (Sprints 3 y 5): estados solo en memoria; se reinician al recargar. ----
// Médicos que aún no son públicos: sirven para probar la moderación sin alterar el directorio inicial.
const PENDING_DOCTORS: DemoDoctor[] = ['Sofía', 'Andrés', 'Paula'].map((nombres, index) => ({
  id: 201 + index, nombres, apellidos: ['Pendiente Demo', 'Revisión Prueba', 'Ejemplo Nuevo'][index], colegiatura: `CMP-DEMO-${201 + index}`,
  especialidadIds: [(index % 3) + 1],
  biografia: 'Perfil ficticio pendiente de revisión. Ninguna persona real corresponde a estos datos.',
  aniosExperiencia: 2 + index,
  centros: [{ id: 300 + index, nombre: `Centro pendiente ${index + 1}`, direccion: `Av. Ejemplo ${500 + index * 10}`, ciudad: DEMO_CITIES[index] }],
}))
const ALL_DOCTORS = [...DEMO_DOCTORS, ...PENDING_DOCTORS]
const PROFILE_STATUSES: DoctorProfileStatus[] = ['PENDIENTE_REVISION', 'APROBADO', 'SUSPENDIDO', 'DESHABILITADO']
const LICENSE_STATUSES: LicenseStatus[] = ['PENDIENTE_VERIFICACION', 'VERIFICADA', 'RECHAZADA']
// Solo se guardan los estados que difieren del valor por defecto (médico aprobado y verificado; reseña visible).
const profileStatus = new Map<number, DoctorProfileStatus>(PENDING_DOCTORS.map((item) => [item.id, 'PENDIENTE_REVISION']))
const licenseStatus = new Map<number, LicenseStatus>(PENDING_DOCTORS.map((item) => [item.id, 'PENDIENTE_VERIFICACION']))
const profileStatusOf = (id: number): DoctorProfileStatus => profileStatus.get(id) ?? 'APROBADO'
const licenseStatusOf = (id: number): LicenseStatus => licenseStatus.get(id) ?? 'VERIFICADA'
/** Igual que el backend: el directorio solo publica perfiles aprobados con colegiatura verificada. */
const isPublic = (doctor: DemoDoctor) => profileStatusOf(doctor.id) === 'APROBADO' && licenseStatusOf(doctor.id) === 'VERIFICADA'

const pendingReviews = [seedReview(105, 2, 11), seedReview(102, 1, 12)]
demoReviews.push(...pendingReviews)
const reviewStatus = new Map<number, ReviewStatus>(pendingReviews.map((item) => [item.id, 'PENDIENTE_REVISION']))
const reviewStatusOf = (id: number): ReviewStatus => reviewStatus.get(id) ?? 'VISIBLE'
/** Solo las reseñas visibles se listan públicamente y cuentan para el promedio. */
const visibleReviewsOf = (medicoId: number) => demoReviews.filter((item) => item.medicoId === medicoId && reviewStatusOf(item.id) === 'VISIBLE')

const blockedUsers = new Set<string>()
const DEMO_SELF_DOCTOR_ID = 101 // El médico de demostración consulta la reputación de este perfil ficticio.

function paginate<T>(items: T[], page = 0, size = 20): PageResponse<T> {
  const safeSize = Math.min(100, Math.max(1, Math.trunc(size)))
  const safePage = Math.max(0, Math.trunc(page))
  return { items: items.slice(safePage * safeSize, (safePage + 1) * safeSize), page: safePage, size: safeSize, total: items.length }
}
function adminDoctor(id: number): DemoDoctor {
  const found = ALL_DOCTORS.find((item) => item.id === id)
  if (!found) throw new ApiError(404, 'El médico no existe.')
  return found
}
const toAdminDoctor = (doctor: DemoDoctor): AdminDoctor => ({
  id: doctor.id, nombres: doctor.nombres, apellidos: doctor.apellidos, colegiatura: doctor.colegiatura,
  estadoColegiatura: licenseStatusOf(doctor.id), estadoPerfil: profileStatusOf(doctor.id),
})
function demoUsers(): AdminUser[] {
  const accounts = [
    ...Object.entries(FIXED_USERS).map(([username, value]) => ({ username, rol: value.rol })),
    ...[...registered].map(([username, value]) => ({ username, rol: value.rol })),
  ]
  return accounts.map((account, index) => ({ id: index + 1, ...account, habilitado: !blockedUsers.has(account.username) }))
}
function toAdminReview(review: DemoReview): AdminReview {
  const doctor = ALL_DOCTORS.find((item) => item.id === review.medicoId)
  return {
    id: review.id, medicoId: review.medicoId, medicoNombre: doctor ? `${doctor.nombres} ${doctor.apellidos}` : `Médico ${review.medicoId}`,
    // Alias sin correo: la moderación no necesita identificar al paciente.
    paciente: `Paciente ${review.id}`, puntuacion: review.puntuacion, comentario: review.comentario,
    estado: reviewStatusOf(review.id), fechaCreacion: review.fechaCreacion,
  }
}

const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
function reputationOf(medicoId: number) {
  const items = visibleReviewsOf(medicoId)
  const total = items.length
  return { total, promedio: total ? Math.round((items.reduce((sum, item) => sum + item.puntuacion, 0) / total) * 10) / 10 : null }
}
function demoDoctor(id: number): DemoDoctor {
  const found = ALL_DOCTORS.find((item) => item.id === id)
  if (!found || !isPublic(found)) throw new ApiError(404, 'Este perfil no está disponible.')
  return found
}
function toSummary(doctor: DemoDoctor): DoctorSummary {
  const stats = reputationOf(doctor.id)
  return {
    id: doctor.id, nombres: doctor.nombres, apellidos: doctor.apellidos, fotoUrl: null, colegiatura: doctor.colegiatura,
    estadoColegiatura: 'VERIFICADA',
    especialidades: store().specialties.filter((item) => doctor.especialidadIds.includes(item.id)).map(({ id, nombre }) => ({ id, nombre })),
    ciudades: [...new Set(doctor.centros.map((center) => center.ciudad))],
    promedioCalificacion: stats.promedio, totalResenas: stats.total,
  }
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
        if (blockedUsers.has(username)) break
        if (fixed?.rol === rol || registered.get(username)?.rol === rol) return { token, username, rol }
      } catch { break }
    }
    throw new ApiError(401, 'Sesión de prueba vencida.')
  },
  async login(username: string, password: string): Promise<Session> {
    await pause()
    const fixed = FIXED_USERS[username as keyof typeof FIXED_USERS]
    const temporary = registered.get(username)
    const role = fixed?.password === password ? fixed.rol
      : temporary?.password === password ? temporary.rol : null
    if (!role) throw new ApiError(401, 'Credenciales de prueba inválidas.')
    if (blockedUsers.has(username)) throw new ApiError(403, 'Esta cuenta está bloqueada. Contacta a un administrador.')
    return { token: `demo:${role}:${encodeURIComponent(username)}`, username, rol: role }
  },
  async register(username: string, password: string, colegiatura: string) {
    await pause()
    const s = store()
    if (!username || !colegiatura || password.length < 8) throw new ApiError(400, 'Completa los datos de registro.')
    if (username in FIXED_USERS || registered.has(username)) throw new ApiError(409, 'Ese usuario ya existe en los datos de prueba.')
    if (Object.values(s.profiles).some((item) => item.colegiatura.toLowerCase() === colegiatura.toLowerCase())) throw new ApiError(409, 'Esa colegiatura ya existe en los datos de prueba.')
    // La contraseña de una cuenta creada aquí solo vive en memoria; nunca se guarda en localStorage.
    registered.set(username, { password, colegiatura, rol: 'ROLE_MEDICO' })
    s.profiles[username] = { biografia: '', aniosExperiencia: null, fotoUrl: null, colegiatura, estadoColegiatura: 'PENDIENTE_VERIFICACION', especialidadIds: [] }
    s.centers[username] = []
    s.nextUserId += 1
    save()
  },
  async registerPatient(username: string, password: string) {
    await pause()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || username.length > 100 || password.length < 8 || password.length > 72) {
      throw new ApiError(400, 'Indica un correo válido y una contraseña de 8 a 72 caracteres.')
    }
    if (username in FIXED_USERS || registered.has(username)) throw new ApiError(409, 'Ese usuario ya existe en los datos de prueba.')
    // Las cuentas nuevas y sus contraseñas permanecen solo en memoria en el modo de prueba.
    registered.set(username, { password, rol: 'ROLE_PACIENTE' })
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
  // Igual que el backend (permitAll): el catálogo de especialidades activas es público y el token es opcional.
  async listSpecialties() { await pause(); return copy(store().specialties.filter((item) => item.habilitada)) },
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

  async listAdminAudit(token: string, page = 0, size = 20) {
    userFromToken(token, 'ROLE_ADMIN')
    return createMockAuditRepository('normal').list({ page: Math.max(0, Math.trunc(page)), size: Math.min(100, Math.max(1, Math.trunc(size))) })
  },

  async searchDoctors(filters: DoctorSearchFilters = {}): Promise<PageResponse<DoctorSummary>> {
    await pause()
    const size = Math.min(50, Math.max(1, Math.trunc(filters.size ?? 10)))
    const page = Math.max(0, Math.trunc(filters.page ?? 0))
    const name = plain(filters.nombre?.trim() ?? '')
    const city = plain(filters.ciudad?.trim() ?? '')
    const license = filters.colegiatura?.trim().toLowerCase() ?? ''
    const matches = ALL_DOCTORS.filter(isPublic).map(toSummary).filter((item) =>
      (!name || plain(`${item.nombres} ${item.apellidos}`).includes(name))
      && (filters.especialidadId === undefined || item.especialidades.some((entry) => entry.id === filters.especialidadId))
      && (!city || item.ciudades.some((entry) => plain(entry).includes(city)))
      && (!license || item.colegiatura.toLowerCase().includes(license))
      && (filters.calificacionMinima === undefined || (item.promedioCalificacion != null && item.promedioCalificacion >= filters.calificacionMinima)),
    ).sort((a, b) => a.apellidos.localeCompare(b.apellidos, 'es') || a.nombres.localeCompare(b.nombres, 'es'))
    return { items: matches.slice(page * size, (page + 1) * size), page, size, total: matches.length }
  },
  async getDoctorDetail(id: number): Promise<DoctorDetail> {
    await pause()
    const doctor = demoDoctor(id)
    return { ...toSummary(doctor), biografia: doctor.biografia, aniosExperiencia: doctor.aniosExperiencia, centros: copy(doctor.centros) }
  },

  // Sustituto aislado del backend: la lógica de emergencia/fallback real vive en el servidor (Integrantes 1 y 3).
  async triage(mensaje: string): Promise<TriageResponse> {
    await new Promise((resolve) => setTimeout(resolve, 650))
    const text = plain(mensaje.trim())
    if (!text || text.length > 1000) throw new ApiError(400, 'Escribe una consulta de entre 1 y 1000 caracteres.')
    if (/dolor de pecho|no puedo respirar|desmayo|sangrado abundante|convulsi/.test(text)) {
      return { emergencia: true, fallback: false, especialidad: null, orientacion: 'Busca atención de urgencia de inmediato o llama a emergencias.' }
    }
    const hintedId = /corazon|presion|palpitaciones/.test(text) ? 2 : /nino|bebe|hijo|pediatr/.test(text) ? 3 : null
    if (text.includes('simular caida')) {
      // Si el mensaje también nombra una especialidad reconocible, el fallback la conserva (como puede hacer el backend).
      const hinted = store().specialties.find((item) => item.id === hintedId && item.habilitada)
      return {
        emergencia: false, fallback: true, especialidad: hinted ? { id: hinted.id, nombre: hinted.nombre } : null,
        orientacion: 'El asistente no está disponible. Continúa con la búsqueda manual en el directorio.',
      }
    }
    const id = hintedId ?? 1
    const specialty = store().specialties.find((item) => item.id === id && item.habilitada)
    return {
      emergencia: false, fallback: false, especialidad: specialty ? { id: specialty.id, nombre: specialty.nombre } : null,
      orientacion: specialty ? `Por lo que cuentas, una consulta de ${specialty.nombre} puede orientarte mejor. Esto no es un diagnóstico.` : null,
    }
  },

  async createReview(token: string, medicoId: number, value: ReviewInput): Promise<Review> {
    await pause()
    const paciente = userFromToken(token, 'ROLE_PACIENTE')
    demoDoctor(medicoId)
    if (!Number.isInteger(value.puntuacion) || value.puntuacion < 1 || value.puntuacion > 5) throw new ApiError(400, 'La puntuación debe ser un número entero de 1 a 5.')
    const comentario = value.comentario.trim()
    if (comentario.length > 500) throw new ApiError(400, 'El comentario admite hasta 500 caracteres.')
    if (demoReviews.some((item) => item.medicoId === medicoId && item.paciente === paciente)) throw new ApiError(409, 'Ya calificaste a este médico. Solo se permite una reseña por paciente.')
    const review: DemoReview = { id: nextReviewId++, medicoId, paciente, puntuacion: value.puntuacion, comentario: comentario || null, fechaCreacion: new Date().toISOString() }
    demoReviews.push(review)
    return { id: review.id, puntuacion: review.puntuacion, comentario: review.comentario, fechaCreacion: review.fechaCreacion }
  },
  async listReviews(medicoId: number, page = 0, size = 5): Promise<ReviewPage> {
    await pause()
    demoDoctor(medicoId)
    const safeSize = Math.min(50, Math.max(1, Math.trunc(size)))
    const safePage = Math.max(0, Math.trunc(page))
    const all = visibleReviewsOf(medicoId)
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.id - a.id)
    return {
      items: all.slice(safePage * safeSize, (safePage + 1) * safeSize)
        .map(({ id, puntuacion, comentario, fechaCreacion }) => ({ id, puntuacion, comentario, fechaCreacion })),
      page: safePage, size: safeSize, total: all.length, promedio: reputationOf(medicoId).promedio,
    }
  },
  async getMyReputation(token: string, page = 0, size = 5): Promise<ReviewPage> {
    await pause()
    const username = userFromToken(token, 'ROLE_MEDICO')
    const medicoId = username === 'medico.demo@prueba.local' ? DEMO_SELF_DOCTOR_ID : null
    const all = (medicoId === null ? [] : visibleReviewsOf(medicoId))
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.id - a.id)
      .map(({ id, puntuacion, comentario, fechaCreacion }) => ({ id, puntuacion, comentario, fechaCreacion }))
    return { ...paginate(all, page, Math.min(50, size)), promedio: medicoId === null ? null : reputationOf(medicoId).promedio }
  },

  async listAdminDoctors(token: string, filters: { estadoPerfil?: DoctorProfileStatus; page?: number; size?: number } = {}): Promise<PageResponse<AdminDoctor>> {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    const items = ALL_DOCTORS.map(toAdminDoctor)
      .filter((item) => !filters.estadoPerfil || item.estadoPerfil === filters.estadoPerfil)
      .sort((a, b) => a.apellidos.localeCompare(b.apellidos, 'es') || a.nombres.localeCompare(b.nombres, 'es'))
    return paginate(items, filters.page, filters.size)
  },
  async updateDoctorProfileStatus(token: string, id: number, estadoPerfil: DoctorProfileStatus): Promise<AdminDoctor> {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    const doctor = adminDoctor(id)
    if (!PROFILE_STATUSES.includes(estadoPerfil)) throw new ApiError(400, 'Estado de perfil no válido.')
    if (profileStatusOf(id) === estadoPerfil) throw new ApiError(409, 'El perfil ya tiene ese estado.')
    profileStatus.set(id, estadoPerfil)
    return toAdminDoctor(doctor)
  },
  async updateDoctorLicenseStatus(token: string, id: number, estadoColegiatura: LicenseStatus): Promise<AdminDoctor> {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    const doctor = adminDoctor(id)
    if (!LICENSE_STATUSES.includes(estadoColegiatura)) throw new ApiError(400, 'Estado de colegiatura no válido.')
    if (licenseStatusOf(id) === estadoColegiatura) throw new ApiError(409, 'La colegiatura ya tiene ese estado.')
    licenseStatus.set(id, estadoColegiatura)
    return toAdminDoctor(doctor)
  },

  async listAdminUsers(token: string, page = 0, size = 20): Promise<PageResponse<AdminUser>> {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    return paginate(demoUsers(), page, size)
  },
  async updateUserStatus(token: string, id: number, habilitado: boolean): Promise<AdminUser> {
    await pause()
    const actor = userFromToken(token, 'ROLE_ADMIN')
    const user = demoUsers().find((item) => item.id === id)
    if (!user) throw new ApiError(404, 'La cuenta no existe.')
    if (user.username === actor && !habilitado) throw new ApiError(409, 'No puedes bloquear tu propia cuenta.')
    if (user.habilitado === habilitado) throw new ApiError(409, habilitado ? 'La cuenta ya está habilitada.' : 'La cuenta ya está bloqueada.')
    if (habilitado) blockedUsers.delete(user.username)
    else blockedUsers.add(user.username)
    return { ...user, habilitado }
  },

  async listAdminReviews(token: string, filters: { estado?: ReviewStatus; page?: number; size?: number } = {}): Promise<PageResponse<AdminReview>> {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    const items = demoReviews.map(toAdminReview)
      .filter((item) => !filters.estado || item.estado === filters.estado)
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.id - a.id)
    return paginate(items, filters.page, filters.size)
  },
  async updateReviewStatus(token: string, id: number, estado: ReviewStatus): Promise<AdminReview> {
    await pause(); userFromToken(token, 'ROLE_ADMIN')
    const review = demoReviews.find((item) => item.id === id)
    if (!review) throw new ApiError(404, 'La reseña no existe.')
    if (estado !== 'VISIBLE' && estado !== 'OCULTA') throw new ApiError(400, 'Una reseña solo puede quedar visible u oculta.')
    if (reviewStatusOf(id) === estado) throw new ApiError(409, 'La reseña ya tiene ese estado.')
    reviewStatus.set(id, estado)
    return toAdminReview(review)
  },
}
