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

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const base = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

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
      ? data.mensaje : response.status === 401 ? 'Credenciales inválidas o sesión vencida.'
        : response.status === 403 ? 'No tienes permiso para realizar esta acción.'
          : response.status === 404 ? 'Esta función aún no está disponible.'
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
    const result = await request<{ token?: string }>('/auth/login', { method: 'POST', body: json({ username, password }) })
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
    if (identity.username !== username) {
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
  listSpecialties: (token: string) => request<Specialty[]>('/especialidades', {}, token),
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
}
