# Sprint 2 — contrato propuesto para integrar el frontend

**Estado:** el código backend incluye registro médico y de paciente, login contra usuarios, `GET /auth/me`, perfil, centros y catálogo. El flujo de paciente se probó localmente contra PostgreSQL; la integración HTTP completa del resto de Sprint 2 aún no se ha verificado. El frontend funciona en desarrollo con un adaptador de datos ficticios; producción usa el cliente HTTP. El [registro de paciente](registro-paciente-v1.md) tiene contrato separado. [Historias del WBS](../wbs-taiga.md): US-MED-01 a 05, US-ADM-01 y US-ADM-03.

## Cuentas y datos de prueba del frontend

Estas credenciales son **públicas, inventadas y solo para el adaptador local de desarrollo**. No existen en PostgreSQL ni deben sembrarse como usuarios reales.

| Rol | Usuario | Contraseña de prueba |
| --- | --- | --- |
| Médico | `medico.demo@prueba.local` | `MedicoDemo2026!` |
| Administrador | `admin.demo@prueba.local` | `AdminDemo2026!` |
| Paciente | `paciente.demo@prueba.local` | `PacienteDemo2026!` |

Con `npm run dev`, el frontend usa el adaptador ficticio de forma predeterminada: login, registros temporales de médico y paciente, perfil, foto, centros y catálogo funcionan sin llamar a Spring Boot. La cuenta de paciente abre `/paciente`, una pantalla sin citas ni historia inventada; su alta real se describe en el [contrato de paciente](registro-paciente-v1.md). Los registros temporales y sus contraseñas viven solo en memoria hasta recargar; los cambios de las cuentas fijas se guardan en `localStorage` bajo `directorio-medico-sprint2-demo-v1`. No introducir datos personales reales en este modo. El distintivo **Entorno de prueba** identifica estas pantallas. La compilación de producción excluye credenciales y datos ficticios.

Para probar el contrato HTTP desde PowerShell en `frontend/`: `$env:VITE_DATA_SOURCE = 'api'; npm run dev`. El proxy Vite envía `/api/*` a `http://127.0.0.1:8080/*`. Al terminar: `Remove-Item Env:VITE_DATA_SOURCE`. En modo HTTP el frontend exige `GET /auth/me` antes de abrir un área privada.

## Acceso y sesión

| Método y ruta | Solicitud / respuesta esperada |
| --- | --- |
| `POST /auth/register` | `{ "username": "correo", "password": "...", "colegiatura": "..." }` → `201` con `{ "id": 1, "username": "correo", "estadoColegiatura": "PENDIENTE_VERIFICACION" }`. Solo crea médico; el cliente no envía el rol. Nunca devolver hash ni contraseña. |
| `POST /auth/login` | `{ "username": "correo", "password": "..." }` → `200` con `{ "token": "JWT" }`; `401` para credenciales inválidas, incluidas cuentas inexistentes. |
| `GET /auth/me` | Con `Authorization: Bearer <JWT>` → `{ "username": "correo", "rol": "ROLE_MEDICO" }`, `ROLE_ADMIN` o `ROLE_PACIENTE`. El filtro comprueba que el usuario siga habilitado y toma el rol vigente de la base; una cuenta deshabilitada devuelve `401` en esta ruta. |

El frontend guarda solo el token en `sessionStorage` durante la pestaña. Al recargar consulta de nuevo `GET /auth/me` y elimina el token si falla; **Inicio → Mi área** regresa al panel del rol activo. Al salir elimina el token. En la demo, las cuentas fijas se revalidan localmente; una cuenta médica recién registrada deja de existir al recargar. Acordar expiración de JWT, tratamiento de sesión en producción y provisión segura del administrador. La V1 aplicada contiene una cuenta/clave de ejemplo que no debe usarse como cuenta real.

## Autogestión y catálogo

Todas las rutas siguientes requieren JWT. `/medicos/me/**` exige `ROLE_MEDICO` y toma el médico de la sesión; `/admin/**` exige `ROLE_ADMIN`. Nunca aceptar un ID de propietario enviado por el navegador para autorizar escritura.

| Método y ruta | Respuesta / cuerpo esperado |
| --- | --- |
| `GET/PUT /medicos/me/perfil` | Objeto `Perfil` descrito abajo. En `PUT` se envían `biografia`, `aniosExperiencia`, `colegiatura`, `especialidadIds`; devuelve el perfil actualizado. |
| `PUT /medicos/me/foto` | `multipart/form-data` con campo `foto` (JPG, PNG o WebP; máximo propuesto 1 MB) → perfil actualizado con `fotoUrl`. Backend debe validar tipo y tamaño y devolver una URL segura. |
| `GET /especialidades` | Arreglo de `{ "id": 1, "nombre": "Cardiología", "habilitada": true }`; el selector médico solo presenta las activas. |
| `GET /admin/especialidades` | Arreglo con activas y deshabilitadas. |
| `POST /admin/especialidades` | `{ "nombre": "..." }` → especialidad creada con `id` y `habilitada`. |
| `PUT /admin/especialidades/{id}` | `{ "nombre": "...", "habilitada": false }` → especialidad actualizada. Deshabilitar no borra asignaciones existentes. |
| `GET /medicos/me/centros` | Arreglo de `{ "id": 1, "nombre": "...", "direccion": "...", "ciudad": "..." }`. |
| `POST /medicos/me/centros` | Mismo objeto sin `id` → centro creado con `id`. |
| `PUT /medicos/me/centros/{id}` | Mismo objeto sin `id` → centro actualizado; solo de su propietario. |
| `DELETE /medicos/me/centros/{id}` | `204` sin cuerpo; solo de su propietario. |

`Perfil`: `{ "biografia": "...", "aniosExperiencia": 5, "fotoUrl": null, "colegiatura": "...", "estadoColegiatura": "PENDIENTE_VERIFICACION", "especialidadIds": [1] }`. `aniosExperiencia` y `fotoUrl` admiten `null`. La ruta, el tamaño y el almacenamiento de fotografía son propuestas para acordar; el adaptador de prueba usa una imagen local en el navegador. La colegiatura debe ser única y empezar pendiente; su verificación administrativa pertenece a US-ADM-02 (Sprint 3).

## Errores y pruebas de integración

Usar `{ "mensaje": "Explicación breve" }` en errores: `400` validación, `401` sin sesión/credenciales, `403` rol insuficiente, `404` recurso ajeno o inexistente y `409` duplicado (usuario, colegiatura o especialidad). El backend debe validar, aunque el formulario también limite campos.

Antes de dar por integrado: comprobar usuario ficticio rechazado, rol admin real, aislamiento entre dos médicos, persistencia tras nuevo login, colegiatura única y estados del catálogo. La [auditoría](auditoria-v1.md) es un contrato separado de Sprint 1.
