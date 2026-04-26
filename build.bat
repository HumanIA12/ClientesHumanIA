@echo off
REM ===================================================================
REM  CorelTile Studio - script de compilacion para Windows
REM  Genera dist\CorelTileStudio.exe (single .EXE) en modo Release.
REM ===================================================================

setlocal
set CONFIG=Release
set ROOT=%~dp0
set OUT=%ROOT%dist

echo.
echo [CorelTile Studio] Compilando en modo %CONFIG%...
echo.

where dotnet >nul 2>nul
if errorlevel 1 (
    echo ERROR: no se encontro 'dotnet'. Instala .NET SDK 6.0+ desde
    echo https://dotnet.microsoft.com/download   y vuelve a ejecutar.
    exit /b 1
)

dotnet build "%ROOT%CorelTileStudio.sln" -c %CONFIG% -v minimal
if errorlevel 1 (
    echo.
    echo ERROR durante la compilacion.
    exit /b 1
)

if not exist "%OUT%" mkdir "%OUT%"

set BIN=%ROOT%src\CorelTileStudio\bin\%CONFIG%\net48
copy /Y "%BIN%\CorelTileStudio.exe"        "%OUT%" >nul
copy /Y "%BIN%\CorelTileStudio.exe.config" "%OUT%" >nul 2>nul

echo.
echo [OK] Generado: %OUT%\CorelTileStudio.exe
echo.
echo Doble-click en el .EXE con CorelDRAW abierto y pulsa "Conectar".
echo.
endlocal
