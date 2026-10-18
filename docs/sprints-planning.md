# Planificación de Sprints y Guía de Git

**Proyecto:** Directorio Médico Inteligente  
**Periodo:** Septiembre 2026 – Diciembre 2026  
**Metodología:** Scrum / Sprints Quincenales  
**Alcance:** 22 Historias de Usuario en 5 Épicas, distribuidas en 5 Sprints (85 puntos de historia).

---

## 1. Cronograma General de Sprints

| Sprint | Periodo | Enfoque | US | Puntos |
| :---: | :--- | :--- | :---: | :---: |
| **1** | 25 Sep – 08 Oct | Arquitectura Base, Persistencia y Capa AOP | 2 | 8 |
| **2** | 09 Oct – 22 Oct | Autenticación, Autogestión Médica y Catálogo | 7 | 27 |
| **3** | 23 Oct – 05 Nov | Motor de Búsqueda de Directorio y Moderación Admin | 4 | 20 |
| **4** | 06 Nov – 19 Nov | Asistente Inteligente (IA), Triage Operativo y Fallback | 3 | 12 |
| **5** | 20 Nov – 03 Dic | Reputación / Calificación, QA, Swagger UI y Cierre | 6 | 18 |
| | | **Total** | **22** | **85** |

---

## 2. Detalle por Sprint

### Sprint 1 (25 Sep – 08 Oct) — Arquitectura Base, Persistencia y Capa AOP
* **Épica:** 1
* **Historias de Usuario:**
  * **US-1.1 — Inicialización del Proyecto, Infraestructura e Integración Base:** Como desarrollador, quiero configurar el entorno base con Docker Compose, PostgreSQL, Flyway, Spring Boot y React con Tailwind CSS para contar con una infraestructura de desarrollo lista para construir el sistema.
  * **US-ADM-04 — Visualización de Auditoría AOP:** Como administrador, quiero consultar el historial de auditoría capturado automáticamente por los aspectos de Spring AOP para supervisar qué usuario realizó modificaciones en los perfiles y en qué fecha.
* **Carga de Trabajo:** UX: 1 pt | Front: 2 pts | Back: 5 pts | **Total: 8 pts**
* **Entregable Demostrable:** Contenedor PostgreSQL en Docker Compose con migraciones Flyway, esqueletos de Spring Boot y React con Tailwind CSS, y aspectos AOP persistiendo registros de auditoría (usuario, campo, fecha) consultables desde un listado.

### Sprint 2 (09 Oct – 22 Oct) — Autenticación, Autogestión Médica y Catálogo
* **Épicas:** 1 y 2
* **Historias de Usuario:**
  * **US-MED-01 — Registro y Autenticación JWT de Médicos:** Como médico, quiero registrarme e iniciar sesión con credenciales seguras para acceder a las herramientas de autogestión de mi perfil profesional.
  * **US-ADM-01 — Autenticación con Privilegios (`ROLE_ADMIN`):** Como administrador, quiero iniciar sesión con un rol protegido para gestionar la plataforma con la seguridad requerida.
  * **US-MED-02 — Gestión de Carta de Presentación y Perfil Profesional:** Como médico, quiero crear y actualizar mi biografía, años de experiencia, fotografía y datos públicos para mantener mi presentación atractiva.
  * **US-MED-03 — Registro de Colegiatura Médica:** Como médico, quiero ingresar mi número de colegiatura profesional para que la plataforma valide mi identidad médica.
  * **US-MED-04 — Gestión de Ubicaciones de Atención y Consultorios:** Como médico, quiero agregar, editar o eliminar las direcciones de mis clínicas o consultorios para informar a los pacientes dónde atiendo.
  * **US-MED-05 — Asignación de Especialidades Acreditadas:** Como médico, quiero seleccionar las especialidades en las que estoy acreditado para figurar en las búsquedas del directorio.
  * **US-ADM-03 — Gestor del Catálogo de Especialidades:** Como administrador, quiero crear, editar o deshabilitar especialidades en el catálogo oficial para mantener actualizada la oferta médica.
