# Estructura de Desglose de Trabajo (WBS) y Backlog para Taiga

**Proyecto:** Directorio Médico Inteligente  
**Institución:** Universidad Nacional de Ingeniería (UNI)  
**URL Taiga:** [http://159.195.245.124:8085/project/sistema-citas-medicas/](http://159.195.245.124:8085/project/sistema-citas-medicas/)  
**Stack Tecnológico:** Java 21 | Spring Boot | React | TypeScript | Tailwind CSS | PostgreSQL | Flyway | Docker Compose | Spring Security (JWT) | Spring AOP | LLM API  
**Alcance:** 22 Historias de Usuario organizadas en 5 Épicas y distribuidas en 5 Sprints.

---

## 1. Requisitos Específicos del Sistema

Esta sección describe las funciones que debe proporcionar el Directorio Médico Inteligente, las condiciones bajo las cuales debe operar y los criterios que permitirán verificar el cumplimiento de los requisitos.

### 1.1 Requisitos Funcionales (RF)

#### Rol: Paciente

| Código | Nombre del Requisito | Descripción Corta |
| :--- | :--- | :--- |
| **RF-PAC-01** | Triage Operativo por IA | El paciente podrá ingresar una consulta en texto libre describiendo sus malestares o síntomas en el widget de chat. El backend procesará la solicitud enviándola a la API REST del LLM externo y retornará la especialidad médica sugerida junto con una breve explicación. |
| **RF-PAC-02** | Detección y Alerta de Emergencias Médicas | Si la consulta del paciente contiene palabras clave relativas a situaciones de urgencia vital (ej. dolor torácico agudo, pérdida de conciencia), el sistema suspenderá la recomendación ordinaria y desplegará una alerta visual roja de atención médica urgente inmediata. |
| **RF-PAC-03** | Buscador Avanzado de Directorio con Filtros Combinados | El paciente podrá buscar especialistas en el directorio utilizando filtros por nombre, especialidad médica, ubicación/centro de atención o número de colegiatura. |
| **RF-PAC-04** | Visualización de Perfil y Carta de Presentación del Médico | El paciente podrá acceder a la ficha técnica completa de cada médico, visualizando su foto, biografía, colegiatura verificada, especialidades y direcciones de sus centros de atención. |
| **RF-PAC-05** | Fallback Manual ante Indisponibilidad de IA | En caso de timeout, latencia elevada o caída de la API del LLM externo, el sistema aislará el fallo sin colapsar la SPA y derivará automáticamente al paciente al motor de búsqueda manual por filtros. |
| **RF-PAC-06** | Calificación y Reseña de Médicos | El paciente podrá registrar una valoración numérica (de 1 a 5 estrellas) y redactar una reseña o comentario opcional sobre su experiencia de atención con el especialista. **Criterio de Aceptación:** solo se permite una calificación por paciente hacia el mismo médico para evitar duplicidades o manipulaciones en el puntaje. |
| **RF-PAC-07** | Filtro de Búsqueda por Calificación Mínima | En el motor de búsqueda del directorio, el paciente podrá aplicar un filtro adicional para mostrar únicamente médicos con un promedio de valoración superior a un umbral seleccionado (ej. 4 estrellas o más). |

#### Rol: Médico

| Código | Nombre del Requisito | Descripción Corta |
| :--- | :--- | :--- |
| **RF-MED-01** | Registro y Autenticación con JWT | El médico podrá registrarse en la plataforma ingresando sus datos personales y credenciales. Al iniciar sesión exitosamente, el backend emitirá un token JWT con el rol `ROLE_MEDICO`. |
| **RF-MED-02** | Gestión de Carta de Presentación | El médico podrá crear, consultar y actualizar su carta de presentación profesional, incluyendo biografía, años de experiencia, fotografía de perfil y datos de contacto públicos. |
| **RF-MED-03** | Registro de Colegiatura Médica | El médico debe ingresar obligatoriamente su número de colegiatura médica profesional durante el registro o actualización de perfil para su posterior verificación. |
| **RF-MED-04** | Gestión de Centros y Ubicaciones de Atención | El médico podrá agregar, editar o eliminar múltiples direcciones físicas (clínicas, consultorios o centros de atención) asociadas a su perfil profesional. |
| **RF-MED-05** | Asignación de Especialidades Médicas | El médico podrá seleccionar de la lista oficial de la plataforma las especialidades en las que está acreditado para ejercer. |
| **RF-MED-06** | Panel de Feedback y Reputación Profesional | El médico podrá acceder desde su panel de autogestión a un resumen estadístico de sus calificaciones recibidas (promedio global, número total de opiniones) y consultar los comentarios dejados por sus pacientes. |

#### Rol: Administrador

| Código | Nombre del Requisito | Descripción Corta |
| :--- | :--- | :--- |
| **RF-ADM-01** | Autenticación con Privilegios | El administrador accederá mediante credenciales protegidas con Spring Security y token JWT con rol de administración (`ROLE_ADMIN`). |
| **RF-ADM-02** | Moderación y Verificación de Perfiles Médicos | El administrador contará con un panel para revisar perfiles médicos recién creados, comprobar la veracidad de la colegiatura y aprobar, suspender o deshabilitar la visibilidad del médico en el directorio público. |
| **RF-ADM-03** | Gestor del Catálogo de Especialidades | El administrador podrá crear, editar o deshabilitar especialidades médicas en el sistema. Se restringirá la eliminación si existen perfiles de médicos activos vinculados. |
| **RF-ADM-04** | Visualización de Registros de Auditoría | El administrador podrá consultar el historial de auditoría capturado automáticamente por los aspectos de Spring AOP (quién modificó un perfil, qué campo cambió, fecha y hora del evento). |
| **RF-ADM-05** | Control de Estado de Cuentas de Usuario | El administrador podrá habilitar o bloquear el acceso de cualquier usuario (paciente o médico) ante incumplimiento de términos o actividad sospechosa. |
| **RF-ADM-06** | Moderación y Control de Reseñas | El administrador tendrá la facultad de revisar, ocultar o eliminar comentarios que contengan lenguaje inapropiado, difamatorio o spam, manteniendo la calidad y el respeto en la plataforma. |

### 1.2 Requisitos No Funcionales (RNF)

| Código | Nombre del Requisito | Descripción Corta |
| :--- | :--- | :--- |
| **RNF-001** | Rendimiento | El sistema deberá responder, bajo una carga previamente definida, en un máximo de 2 segundos para la mayoría de las consultas. |
| **RNF-002** | Seguridad | El sistema deberá utilizar contraseñas protegidas mediante hash, tokens con expiración, HTTPS y control de acceso por roles. |
| **RNF-003** | Protección de datos | Los usuarios solo podrán acceder a la información autorizada. Los datos sensibles no deberán exponerse en mensajes de error ni registros técnicos. |
| **RNF-004** | Usabilidad | La interfaz deberá ser clara, intuitiva y consistente, con mensajes comprensibles y validaciones adecuadas. |
| **RNF-006** | Confiabilidad | El sistema deberá garantizar la consistencia de los datos durante las operaciones de registro y actualización de perfiles, especialidades y reseñas, evitando duplicidades y operaciones incompletas. |
| **RNF-007** | Observabilidad | El sistema deberá registrar información suficiente para identificar errores, operaciones fallidas, componentes involucrados y posibles problemas con servicios externos. |

### 1.3 Matriz de Trazabilidad RF → Historia de Usuario

| Requisito | Historia de Usuario | Épica | Sprint |
| :--- | :--- | :---: | :---: |
| RF-PAC-01 | US-PAC-01 | 4 | 4 |
| RF-PAC-02 | US-PAC-02 | 4 | 4 |
| RF-PAC-03 | US-PAC-03 | 3 | 3 |
| RF-PAC-04 | US-PAC-04 | 3 | 3 |
| RF-PAC-05 | US-PAC-05 | 4 | 4 |
| RF-PAC-06 | US-PAC-06 | 5 | 5 |
| RF-PAC-07 | US-PAC-07 | 5 | 5 |
| RF-MED-01 | US-MED-01 | 1 | 2 |
| RF-MED-02 | US-MED-02 | 2 | 2 |
| RF-MED-03 | US-MED-03 | 2 | 2 |
| RF-MED-04 | US-MED-04 | 2 | 2 |
| RF-MED-05 | US-MED-05 | 2 | 2 |
| RF-MED-06 | US-MED-06 | 5 | 5 |
| RF-ADM-01 | US-ADM-01 | 1 | 2 |
| RF-ADM-02 | US-ADM-02 | 3 | 3 |
| RF-ADM-03 | US-ADM-03 | 2 | 2 |
| RF-ADM-04 | US-ADM-04 | 1 | 1 |
| RF-ADM-05 | US-ADM-05 | 3 | 3 |
| RF-ADM-06 | US-ADM-06 | 5 | 5 |
| RNF-001 (Rendimiento) | US-PAC-03, US-QA-01 | 3, 5 | 3, 5 |
| RNF-002 / RNF-003 (Seguridad y Protección de datos) | US-MED-01, US-ADM-01, US-ADM-05 | 1, 3 | 2, 3 |
| RNF-004 (Usabilidad) | Transversal a todas las US con Frontend | — | 1–5 |
| RNF-006 (Confiabilidad) | US-PAC-06, US-ADM-03, US-QA-01 | 2, 5 | 2, 5 |
| RNF-007 (Observabilidad) | US-ADM-04, US-PAC-05 | 1, 4 | 1, 4 |

---

## 2. Épicas e Historias de Usuario

### ÉPICA 1: Arquitectura Base, Seguridad (JWT) y Capa Transversal (AOP) *(4 US)*
> **Objetivo:** Configuración del entorno de desarrollo con Docker Compose, PostgreSQL y Flyway; autenticación con Spring Security + JWT para médicos y administradores; auditoría transversal con Spring AOP.

#### US-1.1: Inicialización del Proyecto, Infraestructura e Integración Base
* **Descripción:** Como desarrollador, quiero configurar el entorno base con Docker Compose, PostgreSQL, Flyway, Spring Boot y React con Tailwind CSS para contar con una infraestructura de desarrollo lista para construir el sistema.
* **Detalle Técnico:** Setup de Spring Boot (Java 21), React + TypeScript con Tailwind CSS, migraciones Flyway y `docker-compose.yml` para PostgreSQL.
* **Etiquetas (Tags):** `docker`, `postgresql`, `flyway`, `java21`, `spring-boot`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 2 pts
  * **Total US-1.1: 3 pts**

#### US-MED-01: Registro y Autenticación JWT de Médicos
* **Requisito asociado:** RF-MED-01
* **Descripción:** Como médico, quiero registrarme e iniciar sesión con credenciales seguras para acceder a las herramientas de autogestión de mi perfil profesional.
* **Detalle Técnico:** Endpoints `POST /auth/register` y `POST /auth/login`, hash BCrypt, emisión de JWT con expiración y rol `ROLE_MEDICO`; filtros de Spring Security.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `jwt`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 2 pts
  * Backend: 3 pts
  * **Total US-MED-01: 6 pts**

#### US-ADM-01: Autenticación con Privilegios (`ROLE_ADMIN`)
* **Requisito asociado:** RF-ADM-01
* **Descripción:** Como administrador, quiero iniciar sesión con un rol protegido para gestionar la plataforma con la seguridad requerida.
* **Detalle Técnico:** Usuario administrador sembrado vía Flyway, login con JWT de rol `ROLE_ADMIN` y rutas protegidas `/admin/**` en Spring Security y React Router.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `jwt`, `flyway`, `react`, `typescript`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 2 pts
  * **Total US-ADM-01: 3 pts**

#### US-ADM-04: Visualización de Auditoría AOP
* **Requisito asociado:** RF-ADM-04
* **Descripción:** Como administrador, quiero consultar el historial de auditoría capturado automáticamente por los aspectos de Spring AOP para supervisar qué usuario realizó modificaciones en los perfiles y en qué fecha.
* **Detalle Técnico:** Aspecto `@Around` / `@AfterReturning` sobre los servicios de perfil que persiste usuario, campo modificado, valor anterior/nuevo y timestamp en la tabla `auditoria`. Logging centralizado y manejo global de excepciones. Vista tabular paginada en el panel admin.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `aop`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 1 pt
  * Backend: 3 pts
  * **Total US-ADM-04: 5 pts**

---

### ÉPICA 2: Autogestión del Perfil Médico y Catálogo de Especialidades *(5 US)*
> **Objetivo:** Permitir al médico construir su perfil profesional público (carta de presentación, colegiatura, consultorios y especialidades) y al administrador mantener el catálogo oficial de especialidades.

#### US-MED-02: Gestión de Carta de Presentación y Perfil Profesional
* **Requisito asociado:** RF-MED-02
* **Descripción:** Como médico, quiero crear y actualizar mi biografía, años de experiencia, fotografía y datos públicos para mantener mi presentación atractiva.
* **Detalle Técnico:** Endpoints `GET/PUT /medicos/me/perfil`, carga de fotografía de perfil, validaciones de campos y formulario de edición en React.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 2 pts
  * Backend: 2 pts
  * **Total US-MED-02: 5 pts**

#### US-MED-03: Registro de Colegiatura Médica
* **Requisito asociado:** RF-MED-03
* **Descripción:** Como médico, quiero ingresar mi número de colegiatura profesional para que la plataforma valide mi identidad médica.
* **Detalle Técnico:** Campo obligatorio y único en el registro/actualización de perfil; estado inicial `PENDIENTE_VERIFICACION` para la moderación posterior (US-ADM-02).
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 1 pt
  * **Total US-MED-03: 2 pts**

#### US-MED-04: Gestión de Ubicaciones de Atención y Consultorios
* **Requisito asociado:** RF-MED-04
* **Descripción:** Como médico, quiero agregar, editar o eliminar las direcciones de mis clínicas o consultorios para informar a los pacientes dónde atiendo.
* **Detalle Técnico:** Entidad `CentroAtencion` (1:N con médico), endpoints CRUD `/medicos/me/centros` y listado editable en el panel del médico.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 2 pts
  * Backend: 2 pts
  * **Total US-MED-04: 5 pts**

#### US-MED-05: Asignación de Especialidades Acreditadas
* **Requisito asociado:** RF-MED-05
* **Descripción:** Como médico, quiero seleccionar las especialidades en las que estoy acreditado para figurar en las búsquedas del directorio.
* **Detalle Técnico:** Relación N:M médico–especialidad; selector múltiple alimentado por el catálogo oficial (solo especialidades activas).
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 1 pt
  * **Total US-MED-05: 2 pts**

#### US-ADM-03: Gestor del Catálogo de Especialidades
* **Requisito asociado:** RF-ADM-03
* **Descripción:** Como administrador, quiero crear, editar o deshabilitar especialidades en el catálogo oficial para mantener actualizada la oferta médica.
* **Detalle Técnico:** Endpoints CRUD `/admin/especialidades` con validación que impide eliminar especialidades vinculadas a médicos activos (solo deshabilitar). Vista tabular en React.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 1 pt
  * Backend: 2 pts
  * **Total US-ADM-03: 4 pts**

---

### ÉPICA 3: Directorio Médico, Búsqueda Avanzada y Moderación Admin *(4 US)*
> **Objetivo:** Motor de búsqueda público del directorio con filtros combinados y ficha del médico; herramientas de moderación de perfiles y control de cuentas para el administrador.

#### US-PAC-03: Buscador Avanzado de Directorio con Filtros Combinados
* **Requisito asociado:** RF-PAC-03 (y RNF-001)
* **Descripción:** Como paciente, quiero filtrar a los especialistas por nombre, especialidad, ubicación o colegiatura para encontrar al médico adecuado en menos de 2 segundos.
* **Detalle Técnico:** Endpoint `GET /directorio/medicos` con filtros dinámicos (JPA Specifications), paginación e índices en PostgreSQL. Solo muestra médicos aprobados. Interfaz de búsqueda con filtros combinables.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 2 pts
  * Frontend: 3 pts
  * Backend: 3 pts
  * **Total US-PAC-03: 8 pts**

#### US-PAC-04: Ficha Técnica y Perfil del Médico
* **Requisito asociado:** RF-PAC-04
* **Descripción:** Como paciente, quiero acceder al perfil completo del médico (foto, biografía, colegiatura verificada y consultorios) para evaluar su trayectoria profesional.
* **Detalle Técnico:** Endpoint público `GET /directorio/medicos/{id}` y página de detalle en React con insignia de colegiatura verificada.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 2 pts
  * Backend: 1 pt
  * **Total US-PAC-04: 4 pts**

#### US-ADM-02: Moderación y Verificación de Perfiles Médicos
* **Requisito asociado:** RF-ADM-02
* **Descripción:** Como administrador, quiero revisar las colegiaturas de los médicos registrados para aprobar, suspender o deshabilitar su visibilidad en el directorio público.
* **Detalle Técnico:** Estados del perfil (`PENDIENTE_VERIFICACION`, `APROBADO`, `SUSPENDIDO`, `DESHABILITADO`), endpoint `/admin/medicos/{id}/estado` y panel de revisión con cola de pendientes. Cambios de estado auditados por AOP.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `aop`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 2 pts
  * Backend: 2 pts
  * **Total US-ADM-02: 5 pts**

#### US-ADM-05: Control de Cuentas de Usuario (Habilitar / Bloquear)
* **Requisito asociado:** RF-ADM-05
* **Descripción:** Como administrador, quiero habilitar o bloquear cuentas de usuarios para prevenir comportamientos sospechosos o incumplimiento de términos.
* **Detalle Técnico:** Flag `habilitado` en la cuenta, endpoint `/admin/usuarios/{id}/estado`, rechazo de login y de tokens activos para cuentas bloqueadas.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `jwt`, `postgresql`, `react`, `typescript`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 2 pts
  * **Total US-ADM-05: 3 pts**

---

### ÉPICA 4: Asistente Inteligente (IA), Triage Operativo y Fallback *(3 US)*
> **Objetivo:** Chatbot integrado con la API de un LLM externo para orientar al paciente hacia la especialidad adecuada, detectar emergencias y degradar de forma controlada a la búsqueda manual.

#### US-PAC-01: Triage Operativo por IA (Procesamiento de Lenguaje Natural)
* **Requisito asociado:** RF-PAC-01
* **Descripción:** Como paciente, quiero ingresar una consulta en texto libre describiendo mis malestares en el chatbot para recibir la sugerencia de la especialidad médica adecuada y una breve orientación.
* **Detalle Técnico:** Endpoint `POST /asistente/triage`; cliente HTTP en Spring Boot hacia la API REST del LLM resguardando credenciales en variables de entorno; prompt restringido al catálogo de especialidades; widget de chat en React aclarando su rol orientativo y no diagnóstico.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `ia-llm`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 2 pts
  * Backend: 3 pts
  * **Total US-PAC-01: 6 pts**

#### US-PAC-02: Detección y Alerta de Emergencias Médicas
* **Requisito asociado:** RF-PAC-02
* **Descripción:** Como paciente, quiero que el sistema detecte palabras clave de urgencia vital para recibir una alerta visual roja e inmediata que me indique acudir a urgencias.
* **Detalle Técnico:** Diccionario configurable de palabras clave de urgencia evaluado antes de invocar al LLM; respuesta con flag `emergencia=true` y componente de alerta roja en el widget.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `ia-llm`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 1 pt
  * Backend: 1 pt
  * **Total US-PAC-02: 3 pts**

#### US-PAC-05: Fallback Manual por Caída o Timeout de IA
* **Requisito asociado:** RF-PAC-05 (y RNF-007)
* **Descripción:** Como paciente, quiero que el sistema me redirija automáticamente al buscador por catálogo si la API de IA falla para evitar interrupciones en mi búsqueda.
* **Detalle Técnico:** Timeouts y manejo de errores en el cliente HTTP, registro del fallo del servicio externo (observabilidad) y redirección del widget al motor de búsqueda por filtros sin romper la SPA.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `ia-llm`, `aop`, `react`, `typescript`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 2 pts
  * **Total US-PAC-05: 3 pts**

---

### ÉPICA 5: Reputación / Calificación, Garantía de Calidad y Cierre *(6 US)*
> **Objetivo:** Sistema de reputación (calificaciones y reseñas) con moderación, pruebas automatizadas y documentación interactiva de la API para la entrega académica.

#### US-PAC-06: Calificación y Reseña de Médicos (1 a 5 Estrellas)
* **Requisito asociado:** RF-PAC-06
* **Descripción:** Como paciente, quiero registrar una puntuación (1 a 5 estrellas) y redactar un comentario sobre mi experiencia para compartir mi valoración con la comunidad.
* **Detalle Técnico:** Entidad `Resena` con restricción única (paciente, médico) para garantizar una sola calificación por par; endpoint `POST /medicos/{id}/resenas`; componente de estrellas y formulario en la ficha del médico.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 2 pts
  * Backend: 2 pts
  * **Total US-PAC-06: 5 pts**

#### US-PAC-07: Filtro de Búsqueda por Calificación Mínima
* **Requisito asociado:** RF-PAC-07
* **Descripción:** Como paciente, quiero filtrar la lista del directorio por un umbral mínimo de valoración (ej. 4 estrellas o más) para identificar a los especialistas mejor calificados.
* **Detalle Técnico:** Parámetro `calificacionMinima` en el buscador (US-PAC-03) con promedio calculado sobre reseñas visibles; control de selección en la UI de filtros.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 1 pt
  * **Total US-PAC-07: 2 pts**

#### US-MED-06: Panel de Feedback y Reputación Profesional
* **Requisito asociado:** RF-MED-06
* **Descripción:** Como médico, quiero consultar mi promedio general de estrellas y los comentarios recibidos para monitorear la satisfacción de mis pacientes.
* **Detalle Técnico:** Endpoint `GET /medicos/me/reputacion` con promedio global, total de opiniones y listado paginado de comentarios; tarjetas de resumen en el panel del médico.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `postgresql`, `react`, `typescript`, `tailwind`
* **Puntos de Historia:**
  * UX / Design: 1 pt
  * Frontend: 1 pt
  * Backend: 2 pts
  * **Total US-MED-06: 4 pts**

#### US-ADM-06: Moderación de Reseñas por el Administrador
* **Requisito asociado:** RF-ADM-06
* **Descripción:** Como administrador, quiero revisar y ocultar comentarios inapropiados o spam para asegurar un entorno de respeto en la plataforma.
* **Detalle Técnico:** Estado de visibilidad en `Resena` (`VISIBLE`, `OCULTA`, `ELIMINADA`), endpoint `/admin/resenas/{id}/estado` y listado de moderación. Acciones auditadas por AOP.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `aop`, `postgresql`, `react`, `typescript`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 1 pt
  * Backend: 2 pts
  * **Total US-ADM-06: 3 pts**

#### US-QA-01: Pruebas Automatizadas Backend (JUnit 5 + Mockito)
* **Requisito asociado:** RNF-001, RNF-006
* **Descripción:** Como equipo de desarrollo, quiero ejecutar pruebas unitarias e integración sobre los servicios críticos para garantizar la estabilidad del código.
* **Detalle Técnico:** Pruebas unitarias con Mockito para los servicios de perfil, directorio, triage y reseñas; pruebas de integración con PostgreSQL para seguridad JWT y la restricción de reseña única.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `aop`, `testing`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 0 pts
  * Backend: 3 pts
  * **Total US-QA-01: 3 pts**

#### US-DOC-01: Documentación Interactiva de la API (Swagger UI / OpenAPI)
* **Descripción:** Como evaluador/desarrollador, quiero contar con la especificación interactiva de la API para probar los endpoints desde el navegador.
* **Detalle Técnico:** springdoc-openapi con esquema de seguridad Bearer JWT configurado en Swagger UI.
* **Etiquetas (Tags):** `java21`, `spring-boot`, `openapi`
* **Puntos de Historia:**
  * UX / Design: 0 pts
  * Frontend: 0 pts
  * Backend: 1 pt
  * **Total US-DOC-01: 1 pt**

---

## 3. Matriz Resumen de Puntos de Historia

| Épica | ID | Historia de Usuario | RF | Sprint | UX/Des | Front | Back | Total |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Épica 1** | **US-1.1** | Inicialización, Infraestructura e Integración Base | — | 1 | 0 | 1 | 2 | **3** |
| | **US-MED-01** | Registro y Autenticación JWT de Médicos | RF-MED-01 | 2 | 1 | 2 | 3 | **6** |
| | **US-ADM-01** | Autenticación con Privilegios (`ROLE_ADMIN`) | RF-ADM-01 | 2 | 0 | 1 | 2 | **3** |
| | **US-ADM-04** | Visualización de Auditoría AOP | RF-ADM-04 | 1 | 1 | 1 | 3 | **5** |
| | | *Subtotal Épica 1* | | | *2* | *5* | *10* | ***17*** |
| **Épica 2** | **US-MED-02** | Carta de Presentación y Perfil Profesional | RF-MED-02 | 2 | 1 | 2 | 2 | **5** |
| | **US-MED-03** | Registro de Colegiatura Médica | RF-MED-03 | 2 | 0 | 1 | 1 | **2** |
| | **US-MED-04** | Ubicaciones de Atención y Consultorios | RF-MED-04 | 2 | 1 | 2 | 2 | **5** |
| | **US-MED-05** | Asignación de Especialidades Acreditadas | RF-MED-05 | 2 | 0 | 1 | 1 | **2** |
| | **US-ADM-03** | Gestor del Catálogo de Especialidades | RF-ADM-03 | 2 | 1 | 1 | 2 | **4** |
| | | *Subtotal Épica 2* | | | *3* | *7* | *8* | ***18*** |
| **Épica 3** | **US-PAC-03** | Buscador Avanzado con Filtros Combinados | RF-PAC-03 | 3 | 2 | 3 | 3 | **8** |
| | **US-PAC-04** | Ficha Técnica y Perfil del Médico | RF-PAC-04 | 3 | 1 | 2 | 1 | **4** |
| | **US-ADM-02** | Moderación y Verificación de Perfiles Médicos | RF-ADM-02 | 3 | 1 | 2 | 2 | **5** |
| | **US-ADM-05** | Control de Cuentas de Usuario | RF-ADM-05 | 3 | 0 | 1 | 2 | **3** |
| | | *Subtotal Épica 3* | | | *4* | *8* | *8* | ***20*** |
| **Épica 4** | **US-PAC-01** | Triage Operativo por IA | RF-PAC-01 | 4 | 1 | 2 | 3 | **6** |
| | **US-PAC-02** | Detección y Alerta de Emergencias | RF-PAC-02 | 4 | 1 | 1 | 1 | **3** |
| | **US-PAC-05** | Fallback Manual por Caída o Timeout de IA | RF-PAC-05 | 4 | 0 | 1 | 2 | **3** |
| | | *Subtotal Épica 4* | | | *2* | *4* | *6* | ***12*** |
| **Épica 5** | **US-PAC-06** | Calificación y Reseña de Médicos | RF-PAC-06 | 5 | 1 | 2 | 2 | **5** |
| | **US-PAC-07** | Filtro por Calificación Mínima | RF-PAC-07 | 5 | 0 | 1 | 1 | **2** |
| | **US-MED-06** | Panel de Feedback y Reputación | RF-MED-06 | 5 | 1 | 1 | 2 | **4** |
| | **US-ADM-06** | Moderación de Reseñas | RF-ADM-06 | 5 | 0 | 1 | 2 | **3** |
| | **US-QA-01** | Pruebas JUnit 5 / Mockito | RNF | 5 | 0 | 0 | 3 | **3** |
| | **US-DOC-01** | Documentación Swagger UI / OpenAPI | — | 5 | 0 | 0 | 1 | **1** |
| | | *Subtotal Épica 5* | | | *2* | *5* | *11* | ***18*** |
| **TOTALES** | **22 US** | | | | **13** | **29** | **43** | **85** |
