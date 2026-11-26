# Contratos API RESTful (`/api/v1`)

Documento de referencia compartido para el desarrollo e integración frontend–backend.

## Convenciones generales

- **Prefijo:** `/api/v1` para todos los endpoints nuevos (Sprints 3 a 5). Los endpoints de Sprints 1–2 (`/auth/**`, `/medicos/me/**`, `/especialidades`, `/admin/auditoria`, `/admin/especialidades`) conservan su ruta.
- **Formato de error:** `{ "mensaje": "..." }`
- **Códigos HTTP:** `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`, `503/504` proveedor externo no disponible.
- **Autenticación:** Stateless con `Authorization: Bearer <JWT>`. Las rutas `/api/v1/admin/**` y `/admin/**` exigen `ROLE_ADMIN`.

---

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
Cuerpo: `{ "mensaje": "texto de 1 a 1000 caracteres" }`

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
- Cuando `TriageFallbackService` actúa ante caída, timeout, HTTP `429` o `5xx`: `emergencia: false`, `fallback: true`, orientación hacia el directorio manual.

---

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
