using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;

namespace CorelTileStudio.Controls
{
    /// <summary>
    /// Canvas que dibuja a escala: pagina, area util y celdas plantilladas.
    /// Recibe medidas en cm via DependencyProperties; redibuja al cambiar.
    /// </summary>
    public class GridPreview : Canvas
    {
        public static readonly DependencyProperty AreaWidthCmProperty =
            Reg(nameof(AreaWidthCm), 21.0);
        public static readonly DependencyProperty AreaHeightCmProperty =
            Reg(nameof(AreaHeightCm), 29.7);
        public static readonly DependencyProperty MarginLeftCmProperty =
            Reg(nameof(MarginLeftCm), 1.0);
        public static readonly DependencyProperty MarginRightCmProperty =
            Reg(nameof(MarginRightCm), 1.0);
        public static readonly DependencyProperty MarginTopCmProperty =
            Reg(nameof(MarginTopCm), 1.0);
        public static readonly DependencyProperty MarginBottomCmProperty =
            Reg(nameof(MarginBottomCm), 1.0);
        public static readonly DependencyProperty ObjectWidthCmProperty =
            Reg(nameof(ObjectWidthCm), 5.0);
        public static readonly DependencyProperty ObjectHeightCmProperty =
            Reg(nameof(ObjectHeightCm), 5.0);
        public static readonly DependencyProperty SpacingXCmProperty =
            Reg(nameof(SpacingXCm), 0.3);
        public static readonly DependencyProperty SpacingYCmProperty =
            Reg(nameof(SpacingYCm), 0.3);
        public static readonly DependencyProperty ColumnsProperty =
            DependencyProperty.Register(nameof(Columns), typeof(int), typeof(GridPreview),
                new FrameworkPropertyMetadata(3, FrameworkPropertyMetadataOptions.AffectsRender, OnAnyChanged));
        public static readonly DependencyProperty RowsProperty =
            DependencyProperty.Register(nameof(Rows), typeof(int), typeof(GridPreview),
                new FrameworkPropertyMetadata(3, FrameworkPropertyMetadataOptions.AffectsRender, OnAnyChanged));
        public static readonly DependencyProperty CenterProperty =
            DependencyProperty.Register(nameof(CenterInArea), typeof(bool), typeof(GridPreview),
                new FrameworkPropertyMetadata(true, FrameworkPropertyMetadataOptions.AffectsRender, OnAnyChanged));
        public static readonly DependencyProperty CutMarksProperty =
            DependencyProperty.Register(nameof(CutMarks), typeof(bool), typeof(GridPreview),
                new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.AffectsRender, OnAnyChanged));
        public static readonly DependencyProperty CutMarkLengthCmProperty =
            Reg(nameof(CutMarkLengthCm), 0.3);

        public double AreaWidthCm { get => (double)GetValue(AreaWidthCmProperty); set => SetValue(AreaWidthCmProperty, value); }
        public double AreaHeightCm { get => (double)GetValue(AreaHeightCmProperty); set => SetValue(AreaHeightCmProperty, value); }
        public double MarginLeftCm { get => (double)GetValue(MarginLeftCmProperty); set => SetValue(MarginLeftCmProperty, value); }
        public double MarginRightCm { get => (double)GetValue(MarginRightCmProperty); set => SetValue(MarginRightCmProperty, value); }
        public double MarginTopCm { get => (double)GetValue(MarginTopCmProperty); set => SetValue(MarginTopCmProperty, value); }
        public double MarginBottomCm { get => (double)GetValue(MarginBottomCmProperty); set => SetValue(MarginBottomCmProperty, value); }
        public double ObjectWidthCm { get => (double)GetValue(ObjectWidthCmProperty); set => SetValue(ObjectWidthCmProperty, value); }
        public double ObjectHeightCm { get => (double)GetValue(ObjectHeightCmProperty); set => SetValue(ObjectHeightCmProperty, value); }
        public double SpacingXCm { get => (double)GetValue(SpacingXCmProperty); set => SetValue(SpacingXCmProperty, value); }
        public double SpacingYCm { get => (double)GetValue(SpacingYCmProperty); set => SetValue(SpacingYCmProperty, value); }
        public int Columns { get => (int)GetValue(ColumnsProperty); set => SetValue(ColumnsProperty, value); }
        public int Rows { get => (int)GetValue(RowsProperty); set => SetValue(RowsProperty, value); }
        public bool CenterInArea { get => (bool)GetValue(CenterProperty); set => SetValue(CenterProperty, value); }
        public bool CutMarks { get => (bool)GetValue(CutMarksProperty); set => SetValue(CutMarksProperty, value); }
        public double CutMarkLengthCm { get => (double)GetValue(CutMarkLengthCmProperty); set => SetValue(CutMarkLengthCmProperty, value); }

        public GridPreview()
        {
            ClipToBounds = true;
            Background = Brushes.Transparent;
            SizeChanged += (_, __) => Redraw();
            Loaded += (_, __) => Redraw();
        }

        private static DependencyProperty Reg(string name, double def) =>
            DependencyProperty.Register(name, typeof(double), typeof(GridPreview),
                new FrameworkPropertyMetadata(def, FrameworkPropertyMetadataOptions.AffectsRender, OnAnyChanged));

