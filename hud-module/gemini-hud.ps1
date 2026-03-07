#!/usr/bin/env pwsh
# Gemini CLI HUD Launcher — runs gemini with HUD injected via ESM hook
# Original CLI files are NEVER modified.

$basedir = Split-Path $MyInvocation.MyCommand.Definition -Parent
$registerPath = Join-Path $basedir "register.mjs"
# Convert to file:// URL (Windows requires this for --import)
$registerUrl = "file:///" + ($registerPath -replace '\\', '/')

$exe = ""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
    $exe = ".exe"
}

# Find gemini CLI
$npmRoot = (npm root -g 2>$null)
$geminiEntry = Join-Path $npmRoot "@google\gemini-cli\dist\index.js"

if (-not (Test-Path $geminiEntry)) {
    Write-Host "[HUD] ERROR: Cannot find Gemini CLI at $geminiEntry"
    Write-Host "[HUD] Make sure @google/gemini-cli is installed globally."
    exit 1
}

$nodeProg = "node$exe"
if (Test-Path "$basedir/node$exe") {
    $nodeProg = "$basedir/node$exe"
}

& $nodeProg --no-warnings=DEP0040 --import $registerUrl $geminiEntry @args
exit $LASTEXITCODE
