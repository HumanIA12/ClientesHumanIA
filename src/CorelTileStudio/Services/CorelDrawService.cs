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
        // cdrUnit enum: cdrCentimeter = 4
        private const int CDR_UNIT_CM = 4;

        private dynamic _app;

        public bool IsConnected => _app != null;

        /// <summary>Conecta a una instancia ya abierta o lanza una nueva.</summary>
        public void Connect()
        {
            if (_app != null) return;

            try
            {
                _app = Marshal.GetActiveObject("CorelDRAW.Application");
            }
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
                double w = Convert.ToDouble(page.SizeWidth);
                double h = Convert.ToDouble(page.SizeHeight);
                return new PageInfo { WidthCm = w, HeightCm = h };
            }
            finally
            {
                try { doc.Unit = prev; } catch { /* ignore */ }
            }
        }

        public SelectionInfo GetSelectionInfoCm()
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");
            dynamic sel = _app.ActiveSelectionRange ?? _app.ActiveSelection;
            if (sel == null || Convert.ToInt32(sel.Shapes.Count) == 0)
                throw new InvalidOperationException(
                    "Selecciona uno o mas objetos en CorelDRAW antes de plantillar.");

            int prev = (int)doc.Unit;
            doc.Unit = CDR_UNIT_CM;
            try
            {
                int count = Convert.ToInt32(sel.Shapes.Count);
                double w = Convert.ToDouble(sel.SizeWidth);
                double h = Convert.ToDouble(sel.SizeHeight);
                double x = Convert.ToDouble(sel.PositionX);
                double y = Convert.ToDouble(sel.PositionY);

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
                    WidthCm = w,
                    HeightCm = h,
                    OriginXCm = x,
                    OriginYCm = y,
                    HasPowerClip = hasPowerClip,
                    TypeSummary = typeSummary
                };
            }
            finally
            {
                try { doc.Unit = prev; } catch { /* ignore */ }
            }
        }

        /// <summary>
        /// Plantilla la seleccion actual en una grilla de columnas x filas
        /// posicionada dentro del area util (margenes en cm).
        /// Retorna el numero de copias creadas.
        /// </summary>
        public int TileSelection(TileLayoutRequest req, Action<int, int> progress = null)
        {
            EnsureConnected();
            dynamic doc = _app.ActiveDocument
                ?? throw new InvalidOperationException("No hay un documento abierto en CorelDRAW.");
            dynamic sel = _app.ActiveSelectionRange ?? _app.ActiveSelection;
            if (sel == null || Convert.ToInt32(sel.Shapes.Count) == 0)
                throw new InvalidOperationException("No hay seleccion activa.");

            int prevUnit = (int)doc.Unit;
            doc.Unit = CDR_UNIT_CM;

            // Open undo group so the user can revert with one Ctrl+Z
            try { _app.Optimization = true; } catch { }
            try { doc.BeginCommandGroup("CorelTile Studio - plantilla"); } catch { }

            int created = 0;
            try
            {
                double objW = Convert.ToDouble(sel.SizeWidth);
                double objH = Convert.ToDouble(sel.SizeHeight);
                double originX = Convert.ToDouble(sel.PositionX); // bottom-left in CorelDRAW coords
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

                // CorelDRAW page coords: (0,0) bottom-left, +Y goes up.
                // To fill top-to-bottom we place row 0 at the TOP and move DOWN.
                double topRowY;
                double leftColX;
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

                // Move original to first cell so duplicates align cleanly
                double dx0 = leftColX - originX;
                double dy0 = topRowY - originY;
                if (Math.Abs(dx0) > 1e-6 || Math.Abs(dy0) > 1e-6)
                    sel.Move(dx0, dy0);

                progress?.Invoke(++done, total);

                for (int r = 0; r < rows; r++)
                {
                    for (int c = 0; c < cols; c++)
                    {
                        if (r == 0 && c == 0) continue; // original already placed
                        double dx = c * stepX;
                        double dy = -r * stepY; // descend down the page
                        dynamic dup = sel.Duplicate(dx, dy);
                        created++;
                        progress?.Invoke(++done, total);
                        try { Marshal.ReleaseComObject(dup); } catch { }
                    }
                }

                // Refresh viewport
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

        /// <summary>Lanza el dialogo de impresion de CorelDRAW.</summary>
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
    }
}
