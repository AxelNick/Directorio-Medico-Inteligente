import type { AuditPage } from './audit'

export type Role = 'ROLE_MEDICO' | 'ROLE_ADMIN' | 'ROLE_PACIENTE'

export interface Session {
  token: string
  username: string
  rol: Role
}

export interface MedicalProfile {
  biografia: string
  aniosExperiencia: number | null
  fotoUrl: string | null
  colegiatura: string
  estadoColegiatura: 'PENDIENTE_VERIFICACION' | 'VERIFICADA' | 'RECHAZADA'
  especialidadIds: number[]
}

export interface Specialty { id: number; nombre: string; habilitada: boolean }
export interface CareCenter { id: number; nombre: string; direccion: string; ciudad: string }

/** Respuesta paginada común (misma forma que la auditoría): items, page desde 0, size y total de resultados. */
export interface PageResponse<T> { items: T[]; page: number; size: number; total: number }

export interface SpecialtyRef { id: number; nombre: string }

/**
 * Sprint 3 — tarjeta del directorio público (GET /api/v1/directorio/medicos).
 * Solo se devuelven perfiles aprobados con colegiatura verificada; nunca correo ni datos de la cuenta.
 * `promedioCalificacion` y `totalResenas` los entrega el backend (Sprint 5); si faltan, la tarjeta no muestra estrellas.
 */
export interface DoctorSummary {
  id: number
  nombres: string
  apellidos: string
  fotoUrl: string | null
  colegiatura: string
  estadoColegiatura: 'VERIFICADA'
  especialidades: SpecialtyRef[]
  ciudades: string[]
  promedioCalificacion?: number | null
  totalResenas?: number
}

/** Sprint 3 — ficha pública (GET /api/v1/directorio/medicos/{medicoId}). Sin datos privados ni acciones de edición. */
export interface DoctorDetail extends DoctorSummary {
  biografia: string
  aniosExperiencia: number | null
  centros: CareCenter[]
}

/** Los filtros se serializan como query params; el backend ejecuta la búsqueda y calcula el promedio. */
export interface DoctorSearchFilters {
  nombre?: string
  especialidadId?: number
  ciudad?: string
  colegiatura?: string
  /** Sprint 5: umbral mínimo de promedio (por ejemplo 4). */
  calificacionMinima?: number
  /** Índice desde 0. */
  page?: number
  size?: number
  sort?: string
}

/** Sprint 4 — POST /api/v1/triages. */
export interface TriageRequest { mensaje: string }
export interface TriageResponse {
  emergencia: boolean
  fallback: boolean
  especialidad: SpecialtyRef | null
  orientacion: string | null
}

/** Sprint 5 — reseñas visibles de un médico. */
export interface Review { id: number; puntuacion: number; comentario: string | null; fechaCreacion: string }
export interface ReviewInput { puntuacion: number; comentario: string }
export interface ReviewPage extends PageResponse<Review> { promedio: number | null }

/**
 * Sprints 3 y 5 — administración. Contratos PROVISIONALES: siguen las rutas del mapa de endpoints del plan,
 * pero la forma exacta de los DTO debe confirmarse cuando el backend los publique (Integrantes 1 y 3).
 */
export type DoctorProfileStatus = 'PENDIENTE_REVISION' | 'APROBADO' | 'SUSPENDIDO' | 'DESHABILITADO'
export type LicenseStatus = MedicalProfile['estadoColegiatura']
/** Fila de moderación de médicos (GET /api/v1/admin/medicos). */
export interface AdminDoctor {
  id: number
  nombres: string
  apellidos: string
  colegiatura: string
  estadoColegiatura: LicenseStatus
  estadoPerfil: DoctorProfileStatus
}
/** Fila de administración de cuentas (GET /api/v1/admin/usuarios). Nunca incluye contraseña ni hash. */
export interface AdminUser { id: number; username: string; rol: Role; habilitado: boolean }
export type ReviewStatus = 'PENDIENTE_REVISION' | 'VISIBLE' | 'OCULTA'
/** Fila de moderación de reseñas (GET /api/v1/admin/resenas). `paciente` es el identificador que el backend permita mostrar. */
export interface AdminReview {
  id: number
  medicoId: number
  medicoNombre: string
  paciente: string
  puntuacion: number
  comentario: string | null
  estado: ReviewStatus
  fechaCreacion: string
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const base = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

/**
 * Prefijo REST de las APIs nuevas. Se concatena a `base`: con proxy de Vite/nginx la ruta del navegador es
 * /api/api/v1/... (el primer /api lo elimina el proxy) y con VITE_API_BASE_URL es <host>/api/v1/...
 */
export const API_V1 = '/api/v1'
/** Ruta real de auditoría en el backend actual (docs/contratos/auditoria-v1.md). */
export const ADMIN_AUDIT_PATH = '/admin/auditoria'

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (text !== '') search.set(key, text)
  }
  const result = search.toString()
  return result ? `?${result}` : ''
}

