# Regresión funcional de los Sprints 1 y 2

Responsable: Integrante 4 (frontend administrativo, integración y QA).
Fecha de ejecución: 2026-11-25. Código probado: `main` en `afc9e3c`.

> **Actualización (2026-11-25): el proyecto ya no usa Flyway.** Por indicación del profesor se retiraron las migraciones en la rama `chore/quitar-flyway` (commit `4200fd0`): Hibernate crea las tablas (`ddl-auto=update`) y `DatosIniciales` carga roles, administrador de desarrollo y catálogo al arrancar. Los casos y defectos afectados están marcados abajo; el resto de resultados corresponde a la ejecución original sobre `main`.

## Entorno

- Backend Spring Boot con el perfil `local` (H2 en memoria, modo PostgreSQL), JDK 25, puerto 8080.
- Frontend con `npm run dev:api` (API real, sin datos simulados), puerto 5173.
- Datos iniciales: roles, administrador de ejemplo y catálogo cargados con los mismos `INSERT` de las migraciones V1 y V2.
- Cuentas de prueba creadas durante la ejecución: un médico y un paciente `qa.*@prueba.local`. No se usaron datos reales.

### Límites de esta ejecución

- **La ejecución original no usó PostgreSQL**, porque la máquina no tenía Docker. El 2026-11-26 se instaló Docker y se levantó `docker compose up --build` sobre `main` en `5225a7f`; con eso se ejecutó R-01 y un recorrido de humo contra PostgreSQL 15. Los demás casos no se repitieron uno por uno contra PostgreSQL.
- Las pruebas de API se hicieron con `curl` contra el backend; las de interfaz, en el navegador contra el frontend en modo API.

## Resultados

Estado: ✅ pasa · ❌ falla · ⚠️ pasa con observación · ⏳ pendiente.

### Arranque y persistencia

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-01 | Arranque desde BD vacía en PostgreSQL 15 con `docker compose` (sin Flyway) | Hibernate crea las tablas y `DatosIniciales` carga los datos base | Las 8 tablas y los 2 índices se crearon; se cargaron los 3 roles, el administrador de desarrollo y las 5 especialidades; el backend arrancó sin errores. Registro, perfil, centros, catálogo, moderación y auditoría respondieron a través del frontend en contenedor | ✅ |
| R-02 | Arranque con el perfil `local` tal como está en el repositorio | Backend utilizable para pruebas | En `main`: arranca sin roles ni administrador; registro y login fallan (D-01). Repetido en `chore/quitar-flyway`: catálogo cargado, registro, login de admin, perfil, centros y auditoría responden bien | ❌ en `main` · ✅ en `chore/quitar-flyway` |
| R-03 | Arranque con el perfil `local` más datos iniciales cargados a mano (solo `main`) | Backend utilizable | Arranca y responde; catálogo con 5 especialidades | ✅ |

### Registro, login y JWT

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-04 | Registrar médico | 201 con id y colegiatura `PENDIENTE_VERIFICACION` | 201, estado correcto | ✅ |
| R-05 | Registrar médico con correo repetido | 409 | 409 "Ya existe una cuenta con ese correo" | ✅ |
| R-06 | Registrar médico con datos inválidos | 400 con mensaje | 400 "La contrasena debe tener entre 8 y 72 caracteres" | ✅ |
| R-07 | Registrar paciente | 201 con rol `ROLE_PACIENTE` asignado por el servidor | 201, rol correcto | ✅ |
| R-08 | Registrar paciente con correo repetido | 409 | 409 | ✅ |
| R-09 | Login con contraseña incorrecta | 401 | 401 "Credenciales invalidas" | ✅ |
| R-10 | Login correcto | 200 con token | 200 con token | ✅ |
| R-11 | `GET /auth/me` con token de médico, paciente y admin | 200 con usuario y rol de cada uno | 200 y rol correcto en los tres | ✅ |
| R-12 | `GET /auth/me` sin token o con token falso | 401 | 401 "No autenticado" | ✅ |
| R-13 | Login desde la interfaz (admin y médico) | Redirige al área de su rol | Admin a `/admin`, médico a `/medico` | ✅ |
| R-14 | Recargar la página con sesión iniciada | La sesión se restaura | Se restaura y mantiene la ruta | ✅ |

