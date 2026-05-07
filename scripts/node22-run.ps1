param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("dev", "build", "lint", "preview")]
  [string]$Task
)

if (-not $env:NVM_HOME) {
  Write-Error "NVM_HOME is not set. Ensure nvm for Windows is installed and available."
  exit 1
}

$nodeExe = Join-Path $env:NVM_HOME "v22.22.2\\node.exe"
if (-not (Test-Path $nodeExe)) {
  Write-Error "$nodeExe not found. Run: nvm install 22.22.2"
  exit 1
}

switch ($Task) {
  "dev" {
    & $nodeExe ".\\node_modules\\vite\\bin\\vite.js"
    exit $LASTEXITCODE
  }
  "build" {
    & $nodeExe ".\\node_modules\\typescript\\bin\\tsc" -b
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
    & $nodeExe ".\\node_modules\\vite\\bin\\vite.js" build
    exit $LASTEXITCODE
  }
  "lint" {
    & $nodeExe ".\\node_modules\\eslint\\bin\\eslint.js" .
    exit $LASTEXITCODE
  }
  "preview" {
    & $nodeExe ".\\node_modules\\vite\\bin\\vite.js" preview
    exit $LASTEXITCODE
  }
}
