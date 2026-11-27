# Matriz de aceptación de los Sprints 3 a 5

Responsable: Integrante 4 (frontend administrativo, integración y QA).
Última actualización: 2026-11-26. Código de referencia: `main` en `df0213a` (incluye el backend administrativo del PR 17).

## Cómo leer esta matriz

Cada caso tiene dos columnas de resultado, porque hoy solo se puede probar una de las dos formas:

- **Demo:** frontend con datos simulados (`npm run dev`). Demuestra que la interfaz y el cliente API se comportan como pide el caso, no que el backend lo cumpla.
  - `auto`: lo comprueba `npm run test:demo`.
  - `nav`: comprobado a mano en el navegador el 2026-11-25.
- **API real:** frontend con `npm run dev:api` contra el backend. Es la que cuenta para dar la historia por terminada.

Estado: ✅ pasa · ❌ falla · ⏳ pendiente · — no aplica en ese modo.

### Situación actual

- **Moderación administrativa y Swagger ya están en `main`** (PR 17 del Integrante 3). Los casos que dependen solo de eso se ejecutaron con API real el 2026-11-26, contra el backend con el perfil `local` (H2).
- **Siguen sin existir** el directorio público, `POST /api/v1/triages`, crear y listar reseñas, y la reputación del médico (Integrante 1). Todos los casos que dependen de ellos siguen pendientes.
- Los JSON de administración quedaron confirmados en `docs/api-contracts.md` y coinciden con el cliente. Los de reputación siguen siendo provisionales.
- Los datos de prueba deben ser ficticios. Las evidencias no deben incluir JWT, claves, correos reales ni texto de síntomas.

## Sprint 3: directorio y moderación administrativa

| ID | Caso | Pasos | Resultado esperado | Demo | API real |
|---|---|---|---|---|---|
| A-01 | Búsqueda por nombre | En `/directorio`, buscar un nombre sin tildes y en minúsculas | Encuentra al médico; la búsqueda la ejecuta el backend | ✅ auto | ⏳ |
| A-02 | Filtro por especialidad | Elegir una especialidad y aplicar | Solo aparecen médicos de esa especialidad | ✅ auto | ⏳ |
| A-03 | Paginación | Listar con tamaño de página menor al total y avanzar | Cada página trae el número pedido y el total es correcto | ✅ auto | ⏳ |
| A-04 | Filtros combinados | Combinar nombre, especialidad, ciudad y colegiatura | Solo aparecen médicos que cumplen todos los filtros | ✅ auto | ⏳ |
| A-05 | Ficha sin datos privados | Abrir la ficha de un médico | No muestra correo ni datos de la cuenta, ni acciones de edición | ✅ auto | ⏳ |
| A-06 | Perfil pendiente no es público | Abrir la ficha de un médico pendiente de revisión | 404; tampoco aparece en el listado | ✅ auto | ⏳ |
| A-07 | Aprobado sin CMP verificado | Aprobar un perfil con colegiatura pendiente y abrir su ficha | Sigue sin publicarse | ✅ auto | ⏳ |
| A-08 | Admin aprueba y verifica | En `/admin/medicos`, aprobar un pendiente y verificar su CMP; luego buscarlo en `/directorio` | El médico pasa a aparecer en el directorio | ✅ auto, nav | ⏳ la moderación funciona (nav); falta el directorio para ver la publicación |
| A-09 | Admin suspende | Suspender un médico publicado y buscarlo en `/directorio` | Deja de aparecer en el directorio | ✅ auto | ⏳ la suspensión funciona; falta el directorio para ver que deja de publicarse |
| A-10 | Transición repetida | Aprobar un perfil que ya está aprobado | 409 con mensaje claro | ✅ auto | ✅ |
| A-11 | Moderación solo para admin | Llamar al listado de moderación como médico o paciente | 403 | ✅ auto | ✅ 403 con otro rol y 401 sin token |
| A-12 | Bloquear una cuenta | En `/admin/usuarios`, bloquear una cuenta e intentar iniciar sesión con ella | La tabla la muestra bloqueada y el login se rechaza | ✅ auto, nav | ✅ el login de la cuenta bloqueada se rechaza (401) |
| A-13 | Bloqueo invalida la sesión | Con un JWT emitido antes del bloqueo, hacer una solicitud protegida | Se rechaza; el filtro comprueba `Usuario.habilitado` | ✅ auto | ✅ 401 con el JWT previo; vuelve a servir al habilitar |
| A-14 | Sin auto-bloqueo | Como admin, intentar bloquear la cuenta propia | La interfaz no ofrece el botón y el backend responde 409 | ✅ auto, nav | ✅ 409 en el backend; la interfaz muestra "Tu cuenta" (nav) |
| A-15 | Listado sin contraseñas | Revisar la respuesta de `GET /api/v1/admin/usuarios` | No incluye contraseña ni hash | ✅ auto | ✅ solo id, username, rol y habilitado |
| A-16 | Moderación auditada | Moderar un perfil, un CMP y una cuenta; abrir `/admin/auditoria` | Un evento por cambio con actor, objetivo, estado anterior y nuevo | — | ✅ perfil, CMP y cuenta, con actor y estado anterior y nuevo (nav) |
| A-17 | CORS con PATCH | Preflight `OPTIONS` con `Access-Control-Request-Method: PATCH` desde el origen del frontend | 200 | — | ✅ corregido en el PR 17 |

