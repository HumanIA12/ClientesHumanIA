using System;

namespace CorelTileStudio.Services
{
    /// <summary>
    /// Logica pura (sin COM) para calcular cuantas copias caben en un area
    /// y resolver columnas/filas. Permite previsualizar en la UI sin tocar Corel.
    /// </summary>
    public static class TileEngine
    {
        public class Plan
        {
            public int Columns { get; set; }
            public int Rows { get; set; }
            public int TotalCopies => Columns * Rows;
            public double GridWidthCm { get; set; }
            public double GridHeightCm { get; set; }
            public double UsedAreaWidthCm { get; set; }
            public double UsedAreaHeightCm { get; set; }
            public double WastedXCm { get; set; }
            public double WastedYCm { get; set; }
            public string Warning { get; set; }
        }

        public class Input
        {
            public double ObjectWidthCm { get; set; }
            public double ObjectHeightCm { get; set; }
            public double AreaWidthCm { get; set; }
            public double AreaHeightCm { get; set; }
            public double MarginLeftCm { get; set; }
            public double MarginRightCm { get; set; }
            public double MarginTopCm { get; set; }
            public double MarginBottomCm { get; set; }
            public double SpacingXCm { get; set; }
            public double SpacingYCm { get; set; }

            // If both > 0 the plan uses these values directly.
            // Otherwise the engine maximizes copies to fit the area.
            public int? FixedColumns { get; set; }
            public int? FixedRows { get; set; }
        }

        public static Plan Compute(Input i)
        {
            var p = new Plan();

            if (i.ObjectWidthCm <= 0 || i.ObjectHeightCm <= 0)
            {
                p.Warning = "Las dimensiones del objeto deben ser mayores a 0.";
                return p;
            }

            double usableW = i.AreaWidthCm - i.MarginLeftCm - i.MarginRightCm;
            double usableH = i.AreaHeightCm - i.MarginTopCm - i.MarginBottomCm;
            p.UsedAreaWidthCm = Math.Max(0, usableW);
            p.UsedAreaHeightCm = Math.Max(0, usableH);

            if (usableW <= 0 || usableH <= 0)
            {
                p.Warning = "Los margenes consumen toda el area util.";
                return p;
            }

            int cols, rows;
            if (i.FixedColumns.HasValue && i.FixedColumns.Value > 0 &&
                i.FixedRows.HasValue && i.FixedRows.Value > 0)
            {
                cols = i.FixedColumns.Value;
                rows = i.FixedRows.Value;
            }
            else
            {
                cols = MaxFit(usableW, i.ObjectWidthCm, i.SpacingXCm);
                rows = MaxFit(usableH, i.ObjectHeightCm, i.SpacingYCm);
            }

            cols = Math.Max(1, cols);
            rows = Math.Max(1, rows);

            double gridW = cols * i.ObjectWidthCm + Math.Max(0, cols - 1) * i.SpacingXCm;
            double gridH = rows * i.ObjectHeightCm + Math.Max(0, rows - 1) * i.SpacingYCm;

            p.Columns = cols;
            p.Rows = rows;
            p.GridWidthCm = gridW;
            p.GridHeightCm = gridH;
            p.WastedXCm = Math.Max(0, usableW - gridW);
            p.WastedYCm = Math.Max(0, usableH - gridH);

            if (gridW > usableW + 1e-6 || gridH > usableH + 1e-6)
                p.Warning = "La grilla solicitada excede el area util. Las copias se saldran del area de impresion.";

            return p;
        }

        private static int MaxFit(double avail, double size, double spacing)
        {
            if (size <= 0) return 0;
            if (avail < size) return 0;
            // n*size + (n-1)*spacing <= avail
            // n <= (avail + spacing) / (size + spacing)
            double denom = size + Math.Max(0, spacing);
            if (denom <= 0) return 0;
            int n = (int)Math.Floor((avail + Math.Max(0, spacing)) / denom);
            return Math.Max(0, n);
        }
    }
}
