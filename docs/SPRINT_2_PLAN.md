# Sprint 2 — autenticación y autogestión médica

**Alcance del WBS:** 09–22 de octubre, 7 historias y 27 puntos: `US-MED-01`, `US-ADM-01`, `US-MED-02` a `US-MED-05` y `US-ADM-03`. [Planificación original](sprints-planning.md) · [detalle de historias](wbs-taiga.md). Este documento organiza el trabajo; no declara funcionalidades implementadas.

## Orden de trabajo

| Paso | Backend | Frontend (integrante 4) | Resultado visible |
| --- | --- | --- | --- |
| 1. Contratos y acceso | Acordar peticiones, respuestas, errores y permisos en [`docs/contratos/`](contratos/README.md). Sustituir login simulado por usuarios persistidos con BCrypt; registrar médicos y emitir JWT con rol real. Crear acceso administrativo seguro y proteger `/admin/**`. | Preparar cliente HTTP, estado de sesión y rutas por rol; formularios de registro e inicio de sesión con errores reales. | Un usuario inexistente no inicia sesión; médico y administrador llegan solo a su área. |
| 2. Perfil (`US-MED-02`, `03`) | Migrar y persistir perfil, colegiatura única y estado inicial `PENDIENTE_VERIFICACION`; ofrecer `GET/PUT /medicos/me/perfil`. Acordar almacenamiento y límite de fotografía antes de implementarla. | Panel médico con lectura/edición de perfil, colegiatura y fotografía según contrato; estados de carga, guardado y error. | El médico actualiza su propio perfil y lo recupera tras recargar. La colegiatura pendiente no aparece como verificada. |
| 3. Catálogo y especialidades (`US-ADM-03`, `US-MED-05`) | Catálogo administrado por `/admin/especialidades`; impedir eliminación de especialidades vinculadas y permitir deshabilitarlas. Relación médico–especialidad solo con entradas activas. | Tabla administrativa de especialidades y selector múltiple en el perfil médico, alimentados por la API. | El administrador mantiene el catálogo; el médico guarda y recupera sus especialidades. |
| 4. Centros (`US-MED-04`) | Persistir centros asociados al médico y ofrecer CRUD `/medicos/me/centros` con autorización de propietario. | Listado y formularios para crear, editar y retirar centros desde el panel médico. | Los cambios persisten y otro médico no puede modificar esos centros. |
| 5. Integración | Probar permisos, validaciones y persistencia con la base existente. Integrar la consulta real de auditoría cuando estén listos AOP y `ROLE_ADMIN` del Sprint 1. | Probar rutas protegidas, errores y flujo completo en escritorio y móvil; sustituir datos ficticios de auditoría solo al confirmar el [contrato](contratos/auditoria-v1.md). | Demostración con cuentas de prueba y datos identificados como tales. |

## Acuerdos que deben cerrarse antes de conectar pantallas

1. Formato de registro/login, respuesta JWT, expiración y tratamiento de sesión; códigos de error y `401`/`403`. El frontend no enviará un rol elegido por el usuario como autoridad.
2. Campos y validaciones de perfil/colegiatura; formato de fotografía y dónde se almacena; representación de centros y especialidades activas. Escribir los contratos aprobados en `docs/contratos/` antes de construir adaptadores HTTP definitivos.
3. Alta y recuperación de administrador sin credenciales conocidas ni hashes de demostración en archivos versionados. La migración V1 ya está aplicada: cualquier cambio de esquema o datos debe ir en una migración nueva.

## Criterios de cierre

- Registro y login validan usuarios persistidos. JWT refleja el rol confiable; backend rechaza sesiones ausentes, inválidas o de rol incorrecto. No se devuelven hashes ni secretos.
- Perfil, colegiatura, centros y especialidades sobreviven a recarga y nuevo inicio de sesión; se comprueba aislamiento entre médicos y restricciones del catálogo.
- Frontend muestra respuestas reales, carga, vacío y errores; `npm run build` y `npm run lint` pasan. Se verifican los recorridos principales en móvil y con teclado.
- La demo de auditoría de Sprint 1 sigue marcada como ficticia hasta tener API protegida y eventos persistidos. Cualquier pendiente de `US-ADM-04` se registra como arrastre, sin contarlo como historia terminada.

**Fuera de Sprint 2:** búsqueda pública funcional (Sprint 3), citas, pagos, garantía, historia clínica e IA. Esas propuestas locales no amplían las siete historias del WBS.
