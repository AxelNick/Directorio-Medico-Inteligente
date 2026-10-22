# Contratos de integración frontend–backend

Esta carpeta es la **ubicación compartida** de los contratos propuestos para la API. Cada contrato indica su estado, historia de usuario, ruta, autorización, petición, respuesta y casos de error. El [WBS](../wbs-taiga.md) define alcance y sprint; estos archivos concretan la interfaz para que ambos equipos puedan revisarla. Ningún contrato propuesto implica que el endpoint ya exista.

| Contrato | Historia | Estado |
| --- | --- | --- |
| [Auditoría v1](auditoria-v1.md) | US-ADM-04, Sprint 1 | Propuesto para revisión de backend; no implementado. |
| [Integración Sprint 2 v1](sprint2-v1.md) | US-MED-01 a 05, US-ADM-01 y US-ADM-03 | Propuesto para revisión de backend; aún no implementado. |

Las tareas pendientes de auditoría están en [Sprint 1 backend](../SPRINT_1_BACKEND.md). El frontend refleja ese contrato en [su tipo TypeScript](../../frontend/src/data/audit.ts); `/demo/auditoria` usa datos ficticios solo en desarrollo. [Sprint 2](sprint2-v1.md) documenta además las **cuentas de prueba locales** de médico, administrador y paciente, y el cambio al cliente HTTP. La pantalla de paciente es una demostración local; su registro y funciones clínicas reales pertenecen a etapas posteriores. Las cuentas de prueba no son credenciales del backend.
