# Mejoras propuestas

La prioridad combina impacto en visitantes, moderadores y criterios de evaluación. El [informe](informe.md) identifica los cambios incluidos en la versión y sus pruebas.

## Correcciones del corte

| Corrección | Evidencia | Archivos |
| --- | --- | --- |
| Captura y publicación de identidad | Perfil histórico y nuevo pasan del formulario a PostgreSQL, moderación y ficha. Se excluye una identidad incompleta del directorio. | `RegistroMedicoRequest`, `MedicoService`, `AuthPage`, `DoctorPage`. |
| Fotos válidas, persistentes y reemplazables | Chromium cargó JPG/PNG/WebP, se rechazó el MIME falso y se verificó el mismo SHA-256 tras recrear. | `AlmacenamientoFotoService`, `SupabaseFotoStorage`, `docker-compose.yml`. |
| Redirección y CORS en el Compose de ensayo | El POST con Origin al puerto alternativo pasó de 403 a la validación esperada. El build nginx dejó de heredar una URL de desarrollo privada. | `frontend/nginx.conf`, `frontend/.dockerignore`, `backend/.dockerignore`. |
| Feedback y contraste | La reseña exitosa indica que espera moderación. El texto de ayuda del chat superó 4,5:1 y el usuario puede recuperarse de un fallo de búsqueda. | `ReviewForm`, `AsistenteChat`, `DoctorCard`, `api-real.spec.mjs`. |

## Propuestas para el siguiente sprint

| Prioridad | Evidencia, alcance y responsable sugerido | Beneficio, esfuerzo y aceptación |
| --- | --- | --- |
| 1. Entrada HTTPS académica | La aplicación se sirve en loopback y el túnel funciona. Afecta al proxy de la UNI, `compose.uni.yml` y [guía VPS](vps.md). UNI habilita la entrada e I1 verifica el flujo. | Demostración remota segura. Esfuerzo bajo para la app, depende de la UNI. Aceptación DNS válido, certificado correcto, rutas profundas, CORS y pruebas HTTP desde otra red. |
| 2. Operación segura del proveedor de triage | El flujo normal local usa `simulado` y el Adapter quedó verificado con un servidor controlado. Afecta a `TriageConfig`, configuración de despliegue y reglas de entrada. I1 e I3. | Limita costo y exposición de contenido si se habilita una clave externa. Esfuerzo medio. Aceptación presupuesto y política aprobados, límites de solicitudes, ensayo ficticio y comprobación independiente de señales locales y errores del proveedor. |
| 3. Revisión de dependencias frontend | `npm ci` reportó 10 avisos, 7 moderados y 3 altos, también visibles en el build de base. Afecta a `frontend/package.json` y su lockfile. I2/I4. | Reduce dependencias con avisos y mantiene las rutas probadas. Esfuerzo medio. Aceptación informe reproducible de dependencias de producción y desarrollo, actualización focalizada y rerun de lint, build, demo y Playwright. |
| 4. Revisión administrativa de cambio de identidad | El CMP modificado vuelve a verificación. Editar nombres visibles conserva el estado de perfil actual. Afecta a `MedicoService`, `ModeracionMedicoService` y la pantalla de perfil. I1/I3. | Explicita qué cambios requieren una nueva validación de identidad. Esfuerzo medio. Aceptación regla aprobada por el equipo, feedback visible y pruebas de suspensión o nueva aprobación según lo acordado. |
| 5. Escalado de caché y análisis de búsqueda | Ficha y resumen usan memoria por instancia. Los 30 GET medidos sobre 1.000 coincidencias cumplen la meta local. Afecta a `CacheDirectorio`, `ReputacionService` y `DirectorioSpecifications`. I1/I3. | Garantiza coherencia con varias instancias y da una referencia de capacidad. Esfuerzo medio a alto. Aceptación moderar en una instancia e inspeccionar la otra sin datos obsoletos; p95 documentado con `EXPLAIN (ANALYZE, BUFFERS)` y volumen acordado. |
| 6. QA de estados especiales | B-05 requiere una respuesta de fallback que además preserve una especialidad activa. El contrato lo permite y el cliente de demostración lo prueba. Afecta a `TriageFallbackService`, `TriageFallback.tsx` y escenarios QA. I1/I2/I4. | Cierra el caso restante sin cambiar el contrato de producción. Esfuerzo bajo. Aceptación proveedor determinista de QA devuelve el escenario y el navegador abre el directorio filtrado. |