export function backendAssetUrl(path: string): string {
  // En Compose /uploads pasa por nginx; con Render separado apunta al origen de la API.
  return path.startsWith('/uploads/') && /^https?:\/\//.test(base)
    ? new URL(path, base).toString() : path
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try {
    response = await fetch(`${base}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Intenta de nuevo.')
  }
  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    const data: unknown = contentType.includes('application/json') ? await response.json().catch(() => null) : null
    const message = data && typeof data === 'object' && 'mensaje' in data && typeof data.mensaje === 'string'
      ? data.mensaje : response.status === 400 ? 'Revisa los datos enviados e inténtalo de nuevo.'
        : response.status === 401 ? 'Credenciales inválidas o sesión vencida.'
          : response.status === 403 ? 'No tienes permiso para realizar esta acción.'
            : response.status === 404 ? 'Esta función aún no está disponible.'
              : response.status === 409 ? 'La solicitud entra en conflicto con un dato ya registrado.'
                : response.status === 429 || response.status >= 500 ? 'El servicio no está disponible en este momento. Inténtalo más tarde.'
                  : `No se pudo completar la solicitud (${response.status}).`
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const json = (value: unknown) => JSON.stringify(value)

export const api = {
  async resume(token: string): Promise<Session> {
    const identity = await request<{ username?: string; rol?: string }>('/auth/me', {}, token)
    if (!identity.username || !['ROLE_MEDICO', 'ROLE_ADMIN', 'ROLE_PACIENTE'].includes(identity.rol ?? '')) {
      throw new ApiError(401, 'La sesión ya no es válida.')
    }
    return { token, username: identity.username, rol: identity.rol as Role }
  },
  async login(username: string, password: string): Promise<Session> {
    // El backend busca y devuelve el usuario normalizado en minúsculas.
    const normalizedUsername = username.trim().toLowerCase()
    const result = await request<{ token?: string }>('/auth/login', { method: 'POST', body: json({ username: normalizedUsername, password }) })
    if (!result.token) throw new ApiError(502, 'El backend no entregó una sesión válida.')
    // Un JWT del prototipo no basta: /auth/me debe confirmar usuario y rol desde el servidor.
    let identity: Session
    try { identity = await api.resume(result.token) }
    catch (cause) {
      if (cause instanceof ApiError && [403, 404].includes(cause.status)) {
        throw new ApiError(503, 'El backend todavía no confirma las sesiones de Sprint 2.')
      }
      throw cause
    }
    if (identity.username !== normalizedUsername) {
      throw new ApiError(502, 'El backend no confirmó la identidad de esta sesión.')
    }
    return identity
  },
  async register(username: string, password: string, colegiatura: string) {
    const result = await request<{ id?: number; username?: string; estadoColegiatura?: string }>(
      '/auth/register', { method: 'POST', body: json({ username, password, colegiatura }) },
    )
    if (!result.id || result.username !== username || result.estadoColegiatura !== 'PENDIENTE_VERIFICACION') {
      throw new ApiError(502, 'El backend aún no confirma registros persistidos. No se creó una cuenta verificable.')
    }
  },
  async registerPatient(username: string, password: string) {
    // El backend asigna ROLE_PACIENTE y devuelve el id persistido; nunca enviamos un rol desde el cliente.
    const result = await request<{ id?: number; username?: string; rol?: string }>(
      '/auth/register/paciente', { method: 'POST', body: json({ username, password }) },
    )
    if (!result.id || result.username !== username || result.rol !== 'ROLE_PACIENTE') {
      throw new ApiError(502, 'No se pudo confirmar la creación de la cuenta.')
    }
  },
  getProfile: (token: string) => request<MedicalProfile>('/medicos/me/perfil', {}, token),
  updateProfile: (token: string, value: Pick<MedicalProfile, 'biografia' | 'aniosExperiencia' | 'colegiatura' | 'especialidadIds'>) =>
    request<MedicalProfile>('/medicos/me/perfil', { method: 'PUT', body: json(value) }, token),
  uploadPhoto: (token: string, file: File) => {
    const body = new FormData()
    body.append('foto', file)
    return request<MedicalProfile>('/medicos/me/foto', { method: 'PUT', body }, token)
  },
  // GET /especialidades es público (permitAll): el token es opcional y el directorio lo usa sin sesión.
  listSpecialties: (token?: string) => request<Specialty[]>('/especialidades', {}, token),
  listAdminSpecialties: (token: string) => request<Specialty[]>('/admin/especialidades', {}, token),
  createSpecialty: (token: string, nombre: string) => request<Specialty>('/admin/especialidades', { method: 'POST', body: json({ nombre }) }, token),
  updateSpecialty: (token: string, id: number, value: Pick<Specialty, 'nombre' | 'habilitada'>) =>
    request<Specialty>(`/admin/especialidades/${id}`, { method: 'PUT', body: json(value) }, token),
  listCenters: (token: string) => request<CareCenter[]>('/medicos/me/centros', {}, token),
  createCenter: (token: string, value: Omit<CareCenter, 'id'>) =>
    request<CareCenter>('/medicos/me/centros', { method: 'POST', body: json(value) }, token),
  updateCenter: (token: string, id: number, value: Omit<CareCenter, 'id'>) =>
    request<CareCenter>(`/medicos/me/centros/${id}`, { method: 'PUT', body: json(value) }, token),
  deleteCenter: (token: string, id: number) => request<void>(`/medicos/me/centros/${id}`, { method: 'DELETE' }, token),

  /**
   * Sprint 1/2 — auditoría (solo ROLE_ADMIN). Respeta la paginación del backend (page desde 0) y acota size.
   * Los errores 401, 403 y de red llegan como ApiError con mensaje legible; una respuesta mal formada se rechaza.
   */
  async listAdminAudit(token: string, page = 0, size = 20): Promise<AuditPage> {
    const result = await request<AuditPage>(`${ADMIN_AUDIT_PATH}${query({
      page: Math.max(0, Math.trunc(page)), size: Math.min(100, Math.max(1, Math.trunc(size))),
    })}`, {}, token)
    if (!result || !Array.isArray(result.items) || typeof result.total !== 'number') {
      throw new ApiError(502, 'El backend devolvió una respuesta de auditoría inesperada.')
    }
    return result
  },

  // Sprint 3 — directorio público. Sin token: son GET cacheables y no dependen de la sesión.
  searchDoctors: (filters: DoctorSearchFilters = {}) => request<PageResponse<DoctorSummary>>(
    `${API_V1}/directorio/medicos${query({
      nombre: filters.nombre, especialidadId: filters.especialidadId, ciudad: filters.ciudad,
      colegiatura: filters.colegiatura, calificacionMinima: filters.calificacionMinima,
      page: filters.page, size: filters.size, sort: filters.sort,
    })}`),
  getDoctorDetail: (id: number) => request<DoctorDetail>(`${API_V1}/directorio/medicos/${id}`),

  // Sprint 4 — triage. El contrato actual no exige sesión; `token` queda opcional por si el backend lo requiere.
  triage: (mensaje: string, token?: string) => request<TriageResponse>(
    `${API_V1}/triages`, { method: 'POST', body: json({ mensaje } satisfies TriageRequest) }, token),

  // Sprint 5 — reseñas. Crear exige ROLE_PACIENTE; listar es público.
  createReview: (token: string, medicoId: number, value: ReviewInput) =>
    request<Review>(`${API_V1}/medicos/${medicoId}/resenas`, { method: 'POST', body: json(value) }, token),
  listReviews: (medicoId: number, page = 0, size = 5) =>
    request<ReviewPage>(`${API_V1}/medicos/${medicoId}/resenas${query({ page, size })}`),
  // Sprint 5 — reputación del médico autenticado (ROLE_MEDICO): promedio, total y comentarios visibles, solo lectura.
  getMyReputation: (token: string, page = 0, size = 5) =>
    request<ReviewPage>(`${API_V1}/medicos/me/reputacion${query({ page, size })}`, {}, token),

  // Sprint 3 — moderación de médicos (ROLE_ADMIN). PATCH parcial sobre el subrecurso de estado.
  listAdminDoctors: (token: string, filters: { estadoPerfil?: DoctorProfileStatus; page?: number; size?: number } = {}) =>
    request<PageResponse<AdminDoctor>>(
      `${API_V1}/admin/medicos${query({ estadoPerfil: filters.estadoPerfil, page: filters.page, size: filters.size })}`, {}, token),
  updateDoctorProfileStatus: (token: string, id: number, estadoPerfil: DoctorProfileStatus) =>
    request<AdminDoctor>(`${API_V1}/admin/medicos/${id}/estado-perfil`, { method: 'PATCH', body: json({ estadoPerfil }) }, token),
  updateDoctorLicenseStatus: (token: string, id: number, estadoColegiatura: LicenseStatus) =>
    request<AdminDoctor>(`${API_V1}/admin/medicos/${id}/colegiatura`, { method: 'PATCH', body: json({ estadoColegiatura }) }, token),

  // Sprint 3 — cuentas (ROLE_ADMIN). El backend impide el auto-bloqueo y responde 409.
  listAdminUsers: (token: string, page = 0, size = 20) =>
    request<PageResponse<AdminUser>>(`${API_V1}/admin/usuarios${query({ page, size })}`, {}, token),
  updateUserStatus: (token: string, id: number, habilitado: boolean) =>
    request<AdminUser>(`${API_V1}/admin/usuarios/${id}/estado`, { method: 'PATCH', body: json({ habilitado }) }, token),

  // Sprint 5 — moderación de reseñas (ROLE_ADMIN).
  listAdminReviews: (token: string, filters: { estado?: ReviewStatus; page?: number; size?: number } = {}) =>
    request<PageResponse<AdminReview>>(
      `${API_V1}/admin/resenas${query({ estado: filters.estado, page: filters.page, size: filters.size })}`, {}, token),
  updateReviewStatus: (token: string, id: number, estado: ReviewStatus) =>
    request<AdminReview>(`${API_V1}/admin/resenas/${id}`, { method: 'PATCH', body: json({ estado }) }, token),
}
