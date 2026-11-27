# Contratos API RESTful (`/api/v1`)

Documento de referencia compartido para el desarrollo e integración frontend–backend.

## Convenciones generales

- **Prefijo:** `/api/v1` para todos los endpoints nuevos (Sprints 3 a 5). Los endpoints de Sprints 1–2 (`/auth/**`, `/medicos/me/**`, `/especialidades`, `/admin/auditoria`, `/admin/especialidades`) conservan su ruta.
- **Formato de error:** `{ "mensaje": "..." }`
- **Códigos HTTP:** `200`, `201`, `204`, `400`, `401`, `403`, `404`, `405`, `409`, `500`. El triage devuelve su fallback en `200`; `GET /salud` responde `503` si PostgreSQL no está disponible.
- **Autenticación:** Stateless con `Authorization: Bearer <JWT>`. Las rutas `/api/v1/admin/**` y `/admin/**` exigen `ROLE_ADMIN`.

---

## Identidad y fotos del médico — Sprint 2

`POST /auth/register` recibe `username`, `password`, `colegiatura`, `nombres` y `apellidos`. Devuelve `201` con `id`, `username` y `estadoColegiatura`. Cada nombre y apellido admite hasta 100 caracteres. `PUT /medicos/me/perfil` acepta los dos campos de identidad juntos y preserva la identidad si ambos se omiten. `GET /medicos/me/perfil` los devuelve, con `null` en perfiles anteriores sin completar. La fotografía se sube con `PUT /medicos/me/foto`, parte multipart `foto`, JPG/PNG/WebP hasta 1 MiB. `fotoUrl` puede ser una ruta bajo `/uploads/fotos/` o una URL HTTPS de objetos.

## Directorio público — Sprint 3

`GET /api/v1/directorio/medicos?nombre=angela+pena&especialidadId=2&ciudad=lima&colegiatura=CMP&calificacionMinima=4&page=0&size=9&sort=id,desc`

Los filtros son opcionales y acumulativos. Se exige identidad completa, perfil aprobado y CMP verificada. El nombre acepta términos parciales sin distinguir mayúsculas o tildes, la ciudad se compara completa y el CMP acepta coincidencia parcial. `size` admite 1 a 100, con `page` desde 0. `sort` acepta `apellidos`, `nombres`, `colegiatura` o `id`, más `,asc` o `,desc`. El orden predeterminado usa apellidos, nombres e ID. El filtro de reputación admite 1–5 y usa el promedio sin redondear de reseñas visibles.

`GET /api/v1/directorio/medicos/{medicoId}` devuelve el resumen más biografía, años de experiencia y centros físicos, o `404` si no es publicable. La [especificación del cliente](contratos/cliente-paciente-v1.md) contiene los JSON de respuesta.

## Moderación administrativa — Sprint 3 (`ROLE_ADMIN`)

### `GET /api/v1/admin/medicos`
Query params: `estadoPerfil` (`PENDIENTE_REVISION`, `APROBADO`, `SUSPENDIDO`, `DESHABILITADO`, opcional), `page` (default `0`), `size` (default `20`).

```json
{
  "items": [
    {
      "id": 15,
      "nombres": "Ana María",
      "apellidos": "Quispe Rojas",
      "colegiatura": "CMP-12345",
      "estadoColegiatura": "PENDIENTE_VERIFICACION",
      "estadoPerfil": "PENDIENTE_REVISION"
    }
  ],
  "page": 0,
  "size": 20,
  "total": 1
}
```

### `PATCH /api/v1/admin/medicos/{id}/estado-perfil`
Cuerpo: `{ "estadoPerfil": "APROBADO" }` (`PENDIENTE_REVISION | APROBADO | SUSPENDIDO | DESHABILITADO`).  
Respuestas: `200` (`AdminMedicoResponse`), `400`, `401`, `403`, `404`, `409` (transición repetida o inválida).

### `PATCH /api/v1/admin/medicos/{id}/colegiatura`
Cuerpo: `{ "estadoColegiatura": "VERIFICADA" }` (`PENDIENTE_VERIFICACION | VERIFICADA | RECHAZADA`).  
Respuestas: `200` (`AdminMedicoResponse`), `400`, `401`, `403`, `404`, `409`.

