# Contrato que consume el frontend del paciente (Integrante 2)

**Estado:** propuesta del cliente. El frontend ya implementa estas llamadas en [`frontend/src/data/api.ts`](../../frontend/src/data/api.ts) y las prueba contra el adaptador de demostración; **ningún endpoint de esta página está confirmado en el backend**. Integrante 1 (directorio, triage, reseñas) e Integrante 3 (seguridad, OpenAPI) deben confirmar o ajustar nombres de campos y rutas; cualquier cambio se comunica antes de integrar y se refleja en un solo lugar (`api.ts`). Sigue las reglas REST del plan de correcciones del equipo (arquitectura RESTful transversal): recursos en plural, método HTTP como operación, DTO sin entidades JPA, errores `{ "mensaje": "..." }`.

## Prefijo y rutas del navegador

Las APIs nuevas usan el prefijo `/api/v1` en el backend. El cliente concatena su base (`/api` con proxy de Vite/nginx, o `VITE_API_BASE_URL` en Vercel) a esa ruta:

| Entorno | URL del navegador | Llega al backend como |
| --- | --- | --- |
| `npm run dev:api`, Docker Compose (nginx) | `/api/api/v1/directorio/medicos` | `/api/v1/directorio/medicos` (el proxy elimina el primer `/api`) |
| Vercel + Render | `https://<servicio>.onrender.com/api/v1/directorio/medicos` | igual |

Los endpoints anteriores (`/auth/**`, `/medicos/me/**`, `/especialidades`, `/admin/**`) **no cambian de ruta**.

## Directorio público (Sprint 3) — sin `Authorization`

`GET /api/v1/directorio/medicos?nombre=&especialidadId=&ciudad=&colegiatura=&calificacionMinima=&page=0&size=9&sort=`

- Todos los filtros son opcionales y se combinan; la búsqueda y el promedio los calcula el backend. `page` es el índice desde 0. `calificacionMinima` es un número (3, 4, 4.5).
- Solo devuelve perfiles `APROBADO` con colegiatura `VERIFICADA`. No enviar `Authorization`: son consultas GET públicas y cacheables.
- `colegiatura` busca por número de CMP. El filtro «estado de colegiatura» del plan no se ofrece porque la API pública solo contiene verificadas.

```json
{
  "items": [{
    "id": 15, "nombres": "Ana María", "apellidos": "Quispe Rojas", "fotoUrl": "/uploads/fotos/15.webp",
    "colegiatura": "CMP-12345", "estadoColegiatura": "VERIFICADA",
    "especialidades": [{ "id": 2, "nombre": "Cardiología" }], "ciudades": ["Lima"],
    "promedioCalificacion": 4.6, "totalResenas": 12
  }],
  "page": 0, "size": 9, "total": 1
}
```

`promedioCalificacion` y `totalResenas` son opcionales hasta Sprint 5 (con 0 reseñas, `promedioCalificacion` es `null`). `fotoUrl` admite `null`.

`GET /api/v1/directorio/medicos/{medicoId}` → misma información más `biografia`, `aniosExperiencia` (admite `null`) y `centros: [{ id, nombre, direccion, ciudad }]`. `404` si el perfil no existe o no es público. Nunca incluye correo, usuario ni datos privados.

## Triage (Sprint 4)

`POST /api/v1/triages` con `{ "mensaje": "texto de 1 a 1000 caracteres" }` → `200`

```json
{ "emergencia": false, "fallback": false, "especialidad": { "id": 2, "nombre": "Cardiología" }, "orientacion": "Texto breve, sin diagnóstico." }
```

- `emergencia: true` → el cliente muestra la alerta y **no** enlaza al directorio. `fallback: true` → el cliente informa que el asistente no está disponible y ofrece «Buscar manualmente». `especialidad` y `orientacion` admiten `null`.
- El cliente no reinterpreta síntomas, no guarda el texto y no lo escribe en consola. Si el contrato exigiera sesión, `api.triage(mensaje, token)` ya acepta el token.
- Errores: `400` mensaje vacío o demasiado largo; `5xx`/red se muestran como «Buscar manualmente».
- La sugerencia enlaza a `/directorio?especialidadId=<id>`.

## Reseñas (Sprint 5)

| Método y ruta | Acceso | Cuerpo / respuesta |
| --- | --- | --- |
| `POST /api/v1/medicos/{medicoId}/resenas` | `ROLE_PACIENTE` | `{ "puntuacion": 1-5, "comentario": "hasta 500 caracteres, opcional" }` → `201` con `{ id, puntuacion, comentario, fechaCreacion }` y, si procede, `Location`. `400` validación; `409` si el paciente ya calificó a ese médico (UNIQUE paciente+médico en BD). |
| `GET /api/v1/medicos/{medicoId}/resenas?page=0&size=5` | Público | `{ "items": [{ id, puntuacion, comentario, fechaCreacion }], "page": 0, "size": 5, "total": 12, "promedio": 4.6 }` solo con reseñas visibles; más recientes primero. `promedio` es `null` sin reseñas. |

El formulario valida de forma local solo para ayudar a la persona; el servidor sigue siendo la única barrera de la regla «una reseña por paciente y médico». Las reseñas no exponen datos del paciente.

## Auditoría (corrección Sprint 1)

`api.listAdminAudit(token, page, size)` consume la ruta real actual `GET /admin/auditoria?page=&size=` (ver [auditoría v1](auditoria-v1.md)); la ruta está en la constante `ADMIN_AUDIT_PATH` para moverla a `/api/v1/admin/auditoria` si backend la migra. Respeta `page` desde 0, acota `size` a 1–100 y rechaza una respuesta sin `items`/`total`.

## Errores y códigos

El cliente muestra el campo `mensaje` si existe y, si no, un texto por código: `400` revisar datos, `401` sesión vencida, `403` sin permiso, `404` no disponible, `409` conflicto, `429`/`5xx` servicio no disponible. Error de red: «No se pudo conectar con el servidor».
