import { test, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=', 'base64')
const adminCreds = {
  username: process.env.DMI_ADMIN_USER || 'admin@uni.edu.pe',
  password: process.env.DMI_ADMIN_PASS || 'admin123',
}
async function respondio(page, suffix, method, status) {
  const response = await page.waitForResponse(candidate =>
    new URL(candidate.url()).pathname.endsWith(suffix) && candidate.request().method() === method)
  expect(response.status(), `${method} ${suffix}`).toBe(status)
  return response
}

async function ingresar(page, usuario, area) {
  await page.goto('/ingresar')
  await page.getByLabel('Correo o usuario').fill(usuario.username)
  await page.getByLabel('Contraseña', { exact: true }).fill(usuario.password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(area + '$'))
}

async function sinDesborde(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
}

test('SPA real, de aprobación y triage a reseña, reputación y moderación', async ({ browser, baseURL }, info) => {
  const id = randomBytes(4).toString('hex')
  const cmp = `UI-${id}`
  const password = `Ensayo-${randomBytes(16).toString('hex')}`
  const doctor = { username: `ui-med-${id}@ensayo.invalid`, password }
  const paciente = { username: `ui-pac-${id}@ensayo.invalid`, password }
  const doctorCtx = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } })
  const adminCtx = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } })
  const pacienteCtx = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } })
  try {
    const medico = await doctorCtx.newPage()
    const admin = await adminCtx.newPage()
    const page = await pacienteCtx.newPage()
    for (const tab of [medico, admin, page]) tab.setDefaultTimeout(10_000)

    await medico.goto('/registro/medico')
    await medico.getByLabel('Nombres', { exact: true }).fill('Ángela María')
    await medico.getByLabel('Apellidos', { exact: true }).fill('Peña de Ensayo')
    await medico.getByLabel('Correo electrónico').fill(doctor.username)
    await medico.getByLabel('Número de colegiatura').fill(cmp)
    await medico.getByLabel('Contraseña', { exact: true }).fill(password)
    await medico.getByLabel('Repite la contraseña').fill(password)
    const alta = respondio(medico, '/auth/register', 'POST', 201)
    await medico.getByRole('button', { name: 'Crear cuenta médica' }).click()
    const medicoId = (await (await alta).json()).id
    await ingresar(medico, doctor, '/medico')
    await expect(medico.getByLabel('Nombres', { exact: true })).toHaveValue('Ángela María')
    await medico.getByLabel('Biografía').fill('Perfil profesional ficticio para la demostración.')
    await medico.getByLabel('Cardiología', { exact: true }).check()
    const editar = respondio(medico, '/medicos/me/perfil', 'PUT', 200)
    await medico.getByRole('button', { name: 'Guardar perfil' }).click()
    await editar
    const inputFoto = medico.getByLabel('Fotografía de perfil', { exact: true })
    const invalida = respondio(medico, '/medicos/me/foto', 'PUT', 400)
    await inputFoto.setInputFiles({ name: 'invalida.png', mimeType: 'image/png', buffer: Buffer.from('ficticio') })
    await invalida
    await expect(medico.getByRole('alert')).toContainText('formato de imagen')
    let anterior
    for (const formato of ['png', 'webp', 'jpeg']) {
      const mimeType = `image/${formato}`
      const buffer = formato === 'png' ? png : Buffer.from(await medico.evaluate(tipo => {
        const imagen = document.createElement('canvas')
        imagen.width = 8
        imagen.height = 8
        const contexto = imagen.getContext('2d')
        contexto.fillStyle = '#1e3a5f'
        contexto.fillRect(0, 0, 8, 8)
        return imagen.toDataURL(tipo).split(',')[1]
      }, mimeType), 'base64')
      const respuestaFoto = respondio(medico, '/medicos/me/foto', 'PUT', 200)
      await inputFoto.setInputFiles({ name: `ficticia.${formato}`, mimeType, buffer })
      const datos = await (await respuestaFoto).json()
      expect(datos.fotoUrl).not.toBe(anterior)
      expect(datos.fotoUrl).toMatch(new RegExp(`\\.${formato === 'jpeg' ? 'jpg' : formato}$`))
      anterior = datos.fotoUrl
    }
    await medico.getByLabel('Nombre', { exact: true }).fill('Centro UI')
    await medico.getByLabel('Dirección').fill('Calle de ensayo 20')
    await medico.getByLabel('Ciudad', { exact: true }).fill('Lima')
    await medico.getByRole('button', { name: 'Guardar centro' }).click()
    await expect(medico.getByText('Centro UI', { exact: true })).toBeVisible()

    const ficha = `/directorio/medico/${medicoId}`
    await page.goto(ficha)
    await expect(page.getByText(/no está disponible|no se encontró/i).first()).toBeVisible()
    await ingresar(admin, adminCreds, '/admin')
    await admin.goto('/admin/medicos')
    await admin.getByRole('button', { name: 'Pendientes', exact: true }).click()
    const doctorFila = admin.getByRole('row').filter({ hasText: cmp })
    await doctorFila.getByRole('button', { name: 'Verificar CMP', exact: true }).click()
    await admin.getByRole('dialog').getByRole('button', { name: 'Verificar CMP', exact: true }).click()
    await expect(doctorFila.getByRole('button', { name: 'Verificar CMP', exact: true })).toHaveCount(0)
    await doctorFila.getByRole('button', { name: 'Aprobar', exact: true }).click()
    await admin.getByRole('dialog').getByRole('button', { name: /Aprobar/ }).click()
    await expect(admin.getByRole('dialog')).toHaveCount(0)

    await page.goto('/registro/paciente')
    await page.getByLabel('Correo electrónico').fill(paciente.username)
    await page.getByLabel('Contraseña', { exact: true }).fill(password)
    await page.getByLabel('Repite la contraseña').fill(password)
    const altaPaciente = respondio(page, '/auth/register/paciente', 'POST', 201)
    await page.getByRole('button', { name: 'Crear cuenta de paciente' }).click()
    await altaPaciente
    await ingresar(page, paciente, '/paciente')
    await page.goto('/admin/resenas')
    await expect(page).toHaveURL(/\/paciente$/)
    await page.goto('/directorio')
    const nombreInput = page.getByLabel('Nombre o apellido')
    await nombreInput.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Especialidad', { exact: true })).toBeFocused()
    await nombreInput.fill('angela pena')
    await page.getByLabel('Especialidad', { exact: true }).selectOption({ label: 'Cardiología' })
    await page.getByLabel('Ciudad').fill('lima')
    await page.getByLabel('Número de colegiatura').fill(cmp)
    const buscar = respondio(page, '/api/v1/directorio/medicos', 'GET', 200)
    await page.getByRole('button', { name: 'Aplicar filtros' }).click()
    const cruce = await buscar
    const urlBusqueda = new URL(cruce.url())
    expect(urlBusqueda.pathname).toMatch(/\/(?:api\/)?api\/v1\/directorio\/medicos$/)
    expect((await cruce.json()).total).toBe(1)
    await expect(page.getByText('1 médico encontrado')).toBeVisible()
    await page.screenshot({ path: info.outputPath('directorio-escritorio.png'), fullPage: true })
    await page.getByRole('link', { name: /Ver perfil de Ángela María Peña/ }).click()
    await expect(page).toHaveURL(new RegExp(ficha + '$'))
    const imagen = page.getByRole('img', { name: /Fotografía de Ángela María/ })
    await expect(imagen).toBeVisible()
    await expect.poll(() => imagen.evaluate(img => img.naturalWidth)).toBeGreaterThan(0)
    if (process.env.DMI_DIRECT_API_ORIGIN) {
      expect(new URL(await imagen.getAttribute('src'), baseURL).origin).toBe(process.env.DMI_DIRECT_API_ORIGIN)
    }
    await expect(page.getByText('Centro UI', { exact: true })).toBeVisible()
    await page.goto('/asistente')
    const chat = page.getByLabel('Describe cómo te sientes')
    await chat.fill('Consulta ficticia de Cardiología')
    const orienta = respondio(page, '/api/v1/triages', 'POST', 200)
    await chat.press('Enter')
    expect(new URL((await orienta).url()).search).toBe('')
    await expect(page.getByRole('link', { name: /Ver médicos de Cardiología/i })).toBeVisible()
    await chat.fill('Consulta ficticia sin especialidad')
    await chat.press('Enter')
    const manual = page.getByRole('link', { name: 'Buscar manualmente', exact: true })
    await expect(manual).toHaveAttribute('href', '/directorio')
    await manual.click()
    await expect(page).toHaveURL(/\/directorio$/)
    await page.goto('/asistente')
    await chat.fill('Ensayo de dolor torácico')
    await chat.press('Enter')
    await expect(page.getByRole('alert')).toContainText(/urgencia/i)
    await expect(page.getByRole('link', { name: 'Buscar manualmente', exact: true })).toHaveCount(0)
    await page.getByRole('alert').screenshot({ path: info.outputPath('asistente-alerta.png') })

    await page.goto(ficha)
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await expect(page.getByRole('alert')).toContainText('Elige una puntuación')
    const primera = page.getByRole('radio', { name: '1 estrella', exact: true })
    await primera.focus()
    await page.keyboard.press('Space')
    for (let paso = 0; paso < 4; paso++) await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: '5 estrellas' })).toBeFocused()
    const comentario = `Atención ficticia UI ${id}`
    await page.getByLabel('Comentario (opcional)', { exact: true }).fill(comentario)
    const crear = respondio(page, `/medicos/${medicoId}/resenas`, 'POST', 201)
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await crear
    await expect(page.getByText(/tu reseña se registró.*pendiente/i)).toBeVisible()
    await expect(page.getByText(comentario, { exact: true })).toHaveCount(0)
    await page.reload()
    await page.getByRole('radio', { name: '5 estrellas' }).click()
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await expect(page.getByText(/Ya calificaste a este médico/)).toBeVisible()

    await admin.goto('/admin/resenas')
    const resenaFila = admin.getByRole('row').filter({ hasText: comentario })
    await resenaFila.getByRole('button', { name: 'Publicar', exact: true }).click()
    await admin.getByRole('dialog').getByRole('button', { name: 'Publicar reseña' }).click()
    await expect(admin.getByRole('dialog')).toHaveCount(0)
    await page.reload()
    await expect(page.getByText(comentario, { exact: true })).toBeVisible()

    await medico.goto('/medico/reputacion')
    await expect(medico.getByText(comentario, { exact: true })).toBeVisible()
    await medico.setViewportSize({ width: 375, height: 820 })
    await sinDesborde(medico)
    await medico.screenshot({ path: info.outputPath('reputacion-movil.png'), fullPage: true })

    await page.setViewportSize({ width: 375, height: 820 })
    await page.goto(ficha)
    await expect(imagen).toBeVisible()
    await sinDesborde(page)
    await page.screenshot({ path: info.outputPath('ficha-movil.png'), fullPage: true })
    await page.goto('/asistente')
    await expect(chat).toBeVisible()
    await sinDesborde(page)
    const textoAyuda = page.getByText('Enter para enviar', { exact: false })
    const rgb = (await textoAyuda.evaluate(elemento => getComputedStyle(elemento).color)).match(/\d+/g).map(Number)
    const luminancia = rgb.reduce((total, valor, i) => {
      const canal = valor / 255
      return total + [0.2126, 0.7152, 0.0722][i] * (canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4)
    }, 0)
    expect(1.05 / (luminancia + 0.05)).toBeGreaterThanOrEqual(4.5)
    const filtrada = `/directorio?colegiatura=${cmp}&calificacionMinima=4`
    await page.goto(filtrada)
    await expect(page.getByText('1 médico encontrado')).toBeVisible()
    await sinDesborde(page)

    await admin.getByRole('button', { name: 'Visibles', exact: true }).click()
    await resenaFila.getByRole('button', { name: 'Ocultar', exact: true }).click()
    await admin.getByRole('dialog').getByRole('button', { name: 'Ocultar reseña' }).click()
    await expect(admin.getByRole('dialog')).toHaveCount(0)
    await page.reload()
    await expect(page.getByText('0 médicos encontrados')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Limpiar filtros' })).toBeVisible()
    await medico.reload()
    await expect(medico.getByText(comentario, { exact: true })).toHaveCount(0)

    const apiBusqueda = /\/api\/v1\/directorio\/medicos\?/
    await page.route(apiBusqueda, route => route.abort())
    await page.reload()
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
    await page.unroute(apiBusqueda)
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await expect(page.getByText('0 médicos encontrados')).toBeVisible()
  } finally {
    await Promise.all([doctorCtx.close(), adminCtx.close(), pacienteCtx.close()])
  }
})

