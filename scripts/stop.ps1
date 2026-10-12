$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $projectRoot '.server-pid'
if (-not (Test-Path -LiteralPath $pidPath)) { Write-Host 'No launcher-owned server found. If you ran npm start, press Ctrl+C in its terminal.'; exit }
$serverId = [int](Get-Content -LiteralPath $pidPath)
$processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $serverId"
$expectedScript = Join-Path $PSScriptRoot 'server.mjs'
if ($processInfo -and $processInfo.Name -eq 'node.exe' -and $processInfo.CommandLine.Contains($expectedScript)) {
  Stop-Process -Id $serverId
  Write-Host 'Meme Mirror server stopped.'
} else { Write-Host 'That server is no longer running. No other process was stopped.' }
Remove-Item -LiteralPath $pidPath
