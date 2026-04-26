using System;
using System.Linq;
using System.Windows;

namespace CorelTileStudio.Services
{
    public enum AppTheme { Dark, Light }

    public static class ThemeService
    {
        private static readonly Uri DarkUri =
            new Uri("pack://application:,,,/Themes/DarkTheme.xaml", UriKind.Absolute);
        private static readonly Uri LightUri =
            new Uri("pack://application:,,,/Themes/LightTheme.xaml", UriKind.Absolute);

        public static AppTheme Current { get; private set; } = AppTheme.Dark;

        public static event Action<AppTheme> ThemeChanged;

        public static void Apply(AppTheme theme)
        {
            var dicts = Application.Current.Resources.MergedDictionaries;
            // Remove any palette dictionary that defines AccentBrush.
            for (int i = dicts.Count - 1; i >= 0; i--)
            {
                var d = dicts[i];
                if (d.Source != null &&
                    (d.Source.OriginalString.EndsWith("DarkTheme.xaml", StringComparison.OrdinalIgnoreCase) ||
                     d.Source.OriginalString.EndsWith("LightTheme.xaml", StringComparison.OrdinalIgnoreCase)))
                {
                    dicts.RemoveAt(i);
                }
            }

            var palette = new ResourceDictionary { Source = theme == AppTheme.Light ? LightUri : DarkUri };
            // Insert palette FIRST so style files referencing DynamicResource resolve to it.
            dicts.Insert(0, palette);

            Current = theme;
            ThemeChanged?.Invoke(theme);
        }

        public static void Toggle() => Apply(Current == AppTheme.Dark ? AppTheme.Light : AppTheme.Dark);
    }
}
