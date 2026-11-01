using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace InkWellUninstaller
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            DialogResult res = MessageBox.Show(
                "Are you sure you want to completely uninstall InkWell from your computer?",
                "Uninstall InkWell",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (res != DialogResult.Yes) return;

            try
            {
                // Remove shortcuts
                string desktopLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "InkWell.lnk");
                if (File.Exists(desktopLnk)) File.Delete(desktopLnk);

                string startMenuLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "InkWell.lnk");
                if (File.Exists(startMenuLnk)) File.Delete(startMenuLnk);

                // Remove Registry entry
                try
                {
                    Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\InkWell", false);
                }
                catch { }

                // Schedule self directory deletion using cmd
                string installDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = string.Format("/c timeout /t 1 /nobreak > nul & rmdir /s /q \"{0}\"", installDir);
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.CreateNoWindow = true;
                Process.Start(psi);

                MessageBox.Show("InkWell has been successfully uninstalled from your computer.", "InkWell", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error during uninstall:\n" + ex.Message, "InkWell", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