### Roles y autorización

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-15 | Paciente o admin consulta `/medicos/me/perfil` | 403 | 403 | ✅ |
| R-16 | Médico o paciente consulta `/admin/especialidades` y `/admin/auditoria` | 403 | 403 | ✅ |
| R-17 | Ruta protegida sin token (`/medicos/me/perfil`, `/admin/auditoria`) | 401 | 403 sin cuerpo (D-02) | ❌ |
| R-18 | Médico abre `/admin/auditoria` en la interfaz | No accede | Redirige a `/medico` | ✅ |
| R-19 | Sin sesión se abre `/admin/auditoria` en la interfaz | No accede | Redirige a `/ingresar` | ✅ |

### Perfil médico, CMP y fotografía

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-20 | Consultar perfil recién creado | 200 con la colegiatura del registro | 200, datos correctos | ✅ |
| R-21 | Editar biografía, años, colegiatura y especialidades | 200 y los cambios persisten | 200; una segunda consulta devuelve los cambios | ✅ |
| R-22 | Editar con años negativos | 400 con mensaje | 400 "Los anios de experiencia no pueden ser negativos" | ✅ |
| R-23 | Asignar una especialidad deshabilitada | 400 | 400 "La especialidad … no esta habilitada" | ✅ |
| R-24 | Subir fotografía PNG | 200 y URL pública accesible | 200; la URL responde 200 `image/png` | ✅ |
| R-25 | Subir un archivo que no es imagen | 400 | 400 "Formato no permitido: usa JPG, PNG o WebP" | ✅ |
| R-26 | Pantalla "Tu perfil profesional" con API real | Muestra perfil, estado de CMP y catálogo activo | Muestra los datos del backend, sin errores en consola | ✅ |

### Centros de atención

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-27 | Crear centro | 201 | 201 | ✅ |
| R-28 | Crear centro con campos vacíos | 400 | 400 "La ciudad es obligatoria" | ✅ |
| R-29 | Editar centro | 200 con los datos nuevos | 200 | ✅ |
| R-30 | Listar centros propios | 200 con el centro editado | 200 | ✅ |
| R-31 | Eliminar centro y repetir la eliminación | 204 y luego 404 | 204 y 404 | ✅ |
| R-32 | Paciente consulta centros de médico | 403 | 403 | ✅ |

### Catálogo de especialidades

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-33 | Admin crea especialidad | 201 | 201 | ✅ |
| R-34 | Crear especialidad repetida o vacía | 409 y 400 | 409 y 400 | ✅ |
| R-35 | Deshabilitar especialidad | 200 y deja de salir en `GET /especialidades` | 200; el listado público ya no la incluye | ✅ |
| R-36 | Editar especialidad inexistente | 404 | 404 | ✅ |
| R-37 | Pantalla "Catálogo de especialidades" con API real | Lista el catálogo del backend | Lista las 6 especialidades, incluida la deshabilitada | ✅ |

### Auditoría

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-38 | `GET /admin/auditoria` como admin | 200 paginado con actor, acción, entidad, campo y valores | 200; 7 eventos con todos los campos | ✅ |
| R-39 | Cambios de perfil y catálogo quedan auditados | Un evento por campo modificado | 4 eventos de perfil, crear y deshabilitar especialidad | ✅ |
| R-40 | Cambios de centros quedan auditados | Crear, editar y eliminar registrados | Solo se registró "crear"; editar y eliminar no (D-03) | ⚠️ |
| R-41 | Página `/admin/auditoria` con API real | Muestra los eventos reales con paginación | 7 filas, "Página 1 de 1 · 7 registros", sin errores | ✅ |

### CORS

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| R-42 | Preflight `PUT` y `DELETE` desde `http://localhost:5173` | 200 | 200 | ✅ |
| R-43 | Preflight desde un origen no permitido | Rechazado | 403 | ✅ |
| R-44 | Preflight `PATCH` desde `http://localhost:5173` | 200 | 403 (D-04) | ❌ |

## Defectos y observaciones

> **Seguimiento (2026-11-26, `main` en `df0213a`):** tras el PR 17 se repitieron los casos fallidos. D-02, D-03 y D-04 quedan corregidos: sin token responde 401 con mensaje, la auditoría registra crear, editar y eliminar centros, y el preflight de `PATCH` responde 200. Apareció un defecto nuevo, D-06, que ya está corregido y comprobado contra PostgreSQL en Docker.

