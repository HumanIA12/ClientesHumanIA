using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using CorelTileStudio.Models;
using CorelTileStudio.Services;

namespace CorelTileStudio.ViewModels
{
    public class MainViewModel : INotifyPropertyChanged
    {
        private readonly CorelDrawService _corel = new CorelDrawService();

        public MainViewModel()
        {
            ConnectCommand = new RelayCommand(_ => Connect());
            ReadPageCommand = new RelayCommand(_ => ReadPage(), _ => _corel.IsConnected);
            ReadSelectionCommand = new RelayCommand(_ => ReadSelection(), _ => _corel.IsConnected);
            ReadRectangleCommand = new RelayCommand(_ => ReadRectangle(), _ => _corel.IsConnected);
            AutoDetectCommand = new RelayCommand(_ => AutoDetect(), _ => _corel.IsConnected);
            ApplyTileCommand = new RelayCommand(_ => ApplyTile(), _ => CanApply());
            PrintCommand = new RelayCommand(_ => Print(), _ => _corel.IsConnected);
            RecomputeCommand = new RelayCommand(_ => Recompute());
            ToggleThemeCommand = new RelayCommand(_ => { ThemeService.Toggle(); OnPropertyChanged(nameof(IsDarkTheme)); });
            ToggleLanguageCommand = new RelayCommand(_ =>
            {
                Localization.Instance.Lang = Localization.Instance.Lang == "ES" ? "EN" : "ES";
                OnPropertyChanged(nameof(LanguageGlyph));
            });
            SavePresetCommand = new RelayCommand(_ => SavePreset());
            DeletePresetCommand = new RelayCommand(_ => DeletePreset(), _ => SelectedPreset != null);
            LoadPresetCommand = new RelayCommand(_ => ApplyPreset(SelectedPreset), _ => SelectedPreset != null);

            // Load presets
            foreach (var p in PresetService.Load())
                Presets.Add(p);

            // Re-emit computed strings when language switches
            Localization.Instance.PropertyChanged += (_, __) =>
            {
                OnPropertyChanged(nameof(StatusMessage));
                OnPropertyChanged(nameof(SelectionInfo));
                OnPropertyChanged(nameof(PlanSummary));
                OnPropertyChanged(nameof(AreaSourceLabel));
            };
        }

        // ==================== STATUS ====================
        private string _statusMessage;
        public string StatusMessage { get => _statusMessage ?? Localization.Instance.Ready; set => SetField(ref _statusMessage, value); }

        private bool _isConnected;
        public bool IsConnected { get => _isConnected; set => SetField(ref _isConnected, value); }

        private string _corelVersion = "-";
        public string CorelVersion { get => _corelVersion; set => SetField(ref _corelVersion, value); }

        public bool IsDarkTheme => ThemeService.Current == AppTheme.Dark;
        public string LanguageGlyph => Localization.Instance.Lang == "ES" ? "EN" : "ES";

        // ==================== SELECTION ====================
        private string _selectionInfo;
        public string SelectionInfo { get => _selectionInfo ?? Localization.Instance.NoSelection; set => SetField(ref _selectionInfo, value); }

        private double _objectWidthCm = 5.0;
        public double ObjectWidthCm { get => _objectWidthCm; set { if (SetField(ref _objectWidthCm, value)) Recompute(); } }

        private double _objectHeightCm = 5.0;
        public double ObjectHeightCm { get => _objectHeightCm; set { if (SetField(ref _objectHeightCm, value)) Recompute(); } }

        // ==================== AREA / PAGE ====================
        public enum AreaSource { CorelPage, Manual, SelectedRectangle }

        private bool _useCorelPage = true;
        public bool UseCorelPage
        {
            get => _useCorelPage;
            set { if (SetField(ref _useCorelPage, value)) { if (value) AreaSourceMode = AreaSource.CorelPage; Recompute(); } }
        }

        private AreaSource _areaSourceMode = AreaSource.CorelPage;
        public AreaSource AreaSourceMode
        {
            get => _areaSourceMode;
            set { if (SetField(ref _areaSourceMode, value)) OnPropertyChanged(nameof(AreaSourceLabel)); }
        }

        public string AreaSourceLabel
        {
            get
            {
                switch (_areaSourceMode)
                {
                    case AreaSource.CorelPage: return "Pagina de CorelDRAW";
                    case AreaSource.SelectedRectangle: return "Rectangulo seleccionado";
                    default: return "Manual";
                }
            }
        }

        private double _areaOriginXCm;
        public double AreaOriginXCm { get => _areaOriginXCm; set => SetField(ref _areaOriginXCm, value); }

        private double _areaOriginYCm;
        public double AreaOriginYCm { get => _areaOriginYCm; set => SetField(ref _areaOriginYCm, value); }

