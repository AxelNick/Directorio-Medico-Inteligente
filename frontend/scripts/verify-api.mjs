import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'

const spa = (process.env.DMI_SPA_URL || 'http://127.0.0.1:15173').replace(/\/$/, '')
const base = (process.env.DMI_API_URL || `${spa}/api`).replace(/\/$/, '')
const publicRoot = '/api/v1/directorio/medicos'
const adminRoot = '/api/v1/admin'
const idRun = randomBytes(4).toString('hex')
const password = `Ensayo-${randomBytes(16).toString('hex')}`
const adminUser = process.env.DMI_ADMIN_USER || 'admin@uni.edu.pe'
const adminPass = process.env.DMI_ADMIN_PASS || 'admin123'
const store = process.env.DMI_STATE_FILE
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=', 'base64')

async function request(path, { method = 'GET', token, body, status = 200, headers = {} } = {}) {
  const options = { method, signal: AbortSignal.timeout(12_000), headers: new Headers(headers) }
  if (token) options.headers.set('Authorization', `Bearer ${token}`)
  if (body instanceof FormData) options.body = body
  else if (body !== undefined) {
    options.headers.set('Content-Type', 'application/json')
    options.body = JSON.stringify(body)
  }
  const response = await fetch(base + path, options)
  const content = response.headers.get('content-type') || ''
  const data = content.includes('application/json') ? await response.json() : null
  assert.ok([status].flat().includes(response.status), `${method} ${path.split('?')[0]}: HTTP ${response.status}, esperado ${status}`)
  if (response.status >= 400) assert.equal(typeof data?.mensaje, 'string', 'Respuesta de error con mensaje')
  return { data, response }
}

async function login(username, key = password, status = 200) {
  return (await request('/auth/login', { method: 'POST', body: { username, password: key }, status })).data.token
}

async function foto(url) {
  const response = await fetch(new URL(url, spa), { signal: AbortSignal.timeout(8_000) })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/png')
  return createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')
}

function archivo(datos) {
  const form = new FormData()
  form.append('foto', new Blob([datos], { type: 'image/png' }), 'perfil.png')
  return form
}

if (process.argv.includes('--persistencia')) {
  assert.ok(store, 'Define DMI_STATE_FILE para comprobar la misma ficha tras recrear')
  const estado = JSON.parse(await readFile(store, 'utf8'))
  const ficha = (await request(`${publicRoot}/${estado.medicoId}`)).data
  const resenas = (await request(`/api/v1/medicos/${estado.medicoId}/resenas`)).data
  assert.equal(ficha.fotoUrl, estado.fotoUrl)
  assert.equal(await foto(ficha.fotoUrl), estado.hashFoto)
  assert.equal(ficha.totalResenas, 1)
  assert.equal(ficha.promedioCalificacion, 5)
  assert.equal(resenas.items[0].id, estado.resenaId)
  console.log('OK persistencia: mismos ID de médico y reseña, misma URL y SHA-256 de foto')
  process.exit(0)
}

assert.equal((await fetch(spa + '/directorio')).status, 200, 'Ruta profunda de la SPA')
await request('/salud')
const catalogo = (await request('/especialidades')).data
const cardio = catalogo.find(e => e.nombre === 'Cardiología')
const general = catalogo.find(e => e.nombre === 'Medicina General')
assert.ok(cardio && general)
if (process.argv.includes('--benchmark')) {
  const filtros = new URLSearchParams({ nombre: 'alicia quinones', especialidadId: cardio.id,
    ciudad: 'lima', colegiatura: 'B-', size: '9' })
  const tiempos = []
  for (let i = 0; i < 30; i++) {
    const inicio = performance.now()
    const { data } = await request(`${publicRoot}?${filtros}`)
    tiempos.push(performance.now() - inicio)
    assert.equal(data.total, 1000)
    assert.equal(data.items.length, 9)
  }
  tiempos.sort((a, b) => a - b)
  assert.ok(tiempos.at(-1) < 2000)
  console.log(`OK US-PAC-03: 1000 coincidencias, 30 GET, mín/p50/p95/máx: ${[0, 14, 28, 29].map(i => tiempos[i].toFixed(1)).join('/')} ms`)
  process.exit(0)
}

