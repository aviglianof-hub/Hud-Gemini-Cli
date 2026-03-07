@echo off
chcp 65001 >nul 2>&1
title Gemini CLI HUD Module — Uninstaller
echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║      Gemini CLI HUD Module — Uninstaller                 ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

for /f "delims=" %%i in ('npm prefix -g 2^>nul') do set "NPM_PREFIX=%%i"

if exist "%NPM_PREFIX%\gemini-hud.cmd" (
    del "%NPM_PREFIX%\gemini-hud.cmd" >nul 2>&1
    echo  [OK] Removed gemini-hud.cmd
) else (
    echo  [INFO] gemini-hud.cmd not found in %NPM_PREFIX%
)

if exist "%NPM_PREFIX%\gemini-hud.ps1" (
    del "%NPM_PREFIX%\gemini-hud.ps1" >nul 2>&1
    echo  [OK] Removed gemini-hud.ps1
)

echo.
echo  HUD module uninstalled.
echo  The 'gemini' command is unaffected (was never modified).
echo  You can delete the hud-module folder if you want.
echo.
pause
exit /b 0
