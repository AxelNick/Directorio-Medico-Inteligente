# Despliegue de ensayo en la UNI

Despliegue del **26 de noviembre de 2026, Lima**, con versión `106483311b5f8a629a18fbde516f0eea07ba7a76` en el proyecto Compose `dmi-integrante1-uni`.

El VPS ejecuta Linux amd64, Docker Engine 29.8.0, Compose 5.5.1 y PostgreSQL 15.20. Spring usa `prod` y el proveedor de triage `simulado`.

| Alcance | Estado y evidencia |
| --- | --- |
| Dentro del VPS | Verificado. `/salud` 200, ruta profunda de SPA 200 y petición vía nginx `/api/api/v1/directorio/medicos` 200. Los IDs de imagen observados fueron `sha256:38dda989d874661ce70d0efb17f5b601c0427639e8b4d6b411e8440c427b51cb` (API) y `sha256:df8600a8aeea0b061d5e27bdcbc443892253935e532b847d5b4980d0fa4ead21` (SPA). |
| A través de túnel SSH | Verificado desde Windows. Suite HTTP y tres recorridos de Chromium aprobados (flujo, Swagger Authorize y paneles a 375 px). CORS permite el origen del ensayo. Alta y edición, directorio, alertas, fallback, publicación, ocultación, reputación y duplicado concurrente 201/409. Navegador confirmó las fotos y las rutas profundas. |
| HTTPS público | Pendiente de la URL HTTPS asignada por la UNI, con proxy hacia `127.0.0.1:15173`. Con ese dato se puede retomar la verificación de DNS, certificado, salud, rutas profundas y flujo externo. |

Los puertos 15173 (SPA) y 38080 (API) están ligados al loopback del servidor. El 18080 del VPS estaba ocupado y se conservó. `docker inspect` confirmó que el contenedor PostgreSQL carece de mapeos al host. `pgdata` y `uploads` pertenecen al proyecto de ensayo. La capacidad visible antes del despliegue era de 5.312 MiB de memoria disponible y 404.470 MiB de espacio libre en el sistema de archivos. Son lecturas del host compartido. Los límites de los contenedores se fijan en [compose.uni.yml](../../compose.uni.yml) y la cuota efectiva de la cuenta queda por confirmar si el proyecto crece.

El ensayo HTTP por túnel registró el médico **#2** y la reseña **#3**, con una fila para el par y promedio 5,0. Las 12 solicitudes filtradas de esa muestra tuvieron mínimo 255,1 ms, p50 457,9 ms y máximo 628,1 ms. Después del respaldo se recrearon los tres contenedores del proyecto y se comprobaron otra vez la misma ruta profunda, los dos identificadores, la URL y el SHA-256 de la foto. El dump y el tar privados quedaron en `$HOME/dmi-integrante1/backups/106483311b5f8a629a18fbde516f0eea07ba7a76-20261127T005601Z/`. La marca UTC del directorio equivale al 26 de noviembre en Lima.

## Repetir el despliegue

Desde la raíz local, selecciona el SHA evaluado con `git archive --format=tar <SHA>` y transfiere el archivo por el canal SSH del equipo. En este ensayo se usó Plink con la huella previamente validada y una canalización privada para la autenticación. Los datos de conexión se consultan en la referencia privada de la UNI. No los incorpores a la orden de despliegue ni al archivo de evidencias.

En el VPS, extrae el archivo a `$HOME/dmi-integrante1/releases/<SHA>` y deja el archivo de variables en `$HOME/dmi-integrante1/.env` con permisos 600. Configura `DMI_DB_PASSWORD` y `JWT_SECRET` propios, administrador con `APP_ADMIN_BOOTSTRAP_USERNAME` y `APP_ADMIN_BOOTSTRAP_PASSWORD`, `DMI_SPA_PORT=15173` y `DMI_API_PORT=38080`. `APP_CORS_ALLOWED_ORIGINS` incluye el origen exacto del túnel durante QA y, cuando se habilite, el origen HTTPS asignado. El perfil `prod` no siembra el administrador predeterminado de desarrollo.