const admin = await login(adminUser, adminPass)
assert.equal((await request('/auth/me', { token: admin })).data.rol, 'ROLE_ADMIN')
const username = `medico-${idRun}@ensayo.invalid`
const paciente = `paciente-${idRun}@ensayo.invalid`
const colegiatura = `CMP-${idRun}`
const registro = { username, password, colegiatura, nombres: 'Ángela María', apellidos: 'Quíroz Peña' }
await request('/auth/register', { method: 'POST', status: 400, body: { ...registro, nombres: ' ' } })
const { id: medicoId } = (await request('/auth/register', { method: 'POST', status: 201, body: registro })).data
await request('/auth/register', { method: 'POST', status: 409, body: registro })
const { id: pacienteId } = (await request('/auth/register/paciente', { method: 'POST', status: 201,
  body: { username: paciente, password } })).data
await request('/auth/register/paciente', { method: 'POST', status: 409, body: { username: paciente, password } })
await login(paciente, 'Incorrecta!', 401)
const tokenM = await login(username)
const tokenP = await login(paciente)
assert.equal((await request('/auth/me', { token: tokenM })).data.rol, 'ROLE_MEDICO')
assert.equal((await request('/auth/me', { token: tokenP })).data.rol, 'ROLE_PACIENTE')
await request('/medicos/me/perfil', { status: 401 })
await request('/medicos/me/perfil', { token: tokenP, status: 403 })
const perfil = (await request('/medicos/me/perfil', { token: tokenM })).data
assert.equal(perfil.nombres, registro.nombres)
assert.equal(perfil.apellidos, registro.apellidos)
assert.equal(perfil.estadoColegiatura, 'PENDIENTE_VERIFICACION')
const perfilPut = { ...perfil, biografia: 'Ficha de ensayo', aniosExperiencia: 8, especialidadIds: [cardio.id, general.id] }
await request('/medicos/me/perfil', { method: 'PUT', token: tokenM, status: 400, body: { ...perfilPut, apellidos: '' } })
await request('/medicos/me/perfil', { method: 'PUT', token: tokenM, status: 400, body: { ...perfilPut, aniosExperiencia: -1 } })
await request('/medicos/me/perfil', { method: 'PUT', token: tokenM, body: perfilPut })
const centro = { nombre: 'Consultorio ficticio', direccion: 'Calle de ensayo 10', ciudad: 'Límá' }
await request('/medicos/me/centros', { method: 'POST', token: tokenM, status: 400, body: { ...centro, ciudad: '' } })
const { id: centroId } = (await request('/medicos/me/centros', { method: 'POST', token: tokenM, status: 201, body: centro })).data
await request(`/medicos/me/centros/${centroId}`, { method: 'PUT', token: tokenM, body: { ...centro, nombre: 'Consultorio editado' } })
const otroCentro = (await request('/medicos/me/centros', { method: 'POST', token: tokenM, status: 201, body: centro })).data
const temporal = (await request('/medicos/me/centros', { method: 'POST', token: tokenM, status: 201, body: centro })).data
await request(`/medicos/me/centros/${temporal.id}`, { method: 'DELETE', token: tokenM, status: 204 })
await request(`/medicos/me/centros/${temporal.id}`, { method: 'DELETE', token: tokenM, status: 404 })
assert.equal((await request('/medicos/me/centros', { token: tokenM })).data.length, 2)
await request('/medicos/me/centros', { token: tokenP, status: 403 })
assert.notEqual(centroId, otroCentro.id)
await request('/medicos/me/foto', { method: 'PUT', token: tokenM, status: 400, body: archivo('texto disfrazado') })
await request('/medicos/me/foto', { method: 'PUT', token: tokenM, status: 400, body: archivo(Buffer.alloc(1024 * 1024 + 1)) })
const foto1 = (await request('/medicos/me/foto', { method: 'PUT', token: tokenM, body: archivo(png) })).data.fotoUrl
assert.equal(await foto(foto1), createHash('sha256').update(png).digest('hex'))
const fotoUrl = (await request('/medicos/me/foto', { method: 'PUT', token: tokenM, body: archivo(png) })).data.fotoUrl
assert.notEqual(fotoUrl, foto1)
assert.equal((await fetch(new URL(foto1, spa))).status, 404)
const hashFoto = await foto(fotoUrl)
console.log('OK R-04–R-12, R-15/R-17, R-20–R-22, R-24/R-25, R-27/R-29–R-32: registro, roles, identidad, centros y fotos')

