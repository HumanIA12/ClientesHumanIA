# CorelTile Studio

Plugin **flotante .EXE** para CorelDRAW que plantilla (replica en grilla) un
objeto seleccionado — **PowerClip u otros tipos** — sobre un area de impresion
con medidas en **centimetros**, con **vista previa visual**, **marcas de corte**,
**presets**, **temas claro/oscuro** e **interfaz ES/EN**.

> No es un addon `.gms` ni una macro VBA: es un ejecutable independiente que se
> conecta a CorelDRAW por **automatizacion COM (late-binding)**. Funciona con
> CorelDRAW X7, X8 y 2017 - 2024 sin recompilar.

---

## Caracteristicas

### Ventana
- Sin bordes, **arrastrable y redimensionable**.
- Boton **pin** (always-on-top).
- **Tema claro / oscuro** intercambiable en caliente.
- **Idioma ES / EN** intercambiable en caliente.

### Area de trabajo
- Tres formas de definir el area:
  - **Pagina activa** de CorelDRAW (boton "Leer pagina activa").
  - **Manual** en cm.
  - **Rectangulo seleccionado** en CorelDRAW: dibujas un rectangulo, lo
    seleccionas y el plugin lo usa como zona de trabajo (incluye su origen,
    asi puedes plantillar fuera de la pagina si quieres).

### Objetos a plantillar
- **Leer seleccion**: el plugin agarra los objetos seleccionados (PowerClips u
  otros) y los trata como un bloque que se duplica preservando contenido.
- **Auto-deteccion**: tras definir el area como rectangulo, el plugin busca
  todos los objetos cuyo centro cae dentro y los selecciona automaticamente.

### Plantillado
- Margenes IZQ/DER/SUP/INF y espaciado X/Y en cm.
- **Auto-fit** (maximo de copias) o **manual** (columnas x filas).
- **Centrado** opcional dentro del area util.
- **Marcas de corte** (trim marks) en las 4 esquinas de cada celda, con largo
  y grosor configurables.
- Operacion atomica via `BeginCommandGroup` (un solo `Ctrl+Z` deshace todo,
  incluidas las marcas de corte).

### Vista previa visual
- Canvas a escala dentro de la propia ventana que muestra: pagina/area, area
  util (margenes), todas las celdas y las marcas de corte si estan activas.
- Se redibuja en vivo al cambiar cualquier parametro.

### Presets
- Guardar la configuracion actual con un nombre.
- Recargarla con un click desde el ComboBox.
- Eliminarla.
- Persistencia automatica en `%AppData%\CorelTileStudio\presets.xml`.
- Trae 2 presets de ejemplo precargados (A4 tarjetas, Carta stickers).

### Impresion
- Boton dedicado que invoca el dialogo nativo de CorelDRAW.

---

## Compilacion

Requisitos: Windows + .NET SDK 6.0+ (provee `dotnet` y compila para net48).

```cmd
cd ClientesHumanIA
build.bat
```

El binario final queda en `dist\CorelTileStudio.exe`.

> Tambien puedes abrir `CorelTileStudio.sln` en Visual Studio 2022 y compilar
> la configuracion `Release | AnyCPU`.

### Single-file deployment

```cmd
dotnet publish src\CorelTileStudio\CorelTileStudio.csproj -c Release ^
        -p:PublishSingleFile=true -p:DebugType=None
```

---

## Uso

1. Abre **CorelDRAW** y carga tu documento.
2. Ejecuta `CorelTileStudio.exe` y pulsa **Conectar** (indicador verde).
3. Define la **fuente de objetos**:
   - Selecciona en Corel y pulsa **Leer seleccion**, *o*
   - Define un rectangulo de area y pulsa **Detectar objetos dentro del rectangulo**.
4. Define el **area de impresion**:
   - **Leer pagina activa**, o
   - escribir medidas manuales, o
   - dibujar un rectangulo y **Usar rectangulo seleccionado como area**.
5. Ajusta margenes, espaciado, columnas/filas y marcas de corte.
6. Mira la **vista previa** a la derecha — todo se actualiza en tiempo real.
7. Pulsa **PLANTILLAR EN COREL**.
8. Pulsa **Imprimir** para enviar a la impresora.
9. (Opcional) **Guardar** la configuracion como preset.

---

## Arquitectura

```
src/CorelTileStudio/
  App.xaml(.cs)               - bootstrap WPF + handler global de excepciones
  MainWindow.xaml(.cs)        - ventana flotante (chrome custom, drag, pin,
                                tema/idioma, layout 2 columnas con preview)
  Themes/
    DarkTheme.xaml            - paleta oscura (todas las brushes con la misma key)
    LightTheme.xaml           - paleta clara (idem)
    ModernStyles.xaml         - estilos (boton, input, card) con DynamicResource
  Converters/
    InverseBooleanConverter
  Controls/
    GridPreview.cs            - Canvas custom, escalado a cm, redibuja al cambiar DP
  Views/
    PromptDialog.xaml(.cs)    - dialogo simple para nombrar presets
  Models/
    TilePreset.cs             - DTO serializable de una configuracion
  ViewModels/
    MainViewModel.cs          - estado, comandos, recomputo del plan, presets
    RelayCommand.cs
  Services/
    CorelDrawService.cs       - automatizacion COM late-binding
                                + GetSelectedShapeAsAreaCm
                                + SelectShapesInsideAreaCm (auto-detect)
                                + DrawCutMarks
    TileEngine.cs             - logica pura de calculo de grilla
    ThemeService.cs           - swap dinamico de palette dictionaries
    Localization.cs           - INPC singleton ES/EN
    PresetService.cs          - persistencia XML en %AppData%
  app.manifest                - DPI awareness + supportedOS Win7..11
```

### Por que late-binding COM

`Type.GetTypeFromProgID("CorelDRAW.Application")` + `dynamic` evita
referencias a las interop assemblies `Corel.Interop.VGCoreXX`, que cambian
entre versiones. El mismo `.EXE` corre con cualquier CorelDRAW que tenga su
servidor COM registrado.

### Algoritmo de plantillado

```
usable = area - margenes
cols = floor( (usable_W + spacing_X) / (objeto_W + spacing_X) )
rows = floor( (usable_H + spacing_Y) / (objeto_H + spacing_Y) )
grid_W = cols * objeto_W + (cols-1) * spacing_X
grid_H = rows * objeto_H + (rows-1) * spacing_Y
inicio = margen_izq/sup  (o centrado si CenterInArea)
```

Cada celda invoca `Selection.Duplicate(dx, dy)`. Las marcas de corte se
dibujan con `Layer.CreateLineSegment` en 8 lineas por celda (2 por esquina).
Todo dentro de un `Document.BeginCommandGroup` para que el undo sea atomico.

---

## Donde se guardan las cosas

- **Presets**: `%AppData%\CorelTileStudio\presets.xml`
- **Tema/idioma**: actualmente en memoria. Persistirlos en sesiones futuras
  es trivial (mover a un settings.xml junto a presets.xml).
