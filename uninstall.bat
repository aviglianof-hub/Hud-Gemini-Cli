@echo off
chcp 65001 >nul 2>&1
title Gemini CLI HUD - Uninstaller v2.0
echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║      Gemini CLI HUD - Uninstaller v2.0                   ║
echo  ║      Remove HUD launcher                                 ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: ============================================================
:: 1. Remove gemini-hud launcher from npm global bin
:: ============================================================
for /f "delims=" %%i in ('npm prefix -g 2^>nul') do set "NPM_PREFIX=%%i"

echo  Checking: %NPM_PREFIX%
echo.

set "REMOVED=0"

if exist "%NPM_PREFIX%\gemini-hud.cmd" (
    del "%NPM_PREFIX%\gemini-hud.cmd" >nul 2>&1
    if errorlevel 1 (
        echo  [ERROR] Failed to remove gemini-hud.cmd. Try running as Administrator.
    ) else (
        echo  [OK] Removed gemini-hud.cmd
        set "REMOVED=1"
    )
) else (
    echo  [INFO] gemini-hud.cmd not found (already removed or not installed).
)

if exist "%NPM_PREFIX%\gemini-hud.ps1" (
    del "%NPM_PREFIX%\gemini-hud.ps1" >nul 2>&1
    echo  [OK] Removed gemini-hud.ps1
    set "REMOVED=1"
)

:: ============================================================
:: 2. Also clean up any old v1.0 patch if present
:: ============================================================
for /f "delims=" %%i in ('npm root -g 2^>nul') do set "NPM_GLOBAL=%%i"
set "FOOTER_PATH=%NPM_GLOBAL%\@google\gemini-cli\dist\src\ui\components\Footer.js"
set "BACKUP_PATH=%NPM_GLOBAL%\@google\gemini-cli\dist\src\ui\components\Footer.js.original"

if exist "%BACKUP_PATH%" (
    echo.
    echo  [CLEANUP] Found old v1.0 patch backup. Restoring original Footer.js...
    copy /y "%BACKUP_PATH%" "%FOOTER_PATH%" >nul
    del "%BACKUP_PATH%" >nul 2>&1
    echo  [OK] Original Footer.js restored.
    set "REMOVED=1"
)

echo.
if "%REMOVED%"=="1" (
    echo  ╔═══════════════════════════════════════════════════════════╗
    echo  ║  Uninstall complete!                                      ║
    echo  ║                                                           ║
    echo  ║  The 'gemini' command was never modified and works        ║
    echo  ║  as normal. The 'gemini-hud' command has been removed.    ║
    echo  ║                                                           ║
    echo  ║  Note: the hud-module folder is still on disk.            ║
    echo  ║  You can delete it manually or re-run install.bat later.  ║
    echo  ╚═══════════════════════════════════════════════════════════╝
) else (
    echo  Nothing to uninstall. HUD was not installed.
)

echo.
pause
exit /b 0
