$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$fontDir = Join-Path $root 'src\assets\fonts'
$iconDir = Join-Path $root 'src\assets\icons'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

$families = @(
  @{ name='geist';       url='https://fonts.googleapis.com/css2?family=Geist:wght@300..700&display=swap' },
  @{ name='geist-mono';  url='https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..600&display=swap' },
  @{ name='source-serif';url='https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..600&display=swap' }
)

$out = @()
$out += '/* Self-hosted webfonts. Sources: Google Fonts (Geist, Geist Mono - OFL; Source Serif 4 - OFL). */'

foreach ($f in $families) {
  $css = (Invoke-WebRequest -Uri $f.url -Headers @{'User-Agent'=$ua} -UseBasicParsing -TimeoutSec 40).Content
  # split into @font-face blocks
  $blocks = [regex]::Matches($css, '(?s)/\*\s*([a-z0-9\-\[\]]+)\s*\*/\s*@font-face\s*\{(.*?)\}')
  $i = 0
  foreach ($b in $blocks) {
    $subset = $b.Groups[1].Value
    $body   = $b.Groups[2].Value
    if ($subset -ne 'latin' -and $subset -ne 'latin-ext') { continue }
    $m = [regex]::Match($body, "url\((https://fonts\.gstatic\.com/[^)]+)\)")
    if (-not $m.Success) { continue }
    $srcUrl = $m.Groups[1].Value
    $file = "$($f.name)-$subset-$i.woff2"
    $i++
    Invoke-WebRequest -Uri $srcUrl -OutFile (Join-Path $fontDir $file) -UseBasicParsing -TimeoutSec 60
    $newBody = $body -replace "url\(https://fonts\.gstatic\.com/[^)]+\)", "url(../assets/fonts/$file)"
    $out += "/* $($f.name) $subset */"
    $out += "@font-face {$newBody}"
    Write-Host "saved $file"
  }
}

Set-Content -Path (Join-Path $root 'src\css\fonts.css') -Value ($out -join "`n") -Encoding utf8

# Phosphor icon fonts (regular + fill), official @phosphor-icons/web package
$ph = @(
  @{ f='Phosphor.woff2';      u='https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/Phosphor.woff2' },
  @{ f='Phosphor-Fill.woff2'; u='https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/fill/Phosphor-Fill.woff2' }
)
foreach ($p in $ph) { Invoke-WebRequest -Uri $p.u -OutFile (Join-Path $iconDir $p.f) -UseBasicParsing -TimeoutSec 60; Write-Host "saved $($p.f)" }

foreach ($s in @('regular','fill')) {
  $c = (Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/$s/style.css" -UseBasicParsing -TimeoutSec 60).Content
  $c = $c -replace '\.\./\.\./assets/', '../assets/icons/'
  $c = $c -replace 'url\("([^"]*?)([A-Za-z\-]+\.woff2)"\)', 'url("../assets/icons/$2")'
  $c = $c -replace "url\('([^']*?)([A-Za-z\-]+\.woff2)'\)", 'url("../assets/icons/$2")'
  Set-Content -Path (Join-Path $root "src\css\phosphor-$s.css") -Value $c -Encoding utf8
  Write-Host "wrote phosphor-$s.css"
}
Write-Host "DONE"
