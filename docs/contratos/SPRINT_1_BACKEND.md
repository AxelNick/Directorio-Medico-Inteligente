# Sprint 1 — tareas para backend

**Referencia:** [WBS / US-1.1 y US-ADM-04](wbs-taiga.md). **Contrato propuesto para frontend:** [consulta de auditoría](contratos/auditoria-v1.md). Acordar el contrato con frontend antes de conectar datos reales.

## Qué hacer

### US-1.1 — Base técnica

- [ ] Dejar documentado y probado un arranque reproducible de Spring Boot con PostgreSQL y Flyway. El POM fija Java 21 y Spring Boot 4.1.1; el README aún menciona Spring Boot 3.x.

### US-ADM-04 — Auditoría de cambios de perfil

- [ ] Añadir una migración Flyway nueva para la tabla `auditoria`. **No modificar V1**, que ya se aplicó en la base local.
- [ ] Incorporar Spring AOP y persistir los cambios confirmados de perfil: actor obtenido de la sesión, acción, entidad, campo, valor anterior/nuevo permitido y fecha con zona horaria. No registrar cambios revertidos ni contraseñas, hashes, JWT o datos clínicos.
- [ ] Implementar `GET /admin/auditoria?page=0&size=20` con paginación y respuesta según el [contrato propuesto](contratos/auditoria-v1.md).
- [ ] Exigir `ROLE_ADMIN` en la API y probar acceso autorizado, sin sesión y con rol médico.
- [ ] Probar migración, captura de un cambio confirmado, ausencia de evento tras rollback y paginación. Entregar esos resultados junto con el endpoint.

## Estado comprobado el 2026-10-21

- Docker/PostgreSQL 15.19 funciona en el puerto 5433; Flyway V1 figura exitosa. Spring Boot responde en el puerto 8080 y mantiene conexiones JDBC. El proceso observado usa JDK 24; **no se probó** una compilación nueva ni la suite automatizada.
- **Falta auditoría:** no hay tabla, AOP ni endpoint de consulta en el código actual. La vista `/demo/auditoria` del frontend muestra datos ficticios.
- **Autenticación aún prototipo:** el login emitió un JWT `ROLE_MEDICO` para un usuario ficticio inexistente. `/admin/auditoria` respondió `403`, pero una ruta inexistente también; ese código no demuestra autorización por rol.

**Dependencia:** la edición real de perfiles (`US-MED-02`) y la autenticación administrativa (`US-ADM-01`) están planificadas para Sprint 2. Se puede demostrar el mecanismo de auditoría con una operación de prueba identificada como tal, pero US-ADM-04 no estará validada de extremo a extremo con perfiles reales hasta integrar esas historias.
