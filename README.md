# Gemini CLI HUD - Advanced Monitoring Extension

[![License](https://img.shields.io/github/license/aviglianof-hub/Hud-Gemini-Cli)](https://github.com/aviglianof-hub/Hud-Gemini-Cli/blob/main/LICENSE.md)

## What is this?

A custom **HUD (Head-Up Display)** for the official [Google Gemini CLI](https://github.com/google-gemini/gemini-cli), built directly into the terminal footer. It provides **critical real-time insights** that the standard version lacks.

**v2.0 — Standalone Module**: uses Node.js ESM Loader Hooks to inject the HUD at runtime. **Original CLI files are never modified.** Survives CLI updates without reinstalling.

![HUD Preview](./anteprima.jpg)

**What you'll see in the footer bar:**
```
~\Desktop  no sandbox (see /docs)  /model gemini-3-pro-preview RAM:0.0% | Pro:92% (14:30:00) Req:3
```

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Context Monitor (RAM)** | Algorithmic analysis of token density with risk thresholds at 20% / 50% / 80%. Color-coded: green, yellow, orange, red + hallucination warning. |
| **Budget Tracker (Pro/Flash)** | Real-time quota percentage. Always visible (native CLI hides it above 20%). Detects Pro vs Flash automatically. |
| **Reset Countdown** | Live `HH:MM:SS` timer showing exactly when your quota resets. |
| **Request Counter** | Tracks API calls made in the current session. |
| **Debug Hook** | Exposes all data to `globalThis.GEMINI_HUD_DATA` for external tools. |

---

## Installation (Windows)

### Prerequisites
- [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) installed globally (`npm install -g @google/gemini-cli`)
- [Node.js](https://nodejs.org/) (v20+)

### Quick Install

1. **Download** this repository:
   ```
   git clone https://github.com/aviglianof-hub/Hud-Gemini-Cli.git
   ```
2. **Run the installer:**
   ```
   cd Hud-Gemini-Cli
   install.bat
   ```
3. The script will:
   - Auto-detect your Gemini CLI installation
   - Install the `gemini-hud` launcher command
   - Verify the ESM loader hook works
   - Clean up any old v1.0 patch if present

4. **Launch with HUD:**
   ```
   gemini-hud
   ```

### Uninstall

To remove the HUD launcher:
```
uninstall.bat
```

The original `gemini` command is **never modified** and always works normally.

---

## How It Works (v2.0)

Unlike v1.0 which modified CLI files directly, v2.0 uses **Node.js ESM Loader Hooks** — a runtime module interception system.

```
gemini-hud
    |
    v
node --import register.mjs      <-- registers as ESM interceptor
    |
    v
Gemini CLI starts normally
    |
    v
CLI loads Footer.js  --->  loader.mjs intercepts it
                                |
                                v
                          hud-footer.mjs   <-- our enhanced Footer
                          (RAM, Budget, Timer, Req counter)
```

**Key files in `hud-module/`:**

| File | Purpose |
|------|---------|
| `register.mjs` | Entry point for `--import`, registers the loader hook |
| `loader.mjs` | Intercepts `Footer.js` imports from the CLI and serves our version |
| `hud-footer.mjs` | The HUD Footer component (RAM, Budget, Timer, Request count) |

**Why this survives CLI updates:**
- `npm update -g @google/gemini-cli` only rewrites files inside `node_modules/@google/gemini-cli/`
- Our module lives in a separate folder — completely independent
- The ESM hook intercepts at runtime — the original `Footer.js` is never touched on disk

### Compatibility
| Gemini CLI Version | HUD Status |
|-------------------|------------|
| v0.32.x | Tested & Working |
| v0.30.x+ | Should work (same component structure) |

---

## After a Gemini CLI update

**Nothing to do.** The HUD module is independent. Just keep using `gemini-hud`.

If a major CLI refactor changes the Footer.js component structure, update `hud-module/hud-footer.mjs` accordingly.

---

## Research & Development

This project is an autonomous personal research laboratory by **F. Avigliano**. To maintain the architectural integrity and algorithmic rigor of the research, **external contributions (Pull Requests) or proposals are not accepted.**

The **Issues** section may be used exclusively for reporting critical bugs or technical malfunctions in the current implementation.

*Thank you for respecting the independent nature of this research.*

If you find this work useful, you can support the lab: [PayPal](https://paypal.me/aviglianofhub)

---

*Built upon the original [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) — Apache 2.0 License*