test('Swagger Authorize conserva los permisos administrativos', async ({ page, request }) => {
  const swagger = process.env.DMI_SWAGGER_URL
  test.skip(!swagger, 'Define DMI_SWAGGER_URL para abrir Swagger en la API directa')
  page.setDefaultTimeout(10_000)
  const login = await request.post(new URL('/auth/login', swagger).toString(), { data: adminCreds })
  expect(login.status()).toBe(200)
  const { token: tokenAdmin } = await login.json()
  const paciente = { username: `swagger-${randomBytes(5).toString('hex')}@ensayo.invalid`, password: randomBytes(20).toString('hex') }
  const alta = await request.post(new URL('/auth/register/paciente', swagger).toString(), { data: paciente })
  expect(alta.status()).toBe(201)
  const loginPaciente = await request.post(new URL('/auth/login', swagger).toString(), { data: paciente })
  expect(loginPaciente.status()).toBe(200)
  const { token: tokenPaciente } = await loginPaciente.json()
  await page.goto(new URL('/swagger-ui/index.html', swagger).toString())
  await expect(page.getByRole('heading', { name: 'Directorio Médico Inteligente API' })).toBeVisible()
  const ruta = '/api/v1/admin/medicos'
  const operacion = page.locator('.opblock-get').filter({ has: page.getByText(ruta, { exact: true }) })
  await operacion.locator('.opblock-summary').click()
  await operacion.getByRole('button', { name: 'Try it out' }).click()
  const anonimo = respondio(page, ruta, 'GET', 401)
  await operacion.getByRole('button', { name: 'Execute' }).click()
  await anonimo
  async function autorizar(token, reemplazar = false) {
    await page.locator('.auth-wrapper').getByRole('button', { name: 'Authorize' }).click()
    const dialogo = page.locator('.dialog-ux')
    if (reemplazar) await dialogo.locator('button').filter({ hasText: /^Logout$/ }).click()
    await dialogo.locator('input').fill(token)
    await dialogo.getByRole('button', { name: 'Apply credentials', exact: true }).click()
    await dialogo.getByRole('button', { name: 'Close', exact: true }).click()
  }
  await autorizar(tokenPaciente)
  const denegado = respondio(page, ruta, 'GET', 403)
  await operacion.getByRole('button', { name: 'Execute' }).click()
  await denegado
  await autorizar(tokenAdmin, true)
  const autorizado = respondio(page, ruta, 'GET', 200)
  await operacion.getByRole('button', { name: 'Execute' }).click()
  await autorizado
})
