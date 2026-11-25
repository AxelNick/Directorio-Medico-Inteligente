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
  await mockApi.registerPatient('nuevo.paciente@prueba.local', 'PacienteTemporal2026!')
  const newPatient = await mockApi.login('nuevo.paciente@prueba.local', 'PacienteTemporal2026!')
  assert.equal(newPatient.rol, 'ROLE_PACIENTE')
  assert.deepEqual(await mockApi.resume(newPatient.token), newPatient)
  await assert.rejects(mockApi.registerPatient('nuevo.demo@prueba.local', 'PacienteTemporal2026!'), { status: 409 })
  await assert.rejects(mockApi.register('nuevo.paciente@prueba.local', 'ClaveTemporal2026!', 'CMP-DEMO-998'), { status: 409 })
  await assert.rejects(mockApi.registerPatient('sin-correo', 'PacienteTemporal2026!'), { status: 400 })
  await assert.rejects(mockApi.listAdminSpecialties(newPatient.token), { status: 403 })
  const persisted = values.get('directorio-medico-sprint2-demo-v1')
  assert.ok(persisted)
  assert.ok(!persisted.includes('ClaveTemporal2026!'))
  assert.ok(!persisted.includes('nuevo.demo@prueba.local'))
  assert.ok(!persisted.includes('nuevo.paciente@prueba.local'))
  assert.ok(!persisted.includes('PacienteTemporal2026!'))

  const { api } = await vite.ssrLoadModule('/src/data/api.ts')
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/auth/register/paciente')
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(init.body), { username: 'nuevo.paciente@prueba.local', password: 'PacienteTemporal2026!' })
    return new Response(JSON.stringify({ id: 7, username: 'nuevo.paciente@prueba.local', rol: 'ROLE_PACIENTE' }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    })
  }
  await api.registerPatient('nuevo.paciente@prueba.local', 'PacienteTemporal2026!')
  // ---- Sprints 3 a 5 en el adaptador de demostración: directorio, triage, reseñas y auditoría ----
  const firstPage = await mockApi.searchDoctors({ page: 0, size: 5 })
  assert.equal(firstPage.items.length, 5)
  assert.equal(firstPage.total, 12)
  assert.ok((await mockApi.searchDoctors({ especialidadId: 2, size: 50 })).items.every((item) => item.especialidades.some((entry) => entry.id === 2)))
  assert.equal((await mockApi.searchDoctors({ nombre: 'ana maria' })).total, 1, 'la búsqueda por nombre ignora tildes y mayúsculas')
  assert.deepEqual((await mockApi.searchDoctors({ calificacionMinima: 4, size: 50 })).items.map((item) => item.id).sort(), [101, 102, 104])
  await assert.rejects(mockApi.getDoctorDetail(999), { status: 404 })
  const detail = await mockApi.getDoctorDetail(105)
  assert.equal(detail.estadoColegiatura, 'VERIFICADA')
  assert.ok(!JSON.stringify(detail).includes('@'), 'la ficha pública no expone correos')

  await assert.rejects(mockApi.createReview(doctor.token, 105, { puntuacion: 5, comentario: '' }), { status: 403 })
  await assert.rejects(mockApi.createReview(patient.token, 105, { puntuacion: 6, comentario: '' }), { status: 400 })
  const review = await mockApi.createReview(patient.token, 105, { puntuacion: 4, comentario: ' Muy atento ' })
  assert.equal(review.comentario, 'Muy atento')
  await assert.rejects(mockApi.createReview(patient.token, 105, { puntuacion: 5, comentario: '' }), { status: 409 })
  const reviews = await mockApi.listReviews(105)
  assert.equal(reviews.total, 1)
  assert.equal(reviews.promedio, 4)
  assert.ok(!('paciente' in reviews.items[0]), 'las reseñas no exponen datos del paciente')
  assert.ok((await mockApi.searchDoctors({ calificacionMinima: 4, size: 50 })).items.some((item) => item.id === 105))

  assert.equal((await mockApi.triage('Tengo dolor de pecho fuerte')).emergencia, true)
  assert.equal((await mockApi.triage('mensaje para simular caída')).fallback, true)
  assert.equal((await mockApi.triage('palpitaciones y presión alta')).especialidad?.id, 2)
  await assert.rejects(mockApi.triage('   '), { status: 400 })
  await assert.rejects(mockApi.listAdminAudit(doctor.token), { status: 403 })
  const auditPage = await mockApi.listAdminAudit(admin.token, 1, 5)
  assert.equal(auditPage.page, 1)
  assert.equal(auditPage.items.length, 5)

  // ---- Administración y reputación en el adaptador de demostración (contratos provisionales) ----
  await assert.rejects(mockApi.listAdminDoctors(doctor.token), { status: 403 })
  const pendingDoctors = await mockApi.listAdminDoctors(admin.token, { estadoPerfil: 'PENDIENTE_REVISION' })
  assert.equal(pendingDoctors.total, 3)
  const candidate = pendingDoctors.items[0]
  await assert.rejects(mockApi.getDoctorDetail(candidate.id), { status: 404 }, 'un perfil pendiente no es público')
  await mockApi.updateDoctorProfileStatus(admin.token, candidate.id, 'APROBADO')
  await assert.rejects(mockApi.getDoctorDetail(candidate.id), { status: 404 }, 'aprobado sin colegiatura verificada sigue sin publicarse')
  assert.equal((await mockApi.updateDoctorLicenseStatus(admin.token, candidate.id, 'VERIFICADA')).estadoColegiatura, 'VERIFICADA')
  assert.equal((await mockApi.getDoctorDetail(candidate.id)).id, candidate.id)
  assert.equal((await mockApi.searchDoctors({ size: 50 })).total, 13)
  await assert.rejects(mockApi.updateDoctorProfileStatus(admin.token, candidate.id, 'APROBADO'), { status: 409 })
  await mockApi.updateDoctorProfileStatus(admin.token, candidate.id, 'SUSPENDIDO')
  assert.equal((await mockApi.searchDoctors({ size: 50 })).total, 12, 'un perfil suspendido sale del directorio')
  await assert.rejects(mockApi.updateDoctorProfileStatus(admin.token, 999, 'APROBADO'), { status: 404 })

  await assert.rejects(mockApi.listAdminUsers(patient.token), { status: 403 })
  const users = await mockApi.listAdminUsers(admin.token)
  assert.ok(!JSON.stringify(users).includes('2026!'), 'el listado de cuentas no expone contraseñas')
  const adminRow = users.items.find((item) => item.username === admin.username)
  await assert.rejects(mockApi.updateUserStatus(admin.token, adminRow.id, false), { status: 409 }, 'un admin no puede bloquearse a sí mismo')
  const patientRow = users.items.find((item) => item.username === 'nuevo.paciente@prueba.local')
  assert.equal((await mockApi.updateUserStatus(admin.token, patientRow.id, false)).habilitado, false)
  await assert.rejects(mockApi.login('nuevo.paciente@prueba.local', 'PacienteTemporal2026!'), { status: 403 })
  await assert.rejects(mockApi.resume(newPatient.token), { status: 401 }, 'una sesión previa al bloqueo deja de ser válida')
  await mockApi.updateUserStatus(admin.token, patientRow.id, true)
  assert.equal((await mockApi.login('nuevo.paciente@prueba.local', 'PacienteTemporal2026!')).rol, 'ROLE_PACIENTE')

  await assert.rejects(mockApi.listAdminReviews(doctor.token), { status: 403 })
  const pendingReviews = await mockApi.listAdminReviews(admin.token, { estado: 'PENDIENTE_REVISION' })
  assert.equal(pendingReviews.total, 2)
  assert.ok(!JSON.stringify(await mockApi.listAdminReviews(admin.token, { size: 100 })).includes('@'), 'la moderación no expone correos de pacientes')
  const visibleBefore = await mockApi.listReviews(101)
  const target = (await mockApi.listAdminReviews(admin.token, { size: 100 })).items.find((item) => item.medicoId === 101 && item.puntuacion === 4)
  assert.equal((await mockApi.updateReviewStatus(admin.token, target.id, 'OCULTA')).estado, 'OCULTA')
  const visibleAfter = await mockApi.listReviews(101)
  assert.equal(visibleAfter.total, visibleBefore.total - 1, 'una reseña oculta deja de listarse')
  assert.equal(visibleAfter.promedio, 5, 'una reseña oculta no cuenta para el promedio')
  await assert.rejects(mockApi.updateReviewStatus(admin.token, target.id, 'OCULTA'), { status: 409 })
  await assert.rejects(mockApi.updateReviewStatus(admin.token, target.id, 'PENDIENTE_REVISION'), { status: 400 })
  await assert.rejects(mockApi.updateReviewStatus(admin.token, 1, 'OCULTA'), { status: 404 })
  const reputation = await mockApi.getMyReputation(doctor.token)
  assert.equal(reputation.total, 2)
  assert.equal(reputation.promedio, 5)
  assert.ok(!('paciente' in reputation.items[0]), 'la reputación no expone datos del paciente')
  await assert.rejects(mockApi.getMyReputation(patient.token), { status: 403 })
  await mockApi.updateReviewStatus(admin.token, target.id, 'VISIBLE')
  assert.equal((await mockApi.listReviews(101)).promedio, visibleBefore.promedio)

  // ---- Contrato HTTP del cliente compartido (sin red real) ----
  const calls = []
  let respond = (url, init) => {
    const target = String(url)
    const created = init.method === 'POST' && !target.includes('/triages')
    const value = target.includes('/admin/auditoria') ? { items: [], page: 0, size: 5, total: 0 }
      : target.includes('/triages') ? { emergencia: false, fallback: false, especialidad: null, orientacion: null }
        : created ? { id: 1, puntuacion: 5, comentario: null, fechaCreacion: '2026-11-24T10:00:00Z' }
          : target.includes('/resenas') ? { items: [], page: 0, size: 5, total: 0, promedio: null }
            : { items: [], page: 0, size: 9, total: 0 }
    return new Response(JSON.stringify(value), { status: created ? 201 : 200, headers: { 'Content-Type': 'application/json' } })
  }
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', auth: new Headers(init.headers).get('Authorization'), body: init.body })
    return respond(url, init)
  }
  await api.searchDoctors({ nombre: ' Ana ', especialidadId: 2, ciudad: '', calificacionMinima: 4, page: 1, size: 9 })
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/directorio/medicos?nombre=Ana&especialidadId=2&calificacionMinima=4&page=1&size=9', method: 'GET', auth: null, body: undefined })
  await api.getDoctorDetail(15)
  assert.equal(calls.at(-1).url, '/api/api/v1/directorio/medicos/15')
  await api.triage('dolor de cabeza')
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/triages', method: 'POST', auth: null, body: '{"mensaje":"dolor de cabeza"}' })
  await api.createReview('tok', 15, { puntuacion: 5, comentario: 'Bien' })
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/medicos/15/resenas', method: 'POST', auth: 'Bearer tok', body: '{"puntuacion":5,"comentario":"Bien"}' })
  await api.listReviews(15, 0, 5)
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/medicos/15/resenas?page=0&size=5', method: 'GET', auth: null, body: undefined })
  await api.listAdminAudit('tok', 0, 500)
  assert.deepEqual(calls.at(-1), { url: '/api/admin/auditoria?page=0&size=100', method: 'GET', auth: 'Bearer tok', body: undefined })
  await api.listAdminDoctors('tok', { estadoPerfil: 'PENDIENTE_REVISION', page: 0, size: 10 })
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/admin/medicos?estadoPerfil=PENDIENTE_REVISION&page=0&size=10', method: 'GET', auth: 'Bearer tok', body: undefined })
  await api.updateDoctorProfileStatus('tok', 7, 'APROBADO')
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/admin/medicos/7/estado-perfil', method: 'PATCH', auth: 'Bearer tok', body: '{"estadoPerfil":"APROBADO"}' })
  await api.updateDoctorLicenseStatus('tok', 7, 'VERIFICADA')
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/admin/medicos/7/colegiatura', method: 'PATCH', auth: 'Bearer tok', body: '{"estadoColegiatura":"VERIFICADA"}' })
  await api.listAdminUsers('tok', 1, 20)
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/admin/usuarios?page=1&size=20', method: 'GET', auth: 'Bearer tok', body: undefined })
  await api.updateUserStatus('tok', 20, false)
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/admin/usuarios/20/estado', method: 'PATCH', auth: 'Bearer tok', body: '{"habilitado":false}' })
  await api.listAdminReviews('tok', { estado: 'PENDIENTE_REVISION' })
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/admin/resenas?estado=PENDIENTE_REVISION', method: 'GET', auth: 'Bearer tok', body: undefined })
  await api.updateReviewStatus('tok', 3, 'OCULTA')
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/admin/resenas/3', method: 'PATCH', auth: 'Bearer tok', body: '{"estado":"OCULTA"}' })
  await api.getMyReputation('tok', 1, 5)
  assert.deepEqual(calls.at(-1), { url: '/api/api/v1/medicos/me/reputacion?page=1&size=5', method: 'GET', auth: 'Bearer tok', body: undefined })
  respond = () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  await assert.rejects(api.listAdminAudit('tok'), { status: 502 })
  respond = () => new Response(JSON.stringify({}), { status: 403, headers: { 'Content-Type': 'application/json' } })
  await assert.rejects(api.listAdminAudit('tok'), { status: 403 })
  respond = () => new Response(JSON.stringify({ mensaje: 'Ya calificaste a este médico.' }), { status: 409, headers: { 'Content-Type': 'application/json' } })
  await assert.rejects(api.createReview('tok', 15, { puntuacion: 5, comentario: '' }), { status: 409, message: 'Ya calificaste a este médico.' })
  globalThis.fetch = () => { throw new TypeError('sin red') }
  await assert.rejects(api.listAdminAudit('tok'), { status: 0 })

  process.stdout.write('Demo: registro, roles, sesión, directorio, triage, reseñas, auditoría y contratos HTTP correctos; sin red real\n')
} finally {
  await vite.close()
}
