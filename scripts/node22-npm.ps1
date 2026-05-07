param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

if (-not $env:NVM_HOME) {
  Write-Error "NVM_HOME is not set. Ensure nvm for Windows is installed and available."
  exit 1
}

$nodeExe = Join-Path $env:NVM_HOME "v22.22.2\\node.exe"
$npmCli = Join-Path $env:NVM_HOME "v22.22.2\\node_modules\\npm\\bin\\npm-cli.js"

if (-not (Test-Path $nodeExe)) {
  Write-Error "$nodeExe not found. Run: nvm install 22.22.2"
  exit 1
}

if (-not (Test-Path $npmCli)) {
  Write-Error "$npmCli not found."
  exit 1
}

# Ensure child processes (tsc, vite, eslint) resolve to Node 22 as well.
$nodeDir = Split-Path $nodeExe -Parent
$env:PATH = "$nodeDir;$env:PATH"

& $nodeExe $npmCli @Args
exit $LASTEXITCODE
