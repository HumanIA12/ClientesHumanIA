using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Serialization;
using CorelTileStudio.Models;

namespace CorelTileStudio.Services
{
    /// <summary>
    /// Persistencia de presets en %AppData%\CorelTileStudio\presets.xml.
    /// Usa XmlSerializer (sin dependencias externas).
    /// </summary>
    public static class PresetService
    {
        private static readonly string Folder =
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                         "CorelTileStudio");
        private static readonly string FilePath = Path.Combine(Folder, "presets.xml");

        [Serializable]
        public class PresetList
        {
            public List<TilePreset> Items { get; set; } = new List<TilePreset>();
        }

        public static List<TilePreset> Load()
        {
            try
            {
                if (!File.Exists(FilePath)) return Defaults();
                var ser = new XmlSerializer(typeof(PresetList));
                using (var fs = File.OpenRead(FilePath))
                    return ((PresetList)ser.Deserialize(fs))?.Items ?? Defaults();
            }
            catch { return Defaults(); }
        }

        public static void Save(IEnumerable<TilePreset> items)
        {
            try
            {
                Directory.CreateDirectory(Folder);
                var ser = new XmlSerializer(typeof(PresetList));
                using (var fs = File.Create(FilePath))
                    ser.Serialize(fs, new PresetList { Items = items.ToList() });
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("No se pudo guardar el preset: " + ex.Message, ex);
            }
        }

        private static List<TilePreset> Defaults() => new List<TilePreset>
        {
            new TilePreset
            {
                Name = "A4 - Tarjetas 8.5x5.5 (10 unid)",
                ObjectWidthCm = 8.5, ObjectHeightCm = 5.5,
                UseCorelPage = false, AreaWidthCm = 21, AreaHeightCm = 29.7,
                MarginLeftCm = 0.5, MarginRightCm = 0.5,
                MarginTopCm = 0.5, MarginBottomCm = 0.5,
                SpacingXCm = 0.2, SpacingYCm = 0.2,
                AutoFit = true, CenterInArea = true,
                CutMarks = true, CutMarkLengthCm = 0.3, CutMarkWeightMm = 0.25
            },
            new TilePreset
            {
                Name = "Carta - Stickers 5x5 (auto-fit)",
                ObjectWidthCm = 5, ObjectHeightCm = 5,
                UseCorelPage = false, AreaWidthCm = 21.59, AreaHeightCm = 27.94,
                MarginLeftCm = 1, MarginRightCm = 1, MarginTopCm = 1, MarginBottomCm = 1,
                SpacingXCm = 0.3, SpacingYCm = 0.3,
                AutoFit = true, CenterInArea = true,
                CutMarks = true, CutMarkLengthCm = 0.4, CutMarkWeightMm = 0.25
            }
        };
    }
}
