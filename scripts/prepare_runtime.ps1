<#
Prepare runtime and model files for packaging.

This helper will attempt to copy a locally installed Ollama (if present)
and instruct where to place pulled models into the project's `bin/` folder
so they are included by the electron-builder `extraResources` setting.

Run as admin if needed.
#>

$ErrorActionPreference = 'Stop'

Write-Host "Preparing runtime files for packaging..."

$dest = Join-Path -Path $PSScriptRoot -ChildPath "..\bin"
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

$ollamaPath = "$Env:ProgramFiles\Ollama\ollama.exe"
if (Test-Path $ollamaPath) {
  Copy-Item -Path $ollamaPath -Destination (Join-Path $dest "ollama.exe") -Force
  Write-Host "Copied ollama.exe to project bin/."
} else {
  Write-Host "No Ollama found in Program Files. Please install Ollama and run 'ollama pull <model>' then copy model files to bin/models/."
}

Write-Host "Ensure any pulled models are copied into 'bin/models/<model-name>' before building the installer."
Write-Host "Example: copy C:\\Users\\<you>\\.ollama\\models\\mistral to $dest\\models\\mistral"
