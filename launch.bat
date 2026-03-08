@echo off
title Gemini CLI + HUD

:: ============================================================
:: Gemini CLI HUD — Launcher
:: Double-click this file or run it from terminal to start
:: the Gemini CLI with the HUD observability layer active.
:: ============================================================

:: Resolve path to this file's directory (repo root)
set "REPO_DIR=%~dp0"
set "HUD_REGISTER=%REPO_DIR%hud-module\register.mjs"
set "HUD_URL=%HUD_REGISTER:\=/%"

:: Check if HUD module is present
if not exist "%HUD_REGISTER%" (
    echo [ERROR] HUD module not found. Run install.bat first.
    pause
    exit /b 1
)

:: Check if Gemini CLI is installed globally
where gemini >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Gemini CLI not found. Install it first:
    echo         npm install -g @google/gemini-cli
    pause
    exit /b 1
)

:: Resolve global Gemini CLI entry point
for /f "delims=" %%i in ('npm root -g 2^>nul') do set "NPM_GLOBAL=%%i"
set "CLI_ENTRY=%NPM_GLOBAL%\@google\gemini-cli\dist\index.js"
if not exist "%CLI_ENTRY%" (
    echo [ERROR] Cannot locate Gemini CLI entry point.
    echo         Expected: %CLI_ENTRY%
    pause
    exit /b 1
)

:: Launch Gemini CLI with HUD loader hook
node --no-warnings=DEP0040 --import "file:///%HUD_URL%" "%CLI_ENTRY%"
