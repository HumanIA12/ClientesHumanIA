using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
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
            ApplyTileCommand = new RelayCommand(_ => ApplyTile(), _ => CanApply());
            PrintCommand = new RelayCommand(_ => Print(), _ => _corel.IsConnected);
            RecomputeCommand = new RelayCommand(_ => Recompute());
        }

        // ==================== STATUS ====================
        private string _statusMessage = "Plugin listo. Pulsa 'Conectar' para enlazar con CorelDRAW.";
        public string StatusMessage { get => _statusMessage; set => SetField(ref _statusMessage, value); }

        private bool _isConnected;
        public bool IsConnected { get => _isConnected; set => SetField(ref _isConnected, value); }

        private string _corelVersion = "-";
        public string CorelVersion { get => _corelVersion; set => SetField(ref _corelVersion, value); }

        // ==================== SELECTION ====================
        private string _selectionInfo = "Sin seleccion";
        public string SelectionInfo { get => _selectionInfo; set => SetField(ref _selectionInfo, value); }

        private double _objectWidthCm = 5.0;
        public double ObjectWidthCm { get => _objectWidthCm; set { if (SetField(ref _objectWidthCm, value)) Recompute(); } }

        private double _objectHeightCm = 5.0;
        public double ObjectHeightCm { get => _objectHeightCm; set { if (SetField(ref _objectHeightCm, value)) Recompute(); } }

        // ==================== AREA / PAGE ====================
        private bool _useCorelPage = true;
        public bool UseCorelPage { get => _useCorelPage; set { if (SetField(ref _useCorelPage, value)) Recompute(); } }

        private double _areaWidthCm = 21.0;   // A4 default
        public double AreaWidthCm { get => _areaWidthCm; set { if (SetField(ref _areaWidthCm, value)) Recompute(); } }

        private double _areaHeightCm = 29.7;
        public double AreaHeightCm { get => _areaHeightCm; set { if (SetField(ref _areaHeightCm, value)) Recompute(); } }

        // ==================== MARGINS / SPACING (cm) ====================
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

        // ==================== LAYOUT MODE ====================
        private bool _autoFit = true;
        public bool AutoFit { get => _autoFit; set { if (SetField(ref _autoFit, value)) Recompute(); } }

        private int _columns = 3;
        public int Columns { get => _columns; set { if (SetField(ref _columns, value)) Recompute(); } }

        private int _rows = 3;
        public int Rows { get => _rows; set { if (SetField(ref _rows, value)) Recompute(); } }

        private bool _centerInArea = true;
        public bool CenterInArea { get => _centerInArea; set { if (SetField(ref _centerInArea, value)) Recompute(); } }

        // ==================== PLAN OUTPUT ====================
        private string _planSummary = "Define la seleccion y el area para ver el plan.";
        public string PlanSummary { get => _planSummary; set => SetField(ref _planSummary, value); }

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
        public ICommand ApplyTileCommand { get; }
        public ICommand PrintCommand { get; }
        public ICommand RecomputeCommand { get; }

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
                    TryReadSelectionSilent();
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
                                (s.HasPowerClip ? "  (PowerClip detectado)" : string.Empty);
                StatusMessage = "Seleccion leida correctamente.";
            }
            catch (Exception ex) { StatusMessage = ex.Message; }
        }

        private void TryReadSelectionSilent()
        {
            try { ReadSelection(); } catch { /* ignore */ }
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
                    AreaOriginXCm = 0,
                    AreaOriginYCm = 0,
                    AreaWidthCm = AreaWidthCm,
                    AreaHeightCm = AreaHeightCm,
                    MarginLeftCm = MarginLeftCm,
                    MarginRightCm = MarginRightCm,
                    MarginTopCm = MarginTopCm,
                    MarginBottomCm = MarginBottomCm,
                    CenterInArea = CenterInArea
                };

                int created = _corel.TileSelection(req);
                StatusMessage = $"OK. Se crearon {created} copias adicionales ({PlannedCopies} en total).";
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
            PlanSummary = $"{plan.Columns} columnas x {plan.Rows} filas = {plan.TotalCopies} copias  |  " +
                          $"grilla {plan.GridWidthCm:0.##} x {plan.GridHeightCm:0.##} cm  |  " +
                          $"area util {plan.UsedAreaWidthCm:0.##} x {plan.UsedAreaHeightCm:0.##} cm";
            PlanWarning = plan.Warning;
            HasWarning = !string.IsNullOrEmpty(plan.Warning);
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
