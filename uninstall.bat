@echo off
chcp 65001 >nul 2>&1
title Gemini CLI HUD - Uninstaller
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║      🔄 Gemini CLI HUD - Uninstaller                   ║
echo  ║      Restore original Footer                            ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ============================================================
:: 1. Detect global Gemini CLI installation
:: ============================================================
for /f "delims=" %%i in ('npm root -g 2^>nul') do set "NPM_GLOBAL=%%i"

set "CLI_GLOBAL="
if defined NPM_GLOBAL (
    if exist "%NPM_GLOBAL%\@google\gemini-cli\dist\src\ui\components\Footer.js.original" (
        set "CLI_GLOBAL=%NPM_GLOBAL%\@google\gemini-cli"
    )
)

if defined CLI_GLOBAL (
    echo  [FOUND] Installation with backup:
    echo          %CLI_GLOBAL%
    echo.
    set "TARGET=%CLI_GLOBAL%"
    goto :confirm
) else (
    echo  [!] No backup found in global CLI path.
    echo.
    echo  Enter the full path to your @google\gemini-cli folder:
    set /p "TARGET=  Path: "
)

if not exist "%TARGET%\dist\src\ui\components\Footer.js.original" (
    echo.
    echo  [ERROR] No backup file (Footer.js.original) found in:
    echo          %TARGET%\dist\src\ui\components\
    echo  Cannot restore without backup.
    goto :fail
)

:confirm
echo  This will restore the original Footer.js and remove the HUD.
set /p "CONFIRM=  Continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" goto :cancel

set "FOOTER_PATH=%TARGET%\dist\src\ui\components\Footer.js"
set "BACKUP_PATH=%TARGET%\dist\src\ui\components\Footer.js.original"

copy /y "%BACKUP_PATH%" "%FOOTER_PATH%" >nul
if errorlevel 1 (
    echo  [ERROR] Failed to restore. Check permissions.
    goto :fail
)

del "%BACKUP_PATH%" >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  ✅ Original Footer restored!                           ║
echo  ║  Restart your Gemini CLI to apply.                      ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
pause
exit /b 0

:cancel
echo.
echo  Uninstall cancelled.
pause
exit /b 0

:fail
echo.
echo  ❌ Uninstall failed.
pause
exit /b 1
