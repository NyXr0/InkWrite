using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace InkWellApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string appDir = Path.Combine(baseDir, "app");
                if (!Directory.Exists(appDir))
                {
                    MessageBox.Show("Could not find InkWell web application at:\n" + appDir, "InkWell Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Bind to an available local loopback port
                HttpListener listener = null;
                int port = 49280;
                bool bound = false;
                for (int i = 0; i < 40; i++)
                {
                    try
                    {
                        listener = new HttpListener();
                        listener.Prefixes.Add("http://127.0.0.1:" + (port + i) + "/");
                        listener.Start();
                        port = port + i;
                        bound = true;
                        break;
                    }
                    catch
                    {
                        if (listener != null)
                        {
                            try { listener.Close(); } catch { }
                        }
                    }
                }

                if (!bound || listener == null)
                {
                    MessageBox.Show("Unable to start local internal server for InkWell.", "InkWell Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Serve static files on background thread
                Thread serverThread = new Thread(() =>
                {
                    while (listener.IsListening)
                    {
                        try
                        {
                            var context = listener.GetContext();
                            ThreadPool.QueueUserWorkItem((state) =>
                            {
                                try
                                {
                                    var req = context.Request;
                                    var res = context.Response;

                                    string rel = req.Url.AbsolutePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                                    if (string.IsNullOrEmpty(rel)) rel = "index.html";

                                    string full = Path.Combine(appDir, rel);
                                    if (!File.Exists(full))
                                    {
                                        full = Path.Combine(appDir, "index.html");
                                    }

                                    if (File.Exists(full))
                                    {
                                        byte[] bytes = File.ReadAllBytes(full);
                                        string ext = Path.GetExtension(full).ToLowerInvariant();
                                        switch (ext)
                                        {
                                            case ".html": res.ContentType = "text/html; charset=utf-8"; break;
                                            case ".js": res.ContentType = "application/javascript; charset=utf-8"; break;
                                            case ".css": res.ContentType = "text/css; charset=utf-8"; break;
                                            case ".png": res.ContentType = "image/png"; break;
                                            case ".ico": res.ContentType = "image/x-icon"; break;
                                            case ".svg": res.ContentType = "image/svg+xml"; break;
                                            case ".json": res.ContentType = "application/json"; break;
                                            case ".woff2": res.ContentType = "font/woff2"; break;
                                            case ".woff": res.ContentType = "font/woff"; break;
                                            case ".ttf": res.ContentType = "font/ttf"; break;
                                            default: res.ContentType = "application/octet-stream"; break;
                                        }

                                        res.AddHeader("Cache-Control", "no-cache");
                                        res.ContentLength64 = bytes.Length;
                                        res.OutputStream.Write(bytes, 0, bytes.Length);
                                        res.OutputStream.Close();
                                    }
                                    else
                                    {
                                        res.StatusCode = 404;
                                        res.Close();
                                    }
                                }
                                catch { }
                            });
                        }
                        catch { }
                    }
                });
                serverThread.IsBackground = true;
                serverThread.Start();

                // Dedicated Isolated User Data Directory for InkWell storage
                string userDataDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "InkWell",
                    "UserData"
                );
                if (!Directory.Exists(userDataDir))
                {
                    Directory.CreateDirectory(userDataDir);
                }

                // Locate Microsoft Edge executable
                string edgePath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                    "Microsoft", "Edge", "Application", "msedge.exe"
                );
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                        "Microsoft", "Edge", "Application", "msedge.exe"
                    );
                }

                string appUrl = "http://127.0.0.1:" + port + "/";

                if (File.Exists(edgePath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = edgePath;
                    psi.Arguments = string.Format(
                        "--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1440,900 --no-first-run --disable-features=Translate,InterestFeedContentSuggestions",
                        appUrl,
                        userDataDir
                    );
                    psi.UseShellExecute = false;

                    Process proc = Process.Start(psi);
                    if (proc != null)
                    {
                        proc.WaitForExit();
                    }
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(appUrl);
                }

                try
                {
                    listener.Stop();
                    listener.Close();
                }
                catch { }
            }
            catch (Exception ex)
            {
                MessageBox.Show("InkWell encountered an unexpected error:\n" + ex.Message, "InkWell", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