## Sprint 4: asistente, triage y fallback

| ID | Caso | Pasos | Resultado esperado | Demo | API real |
|---|---|---|---|---|---|
| B-01 | Triage normal | En `/asistente`, describir una molestia común | Sugiere una especialidad del catálogo y enlaza al directorio filtrado | ✅ auto | ⏳ |
| B-02 | Emergencia | Escribir un mensaje con una señal de riesgo | Alerta prioritaria de urgencia; no se muestra sugerencia de especialidad | ✅ auto, nav | ⏳ |
| B-03 | Emergencia sin llamar al LLM | Repetir B-02 y revisar los logs del backend | No hay llamada al proveedor externo | — | ⏳ |
| B-04 | Proveedor caído | Provocar timeout, 429 o 5xx del proveedor | Aviso de asistente no disponible y botón "Buscar manualmente" | ✅ auto, nav | ⏳ |
| B-05 | Fallback conserva la especialidad | Fallback en el que el backend sí entrega una especialidad válida | "Buscar manualmente" abre el directorio filtrado por ella | ✅ auto, nav | ⏳ |
| B-06 | Mensaje inválido | Enviar un mensaje vacío o de más de 1000 caracteres | 400 con mensaje; el chat no se bloquea | ✅ auto (solo mensaje vacío) | ⏳ |
| B-07 | Solo orienta | Revisar varias respuestas del asistente | No diagnostica, no receta ni recomienda tratamientos | — | ⏳ |
| B-08 | Síntomas fuera de URL y logs | Enviar un mensaje y revisar la solicitud y los logs | El texto viaja en el cuerpo del POST y no aparece completo en logs | — | ⏳ |
| B-09 | Adapter y Factory Method | Revisar el código y el diagrama del backend | `TriageService` depende de la interfaz; existen creador externo y simulado | — | ⏳ |

## Sprint 5: reputación y calificación