const estadoPerfil = (id, estadoPerfil, status = 200) =>
  request(`${adminRoot}/medicos/${id}/estado-perfil`, { method: 'PATCH', token: admin, body: { estadoPerfil }, status })
const verificar = id => request(`${adminRoot}/medicos/${id}/colegiatura`,
  { method: 'PATCH', token: admin, body: { estadoColegiatura: 'VERIFICADA' } })
const fichaPath = `${publicRoot}/${medicoId}`
const resenaPath = `/api/v1/medicos/${medicoId}/resenas`
const reputacion = '/api/v1/medicos/me/reputacion'
await request(fichaPath, { status: 404 })
await estadoPerfil(medicoId, 'APROBADO')
await request(fichaPath, { status: 404 })
await estadoPerfil(medicoId, 'APROBADO', 409)
await verificar(medicoId)
const fichaInicial = await request(fichaPath)
assert.equal(fichaInicial.data.id, medicoId)
assert.equal(fichaInicial.data.centros.length, 2)
assert.equal(fichaInicial.data.fotoUrl, fotoUrl)
assert.equal(fichaInicial.data.totalResenas, 0)
assert.equal(fichaInicial.data.promedioCalificacion, null)
assert.match(fichaInicial.response.headers.get('cache-control'), /public/)
assert.doesNotMatch(JSON.stringify(fichaInicial.data), /username|correo|@ensayo/)
for (let i = 0; i < 2; i++) {
  const datos = { ...registro, username: `pagina-${i}-${idRun}@ensayo.invalid`, colegiatura: `P${i}-${idRun}` }
  const { id } = (await request('/auth/register', { method: 'POST', status: 201, body: datos })).data
  if (i === 0) { await estadoPerfil(id, 'APROBADO'); await verificar(id) }
  else await request(`${publicRoot}/${id}`, { status: 404 })
}
const filtro = new URLSearchParams({ nombre: 'angela pena', especialidadId: cardio.id, ciudad: 'lima', colegiatura })
const medir = `${publicRoot}?${filtro}`
const resultados = []
for (let i = 0; i < 12; i++) {
  const inicio = performance.now()
  const { data } = await request(medir)
  resultados.push(performance.now() - inicio)
  assert.equal(data.total, 1)
  assert.equal(data.items[0].id, medicoId)
}
resultados.sort((a, b) => a - b)
assert.ok(resultados.at(-1) < 2000, 'Búsqueda filtrada inferior a 2 s en la muestra')
const pag0 = (await request(`${publicRoot}?page=0&size=1&sort=id,desc`)).data
const pag1 = (await request(`${publicRoot}?page=1&size=1&sort=id,desc`)).data
assert.equal(pag1.total, pag0.total)
assert.ok(pag1.total >= 2)
assert.ok(pag0.items[0].id > pag1.items[0].id)
await request(`${publicRoot}?size=101`, { status: 400 })
await request(`${publicRoot}?sort=usuario.password,asc`, { status: 400 })
await estadoPerfil(medicoId, 'SUSPENDIDO')
await request(fichaPath, { status: 404 })
assert.equal((await request(medir)).data.total, 0)
await estadoPerfil(medicoId, 'APROBADO')
await request(`${adminRoot}/medicos`, { token: tokenP, status: 403 })
await request(`${adminRoot}/medicos`, { status: 401 })
const bloquea = habilitado => request(`${adminRoot}/usuarios/${pacienteId}/estado`,
  { method: 'PATCH', token: admin, body: { habilitado } })
