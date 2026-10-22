import type { Role } from '../data/api'

export function rolePath(role: Role) {
  switch (role) {
    case 'ROLE_MEDICO': return '/medico'
    case 'ROLE_ADMIN': return '/admin'
    case 'ROLE_PACIENTE': return '/paciente'
  }
}
