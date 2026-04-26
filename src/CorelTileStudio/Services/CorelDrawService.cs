using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace CorelTileStudio.Services
{
    /// <summary>
    /// Wrapper de automatizacion COM (late-binding) para CorelDRAW.
    /// Compatible con CorelDRAW X7, X8 y 2017 - 2024 sin necesidad de
    /// referenciar las interop assemblies de una version concreta.
    /// </summary>
    public class CorelDrawService : IDisposable
    {
        private const int CDR_UNIT_CM = 4;     // cdrUnit.cdrCentimeter
        private const int CDR_UNIT_MM = 3;     // cdrUnit.cdrMillimeter

        private dynamic _app;

        public bool IsConnected => _app != null;

        public void Connect()
        {
            if (_app != null) return;

            try { _app = Marshal.GetActiveObject("CorelDRAW.Application"); }
            catch (COMException)
            {
                Type t = Type.GetTypeFromProgID("CorelDRAW.Application");
                if (t == null)
                    throw new InvalidOperationException(
                        "CorelDRAW no esta instalado o no se registro su servidor COM.");
                _app = Activator.CreateInstance(t);
                _app.Visible = true;
            }
        }

        public string GetVersion()
        {
            EnsureConnected();
            try { return Convert.ToString(_app.VersionMajor) + "." + Convert.ToString(_app.VersionMinor); }
            catch { try { return Convert.ToString(_app.Version); } catch { return "?"; } }
        }

        public bool HasActiveDocument()
        {
            EnsureConnected();
            try { return _app.ActiveDocument != null; }
            catch { return false; }
        }

        public PageInfo GetPageInfoCm()
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");

            int prev = (int)doc.Unit;
            doc.Unit = CDR_UNIT_CM;
            try
            {
                dynamic page = doc.ActivePage;
                return new PageInfo
                {
                    WidthCm = Convert.ToDouble(page.SizeWidth),
                    HeightCm = Convert.ToDouble(page.SizeHeight)
                };
            }
            finally { try { doc.Unit = prev; } catch { } }
        }

        public SelectionInfo GetSelectionInfoCm()
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");
            dynamic sel = GetSelection();
            if (sel == null || Convert.ToInt32(sel.Shapes.Count) == 0)
                throw new InvalidOperationException(
                    "Selecciona uno o mas objetos en CorelDRAW antes de plantillar.");

            int prev = (int)doc.Unit;
            doc.Unit = CDR_UNIT_CM;
            try
            {
                int count = Convert.ToInt32(sel.Shapes.Count);
                bool hasPowerClip = false;
                string typeSummary;
                if (count == 1)
                {
                    dynamic shape = sel.Shapes[1];
                    typeSummary = SafeShapeName(shape);
                    try { hasPowerClip = shape.PowerClip != null; } catch { }
                }
                else
                {
                    typeSummary = count + " objetos";
                    for (int i = 1; i <= count; i++)
                    {
                        try { if (sel.Shapes[i].PowerClip != null) { hasPowerClip = true; break; } } catch { }
                    }
                }

                return new SelectionInfo
                {
                    Count = count,
                    WidthCm = Convert.ToDouble(sel.SizeWidth),
                    HeightCm = Convert.ToDouble(sel.SizeHeight),
                    OriginXCm = Convert.ToDouble(sel.PositionX),
                    OriginYCm = Convert.ToDouble(sel.PositionY),
                    HasPowerClip = hasPowerClip,
                    TypeSummary = typeSummary
                };
            }
            finally { try { doc.Unit = prev; } catch { } }
        }

        /// <summary>
        /// Devuelve el bounding box (en cm) del unico shape seleccionado,
        /// para usarlo como rectangulo-area de plantillado.
        /// </summary>
        public AreaInfo GetSelectedShapeAsAreaCm()
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");
            dynamic sel = GetSelection();
            if (sel == null || Convert.ToInt32(sel.Shapes.Count) == 0)
                throw new InvalidOperationException(
                    "Selecciona en CorelDRAW el rectangulo que define el area de trabajo.");

            int prev = (int)doc.Unit;
            doc.Unit = CDR_UNIT_CM;
            try
            {
                double left, bottom, w, h;
                if (Convert.ToInt32(sel.Shapes.Count) == 1)
                {
                    dynamic s = sel.Shapes[1];
                    left = Convert.ToDouble(s.LeftX);
                    bottom = Convert.ToDouble(s.BottomY);
                    w = Convert.ToDouble(s.RightX) - left;
                    h = Convert.ToDouble(s.TopY) - bottom;
                }
                else
                {
                    // Bounding box del conjunto seleccionado
                    left = Convert.ToDouble(sel.PositionX);
                    bottom = Convert.ToDouble(sel.PositionY);
                    w = Convert.ToDouble(sel.SizeWidth);
                    h = Convert.ToDouble(sel.SizeHeight);
                }
                return new AreaInfo { OriginXCm = left, OriginYCm = bottom, WidthCm = w, HeightCm = h };
            }
            finally { try { doc.Unit = prev; } catch { } }
        }

        /// <summary>
        /// Encuentra los shapes cuyo bounding box queda dentro de un rectangulo
        /// definido en cm, los selecciona y devuelve sus dimensiones agrupadas.
        /// </summary>
        public SelectionInfo SelectShapesInsideAreaCm(AreaInfo area)
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");
            dynamic page = doc.ActivePage;

            int prev = (int)doc.Unit;
            doc.Unit = CDR_UNIT_CM;
            try
            {
                double minX = area.OriginXCm;
                double minY = area.OriginYCm;
                double maxX = area.OriginXCm + area.WidthCm;
                double maxY = area.OriginYCm + area.HeightCm;

                var inside = new List<dynamic>();
                for (int i = 1; i <= Convert.ToInt32(page.Shapes.Count); i++)
                {
                    dynamic s = page.Shapes[i];
                    double l = Convert.ToDouble(s.LeftX);
                    double r = Convert.ToDouble(s.RightX);
                    double b = Convert.ToDouble(s.BottomY);
                    double t = Convert.ToDouble(s.TopY);
                    // Center of shape inside rectangle (forgiving criteria).
                    double cx = (l + r) / 2.0;
                    double cy = (b + t) / 2.0;
                    if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY)
                        inside.Add(s);
                }

                if (inside.Count == 0)
                    throw new InvalidOperationException(
                        "No se encontraron objetos dentro del rectangulo definido.");

                // Build a ShapeRange and select it
                _app.ActiveDocument.ClearSelection();
                foreach (var s in inside) s.AddToSelection();

                dynamic sel = GetSelection();
                int count = Convert.ToInt32(sel.Shapes.Count);
                bool hasPowerClip = false;
                for (int i = 1; i <= count; i++)
                {
                    try { if (sel.Shapes[i].PowerClip != null) { hasPowerClip = true; break; } } catch { }
                }

                return new SelectionInfo
                {
                    Count = count,
                    WidthCm = Convert.ToDouble(sel.SizeWidth),
                    HeightCm = Convert.ToDouble(sel.SizeHeight),
                    OriginXCm = Convert.ToDouble(sel.PositionX),
                    OriginYCm = Convert.ToDouble(sel.PositionY),
                    HasPowerClip = hasPowerClip,
                    TypeSummary = count + " objeto(s) detectado(s)"
                };
            }
            finally { try { doc.Unit = prev; } catch { } }
        }

        /// <summary>
        /// Plantilla la seleccion actual y, opcionalmente, dibuja marcas de corte.
        /// </summary>
        public int TileSelection(TileLayoutRequest req, Action<int, int> progress = null)
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");
            dynamic sel = GetSelection();
            if (sel == null || Convert.ToInt32(sel.Shapes.Count) == 0)
                throw new InvalidOperationException("No hay seleccion activa.");

            int prevUnit = (int)doc.Unit;
            doc.Unit = CDR_UNIT_CM;

            try { _app.Optimization = true; } catch { }
            try { doc.BeginCommandGroup("CorelTile Studio - plantilla"); } catch { }

            int created = 0;
            try
            {
                double objW = Convert.ToDouble(sel.SizeWidth);
                double objH = Convert.ToDouble(sel.SizeHeight);
                double originX = Convert.ToDouble(sel.PositionX);
                double originY = Convert.ToDouble(sel.PositionY);

                double areaX = req.AreaOriginXCm;
                double areaY = req.AreaOriginYCm;
                double areaW = req.AreaWidthCm;
                double areaH = req.AreaHeightCm;

                int cols = Math.Max(1, req.Columns);
                int rows = Math.Max(1, req.Rows);
                double stepX = objW + req.SpacingXCm;
                double stepY = objH + req.SpacingYCm;
                double gridW = cols * objW + (cols - 1) * req.SpacingXCm;
                double gridH = rows * objH + (rows - 1) * req.SpacingYCm;

                double leftColX, topRowY;
                if (req.CenterInArea)
                {
                    leftColX = areaX + (areaW - gridW) / 2.0;
                    topRowY = areaY + (areaH + gridH) / 2.0 - objH;
                }
                else
                {
                    leftColX = areaX + req.MarginLeftCm;
                    topRowY = areaY + areaH - req.MarginTopCm - objH;
                }

                int total = cols * rows;
                int done = 0;

                double dx0 = leftColX - originX;
                double dy0 = topRowY - originY;
                if (Math.Abs(dx0) > 1e-6 || Math.Abs(dy0) > 1e-6) sel.Move(dx0, dy0);
                progress?.Invoke(++done, total);

                for (int r = 0; r < rows; r++)
                {
                    for (int c = 0; c < cols; c++)
                    {
                        if (r == 0 && c == 0) continue;
                        double dx = c * stepX;
                        double dy = -r * stepY;
                        dynamic dup = sel.Duplicate(dx, dy);
                        created++;
                        progress?.Invoke(++done, total);
                        try { Marshal.ReleaseComObject(dup); } catch { }
                    }
                }

                if (req.CutMarks)
                    DrawCutMarks(doc, leftColX, topRowY, objW, objH, stepX, stepY, cols, rows,
                                 req.CutMarkLengthCm, req.CutMarkWeightMm);

                try { _app.Refresh(); } catch { }
                try { _app.ActiveWindow.Refresh(); } catch { }
            }
            finally
            {
                try { doc.EndCommandGroup(); } catch { }
                try { _app.Optimization = false; } catch { }
                try { doc.Unit = prevUnit; } catch { }
            }

            return created;
        }

        /// <summary>
        /// Dibuja marcas de corte en las 4 esquinas de cada celda (tipo trim marks).
        /// Coordenadas: leftColX/topRowY es la esquina sup-izq de la celda (0,0).
        /// </summary>
        private void DrawCutMarks(dynamic doc, double leftColX, double topRowY,
                                  double objW, double objH, double stepX, double stepY,
                                  int cols, int rows, double markLengthCm, double weightMm)
        {
            dynamic page = doc.ActivePage;
            dynamic layer = page.ActiveLayer;
            // Convert weight to points for OutlineWidth (Corel uses points by default for outlines).
            double weightPt = weightMm * 2.83464567; // 1 mm = 2.834 pt
            if (markLengthCm <= 0) markLengthCm = 0.3;

            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    double cellLeft = leftColX + c * stepX;
                    double cellRight = cellLeft + objW;
                    double cellTop = topRowY + objH - r * stepY; // top of this cell
                    double cellBottom = cellTop - objH;

                    // 4 corners x 2 marks each (horizontal + vertical) extending outward.
                    AddMark(layer, cellLeft - markLengthCm, cellTop, cellLeft, cellTop, weightPt);   // TL horiz
                    AddMark(layer, cellLeft, cellTop, cellLeft, cellTop + markLengthCm, weightPt);   // TL vert
                    AddMark(layer, cellRight, cellTop, cellRight + markLengthCm, cellTop, weightPt); // TR horiz
                    AddMark(layer, cellRight, cellTop, cellRight, cellTop + markLengthCm, weightPt); // TR vert
                    AddMark(layer, cellLeft - markLengthCm, cellBottom, cellLeft, cellBottom, weightPt); // BL horiz
                    AddMark(layer, cellLeft, cellBottom - markLengthCm, cellLeft, cellBottom, weightPt); // BL vert
                    AddMark(layer, cellRight, cellBottom, cellRight + markLengthCm, cellBottom, weightPt); // BR horiz
                    AddMark(layer, cellRight, cellBottom - markLengthCm, cellRight, cellBottom, weightPt); // BR vert
                }
            }
        }

        private void AddMark(dynamic layer, double x1, double y1, double x2, double y2, double weightPt)
        {
            try
            {
                dynamic line = layer.CreateLineSegment(x1, y1, x2, y2);
                try { line.Outline.Width = weightPt; } catch { }
                try { line.Outline.Color.RGBAssign(0, 0, 0); } catch { }
            }
            catch { /* ignore - some Corel versions name it differently */ }
        }

        public void Print()
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");
            doc.PrintOut();
        }

        public void BringCorelToFront()
        {
            EnsureConnected();
            try { _app.AppWindow.Activate(); } catch { }
        }

        // -------- helpers --------
        private dynamic GetSelection()
        {
            try { var r = _app.ActiveSelectionRange; if (r != null) return r; } catch { }
            try { return _app.ActiveSelection; } catch { return null; }
        }

        private static string SafeShapeName(dynamic shape)
        {
            try
            {
                string name = Convert.ToString(shape.Name);
                if (!string.IsNullOrEmpty(name)) return name;
            }
            catch { }
            try { return "Shape (" + Convert.ToString(shape.Type) + ")"; } catch { return "Shape"; }
        }

        private void EnsureConnected()
        {
            if (_app == null)
                throw new InvalidOperationException(
                    "Sin conexion con CorelDRAW. Pulsa el boton 'Conectar'.");
        }

        public void Dispose()
        {
            if (_app != null)
            {
                try { Marshal.ReleaseComObject(_app); } catch { }
                _app = null;
            }
        }
    }

    public class PageInfo
    {
        public double WidthCm { get; set; }
        public double HeightCm { get; set; }
    }

    public class AreaInfo
    {
        public double OriginXCm { get; set; }
        public double OriginYCm { get; set; }
        public double WidthCm { get; set; }
        public double HeightCm { get; set; }
    }

    public class SelectionInfo
    {
        public int Count { get; set; }
        public double WidthCm { get; set; }
        public double HeightCm { get; set; }
        public double OriginXCm { get; set; }
        public double OriginYCm { get; set; }
        public bool HasPowerClip { get; set; }
        public string TypeSummary { get; set; }
    }

    public class TileLayoutRequest
    {
        public int Columns { get; set; } = 1;
        public int Rows { get; set; } = 1;
        public double SpacingXCm { get; set; }
        public double SpacingYCm { get; set; }
        public double AreaOriginXCm { get; set; }
        public double AreaOriginYCm { get; set; }
        public double AreaWidthCm { get; set; }
        public double AreaHeightCm { get; set; }
        public double MarginLeftCm { get; set; }
        public double MarginRightCm { get; set; }
        public double MarginTopCm { get; set; }
        public double MarginBottomCm { get; set; }
        public bool CenterInArea { get; set; } = true;
        public bool CutMarks { get; set; }
        public double CutMarkLengthCm { get; set; } = 0.3;
        public double CutMarkWeightMm { get; set; } = 0.25;
    }
}