await bloquea(false)
await request('/auth/me', { token: tokenP, status: 401 })
await login(paciente, password, 401)
await bloquea(true)
await request('/auth/me', { token: tokenP })
await request('/auth/me', { token: 'token-ficticio-invalido', status: 401 })
const usuarios = (await request(`${adminRoot}/usuarios?size=100`, { token: admin })).data
assert.ok(usuarios.items.every(row => !('password' in row) && !('hash' in row)))
const propio = usuarios.items.find(u => u.username === adminUser)
assert.ok(propio)
await request(`${adminRoot}/usuarios/${propio.id}/estado`, {
  method: 'PATCH', token: admin, status: 409, body: { habilitado: false } })
console.log(`OK A-01–A-13: publicación, límites, búsqueda y roles; total público=${pag0.total}; 12 muestras mín/p50/máx ${resultados[0].toFixed(1)}/${resultados[5].toFixed(1)}/${resultados.at(-1).toFixed(1)} ms`)

const catalogoAdmin = '/admin/especialidades'
const extra = { nombre: `Especialidad ficticia ${idRun}` }
await request(catalogoAdmin, { token: tokenP, status: 403 })
const especialidadExtra = (await request(catalogoAdmin, { method: 'POST', token: admin, status: 201, body: extra })).data
await request(catalogoAdmin, { method: 'POST', token: admin, status: 409, body: extra })
await request(catalogoAdmin, { method: 'POST', token: admin, status: 400, body: { nombre: '' } })
const deshabilita = { ...extra, habilitada: false }
await request(`${catalogoAdmin}/${especialidadExtra.id}`, { method: 'PUT', token: admin, body: deshabilita })
await request(`${catalogoAdmin}/2147483647`, { method: 'PUT', token: admin, status: 404, body: deshabilita })
assert.ok((await request('/especialidades')).data.every(e => e.id !== especialidadExtra.id))
await request('/medicos/me/perfil', { method: 'PUT', token: tokenM, status: 400,
  body: { ...perfilPut, especialidadIds: [cardio.id, especialidadExtra.id] } })
console.log('OK A-14/A-15, R-23/R-33–R-36: autobloqueo, DTO de cuenta y baja lógica del catálogo')

const triage = (mensaje, status = 200) => request('/api/v1/triages', { method: 'POST', status, body: { mensaje } })
assert.equal((await triage('Consulta ficticia de Cardiología')).data.especialidad.id, cardio.id)
const emergencia = (await triage('Señal de ensayo: dolor torácico')).data
assert.equal(emergencia.emergencia, true)
assert.equal(emergencia.especialidad, null)
assert.equal((await triage('Consulta ficticia sin especialidad')).data.fallback, true)
await triage(' ', 400)
await triage('x'.repeat(1001), 400)
console.log('OK B-01/B-02/B-06: triage simulado, alerta, fallback y validación; cuerpo de ensayo omitido del informe')

const publicar = (id, estado, status = 200) => request(`${adminRoot}/resenas/${id}`,
  { method: 'PATCH', token: admin, body: { estado }, status })
