# Confere os requisitos e abre o aplicativo em modo de desenvolvimento.
# Mensagens sem acento de proposito: o Windows PowerShell 5.1 le arquivo UTF-8 sem BOM como ANSI.
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')

function Test-Tool($name, $hint) {
  if (Get-Command $name -ErrorAction SilentlyContinue) { return $true }
  Write-Host "Falta '$name'." -ForegroundColor Yellow
  Write-Host "  $hint" -ForegroundColor Yellow
  return $false
}

$ok = $true
if (-not (Test-Tool 'cargo' 'winget install --id Rustlang.Rustup   (e abra um terminal novo)')) { $ok = $false }

if ($ok) {
  $hasCli = (& cargo tauri --version) 2>$null
  if (-not $?) {
    Write-Host "Instalando a CLI do Tauri (so na primeira vez)..." -ForegroundColor Cyan
    cargo install tauri-cli --version "^2.0" --locked
  }
}

if (-not $ok) {
  Write-Host ""
  Write-Host "Enquanto isso, da para ver o aplicativo no navegador:" -ForegroundColor Cyan
  Write-Host "  powershell -ExecutionPolicy Bypass -File tools\serve.ps1"
  exit 1
}

Set-Location $root
cargo tauri dev