        private double _areaWidthCm = 21.0;
        public double AreaWidthCm { get => _areaWidthCm; set { if (SetField(ref _areaWidthCm, value)) Recompute(); } }

        private double _areaHeightCm = 29.7;
        public double AreaHeightCm { get => _areaHeightCm; set { if (SetField(ref _areaHeightCm, value)) Recompute(); } }

        // ==================== MARGINS / SPACING ====================
        private double _marginLeftCm = 1.0;
        public double MarginLeftCm { get => _marginLeftCm; set { if (SetField(ref _marginLeftCm, value)) Recompute(); } }

        private double _marginRightCm = 1.0;
        public double MarginRightCm { get => _marginRightCm; set { if (SetField(ref _marginRightCm, value)) Recompute(); } }

        private double _marginTopCm = 1.0;
        public double MarginTopCm { get => _marginTopCm; set { if (SetField(ref _marginTopCm, value)) Recompute(); } }

        private double _marginBottomCm = 1.0;
        public double MarginBottomCm { get => _marginBottomCm; set { if (SetField(ref _marginBottomCm, value)) Recompute(); } }

        private double _spacingXCm = 0.3;
        public double SpacingXCm { get => _spacingXCm; set { if (SetField(ref _spacingXCm, value)) Recompute(); } }

        private double _spacingYCm = 0.3;
        public double SpacingYCm { get => _spacingYCm; set { if (SetField(ref _spacingYCm, value)) Recompute(); } }

        // ==================== LAYOUT ====================
        private bool _autoFit = true;
        public bool AutoFit { get => _autoFit; set { if (SetField(ref _autoFit, value)) Recompute(); } }

        private int _columns = 3;
        public int Columns { get => _columns; set { if (SetField(ref _columns, value)) Recompute(); } }

        private int _rows = 3;
        public int Rows { get => _rows; set { if (SetField(ref _rows, value)) Recompute(); } }

        private bool _centerInArea = true;
        public bool CenterInArea { get => _centerInArea; set { if (SetField(ref _centerInArea, value)) Recompute(); } }

        // ==================== CUT MARKS ====================
        private bool _cutMarks;
        public bool CutMarks { get => _cutMarks; set { if (SetField(ref _cutMarks, value)) OnPropertyChanged(); } }

        private double _cutMarkLengthCm = 0.3;
        public double CutMarkLengthCm { get => _cutMarkLengthCm; set => SetField(ref _cutMarkLengthCm, value); }

        private double _cutMarkWeightMm = 0.25;
        public double CutMarkWeightMm { get => _cutMarkWeightMm; set => SetField(ref _cutMarkWeightMm, value); }

        // ==================== PRESETS ====================
        public ObservableCollection<TilePreset> Presets { get; } = new ObservableCollection<TilePreset>();

        private TilePreset _selectedPreset;
        public TilePreset SelectedPreset
        {
            get => _selectedPreset;
            set { if (SetField(ref _selectedPreset, value)) ApplyPreset(value); }
        }

        // ==================== PLAN ====================
        private string _planSummary;
        public string PlanSummary { get => _planSummary ?? Localization.Instance.PlaceholderPlan; set => SetField(ref _planSummary, value); }

        private string _planWarning;
        public string PlanWarning { get => _planWarning; set => SetField(ref _planWarning, value); }

        private bool _hasWarning;
        public bool HasWarning { get => _hasWarning; set => SetField(ref _hasWarning, value); }

        private int _plannedCopies;
        public int PlannedCopies { get => _plannedCopies; set => SetField(ref _plannedCopies, value); }

        // ==================== COMMANDS ====================
        public ICommand ConnectCommand { get; }
        public ICommand ReadPageCommand { get; }
        public ICommand ReadSelectionCommand { get; }
        public ICommand ReadRectangleCommand { get; }
        public ICommand AutoDetectCommand { get; }
        public ICommand ApplyTileCommand { get; }
        public ICommand PrintCommand { get; }
        public ICommand RecomputeCommand { get; }
        public ICommand ToggleThemeCommand { get; }
        public ICommand ToggleLanguageCommand { get; }
        public ICommand SavePresetCommand { get; }
        public ICommand DeletePresetCommand { get; }
        public ICommand LoadPresetCommand { get; }

        // ==================== ACTIONS ====================
        private void Connect()
        {
            try
            {
                _corel.Connect();
                IsConnected = _corel.IsConnected;
                CorelVersion = _corel.GetVersion();
                StatusMessage = "Conectado a CorelDRAW " + CorelVersion;
                if (_corel.HasActiveDocument())
                {
                    if (UseCorelPage) ReadPage();
                    try { ReadSelection(); } catch { /* opcional */ }
                }
            }
            catch (Exception ex)
            {
                IsConnected = false;
                StatusMessage = "Error al conectar: " + ex.Message;
            }
        }