### `GET /api/v1/admin/usuarios`
Query params: `page` (default `0`), `size` (default `20`). Nunca expone contraseñas ni hashes.

```json
{
  "items": [
    {
      "id": 4,
      "username": "medico@uni.edu.pe",
      "rol": "ROLE_MEDICO",
      "habilitado": true
    }
  ],
  "page": 0,
  "size": 20,
  "total": 1
}
```

### `PATCH /api/v1/admin/usuarios/{id}/estado`
Cuerpo: `{ "habilitado": false }`.  
Reglas: impide el auto-bloqueo del administrador (`409`) y dejar el sistema sin administradores activos (`409`). Un JWT previo de una cuenta bloqueada es rechazado en el filtro JWT.

---

## Triage operativo, emergencias y fallback — Sprint 4

### `POST /api/v1/triages`
Cuerpo de ejemplo `{ "mensaje": "Consulta ficticia de Cardiología" }`. Acepta de 1 a 1000 caracteres y exige texto con contenido. Ante validación inválida responde `400`.

Respuesta `200 OK`:
```json
{
  "emergencia": false,
  "fallback": false,
  "especialidad": { "id": 2, "nombre": "Cardiología" },
  "orientacion": "Texto breve de orientación, sin diagnóstico."
}
```

- Cuando `EmergencyDetectionService` detecta señal de riesgo: `emergencia: true`, `fallback: false`, `especialidad: null`, sin llamar al LLM.
- Ante desconexión, timeout, HTTP `429`, `5xx` o salida inválida, `TriageFallbackService` devuelve `emergencia: false`, `fallback: true` y orientación al directorio manual. Se usa el catálogo activo para validar cualquier especialidad propuesta.

---

## Reseñas públicas y reputación — Sprint 5

| Método y ruta | Rol | Respuesta |
| --- | --- | --- |
| `POST /api/v1/medicos/{medicoId}/resenas` | Paciente | Con `{"puntuacion":5,"comentario":"Atención ficticia"}`, devuelve `201` y la nueva reseña pendiente. `400` por cuerpo inválido, `401/403` por permisos, `404` por médico no publicable y `409` por duplicado. |
| `GET /api/v1/medicos/{medicoId}/resenas?page=0&size=5` | Público | `200` con `items`, `page`, `size`, `total` y `promedio`. Solo visibles y ordenadas por fecha e ID descendentes. `404` si el médico no es publicable. |
| `GET /api/v1/medicos/me/reputacion?page=0&size=5` | Médico | Mismo DTO paginado, para el médico del JWT. El promedio es nulo cuando el total vale cero. |

Los GET públicos de directorio, ficha y reseñas usan `Cache-Control: no-cache, public` para exigir revalidación HTTP. El backend mantiene fichas y resúmenes por instancia. Las respuestas privadas usan `no-store`; reputación agrega `private`. El triage también usa `no-store`.

## Moderación de reseñas — Sprint 5 (`ROLE_ADMIN`)

### `GET /api/v1/admin/resenas`
Query params: `estado` (`PENDIENTE_REVISION`, `VISIBLE`, `OCULTA`, opcional), `page` (default `0`), `size` (default `20`).  
Privacidad: `paciente` muestra un alias no sensible (ej. `Paciente #12`), nunca el correo del paciente.

```json
{
  "items": [
    {
      "id": 8,
      "medicoId": 15,
      "medicoNombre": "CMP-12345",
      "paciente": "Paciente #12",
      "puntuacion": 5,
      "comentario": "Excelente atención.",
      "estado": "PENDIENTE_REVISION",
      "fechaCreacion": "2026-11-26T15:10:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "total": 1
}
```

### `PATCH /api/v1/admin/resenas/{id}`
Cuerpo: `{ "estado": "OCULTA" }` (`VISIBLE | OCULTA`).  
Respuestas: `200` (`AdminResenaResponse`), `400` (estado no permitido), `401`, `403`, `404`, `409` (estado repetido).

---

## Documentación OpenAPI / Swagger UI — Sprint 5

- `GET /swagger-ui/index.html` (público)
- `GET /v3/api-docs` (público)
- Esquema de seguridad: `bearerAuth` (`HTTP Bearer JWT`). Los endpoints `/admin/**` y `/api/v1/admin/**` mantienen autorización estricta `ROLE_ADMIN`.