| ID | Severidad | Descripción | Cómo reproducir | Responsable sugerido |
|---|---|---|---|---|
| D-01 | Media | El perfil `local` no deja el backend utilizable: desactiva Flyway y no carga roles ni administrador. Registrar devuelve error ("No existe el rol ROLE_MEDICO") y el admin de ejemplo no puede entrar. | `mvnw spring-boot:run -Dspring-boot.run.profiles=local` y luego `POST /auth/register` | Resuelto en `chore/quitar-flyway` (pendiente de fusionar) |
| D-02 | Media | Las rutas protegidas responden 403 sin cuerpo cuando falta el token; el contrato del equipo pide 401 para "no autenticado". Además, un error interno no controlado también llega como 403 vacío, lo que oculta fallos del servidor. | `GET /admin/auditoria` sin cabecera `Authorization` | Integrante 3 |
| D-03 | Baja | La auditoría registra la creación de un centro de atención, pero no su edición ni su eliminación. | Crear, editar y borrar un centro; consultar `/admin/auditoria` | Integrante 3 (cobertura AOP) |
| D-04 | Alta para Sprints 3 y 5 | CORS no permite `PATCH`. Los endpoints de moderación (`PATCH /api/v1/admin/...`) fallarán desde el navegador cuando frontend y backend estén en orígenes distintos. | Preflight `OPTIONS` con `Access-Control-Request-Method: PATCH` | Integrante 3 |
| D-05 | Baja | La migración V3 no corre en H2 (error "tipo de dato desconocido", probablemente por `TIMESTAMPTZ`), por lo que no se puede activar Flyway en el perfil `local`. No afecta a PostgreSQL. | Arrancar el perfil `local` con `spring.flyway.enabled=true` | Ya no aplica: Flyway se retiró en `chore/quitar-flyway` |
| D-06 | Media | Una ruta que no existe responde 500 "Ocurrio un error interno en el servidor" en vez de 404. Afecta a cualquier endpoint aún no implementado, por ejemplo `/api/v1/medicos/me/reputacion`. | `GET /api/v1/no-existe` con un token válido | Corregido por el Integrante 4: ahora responde 404, y 405 si el método no está permitido |

## Estado de los Sprints 3 a 5 en `main`

Solo como referencia para el carry-over; no forma parte de esta regresión. Situación al 2026-11-26 (`df0213a`):

- **Ya existen** (PR 17): `GET /api/v1/admin/medicos`, `PATCH` de estado de perfil y de colegiatura, `GET /api/v1/admin/usuarios`, `PATCH` de estado de cuenta, `GET` y `PATCH` de `/api/v1/admin/resenas`, `/swagger-ui/index.html` y `/v3/api-docs`.
- **Todavía no existen:** `GET /api/v1/directorio/medicos`, `POST /api/v1/triages`, `POST` y `GET /api/v1/medicos/{id}/resenas` y `GET /api/v1/medicos/me/reputacion`.

El detalle de lo probado está en `docs/matriz-aceptacion-sprints-3-5.md`.

## Pendientes consignados en el corte histórico

- Ninguno: los defectos D-01 a D-06 están resueltos. Falta reflejarlo en Taiga.

## Corte del Integrante 1 · 26/11/2026

Versión `106483311b5f8a629a18fbde516f0eea07ba7a76`, PostgreSQL 15.19 en Docker, JUnit con H2 y PostgreSQL, Chromium contra API real.

| Casos | Resultado |
| --- | --- |
| R-01 y R-02 | Aprobados. PostgreSQL vacío, perfil H2 local y pruebas de evolución desde 4200fd0 y 5e1b763. |
| R-04 a R-14 | Aprobados. Registro, validación, duplicado, tres roles, sesión inválida y restauración en SPA. |
| R-15 a R-17 | Aprobados por HTTP y pruebas de seguridad en las rutas de autogestión y administración ejercitadas. |
| R-20 a R-36 | Aprobados por HTTP y navegador según caso. Captura de identidad en alta y edición, JPG/PNG/WebP, centro propio y catálogo activo. |
| R-18, R-19 y R-37 a R-41 | Aprobados por navegador y SQL saneado. La pantalla de auditoría restringe la ruta por rol. Admin ve el catálogo y los eventos reales. Se observaron `CREAR`, `ACTUALIZAR` y `ELIMINAR` de `CentroAtencion`, además de perfil y catálogo. |
| R-42 a R-44 | Preflight PUT, DELETE y PATCH aprobadas para el origen permitido. Origen distinto rechazado. |
| R-03 | Conservado como caso histórico del procedimiento anterior para H2. La versión integrada usa el arranque de R-02. |

Se preservó la corrección del PR #20. El [informe](qa/informe.md) distingue las pruebas de este corte del historial del equipo.