        private void ReadPage()
        {
            try
            {
                var p = _corel.GetPageInfoCm();
                AreaWidthCm = Math.Round(p.WidthCm, 3);
                AreaHeightCm = Math.Round(p.HeightCm, 3);
                AreaOriginXCm = 0;
                AreaOriginYCm = 0;
                AreaSourceMode = AreaSource.CorelPage;
                StatusMessage = $"Pagina activa: {p.WidthCm:0.##} x {p.HeightCm:0.##} cm";
            }
            catch (Exception ex) { StatusMessage = ex.Message; }
        }

        private void ReadSelection()
        {
            try
            {
                var s = _corel.GetSelectionInfoCm();
                ObjectWidthCm = Math.Round(s.WidthCm, 3);
                ObjectHeightCm = Math.Round(s.HeightCm, 3);
                SelectionInfo = $"{s.TypeSummary} - {s.WidthCm:0.##} x {s.HeightCm:0.##} cm" +
                                (s.HasPowerClip ? "  (PowerClip)" : string.Empty);
                StatusMessage = "Seleccion leida correctamente.";
            }
            catch (Exception ex) { StatusMessage = ex.Message; }
        }

        private void ReadRectangle()
        {
            try
            {
                var a = _corel.GetSelectedShapeAsAreaCm();
                AreaWidthCm = Math.Round(a.WidthCm, 3);
                AreaHeightCm = Math.Round(a.HeightCm, 3);
                AreaOriginXCm = a.OriginXCm;
                AreaOriginYCm = a.OriginYCm;
                AreaSourceMode = AreaSource.SelectedRectangle;
                UseCorelPage = false;
                StatusMessage = $"Area = rectangulo: {a.WidthCm:0.##} x {a.HeightCm:0.##} cm";
            }
            catch (Exception ex) { StatusMessage = ex.Message; }
        }

        private void AutoDetect()
        {
            try
            {
                var area = new AreaInfo
                {
                    OriginXCm = AreaOriginXCm,
                    OriginYCm = AreaOriginYCm,
                    WidthCm = AreaWidthCm,
                    HeightCm = AreaHeightCm
                };
                var s = _corel.SelectShapesInsideAreaCm(area);
                ObjectWidthCm = Math.Round(s.WidthCm, 3);
                ObjectHeightCm = Math.Round(s.HeightCm, 3);
                SelectionInfo = $"{s.TypeSummary} - {s.WidthCm:0.##} x {s.HeightCm:0.##} cm" +
                                (s.HasPowerClip ? "  (incluye PowerClip)" : string.Empty);
                StatusMessage = $"Auto-detectados {s.Count} objeto(s) dentro del area.";
            }
            catch (Exception ex) { StatusMessage = ex.Message; }
        }

        private void ApplyTile()
        {
            try
            {
                Recompute();
                if (PlannedCopies <= 0)
                {
                    StatusMessage = "El plan no genera copias. Revisa medidas y margenes.";
                    return;
                }
                var req = new TileLayoutRequest
                {
                    Columns = Columns,
                    Rows = Rows,
                    SpacingXCm = SpacingXCm,
                    SpacingYCm = SpacingYCm,
                    AreaOriginXCm = AreaOriginXCm,
                    AreaOriginYCm = AreaOriginYCm,
                    AreaWidthCm = AreaWidthCm,
                    AreaHeightCm = AreaHeightCm,
                    MarginLeftCm = MarginLeftCm,
                    MarginRightCm = MarginRightCm,
                    MarginTopCm = MarginTopCm,
                    MarginBottomCm = MarginBottomCm,
                    CenterInArea = CenterInArea,
                    CutMarks = CutMarks,
                    CutMarkLengthCm = CutMarkLengthCm,
                    CutMarkWeightMm = CutMarkWeightMm
                };
                int created = _corel.TileSelection(req);
                StatusMessage = $"OK. {created} copias adicionales creadas ({PlannedCopies} total)" +
                                (CutMarks ? " + marcas de corte." : ".");
                _corel.BringCorelToFront();
            }
            catch (Exception ex) { StatusMessage = "Error al plantillar: " + ex.Message; }
        }

        private void Print()
        {
            try { _corel.Print(); StatusMessage = "Dialogo de impresion abierto."; }
            catch (Exception ex) { StatusMessage = ex.Message; }
        }

        private bool CanApply() => _corel.IsConnected && PlannedCopies > 0;

