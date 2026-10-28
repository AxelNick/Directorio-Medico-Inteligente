# Despliegue separado: Supabase, Render y Vercel

Este repositorio publica **PostgreSQL en Supabase**, **Spring Boot en Render Free** y **la SPA en Vercel**. El navegador llama directamente a Render; no necesita claves de Supabase. La configuración de Docker Compose sigue siendo para desarrollo local.

Los archivos locales `backend/.env`, `frontend/.env.local` y `frontend/.env.production.local` están ignorados por Git. Los ejemplos sin secretos son `backend/.env.example` y `frontend/.env.example`. Vercel toma `VITE_API_BASE_URL` del Dashboard al compilar; **no recibe** los `.env` locales ignorados. Spring Boot tampoco carga `backend/.env` automáticamente: para una prueba local con Docker se pasa explícitamente con `--env-file backend/.env`. Si ese archivo apunta a Supabase, el arranque puede ejecutar migraciones allí.

## 1. Supabase: base de datos

1. Crea un proyecto PostgreSQL. En **Connect**, copia el host, usuario y puerto de **Session pooler**. Usa el puerto **5432**, no el de Transaction pooler (6543), para el backend JDBC y Flyway. El pooler de sesión permite conectarse desde redes IPv4.
2. Guarda en un gestor de secretos la contraseña de la base. No la agregues a Git ni al frontend.
3. En Render se ingresarán por separado:

   | Variable | Valor |
   | --- | --- |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host-de-session-pooler>:5432/postgres?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | El usuario exacto que muestra **Connect**, normalmente `postgres.<ref>` |
   | `SPRING_DATASOURCE_PASSWORD` | Contraseña de la base |

La aplicación ejecuta las migraciones Flyway V1–V3 al iniciar. No ejecutes las migraciones manualmente si arrancó bien. El `schema` esperado es `public` de una base nueva; no apuntes a una base con tablas existentes ajenas al proyecto. El usuario de conexión necesita permisos para crear y modificar tablas.

## 2. Render: API

1. En Render, crea un **Blueprint** desde el repositorio. El [render.yaml](render.yaml) declara solo el backend Docker en el plan Free. También se puede crear un Web Service Docker manual con `backend/Dockerfile` y contexto `backend/`.
2. Introduce las tres variables de Supabase de arriba. El Blueprint genera `JWT_SECRET` una sola vez. Conserva ese valor entre despliegues: cambiarlo invalida todas las sesiones. Si creas el servicio manualmente, establece un secreto aleatorio de **32 caracteres o más**. Nunca lo publiques.
3. `SPRING_PROFILES_ACTIVE=prod` es obligatorio. Este perfil desactiva el acceso administrativo de ejemplo, exige la clave JWT y apaga el SQL detallado en logs. Render proporciona `PORT`; Spring lo usa automáticamente.
4. Establece `APP_CORS_ALLOWED_ORIGINS` con el origen exacto de Vercel, por ejemplo `https://nombre-del-proyecto.vercel.app`, **sin barra final**. Puedes separar varios orígenes concretos con coma. No uses `*`.
5. Despliega y comprueba `GET https://<servicio>.onrender.com/especialidades` (debe devolver JSON). El arranque puede tardar varios minutos en Free.

La migración V1 crea una cuenta administrativa de desarrollo. En `prod`, su contraseña de demostración **no** permite iniciar sesión. Para usar el panel administrativo hace falta un procedimiento de provisión de administrador acordado con backend; no se incluyen credenciales reales en el repositorio.

## 3. Vercel: SPA

1. Importa el mismo repositorio en Vercel con **Root Directory: `frontend`**. Framework: **Vite**. Install: `npm ci`; Build: `npm run build`; Output: `dist`.
2. En **Environment Variables** configura `VITE_API_BASE_URL=https://<servicio>.onrender.com` para Production. Es una URL pública, **nunca un secreto**. No añadas `/api` al final.
3. Vuelve a desplegar si cambias la variable: Vite la incorpora durante la compilación. [frontend/vercel.json](frontend/vercel.json) permite abrir directamente `/ingresar`, `/registro/paciente`, `/medico`, etc.
4. Si el dominio de Vercel definitivo cambia, actualiza `APP_CORS_ALLOWED_ORIGINS` en Render y vuelve a desplegar el backend.

Prueba el registro e inicio de sesión de un **paciente ficticio** desde Vercel. En DevTools, las solicitudes deben ir a `onrender.com/auth/...`, no a `/api` de Vercel. El build de producción usa la API real y excluye las cuentas ficticias del modo de desarrollo.

## Límites conocidos

- Render Free duerme por inactividad y tiene sistema de archivos efímero. Las **fotografías médicas guardadas en `/app/uploads` se perderán** en reinicios, despliegues o al dormir. La ficha en PostgreSQL conservará la URL, que entonces puede quedar rota. No se debe presentar esa carga como almacenamiento persistente; para conservar fotos hará falta almacenamiento externo y adaptación de `AlmacenamientoFotoService`.
- En la prueba local el backend no superó 273 MB, pero con una cuota simulada de 0,1 CPU tardó unos cinco minutos en iniciar. Hay que comprobar el tiempo real de arranque en Render.
- Las nuevas cuentas y perfiles sí se guardan en PostgreSQL. No hay pasarela de pagos, citas ni historia clínica implementadas.

Referencias: [conexión PostgreSQL de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [Blueprint de Render](https://render.com/docs/blueprint-spec), [límites Free de Render](https://render.com/docs/free), [SPA Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite).
