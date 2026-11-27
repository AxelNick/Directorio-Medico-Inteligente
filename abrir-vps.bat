@echo off
setlocal EnableExtensions

where pwsh.exe >nul 2>&1
if errorlevel 1 (
    echo No se encontro PowerShell 7 ^(pwsh.exe^).
    pause
    exit /b 1
)

set "OPCION="
if /i "%~1"=="/verificar" set "OPCION=-Verificar"
pwsh.exe -NoLogo -NoProfile -File "%~dp0scripts\abrir-vps.ps1" %OPCION%
set "RESULTADO=%errorlevel%"
if not "%RESULTADO%"=="0" if not defined OPCION pause
exit /b %RESULTADO%