        private static void OnAnyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e) =>
            ((GridPreview)d).Redraw();

        private SolidColorBrush B(string key, Color fallback) =>
            (TryFindResource(key) as SolidColorBrush) ?? new SolidColorBrush(fallback);

        public void Redraw()
        {
            Children.Clear();
            if (!IsLoaded || ActualWidth < 8 || ActualHeight < 8) return;
            if (AreaWidthCm <= 0 || AreaHeightCm <= 0) return;

            var pageBrush = B("PreviewPageBrush", Color.FromRgb(0x20, 0x24, 0x2D));
            var usableBrush = B("PreviewUsableBrush", Color.FromRgb(0x2A, 0x2F, 0x3B));
            var cellBrush = B("PreviewCellBrush", Color.FromArgb(0x66, 0x4F, 0x8D, 0xFF));
            var cellBorder = B("PreviewCellBorderBrush", Color.FromRgb(0x4F, 0x8D, 0xFF));
            var cutBrush = B("PreviewCutMarkBrush", Color.FromRgb(0xE2, 0x51, 0x6C));
            var borderBrush = B("BorderStrongBrush", Color.FromRgb(0x3A, 0x41, 0x54));

            // Compute scale (fit page into canvas with padding)
            double padding = 12;
            double maxW = ActualWidth - 2 * padding;
            double maxH = ActualHeight - 2 * padding;
            double scale = Math.Min(maxW / AreaWidthCm, maxH / AreaHeightCm);
            if (scale <= 0 || double.IsInfinity(scale)) return;

            double pageW = AreaWidthCm * scale;
            double pageH = AreaHeightCm * scale;
            double offX = (ActualWidth - pageW) / 2.0;
            double offY = (ActualHeight - pageH) / 2.0;

            // Page rectangle
            var page = new Rectangle
            {
                Width = pageW,
                Height = pageH,
                Fill = pageBrush,
                Stroke = borderBrush,
                StrokeThickness = 1,
                RadiusX = 3,
                RadiusY = 3,
                Effect = new System.Windows.Media.Effects.DropShadowEffect
                {
                    BlurRadius = 14, ShadowDepth = 0, Opacity = 0.35, Color = Colors.Black
                }
            };
            SetLeft(page, offX); SetTop(page, offY);
            Children.Add(page);

            // Usable area
            double mlCm = Math.Max(0, MarginLeftCm);
            double mrCm = Math.Max(0, MarginRightCm);
            double mtCm = Math.Max(0, MarginTopCm);
            double mbCm = Math.Max(0, MarginBottomCm);
            double usableWcm = Math.Max(0, AreaWidthCm - mlCm - mrCm);
            double usableHcm = Math.Max(0, AreaHeightCm - mtCm - mbCm);

            double usableX = offX + mlCm * scale;
            double usableY = offY + mtCm * scale;
            double usableW = usableWcm * scale;
            double usableH = usableHcm * scale;

            if (usableW > 0 && usableH > 0)
            {
                var area = new Rectangle
                {
                    Width = usableW,
                    Height = usableH,
                    Fill = usableBrush,
                    Stroke = borderBrush,
                    StrokeDashArray = new DoubleCollection { 3, 3 },
                    StrokeThickness = 1
                };
                SetLeft(area, usableX); SetTop(area, usableY);
                Children.Add(area);
            }

            // Grid cells
            int cols = Math.Max(0, Columns);
            int rows = Math.Max(0, Rows);
            if (cols == 0 || rows == 0 || ObjectWidthCm <= 0 || ObjectHeightCm <= 0) return;

            double objW = ObjectWidthCm * scale;
            double objH = ObjectHeightCm * scale;
            double sX = SpacingXCm * scale;
            double sY = SpacingYCm * scale;
            double gridWpx = cols * objW + (cols - 1) * sX;
            double gridHpx = rows * objH + (rows - 1) * sY;

            double startX, startY;
            if (CenterInArea)
            {
                startX = offX + (pageW - gridWpx) / 2.0;
                startY = offY + (pageH - gridHpx) / 2.0;
            }
            else
            {
                startX = usableX;
                startY = usableY;
            }

            double cutLen = Math.Max(0, CutMarkLengthCm) * scale;

            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    double x = startX + c * (objW + sX);
                    double y = startY + r * (objH + sY);
                    var cell = new Rectangle
                    {
                        Width = objW,
                        Height = objH,
                        Fill = cellBrush,
                        Stroke = cellBorder,
                        StrokeThickness = 1,
                        RadiusX = 2,
                        RadiusY = 2
                    };
                    SetLeft(cell, x); SetTop(cell, y);
                    Children.Add(cell);

                    if (CutMarks && cutLen > 0)
                    {
                        AddLine(cutBrush, x - cutLen, y, x, y);
                        AddLine(cutBrush, x, y - cutLen, x, y);
                        AddLine(cutBrush, x + objW, y, x + objW + cutLen, y);
                        AddLine(cutBrush, x + objW, y - cutLen, x + objW, y);
                        AddLine(cutBrush, x - cutLen, y + objH, x, y + objH);
                        AddLine(cutBrush, x, y + objH, x, y + objH + cutLen);
                        AddLine(cutBrush, x + objW, y + objH, x + objW + cutLen, y + objH);
                        AddLine(cutBrush, x + objW, y + objH, x + objW, y + objH + cutLen);
                    }
                }
            }
        }

        private void AddLine(Brush brush, double x1, double y1, double x2, double y2)
        {
            var line = new Line
            {
                X1 = x1, Y1 = y1, X2 = x2, Y2 = y2,
                Stroke = brush, StrokeThickness = 1.2
            };
            Children.Add(line);
        }
    }
}
