# CorelTile Studio

Plugin **flotante .EXE** para CorelDRAW que plantilla (replica en grilla) un
objeto seleccionado — **PowerClip u otros tipos** — sobre un area de impresion
con medidas en **centimetros**.

> No es un addon `.gms` ni una macro VBA: es un ejecutable independiente que se
> conecta a CorelDRAW por **automatizacion COM (late-binding)**, por lo que
> funciona con CorelDRAW X7, X8 y 2017 - 2024 sin recompilar.

---

## Caracteristicas

- Ventana **flotante, sin bordes, arrastrable y redimensionable**.
- Boton "pin" para mantenerla **siempre encima** mientras trabajas en Corel.
- **Tema oscuro** moderno con tipografia Segoe UI.
- Lee la **pagina activa** y la **seleccion actual** de CorelDRAW con un click.
- Trabaja en **cm** (margenes, espaciados, dimensiones del objeto).
- Dos modos:
  - **Auto-ajustar**: calcula el maximo de copias que caben.
  - **Manual**: el usuario fija columnas x filas.
- **Centrado automatico** opcional dentro del area util.
- Soporta **PowerClip**: la duplicacion preserva el contenido del recorte.
- Una sola operacion deshacible con `Ctrl+Z` (undo group de Corel).
- Boton directo a **Imprimir** (abre el dialogo nativo de CorelDRAW).

---

## Compilacion

Requisitos: Windows + .NET SDK 6.0 o superior (incluye `dotnet`).

```cmd
cd ClientesHumanIA
build.bat
```

El binario final queda en `dist\CorelTileStudio.exe`.

> Tambien puedes abrir `CorelTileStudio.sln` en Visual Studio 2022 y compilar
> la configuracion `Release | AnyCPU`.

### Generar un instalador `.exe` opcional

Para distribuirlo como instalador, usa **Inno Setup** apuntando a
`dist\CorelTileStudio.exe` o publica como single-file con:

```cmd
dotnet publish src\CorelTileStudio\CorelTileStudio.csproj -c Release ^
        -p:PublishSingleFile=true -p:DebugType=None
```

---

## Uso

1. Abre **CorelDRAW** y carga tu documento.
2. Selecciona los objetos a plantillar (PowerClips, agrupaciones, etc).
3. Ejecuta `CorelTileStudio.exe` — aparece la ventana flotante.
4. Pulsa **Conectar**: el indicador pasa a verde.
5. Pulsa **Leer pagina activa** y **Leer seleccion de CorelDRAW**.
6. Ajusta **margenes** y **espaciado** en cm.
7. Activa **Auto-ajustar** o define columnas/filas manualmente.
8. Pulsa **PLANTILLAR EN COREL**.
9. Pulsa **Imprimir** para enviar a la impresora.

> Consejo: si tu seleccion es un grupo o varios objetos, el plugin los trata
> como un unico bloque preservando posiciones relativas.

---

## Arquitectura

```
src/CorelTileStudio/
  App.xaml(.cs)               - bootstrap WPF y handler global de excepciones
  MainWindow.xaml(.cs)        - ventana flotante (chrome custom, drag, pin)
  Themes/ModernStyles.xaml    - paleta + estilos (botones, inputs, cards)
  Converters/                 - InverseBooleanConverter
  ViewModels/
    MainViewModel.cs          - estado, comandos, recomputo del plan
    RelayCommand.cs           - implementacion ICommand
  Services/
    CorelDrawService.cs       - automatizacion COM late-binding (dynamic)
    TileEngine.cs             - logica pura de calculo de grilla (sin COM)
  app.manifest                - DPI awareness + supportedOS Win7..11
```

### Por que late-binding COM

Usar `Type.GetTypeFromProgID("CorelDRAW.Application")` + `dynamic` evita
agregar referencias a las interop assemblies `Corel.Interop.VGCoreXX`, que
cambian entre versiones. Asi el mismo `.EXE` corre con cualquier CorelDRAW que
haya registrado su servidor COM.

### Algoritmo de plantillado

```
usable = area - margenes
n_cols = floor( (usable_W + spacing_X) / (objeto_W + spacing_X) )
n_rows = floor( (usable_H + spacing_Y) / (objeto_H + spacing_Y) )
grid_W = cols * objeto_W + (cols-1) * spacing_X
grid_H = rows * objeto_H + (rows-1) * spacing_Y
inicio = margen_izq/inf  (o centrado si CenterInArea)
```

Cada celda invoca `Selection.Duplicate(dx, dy)` dentro de un
`Document.BeginCommandGroup` para que el undo sea atomico.

---

## Roadmap sugerido

- Marcas de corte (registration marks) entre celdas.
- Presets guardables (medidas frecuentes de impresion).
- Vista previa visual de la grilla en la propia ventana.
- Exportar directo a PDF para imprenta.
- Localizacion EN/ES.
