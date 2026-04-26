using System.Windows;

namespace CorelTileStudio.Views
{
    public partial class PromptDialog : Window
    {
        public string Value => InputBox.Text;

        public PromptDialog(string title, string label, string initial = "")
        {
            InitializeComponent();
            TitleText.Text = title;
            LabelText.Text = label;
            InputBox.Text = initial;
            Loaded += (_, __) => { InputBox.Focus(); InputBox.SelectAll(); };
        }

        private void Ok_Click(object sender, RoutedEventArgs e) { DialogResult = true; Close(); }
        private void Cancel_Click(object sender, RoutedEventArgs e) { DialogResult = false; Close(); }
    }
}