* **Carga de Trabajo:** UX: 4 pts | Front: 10 pts | Back: 13 pts | **Total: 27 pts**
* **Entregable Demostrable:** Registro y login con JWT para médico y administrador, panel de autogestión del médico (perfil, colegiatura, consultorios y especialidades) y módulo CRUD de Especialidades para el administrador.
* **Nota de capacidad:** Es el sprint de mayor carga del proyecto. Se recomienda iniciar con US-MED-01 y US-ADM-01 (bloqueantes) y paralelizar las US-MED-02 a US-MED-05 entre frontend y backend.

### Sprint 3 (23 Oct – 05 Nov) — Motor de Búsqueda de Directorio y Moderación Admin
* **Épica:** 3
* **Historias de Usuario:**
  * **US-PAC-03 — Buscador Avanzado de Directorio con Filtros Combinados:** Como paciente, quiero filtrar a los especialistas por nombre, especialidad, ubicación o colegiatura para encontrar al médico adecuado en menos de 2 segundos.
  * **US-PAC-04 — Ficha Técnica y Perfil del Médico:** Como paciente, quiero acceder al perfil completo del médico (foto, biografía, colegiatura verificada y consultorios) para evaluar su trayectoria profesional.
  * **US-ADM-02 — Moderación y Verificación de Perfiles Médicos:** Como administrador, quiero revisar las colegiaturas de los médicos registrados para aprobar, suspender o deshabilitar su visibilidad en el directorio público.
  * **US-ADM-05 — Control de Cuentas de Usuario:** Como administrador, quiero habilitar o bloquear cuentas de usuarios para prevenir comportamientos sospechosos o incumplimiento de términos.
* **Carga de Trabajo:** UX: 4 pts | Front: 8 pts | Back: 8 pts | **Total: 20 pts**
* **Entregable Demostrable:** Directorio público con búsqueda por filtros combinados (< 2 s), página de ficha del médico con colegiatura verificada, panel de moderación de perfiles y control de habilitación/bloqueo de cuentas.

### Sprint 4 (06 Nov – 19 Nov) — Asistente Inteligente (IA), Triage Operativo y Fallback
* **Épica:** 4
* **Historias de Usuario:**
  * **US-PAC-01 — Triage Operativo por IA (Procesamiento de Lenguaje Natural):** Como paciente, quiero ingresar una consulta en texto libre describiendo mis malestares en el chatbot para recibir la sugerencia de la especialidad médica adecuada y una breve orientación.
  * **US-PAC-02 — Detección y Alerta de Emergencias Médicas:** Como paciente, quiero que el sistema detecte palabras clave de urgencia vital para recibir una alerta visual roja e inmediata que me indique acudir a urgencias.
  * **US-PAC-05 — Fallback Manual por Caída o Timeout de IA:** Como paciente, quiero que el sistema me redirija automáticamente al buscador por catálogo si la API de IA falla para evitar interrupciones en mi búsqueda.
* **Carga de Trabajo:** UX: 2 pts | Front: 4 pts | Back: 6 pts | **Total: 12 pts**
* **Entregable Demostrable:** Widget de chatbot en React comunicándose con la API del LLM externo, sugerencia de especialidad con enlace al directorio filtrado, alerta roja ante palabras clave de emergencia y fallback automático a la búsqueda manual ante timeout o caída de la IA.