        public void Recompute()
        {
            var input = new TileEngine.Input
            {
                ObjectWidthCm = ObjectWidthCm,
                ObjectHeightCm = ObjectHeightCm,
                AreaWidthCm = AreaWidthCm,
                AreaHeightCm = AreaHeightCm,
                MarginLeftCm = MarginLeftCm,
                MarginRightCm = MarginRightCm,
                MarginTopCm = MarginTopCm,
                MarginBottomCm = MarginBottomCm,
                SpacingXCm = SpacingXCm,
                SpacingYCm = SpacingYCm,
                FixedColumns = AutoFit ? (int?)null : Columns,
                FixedRows = AutoFit ? (int?)null : Rows
            };
            var plan = TileEngine.Compute(input);
            if (AutoFit)
            {
                if (Columns != plan.Columns) { _columns = plan.Columns; OnPropertyChanged(nameof(Columns)); }
                if (Rows != plan.Rows) { _rows = plan.Rows; OnPropertyChanged(nameof(Rows)); }
            }
            PlannedCopies = plan.TotalCopies;
            PlanSummary = $"{plan.Columns} cols x {plan.Rows} filas = {plan.TotalCopies} copias  |  " +
                          $"grilla {plan.GridWidthCm:0.##} x {plan.GridHeightCm:0.##} cm  |  " +
                          $"util {plan.UsedAreaWidthCm:0.##} x {plan.UsedAreaHeightCm:0.##} cm";
            PlanWarning = plan.Warning;
            HasWarning = !string.IsNullOrEmpty(plan.Warning);
        }

        // ==================== PRESETS ====================
        private void SavePreset()
        {
            string name = PromptForName();
            if (string.IsNullOrWhiteSpace(name)) return;
            var preset = SnapshotCurrent(name);
            var existing = Presets.FirstOrDefault(p => string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase));
            if (existing != null) Presets.Remove(existing);
            Presets.Add(preset);
            try { PresetService.Save(Presets); StatusMessage = $"Preset '{name}' guardado."; }
            catch (Exception ex) { StatusMessage = ex.Message; }
            SelectedPreset = preset;
        }

        private void DeletePreset()
        {
            if (SelectedPreset == null) return;
            string name = SelectedPreset.Name;
            Presets.Remove(SelectedPreset);
            try { PresetService.Save(Presets); StatusMessage = $"Preset '{name}' eliminado."; }
            catch (Exception ex) { StatusMessage = ex.Message; }
        }

        private void ApplyPreset(TilePreset p)
        {
            if (p == null) return;
            ObjectWidthCm = p.ObjectWidthCm;
            ObjectHeightCm = p.ObjectHeightCm;
            UseCorelPage = p.UseCorelPage;
            AreaWidthCm = p.AreaWidthCm;
            AreaHeightCm = p.AreaHeightCm;
            MarginLeftCm = p.MarginLeftCm;
            MarginRightCm = p.MarginRightCm;
            MarginTopCm = p.MarginTopCm;
            MarginBottomCm = p.MarginBottomCm;
            SpacingXCm = p.SpacingXCm;
            SpacingYCm = p.SpacingYCm;
            AutoFit = p.AutoFit;
            Columns = p.Columns;
            Rows = p.Rows;
            CenterInArea = p.CenterInArea;
            CutMarks = p.CutMarks;
            CutMarkLengthCm = p.CutMarkLengthCm;
            CutMarkWeightMm = p.CutMarkWeightMm;
            StatusMessage = $"Preset '{p.Name}' aplicado.";
            Recompute();
        }

        private TilePreset SnapshotCurrent(string name) => new TilePreset
        {
            Name = name,
            ObjectWidthCm = ObjectWidthCm,
            ObjectHeightCm = ObjectHeightCm,
            UseCorelPage = UseCorelPage,
            AreaWidthCm = AreaWidthCm,
            AreaHeightCm = AreaHeightCm,
            MarginLeftCm = MarginLeftCm,
            MarginRightCm = MarginRightCm,
            MarginTopCm = MarginTopCm,
            MarginBottomCm = MarginBottomCm,
            SpacingXCm = SpacingXCm,
            SpacingYCm = SpacingYCm,
            AutoFit = AutoFit,
            Columns = Columns,
            Rows = Rows,
            CenterInArea = CenterInArea,
            CutMarks = CutMarks,
            CutMarkLengthCm = CutMarkLengthCm,
            CutMarkWeightMm = CutMarkWeightMm
        };

        private static string PromptForName()
        {
            var dlg = new Views.PromptDialog("Guardar preset",
                "Nombre del preset:", "Mi preset");
            return dlg.ShowDialog() == true ? dlg.Value : null;
        }

        // ==================== INPC ====================
        public event PropertyChangedEventHandler PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string name = null) =>
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        protected bool SetField<T>(ref T field, T value, [CallerMemberName] string name = null)
        {
            if (Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(name);
            return true;
        }
    }
}
