import assert from 'node:assert/strict'
import { createServer } from 'vite'

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
}
globalThis.fetch = () => { throw new Error('El adaptador de prueba no debe llamar a la red') }

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { mockApi } = await vite.ssrLoadModule('/src/data/mockApi.ts')
  const doctor = await mockApi.login('medico.demo@prueba.local', 'MedicoDemo2026!')
  const admin = await mockApi.login('admin.demo@prueba.local', 'AdminDemo2026!')
  const patient = await mockApi.login('paciente.demo@prueba.local', 'PacienteDemo2026!')
  assert.equal(doctor.rol, 'ROLE_MEDICO')
  assert.equal(admin.rol, 'ROLE_ADMIN')
  assert.equal(patient.rol, 'ROLE_PACIENTE')
  assert.deepEqual(await mockApi.resume(patient.token), patient)
  assert.deepEqual(await mockApi.resume(doctor.token), doctor)
  await assert.rejects(mockApi.resume('demo:ROLE_PACIENTE:intruso'), { status: 401 })
  await assert.rejects(mockApi.getProfile(patient.token), { status: 403 })
  await assert.rejects(mockApi.login('medico.demo@prueba.local', 'errónea'), { status: 401 })
  await assert.rejects(mockApi.listAdminSpecialties(doctor.token), { status: 403 })
  await assert.rejects(mockApi.getProfile(admin.token), { status: 403 })

  const profile = await mockApi.getProfile(doctor.token)
  const saved = await mockApi.updateProfile(doctor.token, {
    biografia: 'Texto ficticio actualizado', aniosExperiencia: 6,
    colegiatura: profile.colegiatura, especialidadIds: [1, 2],
  })
  assert.equal(saved.biografia, 'Texto ficticio actualizado')
  assert.deepEqual((await mockApi.getProfile(doctor.token)).especialidadIds, [1, 2])

  const center = await mockApi.createCenter(doctor.token, { nombre: 'Sede de prueba', direccion: 'Av. Ficticia 20', ciudad: 'Lima' })
  assert.equal((await mockApi.listCenters(doctor.token)).length, 2)
  await mockApi.updateCenter(doctor.token, center.id, { nombre: 'Sede editada', direccion: 'Av. Ficticia 20', ciudad: 'Lima' })
  assert.equal((await mockApi.listCenters(doctor.token)).find((item) => item.id === center.id)?.nombre, 'Sede editada')
  await mockApi.deleteCenter(doctor.token, center.id)
  assert.equal((await mockApi.listCenters(doctor.token)).length, 1)

  const specialty = await mockApi.createSpecialty(admin.token, 'Especialidad ficticia')
  assert.ok((await mockApi.listSpecialties(doctor.token)).some((item) => item.id === specialty.id))
  await mockApi.updateSpecialty(admin.token, specialty.id, { nombre: specialty.nombre, habilitada: false })
  assert.ok(!(await mockApi.listSpecialties(doctor.token)).some((item) => item.id === specialty.id))

  await mockApi.register('nuevo.demo@prueba.local', 'ClaveTemporal2026!', 'CMP-DEMO-999')
  assert.equal((await mockApi.login('nuevo.demo@prueba.local', 'ClaveTemporal2026!')).rol, 'ROLE_MEDICO')
  const persisted = values.get('directorio-medico-sprint2-demo-v1')
  assert.ok(persisted)
  assert.ok(!persisted.includes('ClaveTemporal2026!'))
  assert.ok(!persisted.includes('nuevo.demo@prueba.local'))
  process.stdout.write('Demo Sprint 2: tres roles, revalidación de sesión, perfil, centros, catálogo y registro temporal correctos; sin llamadas de red\n')
} finally {
  await vite.close()
}
