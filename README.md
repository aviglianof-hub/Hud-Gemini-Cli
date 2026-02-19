# 🚀 Gemini CLI HUD - Advanced Monitoring Extension
*Released under the [F. Avigliano Research Lab License](LICENSE.md)*

## 🌟 What is this?
This is an enhanced version of the official **Google Gemini CLI**, featuring a custom **HUD (Head-Up Display)** built directly into the terminal footer. It provides critical real-time insights that the standard version lacks.

![HUD Preview](./anteprima.jpg)

---

## ✨ Core Algorithmic Features

*   **🧠 Context Protocol (Heuristic Monitor)**
        Implements an algorithmic analysis of token density with predefined risk thresholds (20%/50%/80%) to prevent cognitive degradation and hallucinations.

*   **🔋 Quota Synchronization (Rate-Limit Optimized)**
        Utilizes an intelligent, debounced fetch system to ensure rigorous budget tracking without impacting API rate-limits.

*   **⏳ Reset Predictor**
          Employs a differential timer synchronized with the server's timestamp to calculate the exact moment of resource replenishment (HH:MM:SS).

*   **📊 Session Request Counter**
           Tracks how many API calls you've made in the current session.

---

## 🛠 Installation (Local Dev)
1. Clone this repo.
2. Run `npm install`.
3. Start the lab version: `node dist/index.js`

---

## 🚧 Current Limitations & Roadmap
The main challenge currently is the **Real-time Sync Lag**. 
The UI updates with a 3-second debounce to avoid API rate-limiting, but we want to implement a **Local Token Estimator** to show instant budget drops before the server confirms them.

---

 ## 🔬 Research & Development
 This project is an autonomous personal research laboratory. To maintain the architectural integrity and algorithmic rigor of the research, **external contributions (Pull Requests) or proposals are not accepted.**
 
 All identified technical challenges are resolved internally based on real-world operational needs. The **Issues** section may be used exclusively for reporting critical bugs or technical malfunctions in the current implementation.
 
 *Thank you for respecting the independent nature of this research.*

---
*Built upon the original [Google Gemini CLI](https://github.com/google-gemini/gemini-cli)*
