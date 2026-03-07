@echo off
:: Gemini CLI HUD Launcher — runs gemini with HUD injected via ESM hook
:: Original CLI files are NEVER modified.
setlocal

set "HUD_DIR=%~dp0"
set "REGISTER=%HUD_DIR%register.mjs"

:: Convert backslashes to forward slashes for file:// URL
set "REGISTER_URL=%REGISTER:\=/%"

:: Find node
set "_prog=node"
for /f "delims=" %%i in ('where node 2^>nul') do set "_prog=%%i"

:: Find gemini CLI entry point
for /f "delims=" %%i in ('npm root -g 2^>nul') do set "NPM_GLOBAL=%%i"
set "GEMINI_ENTRY=%NPM_GLOBAL%\@google\gemini-cli\dist\index.js"

if not exist "%GEMINI_ENTRY%" (
    echo [HUD] ERROR: Cannot find Gemini CLI at %GEMINI_ENTRY%
    echo [HUD] Make sure @google/gemini-cli is installed globally.
    exit /b 1
)

:: Launch with ESM loader hook
"%_prog%" --no-warnings=DEP0040 --import "file:///%REGISTER_URL%" "%GEMINI_ENTRY%" %*