### Sprint 5 (20 Nov – 03 Dic) — Reputación / Calificación, QA, Swagger UI y Cierre
* **Épica:** 5
* **Historias de Usuario:**
  * **US-PAC-06 — Calificación y Reseña de Médicos (1 a 5 Estrellas):** Como paciente, quiero registrar una puntuación (1 a 5 estrellas) y redactar un comentario sobre mi experiencia para compartir mi valoración con la comunidad.
  * **US-PAC-07 — Filtro de Búsqueda por Calificación Mínima:** Como paciente, quiero filtrar la lista del directorio por un umbral mínimo de valoración (ej. 4 estrellas o más) para identificar a los especialistas mejor calificados.
  * **US-MED-06 — Panel de Feedback y Reputación Profesional:** Como médico, quiero consultar mi promedio general de estrellas y los comentarios recibidos para monitorear la satisfacción de mis pacientes.
  * **US-ADM-06 — Moderación de Reseñas por el Administrador:** Como administrador, quiero revisar y ocultar comentarios inapropiados o spam para asegurar un entorno de respeto en la plataforma.
  * **US-QA-01 — Pruebas Automatizadas Backend (JUnit 5 + Mockito):** Como equipo de desarrollo, quiero ejecutar pruebas unitarias e integración sobre los servicios críticos para garantizar la estabilidad del código.
  * **US-DOC-01 — Documentación Interactiva de la API (Swagger UI / OpenAPI):** Como evaluador/desarrollador, quiero contar con la especificación interactiva de la API para probar los endpoints desde el navegador.
* **Carga de Trabajo:** UX: 2 pts | Front: 5 pts | Back: 11 pts | **Total: 18 pts**
* **Entregable Demostrable:** Sistema de reseñas con una calificación por paciente y médico, filtro por calificación mínima en el directorio, panel de reputación del médico, moderación de reseñas, batería de pruebas JUnit 5/Mockito, Swagger UI activa y empaquetado para la presentación final.

---

## 3. Resumen de Épicas por Sprint

| Épica | Nombre | US | Sprints |
| :---: | :--- | :---: | :---: |
| 1 | Arquitectura Base, Seguridad (JWT) y Capa Transversal (AOP) | 4 | 1, 2 |
| 2 | Autogestión del Perfil Médico y Catálogo de Especialidades | 5 | 2 |
| 3 | Directorio Médico, Búsqueda Avanzada y Moderación Admin | 4 | 3 |
| 4 | Asistente Inteligente (IA), Triage Operativo y Fallback | 3 | 4 |
| 5 | Reputación / Calificación, Garantía de Calidad y Cierre | 6 | 5 |

> El detalle de cada Historia de Usuario (requisito asociado, detalle técnico, etiquetas y puntos) se encuentra en `docs/wbs-taiga.md`.

---

## 4. Convención de Commits para Evidencia en Git

Para vincular los avances en el código con las Historias de Usuario de Taiga, utiliza la siguiente estructura en los mensajes de commit:

### Formato
`tipo(módulo): [US-ROL-NN] descripción clara de lo realizado`

Los identificadores válidos son `US-1.1`, `US-PAC-01` a `US-PAC-07`, `US-MED-01` a `US-MED-06`, `US-ADM-01` a `US-ADM-06`, `US-QA-01` y `US-DOC-01`.

El hook `.githooks/commit-msg` valida el formato Conventional Commits y rechaza títulos de más de **72 caracteres**.

### Tipos Permitidos
* `feat`: Nueva funcionalidad.
* `fix`: Corrección de errores.
* `docs`: Cambios en la documentación.
* `test`: Adición o modificación de pruebas.
* `refactor`: Refactorización de código sin cambiar comportamiento.
* `chore`: Tareas de configuración o mantenimiento de build/docker.

### Ejemplos
* `git commit -m "chore(infra): [US-1.1] docker compose con postgresql y flyway"`
* `git commit -m "feat(auth): [US-MED-01] login de medico con JWT y ROLE_MEDICO"`
* `git commit -m "feat(directorio): [US-PAC-03] filtros por especialidad y ubicacion"`
* `git commit -m "feat(asistente): [US-PAC-02] alerta roja por palabras de emergencia"`
* `git commit -m "fix(resenas): [US-PAC-06] una calificacion por paciente y medico"`
* `git commit -m "test(perfil): [US-QA-01] pruebas Mockito del servicio de perfil"`
