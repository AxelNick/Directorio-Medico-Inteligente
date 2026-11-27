# Informe de pruebas y persistencia

Ejecución del **26 de noviembre de 2026, Lima**, con base `5e1b763694a15d3468d742d5b6c97c60fa1cb955` (PR #20) y versión evaluada `106483311b5f8a629a18fbde516f0eea07ba7a76`. La implementación principal está en `071fc8d` y el aislamiento de entornos de build en `1064833`.

El alcance incluye tres PostgreSQL locales desechables, H2 para la comparación histórica y un Compose independiente en la UNI. [Informe del VPS](vps.md).

## Resultados locales

| Ejecución | Entorno y resultado |
| --- | --- |
| Línea base | Docker Desktop 4.47.0, Engine 28.4.0, Compose 2.39.4, PostgreSQL 15.19. SPA 200. Directorio, reseñas y reputación del médico daban 404 con JWT. La base permitía un perfil con identidad nula. |
| Backend de base | Maven Wrapper 3.10.0, Java Temurin 25.0.4.1, perfil `local` (H2). 44 aprobadas, 0 fallidas. |
| Backend integrado | Maven Wrapper `clean verify` con H2 y luego PostgreSQL 15.19, en `dmi_junit`. Cada ejecución dio 51 aprobadas, 0 fallidas y 0 omitidas. |
| Frontend | Node 24.14.1, npm 11.11.0 en Windows. `npm ci`, `npm run lint`, `npm run build` y `npm run test:demo` correctos. El build Docker usa Node 22. El adaptador de demo se verificó por separado. |
| HTTP real | API Spring, PostgreSQL en `jdbc:postgresql://db:5432/directorio_medico` y build nginx. Flujo de tres roles, CORS, fotos, directorio, triage, reseña concurrente, moderación, reputación, catálogo, auditoría y regresión 404/405 aprobados. |
| Navegador | Chromium, 3 de 3 casos en el build nginx (flujo, Swagger Authorize 401/403/200, paneles y roles). Un recorrido adicional aprobado con Vite en un origen y la API/foto en otro. Se probaron escritorio y 375 px, teclado y foco, contraste del texto de ayuda, foto JPG/PNG/WebP, carga, validación, alerta, vacío, fallo de red y recuperación. |
| Rendimiento US-PAC-03 | 30 GET consecutivos vía nginx, PostgreSQL 15.19 y 1.000 médicos sintéticos coincidentes, cada uno con dos centros y dos especialidades. Nueve ítems por página. Mínimo 38,9 ms, p50 82,0 ms, p95 148,9 ms y máximo 171,5 ms. Mide tiempo HTTP completo de esta muestra local. |
| Proveedor de triage | Docker local y VPS usan `simulado`. Se probó `OpenAiAdapter` con servidor HTTP local y respuestas 429, 503, ilegible, timeout y desconexión. La prueba de servicio confirma cero llamadas en emergencia. La integración externa carecía de configuración habilitada para este proyecto. [Límites y guía externa](../../DEPLOYMENT.md). |

En modo proxy el navegador pidió `/api/api/v1/…` y nginx eliminó el primer prefijo. En modo de URL directa el navegador pidió `/api/v1/…` y obtuvo la foto con `naturalWidth > 0` desde el origen de backend. Nginx conservó el puerto de `Host` para que los POST del mismo sitio funcionen en puertos alternativos. Se excluyeron los archivos de entorno del contexto Docker para que una URL de producción local no altere el build Compose.

Una revisión de los logs de backend y nginx encontró cero coincidencias de los cuerpos de triage enviados por las pruebas. En auditoría PostgreSQL hubo eventos de creación, edición y eliminación de centros, además de cambios de perfil y catálogo.

### Cobertura y aceptación

Medición JaCoCo 0.8.15 del bundle completo del backend. Se incluyeron todas las clases analizadas y líneas ejecutables de producción. Los tests y las dependencias quedan fuera por el alcance normal de JaCoCo. El umbral de `verify` exige más de 50 %.

| Versión | Tests | Clases analizadas | Líneas cubiertas / total | % |
| --- | ---: | ---: | ---: | ---: |
| Base `5e1b763`, H2 | 44 | 61 | 613 / 806 | 76,05 % |
| Integrado `1064833`, H2 | 51 | 88 | 826 / 1.200 | 68,83 % |
| Integrado `1064833`, PostgreSQL | 51 | 88 | 826 / 1.200 | 68,83 % |

Se cubrieron 213 líneas adicionales y el denominador aumentó 394 líneas al incorporar los servicios públicos y el almacenamiento remoto. Los reportes HTML quedan en `backend/target/site/jacoco/index.html` para la última corrida, `docs-local/integrante1-jacoco-h2/index.html` para H2 integrado y `docs-local/integrante1-base/backend/target/site/jacoco/index.html` para la línea base. Los XML permiten calcular directamente el contador `LINE` del bundle.

Para las matrices A/B/C/D/U se cuenta cada ID una vez, aunque tenga más de un nivel de evidencia. Se ejecutaron **52 de 53** casos en Docker con API real (**98,11 %**), con **52 de 52 aprobados**. Sigue pendiente B-05, fallback con especialidad preservada en API real. La [matriz de aceptación](../matriz-aceptacion-sprints-3-5.md) detalla IDs y alcance. La suite frontend se reporta aparte y el ensayo adicional de paneles corresponde al mismo software desplegado.

## Evidencia PostgreSQL y fotografías

| Base | Antes | Después |
| --- | --- | --- |
| PostgreSQL fresco `dmi-integrante1-qa` | Volumen nuevo. | Hibernate creó columnas, relaciones, índices y UNIQUE. El médico **#5** tiene dos centros, dos especialidades, una reseña visible **#5**, promedio 5,0 y una única fila para el par. Dos POST concurrentes devolvieron 201 y 409. |
| Histórico `4200fd0` | Médico **#1**, un centro y una especialidad. Siete columnas en `medicos`; aún no existía `resenas`. | Mismo ID, centro y especialidad. Hibernate agregó `nombres`, `apellidos`, `estado_perfil` y creó `resenas`. La titular completó su identidad autenticada. CMP aún pendiente y ficha sin publicación. |
| Base `5e1b763` | Médico **#1** con nombres nulos, un centro, una especialidad y reseña visible **#1** de puntuación 4. | IDs y recuentos conservados. Actualizó identidad desde su sesión. Se mantiene la reseña y el promedio 4. Hibernate añadió `ix_resenas_medico_visibilidad`. |

PostgreSQL confirmó `UNIQUE (paciente_id, medico_id)`, ambas FK, `CHECK` de puntuación y estado y el índice `(medico_id, estado_visibilidad)`. Al ocultar una reseña desde la moderación, la ficha precalentada pasó de promedio 5 a nulo y el filtro mínimo dejó de incluir al médico. La prueba Java revirtió una moderación y comprobó que ambos objetos de caché conservaron sus referencias y el GET siguió reflejando el dato confirmado.

Para el médico **#5** se compararon identificadores, URL y SHA-256 del contenido. Luego se recrearon **db, backend y frontend** con los mismos volúmenes `pgdata` y `uploads`. Las consultas devolvieron los mismos ID, el mismo promedio y la misma foto. La URL anterior al reemplazo había pasado a 404. [Consultas SQL saneadas](persistencia.sql).

La imagen PNG ficticia usada por la prueba HTTP conservó el hash `273349097030afc74d6a4afea6cb1928960e75202fa459677adf617672ac3466`, tanto en Docker local como en la UNI. La URL de cada entorno y los identificadores se cotejan automáticamente con `test:api -- --persistencia`.

## Repetición local

Desde la raíz del repositorio en PowerShell:

```powershell
$env:DMI_API_PORT='18080'
$env:DMI_SPA_PORT='15173'
$env:DMI_DB_PORT='15433'
docker compose -p dmi-integrante1-qa up -d --build
curl.exe --retry 15 --retry-delay 2 --retry-all-errors -fsS http://127.0.0.1:15173/api/salud
New-Item -ItemType Directory -Force docs-local | Out-Null
$env:DMI_STATE_FILE=Join-Path (Resolve-Path docs-local).Path 'integrante1-estado.json'
$env:DMI_SWAGGER_URL='http://127.0.0.1:18080'
$env:DMI_BROWSER_CHANNEL='chrome'
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run test:api
npm.cmd --prefix frontend run test:browser
docker compose -p dmi-integrante1-qa up -d --force-recreate
curl.exe --retry 15 --retry-delay 2 --retry-all-errors -fsS http://127.0.0.1:15173/api/salud
npm.cmd --prefix frontend run test:api -- --persistencia
```

La SPA del ensayo está en `http://127.0.0.1:15173` y Swagger en `http://127.0.0.1:18080/swagger-ui/index.html`. La prueba crea datos únicos en cada ejecución. Usa el perfil local de Docker con las cuentas de ensayo predeterminadas o define `DMI_ADMIN_USER` y `DMI_ADMIN_PASS` desde un almacén privado. Si usas Chromium administrado por Playwright, instala su navegador y omite `DMI_BROWSER_CHANNEL`. Para probar otro origen, inicia `npm run dev:api` con `VITE_API_BASE_URL=http://127.0.0.1:18080`, usa `DMI_SPA_URL=http://127.0.0.1:5173` y valida con `DMI_DIRECT_API_ORIGIN=http://127.0.0.1:18080`.

```powershell
$src=(Resolve-Path backend).Path
docker run --rm --mount "type=bind,source=$src,target=/src" --mount 'type=volume,source=dmi-integrante1-maven,target=/root/.m2' -w /src maven:3.9-eclipse-temurin-25 bash ./mvnw -B -ntp clean verify

docker compose -p dmi-integrante1-qa exec -T db createdb -U usuario_medico dmi_junit
docker run --rm --network dmi-integrante1-qa_default --mount "type=bind,source=$src,target=/src" --mount 'type=volume,source=dmi-integrante1-maven,target=/root/.m2' -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/dmi_junit -e SPRING_DATASOURCE_USERNAME=usuario_medico -e SPRING_DATASOURCE_PASSWORD=password123 -e SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver -e SPRING_JPA_HIBERNATE_DDL_AUTO=create-drop -w /src maven:3.9-eclipse-temurin-25 bash ./mvnw -B -ntp clean verify
```

Los valores de JDBC mostrados en este bloque pertenecen exclusivamente al Compose desechable. Para medir la base, extrae `git archive 5e1b763 backend` a una carpeta temporal, añade solo los objetivos JaCoCo `prepare-agent` y `report` (0.8.15), y ejecuta la misma orden con H2.

```powershell
$caso = Get-Content -Raw $env:DMI_STATE_FILE | ConvertFrom-Json
Get-Content -Raw docs/qa/persistencia.sql | docker compose -p dmi-integrante1-qa exec -T db psql -U usuario_medico -d directorio_medico -v "medico_id=$($caso.medicoId)"
Get-Content -Raw docs/qa/datos-benchmark.sql | docker compose -p dmi-integrante1-qa exec -T db psql -U usuario_medico -d directorio_medico
npm.cmd --prefix frontend run test:api -- --benchmark
```

Para reproducir la evolución, compila los árboles de `4200fd0` y `5e1b763` en carpetas independientes. Arranca cada artefacto antiguo sobre un PostgreSQL de proyecto propio, registra un médico por su antiguo contrato y añade centro y especialidad. En `5e1b763`, inserta además una reseña ficticia para ese médico y un paciente de pruebas, ya que el POST público todavía no existe. Captura columnas y recuentos antes de reemplazar solo el backend por la imagen actual, manteniendo el volumen `pgdata`. Completa la identidad con el JWT del médico y vuelve a ejecutar [persistencia.sql](persistencia.sql). Los proyectos usados fueron `dmi-integrante1-historico` y `dmi-integrante1-base`.

## Evidencias y Taiga

El código se identifica en Git local con `git log --oneline 5e1b763..1064833`. Se guardaron cuatro vistas por entorno en una carpeta local ignorada por Git. [Directorio de escritorio](../../docs-local/evidencia-integrante1/1064833/docker/directorio-escritorio.png) · [Ficha móvil](../../docs-local/evidencia-integrante1/1064833/docker/ficha-movil.png) · [Alerta sin texto de entrada](../../docs-local/evidencia-integrante1/1064833/docker/asistente-alerta.png) · [Reputación móvil](../../docs-local/evidencia-integrante1/1064833/docker/reputacion-movil.png) · [Ficha con API de otro origen](../../docs-local/evidencia-integrante1/1064833/origenes-separados/ficha-movil.png) · [Ficha desde el túnel de la UNI](../../docs-local/evidencia-integrante1/1064833/uni-tunel/ficha-movil.png).

| Actualización preparada para Taiga | Evidencia a adjuntar |
| --- | --- |
| US-MED-02/03 | ID preservado desde 4200fd0, perfil y fotos en navegador, lectura tras recrear. |
| US-PAC-03/04 | Resultados A-01 a A-09, tiempo sobre 1.000 médicos, captura de directorio y ficha. |
| US-PAC-01/02/05 | Proveedor simulado, casos de alerta y fallback más prueba HTTP del Adapter. |
| US-PAC-06/07 y US-MED-06 | 201/409 físicamente únicos, caché con rollback, captura de la reputación y filtro mínimo. |
| US-DOC-01 y QA | Swagger Authorize, matrices, JaCoCo, guía de despliegue y evidencia por entorno. |

Las actualizaciones están preparadas para su carga con acceso autorizado a Taiga.
