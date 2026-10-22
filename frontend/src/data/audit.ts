/** Contrato propuesto para GET /admin/auditoria?page=0&size=20. No existe aún en el backend. */
export interface AuditEvent {
  id: string
  actor: string
  accion: string
  entidad: string
  campo: string | null
  valorAnterior: string | null
  valorNuevo: string | null
  ocurrioEn: string
}

export interface AuditPage {
  items: AuditEvent[]
  page: number
  size: number
  total: number
}

export interface AuditRepository {
  list(params: { page: number; size: number }): Promise<AuditPage>
}
