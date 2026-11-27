@echo off
setlocal EnableExtensions DisableDelayedExpansion
pushd "%~dp0" || exit /b 1

set "PROYECTO=dmi-integrante1-qa"
set "DMI_API_PORT=18080"
set "DMI_SPA_PORT=15173"
set "DMI_DB_PORT=15433"
set "DMI_SPA_URL=http://127.0.0.1:%DMI_SPA_PORT%"
set "DMI_API_URL=http://127.0.0.1:%DMI_API_PORT%"
set "DMI_SWAGGER_URL=%DMI_API_URL%"
set "DMI_CORS_ORIGIN=http://127.0.0.1:5173"
set "DMI_DIRECT_API_ORIGIN="
set "DMI_ADMIN_USER="
set "DMI_ADMIN_PASS="
set "VITE_API_BASE_URL=/api"
set "DMI_STATE_FILE=%CD%\docs-local\integrante1-bat-estado.json"
set "DMI_UI_OUTPUT=%CD%\docs-local\integrante1-bat-navegador"

set "PASO=Comprobar Docker Desktop y Node.js"
docker info --format "{{.ServerVersion}}" || goto :fallo
docker compose version || goto :fallo
where npm.cmd >nul 2>&1 || goto :fallo
where curl.exe >nul 2>&1 || goto :fallo

set "PASO=Preparar la carpeta de evidencias"
if not exist "docs-local\" mkdir "docs-local" || goto :fallo

set "PASO=Construir y levantar el entorno Docker"
echo.
echo [1/6] %PASO%
docker compose -f docker-compose.yml -p "%PROYECTO%" up -d --build || goto :fallo
call :esperar_api || goto :fallo

set "PASO=Verificar el backend con Maven Wrapper en Java 25"
echo.
echo [2/6] %PASO%
docker run --rm --mount "type=bind,source=%CD%\backend,target=/src" --mount "type=volume,source=dmi-integrante1-maven,target=/root/.m2" -w /src maven:3.9-eclipse-temurin-25 bash ./mvnw -B -ntp clean verify || goto :fallo

set "PASO=Instalar y verificar el frontend"
echo.
echo [3/6] %PASO%
call npm.cmd --prefix frontend ci || goto :fallo
call npm.cmd --prefix frontend run lint || goto :fallo
call npm.cmd --prefix frontend run build || goto :fallo
call npm.cmd --prefix frontend run test:demo || goto :fallo

set "PASO=Ejecutar las pruebas HTTP contra PostgreSQL"
echo.
echo [4/6] %PASO%
call npm.cmd --prefix frontend run test:api || goto :fallo

set "PASO=Ejecutar las pruebas de navegador y Swagger"
echo.
echo [5/6] %PASO%
call :preparar_navegador || goto :fallo
call npm.cmd --prefix frontend run test:browser || goto :fallo

set "PASO=Recrear los contenedores y comprobar la persistencia"
echo.
echo [6/6] %PASO%
docker compose -f docker-compose.yml -p "%PROYECTO%" up -d --no-build --force-recreate || goto :fallo
call :esperar_api || goto :fallo
call npm.cmd --prefix frontend run test:api -- --persistencia || goto :fallo

echo.
echo Todas las pruebas pasaron. El entorno local sigue activo.
echo Aplicacion: %DMI_SPA_URL%
echo Swagger: %DMI_SWAGGER_URL%/swagger-ui/index.html
echo Cobertura: backend\target\site\jacoco\index.html
echo Capturas: docs-local\integrante1-bat-navegador
set "RESULTADO=0"
goto :salir

:esperar_api
curl.exe --fail --silent --max-time 3 --retry 40 --retry-delay 2 --retry-max-time 90 --retry-all-errors "%DMI_SPA_URL%/api/salud"
if errorlevel 1 exit /b 1
echo.
exit /b 0

:preparar_navegador
if defined DMI_BROWSER_CHANNEL exit /b 0
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" goto :usar_chrome
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" goto :usar_chrome
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" goto :usar_chrome
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" goto :usar_edge
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" goto :usar_edge
call "frontend\node_modules\.bin\playwright.cmd" install chromium
exit /b %errorlevel%

:usar_chrome
set "DMI_BROWSER_CHANNEL=chrome"
exit /b 0

:usar_edge
set "DMI_BROWSER_CHANNEL=msedge"
exit /b 0

:fallo
set "RESULTADO=%errorlevel%"
if "%RESULTADO%"=="0" set "RESULTADO=1"
echo.
echo ERROR en el paso: %PASO%
echo Codigo de salida: %RESULTADO%

:salir
if /i not "%~1"=="/sin-pausa" pause
popd
exit /b %RESULTADO%
