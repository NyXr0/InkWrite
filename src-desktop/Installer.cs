using System;
using System.Drawing;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace InkWellInstaller
{
    public class SetupForm : Form
    {
        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblPath;
        private TextBox txtPath;
        private Button btnBrowse;
        private CheckBox chkDesktop;
        private CheckBox chkStartMenu;
        private CheckBox chkLaunch;
        private ProgressBar progressBar;
        private Label lblStatus;
        private Button btnInstall;
        private Button btnCancel;
        private Panel headerPanel;

        public SetupForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "InkWell Setup — Novelist's Studio & Reading Sanctuary";
            this.Size = new Size(540, 420);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(250, 250, 249);
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular, GraphicsUnit.Point);

            try
            {
                this.Icon = Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location);
            }
            catch { }

            // Header Banner
            headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 78;
            headerPanel.BackColor = Color.FromArgb(24, 24, 27);

            lblTitle = new Label();
            lblTitle.Text = "Install InkWell v0.1.0";
            lblTitle.Font = new Font("Segoe UI", 13F, FontStyle.Bold, GraphicsUnit.Point);
            lblTitle.ForeColor = Color.FromArgb(235, 94, 40);
            lblTitle.Location = new Point(24, 16);
            lblTitle.AutoSize = true;

            lblSubtitle = new Label();
            lblSubtitle.Text = "Novel Writing Studio & Personal eBook Reading Sanctuary";
            lblSubtitle.Font = new Font("Segoe UI", 9F, FontStyle.Regular, GraphicsUnit.Point);
            lblSubtitle.ForeColor = Color.FromArgb(161, 161, 170);
            lblSubtitle.Location = new Point(24, 42);
            lblSubtitle.AutoSize = true;

            headerPanel.Controls.Add(lblTitle);
            headerPanel.Controls.Add(lblSubtitle);
            this.Controls.Add(headerPanel);

            // Install Path
            lblPath = new Label();
            lblPath.Text = "Destination Folder:";
            lblPath.Location = new Point(24, 98);
            lblPath.AutoSize = true;
            this.Controls.Add(lblPath);

            string defaultPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                "InkWell"
            );

            txtPath = new TextBox();
            txtPath.Text = defaultPath;
            txtPath.Location = new Point(24, 122);
            txtPath.Size = new Size(380, 23);
            this.Controls.Add(txtPath);

            btnBrowse = new Button();
            btnBrowse.Text = "Browse...";
            btnBrowse.Location = new Point(414, 121);
            btnBrowse.Size = new Size(86, 25);
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtPath.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtPath.Text = fbd.SelectedPath;
                    }
                }
            };
            this.Controls.Add(btnBrowse);

            // Options
            chkDesktop = new CheckBox();
            chkDesktop.Text = "Create a Desktop shortcut";
            chkDesktop.Checked = true;
            chkDesktop.Location = new Point(24, 165);
            chkDesktop.AutoSize = true;
            this.Controls.Add(chkDesktop);

            chkStartMenu = new CheckBox();
            chkStartMenu.Text = "Create a Start Menu shortcut";
            chkStartMenu.Checked = true;
            chkStartMenu.Location = new Point(24, 195);
            chkStartMenu.AutoSize = true;
            this.Controls.Add(chkStartMenu);

            chkLaunch = new CheckBox();
            chkLaunch.Text = "Launch InkWell after installation finishes";
            chkLaunch.Checked = true;
            chkLaunch.Location = new Point(24, 225);
            chkLaunch.AutoSize = true;
            this.Controls.Add(chkLaunch);

            // Progress Bar
            progressBar = new ProgressBar();
            progressBar.Location = new Point(24, 268);
            progressBar.Size = new Size(476, 18);
            progressBar.Visible = false;
            this.Controls.Add(progressBar);

            lblStatus = new Label();
            lblStatus.Text = "Ready to install InkWell.";
            lblStatus.ForeColor = Color.FromArgb(100, 100, 100);
            lblStatus.Location = new Point(24, 292);
            lblStatus.Size = new Size(476, 20);
            this.Controls.Add(lblStatus);

            // Action Buttons
            btnInstall = new Button();
            btnInstall.Text = "Install InkWell";
            btnInstall.Size = new Size(116, 32);
            btnInstall.Location = new Point(268, 328);
            btnInstall.BackColor = Color.FromArgb(235, 94, 40);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold, GraphicsUnit.Point);
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);

            btnCancel = new Button();
            btnCancel.Text = "Cancel";
            btnCancel.Size = new Size(96, 32);
            btnCancel.Location = new Point(394, 328);
            btnCancel.Click += (s, e) => this.Close();
            this.Controls.Add(btnCancel);
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            btnInstall.Enabled = false;
            btnCancel.Enabled = false;
            btnBrowse.Enabled = false;
            txtPath.Enabled = false;
            chkDesktop.Enabled = false;
            chkStartMenu.Enabled = false;
            progressBar.Visible = true;
            progressBar.Style = ProgressBarStyle.Marquee;

            string destDir = txtPath.Text.Trim();
            bool createDesktop = chkDesktop.Checked;
            bool createStartMenu = chkStartMenu.Checked;
            bool launch = chkLaunch.Checked;

            Thread worker = new Thread(() =>
            {
                try
                {
                    UpdateStatus("Creating installation directory...");
                    if (!Directory.Exists(destDir))
                    {
                        Directory.CreateDirectory(destDir);
                    }

                    UpdateStatus("Extracting InkWell application files...");
                    Assembly asm = Assembly.GetExecutingAssembly();
                    using (Stream resStream = asm.GetManifestResourceStream("payload.zip"))
                    {
                        if (resStream == null)
                        {
                            throw new Exception("Embedded application payload was not found inside the installer.");
                        }

                        string tempZip = Path.Combine(Path.GetTempPath(), "InkWellPayload_" + Guid.NewGuid().ToString("N") + ".zip");
                        using (FileStream fs = File.Create(tempZip))
                        {
                            resStream.CopyTo(fs);
                        }

                        // Extract files
                        ZipFile.ExtractToDirectory(tempZip, destDir);
                        try { File.Delete(tempZip); } catch { }
                    }

                    string exePath = Path.Combine(destDir, "InkWell.exe");
                    string iconPath = Path.Combine(destDir, "icon.ico");

                    UpdateStatus("Creating Windows desktop shortcuts...");
                    if (createDesktop)
                    {
                        string desktopPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "InkWell.lnk");
                        CreateShortcut(desktopPath, exePath, iconPath, destDir, "InkWell — Novel Writing Studio & Reading Sanctuary");
                    }

                    if (createStartMenu)
                    {
                        string programsFolder = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                        string startLink = Path.Combine(programsFolder, "InkWell.lnk");
                        CreateShortcut(startLink, exePath, iconPath, destDir, "InkWell — Novel Writing Studio & Reading Sanctuary");
                    }

                    UpdateStatus("Registering in Windows Settings (Apps & Features)...");
                    RegisterInAddRemovePrograms(destDir, exePath, iconPath);

                    UpdateStatus("Installation finished successfully!");

                    this.Invoke(new Action(() =>
                    {
                        progressBar.Style = ProgressBarStyle.Continuous;
                        progressBar.Value = 100;
                        btnCancel.Text = "Finish";
                        btnCancel.Enabled = true;

                        if (launch && File.Exists(exePath))
                        {
                            Process.Start(exePath);
                            this.Close();
                        }
                        else
                        {
                            MessageBox.Show("InkWell was successfully installed on your computer!", "InkWell Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
                            this.Close();
                        }
                    }));
                }
                catch (Exception ex)
                {
                    this.Invoke(new Action(() =>
                    {
                        MessageBox.Show("Installation failed:\n" + ex.Message, "InkWell Setup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        btnInstall.Enabled = true;
                        btnCancel.Enabled = true;
                        progressBar.Visible = false;
                        lblStatus.Text = "Installation failed.";
                    }));
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        private void UpdateStatus(string text)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => lblStatus.Text = text));
            }
            else
            {
                lblStatus.Text = text;
            }
        }

        private static void CreateShortcut(string shortcutPath, string targetPath, string iconPath, string workingDir, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = targetPath;
                    shortcut.WorkingDirectory = workingDir;
                    shortcut.Description = description;
                    if (File.Exists(iconPath))
                    {
                        shortcut.IconLocation = iconPath + ",0";
                    }
                    shortcut.Save();
                }
            }
            catch { }
        }

        private static void RegisterInAddRemovePrograms(string installDir, string exePath, string iconPath)
        {
            try
            {
                string uninstExe = Path.Combine(installDir, "Uninstall-InkWell.exe");
                string regKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\InkWell";

                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(regKeyPath))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "InkWell — Novel Writing Studio & Reading Sanctuary");
                        key.SetValue("DisplayVersion", "0.1.0");
                        key.SetValue("Publisher", "Inayat Ali");
                        key.SetValue("InstallLocation", installDir);
                        key.SetValue("DisplayIcon", File.Exists(iconPath) ? iconPath : exePath);
                        key.SetValue("UninstallString", "\"" + uninstExe + "\"");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            }
            catch { }
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