| ID | Caso | Pasos | Resultado esperado | Demo | API real |
|---|---|---|---|---|---|
| C-01 | Crear reseña | Como paciente, calificar a un médico con 1 a 5 estrellas y comentario | 201; la reseña aparece en la ficha | ✅ auto | ⏳ |
| C-02 | Puntuación fuera de rango | Enviar una puntuación de 0 o 6 | 400 | ✅ auto | ⏳ |
| C-03 | Una reseña por paciente y médico | Calificar dos veces al mismo médico | La segunda responde 409 | ✅ auto | ⏳ |
| C-04 | Solo pacientes califican | Intentar crear una reseña como médico | 403 | ✅ auto | ⏳ |
| C-05 | Reseñas públicas sin datos del paciente | Revisar la respuesta del listado de reseñas | No incluye identificador ni correo del paciente | ✅ auto | ⏳ |
| C-06 | Promedio solo con visibles | Comparar el promedio con las reseñas visibles | Las pendientes y ocultas no cuentan | ✅ auto | ⏳ |
| C-07 | Filtro por calificación mínima | En `/directorio`, filtrar por promedio mínimo 4 | Solo aparecen médicos con promedio de 4 o más | ✅ auto | ⏳ |
| C-08 | Médico ve su reputación | Como médico, abrir `/medico/reputacion` | Promedio general, número de reseñas y comentarios paginados | ✅ auto, nav | ⏳ |
| C-09 | Reputación de solo lectura | Revisar la pantalla y llamar al endpoint como paciente | Sin controles de edición; 403 para otros roles | ✅ auto, nav | ⏳ |
| C-10 | Admin lista pendientes | En `/admin/resenas`, filtro "Pendientes" | Muestra las reseñas pendientes con médico, puntuación, comentario y fecha | ✅ auto, nav | ⏳ el listado responde, pero aún no hay reseñas que mostrar |
| C-11 | Admin oculta una reseña | Ocultar una reseña visible y abrir la ficha del médico | Deja de listarse y el promedio se recalcula | ✅ auto, nav | ⏳ |
| C-12 | Admin vuelve a publicar | Publicar una reseña oculta | Vuelve a listarse y a contar en el promedio | ✅ auto | ⏳ |
| C-13 | Errores de moderación | Estado no permitido, reseña inexistente y estado repetido | 400, 404 y 409 respectivamente | ✅ auto | ⏳ 400 y 404 ✅; el 409 necesita una reseña existente |
| C-14 | Moderación sin correos | Revisar la respuesta de `GET /api/v1/admin/resenas` | No expone correos de pacientes | ✅ auto | ⏳ |
| C-15 | Observer | Crear, aprobar y ocultar una reseña; revisar pruebas del backend | El evento activa la actualización de reputación y la invalidación de caché | — | ⏳ |
| C-16 | Moderación de reseñas auditada | Ocultar una reseña y abrir `/admin/auditoria` | Queda registrado quién cambió la visibilidad y cuándo | — | ⏳ |

## REST y OpenAPI

| ID | Caso | Pasos | Resultado esperado | Demo | API real |
|---|---|---|---|---|---|
| D-01 | Rutas y métodos del contrato | Comparar las llamadas del cliente con el mapa de endpoints | Recursos en plural, sin verbos; GET, POST y PATCH coherentes | ✅ auto | ⏳ rutas administrativas ✅; faltan directorio, triage y reseñas |
| D-02 | JWT en cada solicitud protegida | Revisar las cabeceras de las llamadas administrativas | `Authorization: Bearer`; el token nunca va en la URL | ✅ auto | ✅ en las rutas administrativas |
| D-03 | Códigos de estado consistentes | Provocar 400, 401, 403, 404 y 409 | Cada uno con cuerpo JSON y `mensaje` | — | ✅ 400, 401, 403, 404, 405 y 409 con `mensaje`; D-06 corregido |
| D-04 | Swagger UI disponible | Abrir `/swagger-ui/index.html` y `/v3/api-docs` | Cargan y documentan controladores, DTO y respuestas | — | ✅ cargan; las rutas de Sprints 1 y 2 solo documentan la respuesta 200 |
| D-05 | Swagger Authorize | Probar con JWT válido, sin token y con rol incorrecto | Éxito, 401 y 403 respectivamente | — | ⏳ la API responde 200, 401 y 403 según el caso; falta repetirlo desde el botón Authorize |
| D-06 | Admin protegido con Swagger público | Llamar a una operación `/admin/**` sin autorizar | Se rechaza aunque la documentación sea pública | — | ✅ 401 sin token con la documentación pública |
| D-07 | Caché en GET públicos | Revisar cabeceras del directorio y de respuestas privadas | `Cache-Control` o `ETag` en lo público; sin caché en lo privado | — | ⏳ lo privado va sin caché ✅; los GET públicos tampoco usan caché todavía |
| D-08 | DTO sin datos internos | Revisar las respuestas JSON | No se serializan entidades JPA ni campos privados del usuario | — | ⏳ DTO administrativos ✅; faltan los públicos |

