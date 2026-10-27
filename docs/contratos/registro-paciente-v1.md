# Registro de paciente — contrato v1

**Estado (23-10-2026):** implementado en esta rama y probado por HTTP contra PostgreSQL del Compose local. El frontend ofrece `/registro/paciente` con adaptador ficticio en desarrollo y cliente HTTP al seleccionar `VITE_DATA_SOURCE=api` o compilar producción. Esta función necesita una historia propia en el WBS/Taiga; no se asigna a una US médica existente.

## Alta pública

`POST /auth/register/paciente` sin autenticación.

```json
{ "username": "paciente@ejemplo.test", "password": "clave-de-ejemplo" }
```

- `username`: correo obligatorio, único entre **todos** los roles, máximo 100 caracteres. El backend recorta espacios antes de validar y convierte a minúsculas antes de consultar y guardar.
- `password`: obligatoria, entre 8 y 72 caracteres; almacenar solo hash seguro. Nunca devolver ni registrar la contraseña.
- El servidor asigna `ROLE_PACIENTE` y `habilitado=true`. El cliente **no** envía `rol`, `id`, colegiatura ni datos clínicos.
- El correo permite crear la cuenta, pero por sí solo **no verifica la identidad civil** del paciente. Definir esa verificación antes de habilitar decisiones o accesos clínicos que la requieran.
- Respuesta: `201 Created` con `{ "id": 123, "username": "paciente@ejemplo.test", "rol": "ROLE_PACIENTE" }`. `id` identifica el usuario creado. El alta no entrega JWT; el paciente inicia sesión después.
- Errores: `400` datos inválidos, `409` correo duplicado, con `{ "mensaje": "..." }` sin revelar información sensible. El backend debe validar de nuevo independientemente del formulario.

Reutilizar `POST /auth/login` y `GET /auth/me` existentes para la cuenta persistida. `GET /auth/me` debe devolver el rol `ROLE_PACIENTE` desde la identidad autenticada; el frontend dirige esa sesión a `/paciente`. Verificar que una cuenta bloqueada o un token vencido no obtengan acceso. El alta no crea historia clínica ni permisos médicos; esos flujos requieren contratos aparte.

Los JWT actuales se firman con una clave generada al arrancar Spring Boot: una cuenta persiste en PostgreSQL, pero una sesión anterior deja de ser válida después de reiniciar el backend. La clave estable y su gestión segura siguen pendientes para un despliegue persistente.

## Separación del modo de prueba

En `npm run dev`, `/registro/paciente` crea por defecto una cuenta **solo en memoria del navegador** y permite iniciar sesión como paciente hasta recargar. La contraseña de prueba no se guarda en `localStorage`. La cuenta fija `paciente.demo@prueba.local` permanece como ejemplo local. Ni esas credenciales ni el adaptador ficticio se incluyen en el build de producción. En modo HTTP (`VITE_DATA_SOURCE=api`) o en producción, el formulario envía la petición anterior al backend. No usar credenciales de demostración como cuentas reales.

## Comprobaciones de integración

1. Registrar paciente y obtener `201` con `ROLE_PACIENTE`; luego iniciar sesión y consultar `/auth/me`.
2. Rechazar un correo ya usado por médico, administrador o paciente con `409`, sin crear usuario parcial.
3. Rechazar rol, colegiatura o ID enviados por el cliente; comprobar asignación del rol exclusivamente en servidor.
4. Confirmar que una cuenta nueva no posee historia clínica, citas ni acceso a `/medicos/me/**` o `/admin/**`.

**Resultado local:** `docker compose up -d db backend` aplicó Flyway V1–V3 en PostgreSQL 15.19. Una cuenta ficticia temporal devolvió `201`, login `200`, `/auth/me` `200` con `ROLE_PACIENTE`, y `403` en rutas médica y administrativa. Un duplicado devolvió `409`; datos inválidos y un campo `rol` enviado por el cliente devolvieron `400`. Se comprobó en `usuarios` una fila con hash BCrypt y rol paciente. Tras poner `habilitado=false` en **esa cuenta de prueba**, login y `/auth/me` devolvieron `401`; se eliminó la cuenta temporal al terminar. La suite Java pasó con 17 pruebas usando el perfil H2. Esto verifica el backend local; no constituye una prueba del despliegue de frontend en Vercel.

**Código:** [controlador](../../backend/src/main/java/pe/edu/uni/backend/controller/AuthController.java), [servicio](../../backend/src/main/java/pe/edu/uni/backend/service/PacienteService.java), [solicitud](../../backend/src/main/java/pe/edu/uni/backend/dto/RegistroPacienteRequest.java), [respuesta](../../backend/src/main/java/pe/edu/uni/backend/dto/RegistroPacienteResponse.java). El JWT se revalida contra el usuario y rol habilitados en la base mediante [JwtAuthFilter](../../backend/src/main/java/pe/edu/uni/backend/security/JwtAuthFilter.java). No se creó tabla ni migración nueva: el rol y `usuarios` ya existían en V1.
