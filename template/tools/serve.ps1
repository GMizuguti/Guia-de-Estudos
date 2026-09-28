# Servidor estático mínimo para pré-visualizar src/ sem Node nem Python.
# Uso:  powershell -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 5177]
param([int]$Port = 5177)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\src')

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.woff2'= 'font/woff2'
  '.woff' = 'font/woff'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Servindo $root em http://localhost:$Port/"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    # Uma requisição com erro (HEAD, cliente que desconectou) não pode derrubar o servidor.
    try {
      $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
      $path = Join-Path $root $rel
      $isHead = $ctx.Request.HttpMethod -eq 'HEAD'

      if (Test-Path $path -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($path).ToLower()
        $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $ctx.Response.Headers.Add('Cache-Control', 'no-store')
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $ctx.Response.ContentLength64 = $bytes.Length
        if (-not $isHead) { $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) }
      } else {
        $ctx.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 $rel")
        if (-not $isHead) { $ctx.Response.OutputStream.Write($msg, 0, $msg.Length) }
      }
    } catch {
      Write-Host "Erro ao servir $($ctx.Request.Url): $($_.Exception.Message)"
    } finally {
      try { $ctx.Response.OutputStream.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
