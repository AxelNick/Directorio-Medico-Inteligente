# Contratos de integración frontend–backend

Esta carpeta es la **ubicación compartida** de los contratos propuestos para la API. Cada contrato indica su estado, historia de usuario, ruta, autorización, petición, respuesta y casos de error. El [WBS](../wbs-taiga.md) define alcance y sprint; estos archivos concretan la interfaz para que ambos equipos puedan revisarla. Ningún contrato propuesto implica que el endpoint ya exista.

| Contrato | Historia | Estado |
| --- | --- | --- |
| [Auditoría v1](auditoria-v1.md) | US-ADM-04, Sprint 1 | Propuesto para revisión de backend; no implementado. |

La guía de tareas y dependencias para esta primera integración está en [Sprint 1 backend](../SPRINT_1_BACKEND.md). El frontend refleja el contrato de auditoría en [su tipo TypeScript](../../frontend/src/data/audit.ts); su ruta `/demo/auditoria` usa datos ficticios solo en desarrollo. Los futuros contratos de autenticación y perfil de Sprint 2 deberán añadirse aquí tras acordar sus respuestas reales, sin tratarlos como existentes a partir de las rutas candidatas del WBS.
