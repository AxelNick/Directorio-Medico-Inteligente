# Publicación con Supabase, Render y Vercel

Guía del Integrante 1, revisada el **26 de noviembre de 2026 (Lima)**. Los pasos de proveedor se contrastaron con sus documentos oficiales. El [informe](docs/qa/informe.md) registra Docker Desktop y la UNI. La publicación de los tres servicios comerciales queda como guía.

## 1. Preparar PostgreSQL y fotos en Supabase

1. Crea un proyecto de ensayo o elige el proyecto autorizado. Guarda la contraseña de PostgreSQL en el almacén de credenciales. En **Connect**, copia los datos de **Session pooler** si el backend necesita IPv4. Elige la conexión directa cuando tengas IPv6 hacia el host directo o una opción IPv4 asignada. El puerto de sesión es `5432` y el usuario del pooler lleva el sufijo del proyecto, por ejemplo `postgres.<ref>`. Usa una cuenta y un esquema dedicados para este backend cuando compartas el proyecto y evita exponer sus tablas por Data API. [Conexión de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).
2. Descarga el certificado de CA desde el panel y verifica JDBC con `sslmode=verify-full`, nombre de host correcto para ese certificado y `sslrootcert` hacia el archivo de CA. Antes de arrancar Spring, prueba con `psql` usando la contraseña por prompt o almacén. Ejecuta `select current_database(), current_schema();` y `select ssl, version from pg_stat_ssl where pid = pg_backend_pid();`. En JDBC, confirma con `/salud`, revisa la conexión inicial en el log saneado y verifica las tablas con [la prueba de persistencia](docs/qa/persistencia.sql). [SSL en pgJDBC](https://jdbc.postgresql.org/documentation/ssl/) · [Conexión con CA en Supabase](https://supabase.com/docs/guides/database/pgadmin).
3. Crea el bucket público `fotos-medicos` en **Storage**, con máximo 1 MiB y tipos `image/jpeg`, `image/png`, `image/webp`. La lectura de estas fotos es pública. Spring valida el rol del propietario y realiza las escrituras y eliminaciones con una clave de servidor. No concedas escritura a clientes anónimos. Obtén una clave secreta de servidor en el panel o la `service_role` de un proyecto que todavía la use. [Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) · [Subida estándar](https://supabase.com/docs/guides/storage/uploads/standard-uploads) · [Claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

Ejemplo de comprobación, con contraseña introducida por prompt y certificado disponible localmente:

```sh
psql "host=pooler-ejemplo.supabase.com port=5432 dbname=postgres user=postgres.referencia sslmode=verify-full sslrootcert=./supabase-ca.crt" -W
```

Hibernate crea o actualiza las tablas según las entidades y carga roles y catálogo. Usa una base de ensayo o respalda datos y objetos antes de actualizar una base con datos. Los nombres del host y el archivo de CA deben corresponder al destino elegido. Ante un error TLS, comprueba fecha, hostname y cadena de CA.

## 2. Construir y configurar la API en Render

1. Crea un **Web Service** Docker desde el repositorio autorizado. Selecciona el SHA de la versión evaluada o una rama que lo contenga. Con raíz del repositorio, indica Dockerfile `./backend/Dockerfile` y contexto `./backend`. Si seleccionas `backend` como Root Directory, usa `./Dockerfile` y `.` a partir de esa raíz. [Docker en Render](https://render.com/docs/docker).
2. Establece el perfil `prod` y las variables de abajo en **Environment**. Añade la CA a **Secret Files** como `supabase-ca.crt` para referenciar `/etc/secrets/supabase-ca.crt`. Usa el `PORT` del servicio, que la aplicación lee como `${PORT:8080}`. El perfil de producción deshabilita la cuenta de demostración. Provisiona un administrador propio durante el primer arranque y elimina las dos variables de provisión cuando confirmes el acceso. [Puertos de Web Services](https://render.com/docs/web-services) · [Variables y archivos secretos](https://render.com/docs/configure-environment-variables).
3. En **Health Check Path**, configura `/salud`. Espera el estado disponible y revisa los logs de arranque. Comprueba `GET /salud`, `GET /especialidades` y `GET /v3/api-docs`. El endpoint de salud consulta PostgreSQL y responde 503 durante una caída de la base. [Health Checks](https://render.com/docs/health-checks).

| Variable de Render | Valor ficticio o forma |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://pooler-ejemplo.supabase.com:5432/postgres?sslmode=verify-full&sslrootcert=/etc/secrets/supabase-ca.crt&currentSchema=directorio` |
| `SPRING_DATASOURCE_USERNAME` y `SPRING_DATASOURCE_PASSWORD` | Usuario de Connect y contraseña secreta. Crea el esquema `directorio` primero si usas `currentSchema`. |
| `JWT_SECRET` | Valor aleatorio de al menos 32 bytes, generado en el almacén de Render. |
| `APP_CORS_ALLOWED_ORIGINS` | `https://directorio-ejemplo.vercel.app`, sin barra final. Separa orígenes concretos por comas. |
| `APP_ADMIN_BOOTSTRAP_USERNAME` y `APP_ADMIN_BOOTSTRAP_PASSWORD` | Administrador del entorno y contraseña aleatoria de 16–72 bytes para el alta inicial. |
| `APP_UPLOADS_SUPABASE_URL` | `https://referencia-ejemplo.supabase.co` |
| `APP_UPLOADS_SUPABASE_BUCKET` | `fotos-medicos` |
| `APP_UPLOADS_SUPABASE_KEY` | Clave secreta de Storage, solo en Render. |
| `APP_TRIAGE_PROVIDER` | `simulado` para la demo. `openai` usa además `APP_TRIAGE_OPENAI_KEY` y `APP_TRIAGE_OPENAI_MODEL` de un proyecto habilitado. |

El disco estándar de Render es efímero. Con estas variables las fotos nuevas se escriben en Supabase Storage y su URL comienza con el origen público del proyecto. Para un despliegue con disco persistente autorizado, monta una ruta dedicada y define `APP_UPLOADS_DIR`; deja vacía la URL de Supabase en esa modalidad. Si ya hay enlaces relativos en una base anterior, migra sus objetos y referencias como un paso previo a abandonar el volumen. [Discos de Render](https://render.com/docs/disks) · [Despliegues de Render](https://render.com/docs/deploys).

## 3. Publicar la SPA en Vercel

1. Importa el repositorio desde tu cuenta y fija **Root Directory** en `frontend`. Selecciona **Vite**, instalación `npm ci`, build `npm run build`, salida `dist` y una versión Node compatible con el proyecto. Conserva el [rewrite de React Router](frontend/vercel.json) a `/index.html`. [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite) · [Rewrites](https://vercel.com/docs/routing/rewrites).
2. En **Environment Variables** de Production indica únicamente `VITE_API_BASE_URL=https://api-ejemplo.onrender.com` para este flujo. La URL base se compila dentro de la SPA y termina en el origen. Después de cambiarla, crea un nuevo deploy. Vite concatena `/api/v1` al origen directo. El prefijo adicional del proxy local pertenece a Compose y Vite en modo proxy. [Variables de Vercel](https://vercel.com/docs/environment-variables).
3. Añade el origen final de Vercel al valor `APP_CORS_ALLOWED_ORIGINS` de Render. Para previsualizaciones, incorpora solo los orígenes concretos que se van a probar. Actualiza la API y valida la ruta profunda `/directorio/medico/<id>` con una recarga.

## 4. Validación cruzada y recuperación

| Observación | Verificación |
| --- | --- |
| Disponibilidad | `/salud` devuelve 200 y la SPA carga una ruta interna. |
| API directa | En Network existe una solicitud a `https://api-ejemplo.onrender.com/api/v1/directorio/medicos` con un solo prefijo `/api/v1`. |
| CORS y sesión | Revisa la preflight de una operación protegida, el valor exacto de `Access-Control-Allow-Origin`, el rol del token y la respuesta JSON. Ante 403 de navegador, confirma puerto, esquema y origen, incluido el redeploy. |
| Fotos | Sube y reemplaza una imagen ficticia desde perfil autorizado. Abre la ficha en el dominio de Vercel. Confirma URL de Supabase, tipo de imagen, contenido y lectura después de desplegar de nuevo la API. Un 404 suele indicar bucket/ruta incorrectos o un enlace antiguo al disco efímero. |
| Seguridad | Swagger carga por HTTPS. Repite el acceso con paciente y admin. Una inspección del build de la SPA debe encontrar solo configuración pública. |
| Reversión | Si falla la SPA, promueve una versión anterior compatible. Si falla la API, usa **Rollback** del despliegue verificado. Las bases y fotos se recuperan aparte desde copias controladas si la versión anterior requiere una restauración de datos. Prueba la restauración en un entorno separado antes de sustituir datos. |

Cuando la API tarda en arrancar, revisa primero el resultado del health check y la conectividad JDBC. Valida luego CORS y prefijos. Si el proceso se queda sin memoria, revisa el límite del servicio y considera ajustar el heap al presupuesto del plan. [Diagnóstico de Render](https://render.com/docs/troubleshooting-deploys) · [Rollback de Render](https://render.com/docs/rollbacks) · [Rollback de Vercel](https://vercel.com/docs/instant-rollback).
