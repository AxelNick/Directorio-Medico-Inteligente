# US-ADM-04: contrato propuesto de consulta de auditoría

**Estado:** propuesta para revisión; no implementado ni validado con backend. **Fuente de alcance:** [WBS, US-ADM-04](../wbs-taiga.md) y [tareas backend de Sprint 1](../SPRINT_1_BACKEND.md). El tipo correspondiente en frontend está en [`frontend/src/data/audit.ts`](../../frontend/src/data/audit.ts).

## Solicitud

`GET /admin/auditoria?page=0&size=20`

- `page`: índice desde 0; valor predeterminado propuesto 0.
- `size`: registros por página; valor predeterminado propuesto 20. Backend debe validar que sea positivo y limitar tamaños excesivos.
- `Authorization: Bearer <JWT>` de un usuario con `ROLE_ADMIN`. Una cuenta médica no debe poder consultar estos eventos.
- Orden propuesto: eventos más recientes primero; ante la misma fecha, desempatar por `id` para que la paginación sea estable.

## Respuesta `200 OK`

```json
{
  "items": [
    {
      "id": "evento-123",
      "actor": "usuario-42",
      "accion": "ACTUALIZAR",
      "entidad": "Perfil médico",
      "campo": "biografia",
      "valorAnterior": null,
      "valorNuevo": null,
      "ocurrioEn": "2026-10-21T14:25:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "total": 1
}
```

`items` es una lista; en una página vacía es `[]` y `total` conserva el total de resultados. `id`, `actor`, `accion`, `entidad` y `ocurrioEn` son obligatorios. `campo`, `valorAnterior` y `valorNuevo` admiten `null`. `ocurrioEn` usa ISO 8601 con zona horaria; la UI lo presenta en `America/Lima`. `actor` debe ser un identificador publicable derivado de la sesión del servidor, no un valor suministrado por el cliente.

**Privacidad:** el WBS solicita valores anterior/nuevo, pero el endpoint no debe exponer contraseñas, hashes, tokens, secretos ni contenido clínico. El backend decide y documenta qué campos de perfil son auditables y cuáles se sustituyen por `null` o un resumen seguro; no enviar datos sensibles para ocultarlos únicamente con CSS o lógica frontend.

## Errores esperados para integrar la UI

| Situación | HTTP propuesto | Comportamiento frontend |
| --- | --- | --- |
| Sin sesión válida | `401` | Solicitar inicio de sesión cuando exista en Sprint 2. |
| Sesión sin `ROLE_ADMIN` | `403` | Mostrar acceso denegado, sin datos de auditoría. |
| Paginación inválida | `400` | Mostrar error de solicitud; no repetir automáticamente. |
| Fallo inesperado | `5xx` | Mostrar estado de error y permitir reintento. |

## Criterio de integración

El frontend sustituirá su `AuditRepository` ficticio por un adaptador HTTP cuando backend confirme este contrato y exista acceso administrativo real. Probar una modificación de perfil persistida, el evento capturado automáticamente y su aparición en la consulta paginada. Como la edición de perfiles está programada para Sprint 2, una demostración con datos ficticios en Sprint 1 solo valida la interfaz, no la historia completa.
