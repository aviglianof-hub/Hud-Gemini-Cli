# Gemini CLI HUD - Observability Extension

[![License](https://img.shields.io/github/license/aviglianof-hub/Hud-Gemini-Cli)](https://github.com/aviglianof-hub/Hud-Gemini-Cli/blob/main/LICENSE.md)

## What is this?

In LLM-based workflows, context saturation is the primary cause of unpredictable behavior and hallucinations. The official Google Gemini CLI provides no visibility into this risk during an active session.

**Hud-Gemini-Cli** is an observability layer for the Google Gemini CLI. It monitors critical session variables — context usage, remaining API quota, and request rate — and displays them directly in the terminal footer, updating on every request.

**v2.0 — Standalone Module**: implemented via Node.js ESM Loader Hooks as a runtime inspection layer. **Original CLI files are never modified.** Survives CLI updates without reinstalling.

![HUD Preview](./anteprima.jpg)

**What you'll see in the footer bar:**
```
~\Desktop  no sandbox (see /docs)  /model gemini-2.5-pro-preview CTX:0.0% | Pro:92% (14:30:00) Req:3
```

---

## Why use it?

| Area | Benefit |
| :--- | :--- |
| **Application Reliability** | CTX monitoring with fixed risk thresholds at 20% / 50% / 80% signals progressive context saturation before it compromises response coherence. |
| **Cost Management** | Remaining API quota (Pro/Flash) is always visible — the native CLI hides it above 20%. Precise consumption control without opening the dashboard. |
| **Operational Continuity** | The integrated reset timer provides visibility on the exact time to quota restoration, eliminating unexpected session interruptions. |
| **Zero Overhead** | Passive observer: reads data already produced by the CLI. **AI tokens generated: 0. Additional LLM calls: 0.** Additional network traffic: at most 3 lightweight quota-check calls at session startup (at 2s, 8s, 20s), only if native quota data is not yet available — none thereafter. The countdown timer is pure local computation (`setInterval` 1s). |

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Context Window (CTX)** | Per-request context window usage with fixed risk thresholds at 20% / 50% / 80%. Color-coded: green → yellow → orange → red + hallucination warning. |
| **Budget Tracker (Pro/Flash)** | Always-visible quota percentage. Native CLI hides it above 20%. Auto-detects Pro vs Flash model. |
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

   **Option A — From any terminal (recommended for developers):**
   ```
   gemini-hud
   ```

   **Option B — Double-click launcher (no terminal needed):**

   A `launch.bat` file is included in the repository root. You can double-click it directly, or copy it anywhere on your system (Desktop, taskbar, etc.). It automatically locates the HUD module and starts the CLI.

   > `launch.bat` does not need to stay in the repo folder — it resolves paths dynamically.

### Uninstall

To remove the `gemini-hud` global command:
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
                          (CTX, Budget, Timer, Req counter)
```

**Key files in `hud-module/`:**

| File | Purpose |
|------|---------|
| `register.mjs` | Entry point for `--import`, registers the loader hook |
| `loader.mjs` | Intercepts `Footer.js` imports from the CLI and serves our version |
| `hud-footer.mjs` | The HUD Footer component (CTX, Budget, Timer, Request count) |

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

Autonomous independent research by **F. Avigliano**. This project does not accept Pull Requests or external contributions.

For the research protocol and collaboration policies: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## Support the Lab

If you find this work useful, you can support the research:

- **One-time** — [PayPal](https://paypal.me/aviglianofhub)
- **Monthly** — GitHub Sponsors *(coming soon)*

---

*Built upon the original [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) — Apache 2.0 License*
