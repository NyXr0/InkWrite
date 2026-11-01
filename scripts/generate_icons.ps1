Add-Type -AssemblyName System.Drawing

$iconDir = 'src-tauri\icons'
if (-not (Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force | Out-Null
}

function Build-Icon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Dark background circle
    $brushBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(24, 24, 27))
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $g.FillEllipse($brushBg, $rect)

    # Terracotta accent ring
    $penRing = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(235, 94, 40)), ([Math]::Max(2, $size * 0.04))
    $g.DrawEllipse($penRing, ($size * 0.06), ($size * 0.06), ($size * 0.88), ($size * 0.88))

    # Center Nib shape
    $cx = $size / 2.0
    $cy = $size / 2.0
    $w = $size * 0.24
    $h = $size * 0.38

    $p1 = New-Object System.Drawing.PointF $cx, ($cy - $h)
    $p2 = New-Object System.Drawing.PointF ($cx + $w), ($cy - $h * 0.25)
    $p3 = New-Object System.Drawing.PointF ($cx + $w * 0.55), ($cy + $h * 0.75)
    $p4 = New-Object System.Drawing.PointF ($cx - $w * 0.55), ($cy + $h * 0.75)
    $p5 = New-Object System.Drawing.PointF ($cx - $w), ($cy - $h * 0.25)

    $brushNib = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235, 94, 40))
    $points = [System.Drawing.PointF[]]@($p1, $p2, $p3, $p4, $p5)
    $g.FillPolygon($brushNib, $points)

    # Pen slit & breather hole
    $penSplit = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(24, 24, 27)), ([Math]::Max(1.5, $size * 0.025))
    $g.DrawLine($penSplit, $cx, ($cy - $h), $cx, ($cy + $h * 0.2))

    $brushHole = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(254, 243, 199))
    $holeSize = [Math]::Max(3, $size * 0.08)
    $g.FillEllipse($brushHole, ($cx - $holeSize / 2), ($cy + $h * 0.15), $holeSize, $holeSize)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Build-Icon 32 'src-tauri\icons\32x32.png'
Build-Icon 128 'src-tauri\icons\128x128.png'
Build-Icon 256 'src-tauri\icons\128x128@2x.png'
Build-Icon 512 'src-tauri\icons\icon.png'

# Save .ico
$bmp256 = [System.Drawing.Bitmap]::FromFile((Resolve-Path 'src-tauri\icons\128x128@2x.png').Path)
$hIcon = $bmp256.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::OpenWrite((Join-Path (Resolve-Path 'src-tauri\icons').Path 'icon.ico'))
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$bmp256.Dispose()

# Create dummy icns for tauri bundle
Copy-Item 'src-tauri\icons\icon.ico' 'src-tauri\icons\icon.icns' -Force

# Public favicon
if (-not (Test-Path 'public')) {
    New-Item -ItemType Directory -Path 'public' -Force | Out-Null
}
Copy-Item 'src-tauri\icons\32x32.png' 'public\favicon.png' -Force
Copy-Item 'src-tauri\icons\icon.ico' 'public\favicon.ico' -Force

Write-Host "InkWell icons successfully generated in src-tauri\icons and public!"
