@echo off
chcp 65001 >nul 2>&1
title Gemini CLI HUD - Installer v2.0
echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║      Gemini CLI HUD - Installer v2.0                     ║
echo  ║      Standalone Module (survives CLI updates)             ║
echo  ║      by F. Avigliano Research Lab                        ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: ============================================================
:: 1. Verify hud-module files exist
:: ============================================================
set "SCRIPT_DIR=%~dp0"
set "HUD_DIR=%SCRIPT_DIR%hud-module\"

if not exist "%HUD_DIR%register.mjs" (
    echo  [ERROR] hud-module\register.mjs not found!
    echo  Make sure you run this script from the repository root.
    goto :fail
)
if not exist "%HUD_DIR%loader.mjs" (
    echo  [ERROR] hud-module\loader.mjs not found!
    goto :fail
)
if not exist "%HUD_DIR%hud-footer.mjs" (
    echo  [ERROR] hud-module\hud-footer.mjs not found!
    goto :fail
)
echo  [OK] All HUD module files found.

:: ============================================================
:: 2. Verify Node.js and Gemini CLI
:: ============================================================
echo.
echo  Checking prerequisites...

node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found! Install Node.js v20+.
    goto :fail
)
for /f "delims=" %%v in ('node --version 2^>nul') do set "NODE_VERSION=%%v"
echo  [OK] Node.js %NODE_VERSION%

for /f "delims=" %%i in ('npm root -g 2^>nul') do set "NPM_GLOBAL=%%i"
set "GEMINI_ENTRY=%NPM_GLOBAL%\@google\gemini-cli\dist\index.js"

if not exist "%GEMINI_ENTRY%" (
    echo  [ERROR] Gemini CLI not found! Install it first:
    echo          npm install -g @google/gemini-cli
    goto :fail
)

for /f "delims=" %%v in ('node -e "try{console.log(require('%NPM_GLOBAL:\=/%/@google/gemini-cli/dist/package.json').version)}catch(e){console.log('unknown')}" 2^>nul') do set "CLI_VERSION=%%v"
echo  [OK] Gemini CLI v%CLI_VERSION%

:: ============================================================
:: 3. Build file:// URL for register.mjs
:: ============================================================
set "REGISTER_PATH=%HUD_DIR%register.mjs"
set "REGISTER_URL=%REGISTER_PATH:\=/%"

:: ============================================================
:: 4. Install gemini-hud launcher to npm global bin
:: ============================================================
echo.
for /f "delims=" %%i in ('npm prefix -g 2^>nul') do set "NPM_PREFIX=%%i"

echo  Installing launcher to: %NPM_PREFIX%

:: Write .cmd launcher
(
echo @echo off
echo setlocal
echo set "_prog=node"
echo for /f "delims=" %%%%i in ^('where node 2^^^>nul'^) do set "_prog=%%%%i"
echo "%%_prog%%" --no-warnings=DEP0040 --import "file:///%REGISTER_URL%" "%GEMINI_ENTRY%" %%*
) > "%NPM_PREFIX%\gemini-hud.cmd"

if errorlevel 1 (
    echo  [ERROR] Failed to write gemini-hud.cmd. Try running as Administrator.
    goto :fail
)
echo  [OK] gemini-hud.cmd installed.

:: Write .ps1 launcher
(
echo #!/usr/bin/env pwsh
echo $exe = ""
echo if ^($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows^) { $exe = ".exe" }
echo $nodeProg = "node$exe"
echo ^& $nodeProg --no-warnings=DEP0040 --import "file:///%REGISTER_URL%" "%GEMINI_ENTRY%" @args
echo exit $LASTEXITCODE
) > "%NPM_PREFIX%\gemini-hud.ps1"
echo  [OK] gemini-hud.ps1 installed.

:: ============================================================
:: 5. Restore original Footer.js if previously patched (v1.0 cleanup)
:: ============================================================
set "FOOTER_PATH=%NPM_GLOBAL%\@google\gemini-cli\dist\src\ui\components\Footer.js"
set "BACKUP_PATH=%NPM_GLOBAL%\@google\gemini-cli\dist\src\ui\components\Footer.js.original"

if exist "%BACKUP_PATH%" (
    echo.
    echo  [CLEANUP] Found old v1.0 patch backup. Restoring original Footer.js...
    copy /y "%BACKUP_PATH%" "%FOOTER_PATH%" >nul
    del "%BACKUP_PATH%" >nul 2>&1
    echo  [OK] Original Footer.js restored. Old patch removed.
)

:: ============================================================
:: 6. Quick test
:: ============================================================
echo.
echo  Running quick test...
node --no-warnings=DEP0040 --import "file:///%REGISTER_URL%" -e "console.log('[HUD] ESM loader hook OK')" 2>nul
if errorlevel 1 (
    echo  [WARN] Quick test failed. The HUD may not work correctly.
    echo  Check Node.js version is v20+.
) else (
    echo  [OK] ESM loader hook verified.
)

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║  Installation complete!                                   ║
echo  ║                                                           ║
echo  ║  Usage:  gemini-hud                                       ║
echo  ║                                                           ║
echo  ║  How it works:                                            ║
echo  ║  - Runs Gemini CLI with HUD injected at runtime           ║
echo  ║  - Original CLI files are NEVER modified                  ║
echo  ║  - CLI updates will NOT break the HUD                     ║
echo  ║                                                           ║
echo  ║  You'll see in the footer bar:                            ║
echo  ║    CTX:X.X%% ^| Pro:XX%% (HH:MM:SS) Req:N                 ║
echo  ║                                                           ║
echo  ║  To uninstall: uninstall.bat                              ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.
pause
exit /b 0

:cancel
echo.
echo  Installation cancelled.
pause
exit /b 0

:fail
echo.
echo  Installation failed.
pause
exit /b 1
