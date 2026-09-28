# Gera os ícones do app (PNG + ICO multirresolução) sem dependência externa.
# Desenha um monograma sobre um quadrado arredondado na cor de destaque do projeto.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1 -Accent "#8A1538" -Glyph "Bm"
#
# -Accent deve ser a MESMA cor de --accent em src/css/tokens.css.
# -Glyph  1 ou 2 caracteres (iniciais da matéria).
param(
  [string]$Accent = "#8A1538",
  [string]$Glyph  = "M"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\src-tauri\icons'
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Force -Path $out | Out-Null }

function ToColor([string]$hex) {
  $h = $hex.TrimStart('#')
  [System.Drawing.Color]::FromArgb(255,
    [Convert]::ToInt32($h.Substring(0,2),16),
    [Convert]::ToInt32($h.Substring(2,2),16),
    [Convert]::ToInt32($h.Substring(4,2),16))
}

function Darken([System.Drawing.Color]$c, [double]$f) {
  [System.Drawing.Color]::FromArgb(255, [int]($c.R*$f), [int]($c.G*$f), [int]($c.B*$f))
}

$base  = ToColor $Accent
$deep  = Darken $base 0.72
$ivory = [System.Drawing.Color]::FromArgb(255, 250, 246, 244)

function New-Icon([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::Transparent)

  # quadrado arredondado com degradê
  $r = [Math]::Max(2, [int]($size * 0.22)); $d = $r * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($size - $d, 0, $d, $d, 270, 90)
  $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
  $path.AddArc(0, $size - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0,0)), (New-Object System.Drawing.Point($size,$size)), $base, $deep)
  $g.FillPath($brush, $path)

  # monograma centralizado
  if ($Glyph.Length -ge 2) { $ratio = 0.40 } else { $ratio = 0.52 }
  $fontSize = [single]($size * $ratio)
  $font = New-Object System.Drawing.Font("Segoe UI Semibold", $fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $fill = New-Object System.Drawing.SolidBrush($ivory)
  $rect = New-Object System.Drawing.RectangleF(0, [single]($size * 0.02), [single]$size, [single]$size)
  $g.DrawString($Glyph, $font, $fill, $rect, $fmt)

  $g.Dispose(); $brush.Dispose(); $path.Dispose(); $font.Dispose(); $fill.Dispose(); $fmt.Dispose()
  return $bmp
}

# --- PNG ---
$pngs = @{ '32x32.png' = 32; '128x128.png' = 128; '128x128@2x.png' = 256; 'icon.png' = 512 }
foreach ($k in $pngs.Keys) {
  $b = New-Icon $pngs[$k]
  $b.Save((Join-Path $out $k), [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose()
  Write-Host "icone $k"
}

# --- ICO multirresolução (entradas DIB 32 bpp) ---
$entries = @()
foreach ($s in @(16, 24, 32, 48, 64, 128, 256)) {
  $b = New-Icon $s
  $stride = $s * 4
  $pixels = New-Object byte[] ($stride * $s)
  for ($y = 0; $y -lt $s; $y++) {           # DIB é armazenado de baixo para cima
    for ($x = 0; $x -lt $s; $x++) {
      $c = $b.GetPixel($x, $s - 1 - $y); $o = $y * $stride + $x * 4
      $pixels[$o]=$c.B; $pixels[$o+1]=$c.G; $pixels[$o+2]=$c.R; $pixels[$o+3]=$c.A
    }
  }
  $maskStride = [int](([Math]::Floor(($s + 31) / 32)) * 4)
  $mask = New-Object byte[] ($maskStride * $s)   # zeros = opaco

  $ms = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter($ms)
  $bw.Write([uint32]40); $bw.Write([int32]$s); $bw.Write([int32]($s * 2))
  $bw.Write([uint16]1); $bw.Write([uint16]32); $bw.Write([uint32]0)
  $bw.Write([uint32]($pixels.Length + $mask.Length))
  $bw.Write([int32]0); $bw.Write([int32]0); $bw.Write([uint32]0); $bw.Write([uint32]0)
  $bw.Write($pixels); $bw.Write($mask); $bw.Flush()
  $entries += ,@{ size = $s; data = $ms.ToArray() }
  $bw.Dispose(); $ms.Dispose(); $b.Dispose()
}

$fs = [System.IO.File]::Create((Join-Path $out 'icon.ico'))
$w = New-Object System.IO.BinaryWriter($fs)
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$entries.Count)
$offset = 6 + 16 * $entries.Count
foreach ($e in $entries) {
  $dim = if ($e.size -ge 256) { 0 } else { $e.size }
  $w.Write([byte]$dim); $w.Write([byte]$dim); $w.Write([byte]0); $w.Write([byte]0)
  $w.Write([uint16]1); $w.Write([uint16]32)
  $w.Write([uint32]$e.data.Length); $w.Write([uint32]$offset)
  $offset += $e.data.Length
}
foreach ($e in $entries) { $w.Write($e.data) }
$w.Flush(); $w.Dispose(); $fs.Dispose()
Write-Host "icone icon.ico ($($entries.Count) resolucoes)"

Copy-Item (Join-Path $out '32x32.png') (Join-Path $PSScriptRoot '..\src\assets\favicon.png') -Force
Write-Host "DONE"
