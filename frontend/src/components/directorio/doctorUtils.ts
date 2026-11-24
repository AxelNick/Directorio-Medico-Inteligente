import type { DoctorSummary } from '../../data/api'

export const doctorName = (doctor: Pick<DoctorSummary, 'nombres' | 'apellidos'>) => `${doctor.nombres} ${doctor.apellidos}`.trim()

export function doctorInitials(doctor: Pick<DoctorSummary, 'nombres' | 'apellidos'>) {
  return `${doctor.nombres.trim()[0] ?? ''}${doctor.apellidos.trim()[0] ?? ''}`.toUpperCase()
}