```sh
base="$HOME/dmi-integrante1"
sha=106483311b5f8a629a18fbde516f0eea07ba7a76
cd "$base/releases/$sha"
dc() { docker compose --env-file "$base/.env" -p dmi-integrante1-uni -f docker-compose.yml -f compose.uni.yml "$@"; }
dc config --quiet
COMPOSE_PARALLEL_LIMIT=1 dc build
dc up -d --no-build
curl -fsS http://127.0.0.1:38080/salud
curl -fsS http://127.0.0.1:15173/api/api/v1/directorio/medicos
docker inspect --format '{{json .HostConfig.PortBindings}}' "$(dc ps -q db)"
for svc in backend frontend; do docker tag "dmi-integrante1-uni-$svc:latest" "dmi-integrante1-uni-$svc:$sha"; done
```

Espera a que `/salud` responda antes de iniciar el cliente. La comprobación de `PortBindings` debe devolver un mapa vacío. En Windows, usa una sesión SSH con clave/credencial gestionada y el anfitrión ya validado:

```text
plink -ssh -N -L 127.0.0.1:25174:127.0.0.1:15173 -L 127.0.0.1:28082:127.0.0.1:38080 -P <puerto> <cuenta>@<host>
```

Con el túnel activo, abre `http://127.0.0.1:25174/directorio` y `http://127.0.0.1:28082/swagger-ui/index.html`. Define `DMI_SPA_URL`, `DMI_API_URL`, `DMI_CORS_ORIGIN` y `DMI_SWAGGER_URL` con esos orígenes. Carga `DMI_ADMIN_USER` y `DMI_ADMIN_PASS` desde el almacén privado. Los scripts de [repetición](informe.md#repetición-local) pueden usar `DMI_STATE_FILE` para probar los mismos identificadores al recrear.

## Respaldo y reversión

Antes de actualizar, guarda un respaldo privado de PostgreSQL y de las fotos. Comprueba sus catálogos. Conserva las imágenes con la etiqueta del SHA y el directorio de cada release. El proyecto de ensayo recién creado convive con los servicios previos de la UNI.

```sh
umask 077
backup="$base/backups/$sha-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup"
dc exec -T db pg_dump -U usuario_medico -Fc -d directorio_medico > "$backup/db.dump"
dc exec -T backend tar -C /app/uploads -czf - . > "$backup/uploads.tar.gz"
dc exec -T db pg_restore -l < "$backup/db.dump" >/dev/null
tar -tzf "$backup/uploads.tar.gz" >/dev/null
```

Para revertir el código, selecciona la revisión previa y vuelve a etiquetar esas dos imágenes como `latest`. Desde su directorio de release, ejecuta `dc up -d --no-build --force-recreate backend frontend` y comprueba `/salud`, catálogo, sesión y una ficha. PostgreSQL y fotos conservan los volúmenes. Si el esquema de la nueva versión exige restauración, restaura el dump y el tar en volúmenes separados antes de cambiar el servicio con autorización.

## Reanudar HTTPS cuando la UNI asigne la entrada

Solicita a la UNI **la URL HTTPS asignada cuyo proxy enrute la aplicación a `127.0.0.1:15173` en el VPS**. Con el dominio de respuesta, comprueba desde fuera del VPS:

```sh
dominio=directorio-ejemplo.uni.edu.pe
nslookup "$dominio"
curl -fsS "https://$dominio/api/salud"
curl -fsS -o /dev/null -w '%{http_code}\n' "https://$dominio/directorio"
```

Continúa con Playwright sobre la URL HTTPS, comprueba la foto y el filtro CMP y registra la fecha, el SHA y la evidencia de TLS. El PostgreSQL de este ensayo vive en Compose. La conexión comercial a Supabase y Storage se describen en la [guía separada](../../DEPLOYMENT.md).