const calificar = (token, body, status) => request(resenaPath, { method: 'POST', token, body, status })
const opinion = { puntuacion: 5, comentario: 'Atención ficticia para QA' }
await calificar(undefined, opinion, 401)
await calificar(tokenM, opinion, 403)
await calificar(admin, opinion, 403)
await calificar(tokenP, { puntuacion: 0 }, 400)
await calificar(tokenP, { puntuacion: 5, comentario: 'x'.repeat(501) }, 400)
const intentos = await Promise.all([calificar(tokenP, opinion, [201, 409]), calificar(tokenP, opinion, [201, 409])])
assert.deepEqual(intentos.map(r => r.response.status).sort(), [201, 409])
const resenaId = intentos.find(r => r.response.status === 201).data.id
assert.equal((await request(resenaPath)).data.total, 0)
await request(reputacion, { status: 401 })
await request(reputacion, { token: tokenP, status: 403 })
await request(reputacion, { token: admin, status: 403 })
const pendientes = (await request(`${adminRoot}/resenas?estado=PENDIENTE_REVISION`, { token: admin })).data
assert.ok(pendientes.items.some(r => r.id === resenaId))
assert.doesNotMatch(JSON.stringify(pendientes), /@ensayo/)
const filtroRating = medir + '&calificacionMinima=4'
async function comparar(total, promedio) {
  const respuestas = await Promise.all([request(fichaPath), request(resenaPath), request(reputacion, { token: tokenM }), request(filtroRating)])
  assert.equal(respuestas[0].data.totalResenas, total)
  assert.equal(respuestas[0].data.promedioCalificacion, promedio)
  for (const { data } of respuestas.slice(1, 3)) {
    assert.equal(data.total, total)
    assert.equal(data.promedio, promedio)
    assert.doesNotMatch(JSON.stringify(data), /paciente|@ensayo/)
  }
  assert.match(respuestas[2].response.headers.get('cache-control'), /no-store/)
  assert.equal(respuestas[3].data.total, total)
}
await comparar(0, null)
await publicar(resenaId, 'VISIBLE')
await comparar(1, 5)
await publicar(resenaId, 'OCULTA')
await comparar(0, null)
await publicar(resenaId, 'OCULTA', 409)
await publicar(resenaId, 'PENDIENTE_REVISION', 400)
await publicar(2147483647, 'VISIBLE', 404)
await publicar(resenaId, 'VISIBLE')
await comparar(1, 5)
assert.equal((await request(resenaPath + '?page=1&size=1')).data.items.length, 0)
assert.equal((await request(resenaPath + '?page=1&size=1')).data.total, 1)
const audit = (await request('/admin/auditoria?size=100', { token: admin })).data
assert.ok(audit.items.some(e => JSON.stringify(e).includes('MODERAR_RESENA')))
for (const accion of ['MODERAR_PERFIL', 'MODERAR_COLEGIATURA', 'BLOQUEAR_CUENTA']) {
  assert.ok(audit.items.some(e => JSON.stringify(e).includes(accion)), `Auditoría de ${accion}`)
}
console.log('OK C-01–C-16: roles, validación, 201/409 concurrentes, aprobación, ocultación con caché precalentada, republicación, auditoría y reputación')

await request('/api/v1/no-existe', { token: admin, status: 404 })
await request(publicRoot, { token: admin, method: 'PUT', status: 405 })
const openapi = (await request('/v3/api-docs')).data
assert.ok(openapi.components.securitySchemes.bearerAuth)
assert.ok(openapi.paths[publicRoot].get)
assert.ok(openapi.paths['/api/v1/triages'].post)
assert.ok(openapi.paths['/api/v1/medicos/{medicoId}/resenas'].post.security)
assert.equal((await request('/swagger-ui/index.html')).response.status, 200)
if (process.env.DMI_CORS_ORIGIN) {
  const response = await request(`${adminRoot}/medicos/${medicoId}/estado-perfil`, {
    method: 'OPTIONS', headers: { Origin: process.env.DMI_CORS_ORIGIN, 'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'authorization,content-type' } })
  assert.equal(response.response.headers.get('access-control-allow-origin'), process.env.DMI_CORS_ORIGIN)
  console.log('OK A-17: preflight CORS con PATCH y JWT')
}
console.log('OK D-01–D-04/D-06–D-08: HTTP, OpenAPI, JWT, DTO públicos y cabeceras')
if (store) await writeFile(store, JSON.stringify({ medicoId, resenaId, fotoUrl, hashFoto }, null, 2))
console.log(`Datos ficticios verificados: médico #${medicoId}, reseña #${resenaId}; proveedor simulado`)
