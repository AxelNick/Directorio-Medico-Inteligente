# Directorio Médico Inteligente

> **Cliente / Organización:** Universidad Nacional de Ingeniería (UNI)  
> **Arquitectura:** Monolítica Modular por capas con Programación Orientada a Aspectos (AOP)  
> **Taiga PM:** [http://159.195.245.124:8085/project/sistema-citas-medicas/](http://159.195.245.124:8085/project/sistema-citas-medicas/)  
> **Estado:** En desarrollo (Sprints 1 a 5 - 2026)


## Descripción del Proyecto

El **Directorio Médico Inteligente** es una plataforma digital web bajo una arquitectura monolítica modular diseñada para conectar a pacientes con especialistas médicos de forma eficiente. Su núcleo innovador radica en la integración de un **Asistente Inteligente (IA)** capaz de procesar el lenguaje natural del paciente para realizar un *triage operativo* (sugerir la especialidad correcta según los síntomas) y filtrar automáticamente el directorio.

Empodera a los profesionales de la salud brindándoles herramientas de autogestión para publicar sus perfiles y centros de atención, aplicando **Spring AOP** para la separación de aspectos transversales como auditoría, logging y manejo de excepciones.


## Stack Tecnológico

| Capa / Módulo | Tecnología / Herramienta | Descripción |
| :--- | :--- | :--- |
| **Lenguaje Backend** | Java 21 LTS | Código robusto, moderno y mantenible. |
| **Framework Backend** | Spring Boot 3.x | Desarrollo de la API RESTful. |
| **Capa Transversal** | Spring AOP + AspectJ | Logging centralizado, auditoría de modificaciones y medición de rendimiento. |
| **Seguridad** | Spring Security + JWT | Autenticación basada en tokens y control de acceso por roles (RBAC). |
| **Base de Datos** | PostgreSQL 15+ | Persistencia relacional de datos. |
| **ORM / Persistencia**| Spring Data JPA + Hibernate | Mapeo objeto-relacional. |
| **Migraciones DB** | Flyway | Control de versiones del esquema de base de datos. |
| **Frontend SPA** | React 18 + TypeScript | Interfaz de usuario interactiva y tipada. |
| **Diseño y Estilos** | Tailwind CSS | Estilos adaptables (Azul `#1E3A5F`, Turquesa `#0F8B8D`). |
| **Inteligencia Artificial**| API REST de LLM Externa | Chatbot de triage operativo y derivación a especialidades. |
| **Pruebas** | JUnit 5 + Mockito | Pruebas unitarias e integración backend. |
| **Documentación API**| Springdoc OpenAPI / Swagger UI | Especificación interactiva de endpoints REST. |
| **Contenedores** | Docker & Docker Compose | Entorno de desarrollo aislado con PostgreSQL. |
| **Control de Versiones**| Git & GitHub / Taiga | Gestión del código fuente y metodologías ágiles. |


## Características Principales (Dentro del Alcance)

* **Módulo de Autenticación y RBAC:** Registro e inicio de sesión seguro con tokens JWT para roles de `PACIENTE`, `MEDICO` y `ADMINISTRADOR`.
* **Módulo de Autogestión Médica:** Interfaz dedicada para que los especialistas administren su carta de presentación, colegiatura, especialidades y direcciones.
* **Asistente Inteligente / Chatbot IA:** Triage operativo en lenguaje natural para interpretar malestares y sugerir la especialidad pertinente.
* **Motor de Búsqueda de Directorio:** Exploración y filtrado avanzado (por nombre, especialidad, ubicación, calificación) para ubicar especialistas.
* **Detección de Emergencias y Fallback:** Alertas visuales ante situaciones críticas y canalización al flujo manual de búsqueda si la IA no responde.
* **Sistema de Reseñas:** Los pacientes pueden calificar (1 a 5 estrellas) y dejar comentarios sobre su experiencia.
* **Capa Transversal (Spring AOP):** Registro silencioso de logs, monitoreo y auditoría de modificaciones de perfiles médicos.


## Fuera del Alcance (Exclusiones)

* **Sin Gestión de Citas y Agendas:** El sistema NO es un motor de reservas. No maneja calendarios ni bloquea horarios.
* **Sin Responsabilidad Clínica:** El chatbot de IA no emite diagnósticos, no sugiere tratamientos ni receta fármacos.
* **Sin Procesamiento Financiero:** No incluye facturación, pasarelas de pago ni validación de seguros.
* **Sin Historias Clínicas (EHR):** No gestiona expedientes médicos complejos, resultados ni imágenes de pacientes.


## Estructura del Repositorio

```text
sistema-citas-medicas/
├── docker-compose.yml          # Servicio de PostgreSQL para desarrollo local
├── README.md                   # Documentación principal del repositorio
├── .gitignore                  # Exclusión de archivos binarios y temporales
├── .env.example                # Variables de entorno de ejemplo (DB, JWT, LLM Key)
├── docs/                       # Documentación del proyecto
│   ├── wbs-taiga.md            # Estructura de Desglose de Trabajo (WBS) y Backlog
│   ├── sprints-planning.md     # Cronograma de Sprints y guía de commits
│   └── ARQUITECTURA.md         # Documentación técnica de arquitectura y AOP
├── backend/                    # Proyecto Spring Boot (Java 21)
└── frontend/                   # Proyecto React + TypeScript (Tailwind CSS)
```

## Requisitos Previos e Instalación

### Prerrequisitos
* **Java 21 LTS** o superior.
* **Node.js v20+** y npm.
* **Docker Desktop** y Docker Compose.
* **Git**.

### Pasos de Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/sistema-citas-medicas.git
   cd sistema-citas-medicas
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```

3. **Iniciar la Base de Datos PostgreSQL con Docker Compose:**
   ```bash
   docker compose up -d
   ```

4. **Ejecutar el Backend (Spring Boot):**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   * La API estará disponible en: http://localhost:8080
   * Swagger UI estará disponible en: http://localhost:8080/swagger-ui.html

5. **Ejecutar el Frontend (React + TypeScript):**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   * La aplicación estará disponible en: http://localhost:5173


## Planificación y Gestión en Taiga
* **URL de Taiga:** [http://159.195.245.124:8085/project/sistema-citas-medicas/](http://159.195.245.124:8085/project/sistema-citas-medicas/)

Para consultar el desglose detallado, asignación de Puntos de Historia y el plan de Sprints, revisa los documentos en la carpeta `/docs`:
* `docs/wbs-taiga.md` — Estructura WBS y Backlog actualizado al nuevo alcance.
* `docs/sprints-planning.md` — Cronograma de Sprints y Convención de Commits.


## Licencia y Créditos
Desarrollado para el curso de **Desarrollo de Software** de la **Universidad Nacional de Ingeniería (UNI)**.
