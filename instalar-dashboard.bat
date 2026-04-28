@echo off
chcp 65001 > nul
title Instalador - Dashboard V2 ClientesHumanIA
color 0B

echo.
echo  =============================================================
echo                    DASHBOARD V2 - ClientesHumanIA
echo                          Instalador automatico
echo  =============================================================
echo.

set "REPO_URL=https://github.com/HumanIA12/ClientesHumanIA/archive/refs/heads/claude/review-dashboard-v2-gKJdU.zip"
set "DEST=%USERPROFILE%\Desktop\Dashboard-V2"
set "ZIP=%TEMP%\dashboard-v2.zip"
set "TMP_EXTRACT=%TEMP%\dashboard-v2-extract"

echo  [1/4] Descargando proyecto desde GitHub...
echo.
powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%REPO_URL%' -OutFile '%ZIP%' -UseBasicParsing } catch { Write-Host '  ERROR: No se pudo descargar' -ForegroundColor Red; exit 1 }"
if errorlevel 1 goto error

echo  [2/4] Extrayendo archivos...
echo.
if exist "%TMP_EXTRACT%" rmdir /s /q "%TMP_EXTRACT%"
powershell -NoProfile -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%TMP_EXTRACT%' -Force"
if errorlevel 1 goto error

echo  [3/4] Instalando en el escritorio...
echo.
if exist "%DEST%" (
    echo  La carpeta Dashboard-V2 ya existe en tu escritorio.
    set /p OVERWRITE="  Deseas sobrescribirla? (s/n): "
    if /i not "%OVERWRITE%"=="s" goto cancelado
    rmdir /s /q "%DEST%"
)

mkdir "%DEST%"
for /d %%D in ("%TMP_EXTRACT%\*") do (
    xcopy "%%D\*" "%DEST%\" /E /I /Y > nul
)

echo  [4/4] Limpiando archivos temporales...
del /q "%ZIP%" 2> nul
rmdir /s /q "%TMP_EXTRACT%" 2> nul

echo.
echo  =============================================================
echo    INSTALACION COMPLETADA
echo  =============================================================
echo.
echo    Ubicacion:  %DEST%
echo.
echo    Credenciales de prueba:
echo      Usuario:  admin       Password: admin123
echo      Usuario:  vendedor    Password: vendedor123
echo.
echo    El navegador se abrira automaticamente en 3 segundos...
echo.

timeout /t 3 /nobreak > nul
start "" "%DEST%\index.html"

echo  Listo! Disfruta tu Dashboard V2.
echo.
pause
exit /b 0

:error
echo.
echo  =============================================================
echo    ERROR EN LA INSTALACION
echo  =============================================================
echo.
echo    Verifica tu conexion a internet e intenta de nuevo.
echo    O descarga manualmente desde:
echo    https://github.com/HumanIA12/ClientesHumanIA
echo.
pause
exit /b 1

:cancelado
echo.
echo  Instalacion cancelada por el usuario.
echo.
pause
exit /b 0
