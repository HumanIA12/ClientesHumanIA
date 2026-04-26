using System;

namespace CorelTileStudio.Models
{
    [Serializable]
    public class TilePreset
    {
        public string Name { get; set; } = string.Empty;
        public double ObjectWidthCm { get; set; } = 5;
        public double ObjectHeightCm { get; set; } = 5;
        public bool UseCorelPage { get; set; } = true;
        public double AreaWidthCm { get; set; } = 21;
        public double AreaHeightCm { get; set; } = 29.7;
        public double MarginLeftCm { get; set; } = 1;
        public double MarginRightCm { get; set; } = 1;
        public double MarginTopCm { get; set; } = 1;
        public double MarginBottomCm { get; set; } = 1;
        public double SpacingXCm { get; set; } = 0.3;
        public double SpacingYCm { get; set; } = 0.3;
        public bool AutoFit { get; set; } = true;
        public int Columns { get; set; } = 3;
        public int Rows { get; set; } = 3;
        public bool CenterInArea { get; set; } = true;
        public bool CutMarks { get; set; } = false;
        public double CutMarkLengthCm { get; set; } = 0.3;
        public double CutMarkWeightMm { get; set; } = 0.25;

        public override string ToString() => string.IsNullOrEmpty(Name) ? "(sin nombre)" : Name;
    }
}
