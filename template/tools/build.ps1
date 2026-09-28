# Gera os instaladores de Windows (NSIS e MSI).
# Mensagens sem acento de proposito: o Windows PowerShell 5.1 le arquivo UTF-8 sem BOM como ANSI.
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
  Write-Host "Falta o Rust. Instale com:" -ForegroundColor Yellow
  Write-Host "  winget install --id Rustlang.Rustup"
  Write-Host "Depois abra um terminal novo e rode este script de novo."
  exit 1
}

$hasCli = (& cargo tauri --version) 2>$null
if (-not $?) {
  Write-Host "Instalando a CLI do Tauri (so na primeira vez)..." -ForegroundColor Cyan
  cargo install tauri-cli --version "^2.0" --locked
}

# O script de build do Tauri le tauri.conf.json com serde_json, que recusa BOM
# ("expected value at line 1 column 1"). Editores do Windows costumam gravar com BOM.
$utf8 = New-Object System.Text.UTF8Encoding($false)
Get-ChildItem (Join-Path $root 'src-tauri') -Recurse -Include *.json, *.rs, *.toml |
  Where-Object { $_.FullName -notmatch '\\target\\' } | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
      [System.IO.File]::WriteAllText($_.FullName, [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3), $utf8)
      Write-Host "BOM removido: $($_.Name)"
    }
  }

Set-Location $root
cargo tauri build
# cargo escreve progresso em stderr: o PowerShell pinta de vermelho mesmo em sucesso. Vale o exit code.
if ($LASTEXITCODE -ne 0) { Write-Host "Falhou (exit $LASTEXITCODE)." -ForegroundColor Red; exit $LASTEXITCODE }

$bundle = Join-Path $root 'src-tauri\target\release\bundle'
if (Test-Path $bundle) {
  Write-Host ""
  Write-Host "Instaladores gerados em:" -ForegroundColor Green
  Get-ChildItem $bundle -Recurse -Include *.exe, *.msi | ForEach-Object { Write-Host "  $($_.FullName)" }
}
