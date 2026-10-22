import type { AuditEvent, AuditRepository } from '../data/audit'

export type DemoScenario = 'normal' | 'empty' | 'error'

// Identificadores y cambios ficticios. Este archivo solo se carga en modo desarrollo.
const events: AuditEvent[] = Array.from({ length: 23 }, (_, index) => {
  const fields = ['biografia', 'contactoPublico', 'centroAtencion', 'aniosExperiencia']
  const field = fields[index % fields.length]
  return {
    id: `demo-${String(index + 1).padStart(3, '0')}`,
    actor: `usuario_demo_${String((index % 4) + 1).padStart(2, '0')}`,
    accion: index % 3 === 0 ? 'CREAR' : 'ACTUALIZAR',
    entidad: index % 3 === 0 ? 'Centro de atención' : 'Perfil médico',
    campo: index % 3 === 0 ? null : field,
    valorAnterior: index % 3 === 0 ? null : 'Dato de ejemplo anterior',
    valorNuevo: index % 3 === 0 ? 'Centro de ejemplo' : 'Dato de ejemplo actualizado',
    ocurrioEn: new Date(Date.UTC(2026, 9, 20 - Math.floor(index / 4), 14 - (index % 4), 25)).toISOString(),
  }
})

export function createMockAuditRepository(scenario: DemoScenario): AuditRepository {
  return {
    async list({ page, size }) {
      await new Promise((resolve) => setTimeout(resolve, 450))
      if (scenario === 'error') throw new Error('Fallo simulado al consultar auditoría')
      const source = scenario === 'empty' ? [] : events
      return { items: source.slice(page * size, (page + 1) * size), page, size, total: source.length }
    },
  }
}
