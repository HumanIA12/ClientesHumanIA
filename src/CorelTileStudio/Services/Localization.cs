using System.ComponentModel;

namespace CorelTileStudio.Services
{
    /// <summary>
    /// Singleton localizable. Bindings en XAML usan
    /// {Binding Source={x:Static svc:Localization.Instance}, Path=LblXxxx}.
    /// Cambiar idioma dispara INPC para todas las propiedades.
    /// </summary>
    public class Localization : INotifyPropertyChanged
    {
        public static Localization Instance { get; } = new Localization();
        private string _lang = "ES";
        public string Lang
        {
            get => _lang;
            set { if (_lang != value) { _lang = value; RaiseAll(); } }
        }
        public bool IsEnglish => _lang == "EN";

        private string T(string es, string en) => _lang == "EN" ? en : es;

        // ---------- HEADER ----------
        public string AppTitle => T("CorelTile Studio", "CorelTile Studio");
        public string AppSubtitle => T("Plantillador de impresion", "Print template tool");
        public string PinTooltip => T("Mantener encima de todas las ventanas", "Keep on top of all windows");
        public string ThemeTooltip => T("Cambiar tema (claro / oscuro)", "Toggle theme (light / dark)");
        public string LanguageTooltip => T("Cambiar idioma (ES / EN)", "Switch language (ES / EN)");
        public string MinimizeTooltip => T("Minimizar", "Minimize");
        public string CloseTooltip => T("Cerrar", "Close");

        // ---------- SECTIONS ----------
        public string SecConnection => T("CONEXION", "CONNECTION");
        public string SecObject => T("OBJETO A PLANTILLAR", "OBJECT TO TILE");
        public string SecArea => T("AREA DE TRABAJO", "WORK AREA");
        public string SecMargins => T("MARGENES Y ESPACIADO (cm)", "MARGINS AND SPACING (cm)");
        public string SecLayout => T("DISTRIBUCION", "LAYOUT");
        public string SecCutMarks => T("MARCAS DE CORTE", "CUT MARKS");
        public string SecPresets => T("PRESETS", "PRESETS");
        public string SecPlan => T("PLAN", "PLAN");
        public string SecPreview => T("VISTA PREVIA", "PREVIEW");

        // ---------- LABELS ----------
        public string LblWidthCm => T("ANCHO (cm)", "WIDTH (cm)");
        public string LblHeightCm => T("ALTO (cm)", "HEIGHT (cm)");
        public string LblLeft => T("IZQ", "LEFT");
        public string LblRight => T("DER", "RIGHT");
        public string LblTop => T("SUP", "TOP");
        public string LblBottom => T("INF", "BOTTOM");
        public string LblSpacingX => T("ESPACIADO X", "SPACING X");
        public string LblSpacingY => T("ESPACIADO Y", "SPACING Y");
        public string LblColumns => T("COLUMNAS", "COLUMNS");
        public string LblRows => T("FILAS", "ROWS");
        public string LblCutLength => T("LARGO MARCA (cm)", "MARK LENGTH (cm)");
        public string LblCutWeight => T("GROSOR (mm)", "WEIGHT (mm)");

        // ---------- BUTTONS ----------
        public string BtnConnect => T("Conectar", "Connect");
        public string BtnReadSelection => T("↻  Leer seleccion de CorelDRAW", "↻  Read selection from CorelDRAW");
        public string BtnReadPage => T("↻  Leer pagina activa", "↻  Read active page");
        public string BtnReadRectangle => T("▢  Usar rectangulo seleccionado como area", "▢  Use selected rectangle as area");
        public string BtnAutoDetect => T("✨  Detectar objetos dentro del rectangulo", "✨  Auto-detect objects inside rectangle");
        public string BtnApplyTile => T("✦  PLANTILLAR EN COREL", "✦  TILE IN COREL");
        public string BtnPrint => T("⎙  Imprimir", "⎙  Print");
        public string BtnSavePreset => T("Guardar", "Save");
        public string BtnDeletePreset => T("Eliminar", "Delete");

        // ---------- CHECKBOXES ----------
        public string ChkUseCorelPage => T("Usar pagina activa de CorelDRAW", "Use CorelDRAW active page");
        public string ChkAutoFit => T("Auto-ajustar (maximo de copias)", "Auto-fit (maximize copies)");
        public string ChkCenter => T("Centrar grilla en el area util", "Center grid in usable area");
        public string ChkCutMarks => T("Agregar marcas de corte", "Add cut marks");

        // ---------- HINTS / STATUS ----------
        public string HintObject =>
            T("Selecciona en CorelDRAW el objeto (PowerClip u otro), luego pulsa \"Leer seleccion\".",
              "Select the object (PowerClip or other) in CorelDRAW, then press \"Read selection\".");
        public string HintArea =>
            T("Define el area como pagina, medidas manuales o rectangulo dibujado en CorelDRAW.",
              "Define the area as the page, manual values, or a rectangle drawn in CorelDRAW.");
        public string NoSelection => T("Sin seleccion", "No selection");
        public string PlaceholderPlan => T("Define la seleccion y el area para ver el plan.",
                                           "Define the selection and area to see the plan.");
        public string Ready => T("Plugin listo. Pulsa 'Conectar' para enlazar con CorelDRAW.",
                                 "Plugin ready. Press 'Connect' to link to CorelDRAW.");

        public event PropertyChangedEventHandler PropertyChanged;
        private void RaiseAll() => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(string.Empty));
    }
}
