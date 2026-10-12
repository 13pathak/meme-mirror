param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$appUrl = 'http://127.0.0.1:4173'
function Get-AppHealth {
  try { return Invoke-RestMethod -Uri "$appUrl/health" -TimeoutSec 2 } catch { return $null }
}
try {
  Set-Location -LiteralPath $projectRoot
  $nodeVersion = & node -p 'parseInt(process.versions.node)'
  if ([int]$nodeVersion -lt 22) { throw 'Install Node.js 22 or newer.' }
  $health = Get-AppHealth
  if ($health -and ($health.app -ne 'meme-mirror' -or $health.root -ne (Join-Path $projectRoot 'public'))) { throw 'Port 4173 belongs to another application or another Meme Mirror folder. Stop that server first.' }
  if (-not $health) {
    & node (Join-Path $PSScriptRoot 'check-assets.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Local files are missing or damaged. First-time setup: npm ci, then npm run setup.' }
    $serverPath = Join-Path $PSScriptRoot 'server.mjs'
    $server = Start-Process -FilePath (Get-Command node).Source -ArgumentList ('"' + $serverPath + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'server.log') -RedirectStandardError (Join-Path $projectRoot 'server-error.log') -PassThru
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
      Start-Sleep -Milliseconds 300
      $health = Get-AppHealth
      if ($health) { break }
      if ($server.HasExited) { break }
    }
    if (-not $health -or $health.app -ne 'meme-mirror' -or $health.root -ne (Join-Path $projectRoot 'public')) {
      if (Test-Path -LiteralPath (Join-Path $projectRoot 'server-error.log')) { Get-Content -LiteralPath (Join-Path $projectRoot 'server-error.log') }
      throw 'Server did not start. Port 4173 may be busy. See server-error.log.'
    }
    Set-Content -LiteralPath (Join-Path $projectRoot '.server-pid') -Value $server.Id
  }
  $chromeCandidates = @((Join-Path ${env:ProgramFiles} 'Google\Chrome\Application\chrome.exe'), (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'), (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'))
  $chromePath = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if (-not $NoBrowser) {
    if ($chromePath) { Start-Process -FilePath $chromePath -ArgumentList $appUrl }
    else { Write-Host 'Chrome was not found. Opening your default browser; Chrome is the supported target.'; Start-Process $appUrl }
  }
  Write-Host "Meme Mirror is running at $appUrl. Use Stop Meme Mirror.bat when finished."
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
