@echo off
chcp 65001 >nul 2>&1
title Gemini CLI HUD - Installer
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║      🚀 Gemini CLI HUD - Installer v1.0                ║
echo  ║      Advanced Monitoring Extension                      ║
echo  ║      by F. Avigliano Research Lab                       ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ============================================================
:: 1. Verify patches/Footer.js exists (relative to this script)
:: ============================================================
set "SCRIPT_DIR=%~dp0"
set "PATCH_FILE=%SCRIPT_DIR%patches\Footer.js"

if not exist "%PATCH_FILE%" (
    echo  [ERROR] patches\Footer.js not found!
    echo  Make sure you run this script from the repository folder.
    echo  Expected: %PATCH_FILE%
    goto :fail
)
echo  [OK] Patch file found.

:: ============================================================
:: 2. Detect global Gemini CLI installation
:: ============================================================
echo.
echo  Searching for Gemini CLI installation...

:: Method 1: npm root -g
for /f "delims=" %%i in ('npm root -g 2^>nul') do set "NPM_GLOBAL=%%i"

set "CLI_GLOBAL="
if defined NPM_GLOBAL (
    if exist "%NPM_GLOBAL%\@google\gemini-cli\dist\src\ui\components\Footer.js" (
        set "CLI_GLOBAL=%NPM_GLOBAL%\@google\gemini-cli"
    )
)

:: ============================================================
:: 3. Let user choose
:: ============================================================
echo.
if defined CLI_GLOBAL (
    echo  [FOUND] Global installation:
    echo          %CLI_GLOBAL%
    echo.

    :: Check version
    for /f "delims=" %%v in ('node -e "try{console.log(require('%CLI_GLOBAL:\=/%/package.json').version)}catch(e){console.log('unknown')}" 2^>nul') do set "CLI_VERSION=%%v"
    echo  [INFO]  CLI Version: %CLI_VERSION%
    echo.
    echo  ────────────────────────────────────────────────────
    echo   [1] Install HUD to this location (recommended)
    echo   [2] Enter a custom path
    echo   [0] Cancel
    echo  ────────────────────────────────────────────────────
) else (
    echo  [!] No global Gemini CLI found via npm.
    echo.
    echo  ────────────────────────────────────────────────────
    echo   [2] Enter a custom path
    echo   [0] Cancel
    echo  ────────────────────────────────────────────────────
)

echo.
set /p "CHOICE=  Your choice: "

if "%CHOICE%"=="0" goto :cancel
if "%CHOICE%"=="1" (
    if not defined CLI_GLOBAL (
        echo  [ERROR] Option 1 not available - no global CLI found.
        goto :fail
    )
    set "TARGET=%CLI_GLOBAL%"
    goto :install
)
if "%CHOICE%"=="2" goto :custom
echo  [ERROR] Invalid choice.
goto :fail

:custom
echo.
echo  Enter the full path to your @google\gemini-cli folder.
echo  Example: C:\Users\YourName\AppData\Roaming\npm\node_modules\@google\gemini-cli
echo.
set /p "TARGET=  Path: "

if not exist "%TARGET%\dist\src\ui\components\Footer.js" (
    echo.
    echo  [ERROR] Footer.js not found in: %TARGET%\dist\src\ui\components\
    echo  Make sure the path points to the @google\gemini-cli folder.
    goto :fail
)

:: ============================================================
:: 4. Install: Backup + Patch
:: ============================================================
:install
set "FOOTER_PATH=%TARGET%\dist\src\ui\components\Footer.js"
set "BACKUP_PATH=%TARGET%\dist\src\ui\components\Footer.js.original"

echo.
echo  ══════════════════════════════════════════════════════════
echo   Target:  %FOOTER_PATH%
echo  ══════════════════════════════════════════════════════════

:: Backup (only if no backup exists yet — preserve first original)
if not exist "%BACKUP_PATH%" (
    echo.
    echo  [BACKUP] Saving original Footer.js...
    copy /y "%FOOTER_PATH%" "%BACKUP_PATH%" >nul
    if errorlevel 1 (
        echo  [ERROR] Failed to create backup. Check permissions.
        echo  Try running this script as Administrator.
        goto :fail
    )
    echo  [OK] Backup saved: Footer.js.original
) else (
    echo  [INFO] Backup already exists, skipping (preserving first original).
)

:: Patch
echo  [PATCH] Installing HUD Footer...
copy /y "%PATCH_FILE%" "%FOOTER_PATH%" >nul
if errorlevel 1 (
    echo  [ERROR] Failed to copy patch. Check permissions.
    echo  Try running this script as Administrator.
    goto :fail
)

:: Verify
fc /b "%PATCH_FILE%" "%FOOTER_PATH%" >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Verification failed - files don't match!
    goto :fail
)

echo  [OK] HUD installed successfully!
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  ✅ Installation complete!                              ║
echo  ║                                                          ║
echo  ║  Restart your Gemini CLI to see the HUD:                ║
echo  ║    gemini                                                ║
echo  ║                                                          ║
echo  ║  You'll see in the footer bar:                          ║
echo  ║    RAM:X.X%% ^| Pro:XX%% (HH:MM:SS) Req:N               ║
echo  ║                                                          ║
echo  ║  To uninstall, run: uninstall.bat                       ║
echo  ╚══════════════════════════════════════════════════════════╝
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
echo  ❌ Installation failed.
pause
exit /b 1