## Revisiones de interfaz de los paneles administrativos

Comprobadas a mano en el navegador el 2026-11-25. No sustituyen a los casos de arriba.

| ID | Revisión | Cómo se comprobó | Resultado |
|---|---|---|---|
| U-01 | Vista móvil (375 px) de médicos, usuarios, reseñas y auditoría | Modo demo con el ancho de un teléfono | ✅ La tabla pasa a tarjetas, las acciones siguen disponibles y no hay desplazamiento horizontal |
| U-02 | Estado de error de médicos, usuarios y reseñas | Modo API real contra el backend actual, que aún no tiene esos endpoints | ✅ Cada página muestra el aviso de error con el mensaje del servidor y el botón "Reintentar" |
| U-03 | Vista móvil de la reputación del médico | No revisada | ⏳ |

U-02 se comprobó antes del PR 17, cuando el backend respondía 403 a esas rutas. Desde el PR 17 los tres paneles cargan datos reales.

## Qué faltaba en el corte histórico

1. Que existan en `main` los endpoints del Integrante 1: directorio, triage, reseñas y reputación.
2. Confirmar el JSON de reputación y ajustar `api.ts` si difiere del provisional.
3. Ejecutar los casos de "API real" que siguen pendientes con `npm run dev:api` y guardar las evidencias.
4. Que el registro de médico guarde nombres y apellidos: hoy llegan vacíos y el panel muestra "Sin nombre registrado".
5. Actualizar el estado de cada historia en Taiga.

## Corte del Integrante 1 · 26/11/2026

Versión `106483311b5f8a629a18fbde516f0eea07ba7a76`. Docker Desktop y PostgreSQL 15.19, API real por nginx y, aparte, origen directo por Vite. Los estados superiores conservan el corte previo del Integrante 4.

| Casos | Resultado y evidencia del corte |
| --- | --- |
| A-01 a A-09 | Aprobados con PostgreSQL. Filtros combinados y consultas paginadas, ficha sin cuenta, publicación tras las dos decisiones y suspensión con caché precalentada. Browser confirma alta, aprobación y búsqueda. |
| A-10 a A-17 | Aprobados por HTTP y pruebas de seguridad. Conflictos, permiso de admin, bloqueo de JWT emitido, auditoría y preflight de PATCH. |
| B-01 a B-04, B-06 a B-09 | Aprobados con navegador, HTTP y pruebas Java. Proveedor simulado en ejecución. Adaptador externo contra servidor HTTP local, sin llamada real a OpenAI. |
| B-05 | Pendiente en API real. El componente conserva el enlace filtrado en el ensayo de demo histórico; la ejecución simulada actual verificó el enlace manual general. |
| C-01 a C-16 | Aprobados. Una reseña pendiente con 201, duplicado concurrente con 409 y una fila física. Solo reseñas visibles. Republicación, auditoría, reputación y rollback verificados. |
| D-01 a D-08 | Aprobados. Documentación Swagger abierta, 401/403/200 mediante Authorize, cabeceras públicas/privadas y regresión 404/405 del PR #20. |
| U-03 | Aprobado en Chromium a 375 px. Reputación de API real, sin desbordamiento horizontal. |
| U-01 y U-02 | Aprobados en un recorrido suplementario sobre el build integrado. Médicos, cuentas, reseñas y auditoría a 375 px, estado de carga, error inducido, reintento contra API real y ausencia de desbordamiento. |

Aceptación local del corte **52 ejecutados de 53 planificados, 52 aprobados de 52 ejecutados**. La [evidencia reproducible](qa/informe.md) registra el alcance de cada prueba.
