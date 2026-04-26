@echo off
REM ===================================================================
REM  CorelTile Studio - script de compilacion para Windows (.NET 8)
REM
REM   build.bat            -> framework-dependent single-file (~1 MB)
REM                           requiere "Microsoft .NET 8 Desktop Runtime"
REM                           https://dotnet.microsoft.com/download
REM
REM   build.bat portable   -> self-contained single-file (~80 MB)
REM                           NO requiere ningun runtime instalado
REM
REM  Salida: dist\CorelTileStudio.exe
REM ===================================================================

setlocal
set ROOT=%~dp0
set OUT=%ROOT%dist
set RID=win-x64
set MODE=%1

where dotnet >nul 2>nul
if errorlevel 1 (
    echo ERROR: no se encontro 'dotnet'. Instala .NET 8 SDK desde
    echo https://dotnet.microsoft.com/download   y vuelve a ejecutar.
    exit /b 1
)

if /I "%MODE%"=="portable" (
    echo.
    echo [CorelTile Studio] Publicando self-contained ^(%RID%^)...
    echo.
    dotnet publish "%ROOT%src\CorelTileStudio\CorelTileStudio.csproj" ^
        -c Release -r %RID% --self-contained true ^
        -p:PublishSingleFile=true ^
        -p:IncludeNativeLibrariesForSelfExtract=true ^
        -p:EnableCompressionInSingleFile=true ^
        -o "%OUT%"
) else (
    echo.
    echo [CorelTile Studio] Publicando framework-dependent ^(%RID%^)...
    echo.
    dotnet publish "%ROOT%src\CorelTileStudio\CorelTileStudio.csproj" ^
        -c Release -r %RID% --self-contained false ^
        -p:PublishSingleFile=true ^
        -o "%OUT%"
)

if errorlevel 1 (
    echo.
    echo ERROR durante la compilacion.
    exit /b 1
)

REM Limpiamos archivos sobrantes; queremos solo el .exe
del /Q "%OUT%\*.pdb" 2>nul

echo.
echo [OK] Generado: %OUT%\CorelTileStudio.exe
echo.
if /I "%MODE%"=="portable" (
    echo Modo PORTABLE: el .exe corre sin dependencias.
) else (
    echo Modo FRAMEWORK-DEPENDENT: requiere .NET 8 Desktop Runtime.
    echo Para una version portable usa:  build.bat portable
)
echo.
endlocal
