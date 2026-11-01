# Build Windows Desktop Package & Standalone Installer for InkWell
$ErrorActionPreference = 'Stop'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Building InkWell Windows Desktop Release Package & Setup " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Compile web application
Write-Host "`n[1/5] Building Web Assets with Vite & TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed with exit code $LASTEXITCODE"
}

# 2. Setup release directories
$releaseDir = "release"
$appDistDir = Join-Path $releaseDir "InkWell-win32-x64"
$appPayloadDir = Join-Path $appDistDir "app"

if (Test-Path $appDistDir) {
    Remove-Item -Recurse -Force $appDistDir | Out-Null
}
New-Item -ItemType Directory -Path $appPayloadDir -Force | Out-Null

Write-Host "`n[2/5] Copying application assets to release bundle..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "dist\*" $appPayloadDir
Copy-Item -Force "src-tauri\icons\icon.ico" $appDistDir
Copy-Item -Force "src-tauri\icons\icon.png" $appDistDir
Copy-Item -Force "LICENSE" $appDistDir
Copy-Item -Force "README.md" $appDistDir

# Locate C# compiler
$csc = "$env:windir\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "$env:windir\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
if (-not (Test-Path $csc)) {
    throw "Could not locate C# compiler csc.exe on this system."
}

# 3. Compile Desktop Launcher (InkWell.exe)
Write-Host "`n[3/5] Compiling native Windows GUI executable (InkWell.exe)..." -ForegroundColor Yellow
$launcherExe = Join-Path $appDistDir "InkWell.exe"
$iconPath = (Resolve-Path "src-tauri\icons\icon.ico").Path

& $csc /target:winexe /optimize+ /platform:anycpu `
    "/out:$launcherExe" `
    "/win32icon:$iconPath" `
    "/reference:System.Windows.Forms.dll,System.Drawing.dll,System.dll" `
    "src-desktop\Launcher.cs"

if ($LASTEXITCODE -ne 0) {
    throw "Failed to compile InkWell.exe"
}

# Compile Uninstaller (Uninstall-InkWell.exe)
$uninstallerExe = Join-Path $appDistDir "Uninstall-InkWell.exe"
& $csc /target:winexe /optimize+ /platform:anycpu `
    "/out:$uninstallerExe" `
    "/win32icon:$iconPath" `
    "/reference:System.Windows.Forms.dll,System.Drawing.dll,System.dll" `
    "src-desktop\Uninstaller.cs"

if ($LASTEXITCODE -ne 0) {
    throw "Failed to compile Uninstall-InkWell.exe"
}

# 4. Create Portable ZIP & Installer Payload
Write-Host "`n[4/5] Packaging Portable ZIP & Installer payload..." -ForegroundColor Yellow
$zipPortable = Join-Path $releaseDir "InkWell-0.1.0-Windows-Portable.zip"
$tempPayloadZip = Join-Path $releaseDir "payload.zip"

if (Test-Path $zipPortable) { Remove-Item -Force $zipPortable }
if (Test-Path $tempPayloadZip) { Remove-Item -Force $tempPayloadZip }

# Compress payload
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory((Resolve-Path $appDistDir).Path, (Resolve-Path $releaseDir).Path + "\payload.zip")
Copy-Item $tempPayloadZip $zipPortable -Force

# 5. Compile Self-Contained GUI Windows Installer (InkWell-Setup-0.1.0.exe)
Write-Host "`n[5/5] Compiling single-file GUI Windows Installer (InkWell-Setup-0.1.0.exe)..." -ForegroundColor Yellow
$setupExe = Join-Path $releaseDir "InkWell-Setup-0.1.0.exe"

& $csc /target:winexe /optimize+ /platform:anycpu `
    "/out:$setupExe" `
    "/win32icon:$iconPath" `
    "/resource:$tempPayloadZip,payload.zip" `
    "/reference:System.Windows.Forms.dll,System.Drawing.dll,System.IO.Compression.FileSystem.dll,System.dll,Microsoft.CSharp.dll" `
    "src-desktop\Installer.cs"

if ($LASTEXITCODE -ne 0) {
    throw "Failed to compile InkWell-Setup-0.1.0.exe"
}

# Cleanup temporary payload zip
Remove-Item -Force $tempPayloadZip

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " InkWell Windows Release Artifacts Successfully Created! " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " 1. Windows Installer:  $setupExe" -ForegroundColor White
Write-Host " 2. Portable Package:   $zipPortable" -ForegroundColor White
Write-Host " 3. Portable Folder:    $appDistDir" -ForegroundColor White
Write-Host " 4. Inno Setup File:    installer.iss" -ForegroundColor White
Write-Host " 5. GitHub Release CI:  .github/workflows/release.yml" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
