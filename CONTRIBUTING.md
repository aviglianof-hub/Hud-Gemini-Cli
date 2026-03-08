# Research Protocol — F. Avigliano Lab

This project is an **independent personal research laboratory**. It is not a community-driven project.

---

## Bug Reports

The **Issues** section may be used exclusively for reporting critical bugs or technical malfunctions in the current implementation.

When reporting a bug, include:
- Gemini CLI version (`gemini --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior

---

## External Contributions

To maintain the architectural integrity and algorithmic rigor of this research, **external Pull Requests are not accepted.**

Any modification, feature proposal, or refactor submitted without prior authorization will be closed without review.

---

## Commissioned Work

The lab evaluates external development requests on a selective basis. Proposals are assessed for compatibility with the active research direction before any commitment is made.

To submit a proposal:
1. Open a new Issue with the label `[commission]`
2. Describe the objective, scope, and context of the request
3. The lab will respond if the proposal is deemed compatible

**The lab reserves the right not to respond to requests that fall outside its research scope.** Acceptance is not guaranteed and is entirely at the lab's discretion.

---

## Technical Standards (Internal)

All internal commits follow [Conventional Commits](https://www.conventionalcommits.org/):
- `fix:` — bug fixes
- `feat:` — new features
- `refactor:` — structural changes
- `docs:` — documentation updates

---

## Project Architecture (v2.0)

The HUD is a **standalone ESM module** (`hud-module/`). When modifying the HUD:
- Edit `hud-module/hud-footer.mjs` — the enhanced Footer component
- Never modify CLI source files directly
- Test with `gemini-hud.cmd` before committing

---

Copyright © 2026 Francesco Avigliano.
*Developed with rigor for the evolution of human control over AI.*


---
---


# Protocollo di Ricerca — Laboratorio F. Avigliano

Questo progetto è un **laboratorio di ricerca personale e indipendente**. Non è un progetto guidato dalla comunità.

---

## Segnalazione Bug

La sezione **Issues** può essere utilizzata esclusivamente per segnalare bug critici o malfunzionamenti tecnici nell'implementazione corrente.

Quando segnali un bug, includi:
- Versione della Gemini CLI (`gemini --version`)
- Sistema operativo
- Passaggi per riprodurre il problema
- Comportamento atteso vs comportamento effettivo

---

## Contributi Esterni

Per mantenere l'integrità architettonica e il rigore algoritmico di questa ricerca, **le Pull Request esterne non sono accettate.**

Qualsiasi modifica, proposta di funzionalità o refactor inviato senza autorizzazione preventiva verrà chiuso senza revisione.

---

## Lavoro su Commissione

Il laboratorio valuta richieste di sviluppo esterno su base selettiva. Le proposte vengono esaminate in base alla compatibilità con le direzioni di ricerca attive, prima di qualsiasi impegno.

Per inviare una proposta:
1. Apri una nuova Issue con l'etichetta `[commission]`
2. Descrivi obiettivo, ambito e contesto della richiesta
3. Il laboratorio risponderà se la proposta è ritenuta compatibile

**Il laboratorio si riserva il diritto di non rispondere a richieste al di fuori del proprio ambito di ricerca.** L'accettazione non è garantita ed è a totale discrezione del laboratorio.

---

## Standard Tecnico (Interno)

Tutti i commit interni seguono lo standard [Conventional Commits](https://www.conventionalcommits.org/):
- `fix:` — correzioni di bug
- `feat:` — nuove funzionalità
- `refactor:` — modifiche strutturali
- `docs:` — aggiornamenti alla documentazione

---

## Architettura del Progetto (v2.0)

L'HUD è un **modulo ESM standalone** (`hud-module/`). Quando si modifica l'HUD:
- Modifica `hud-module/hud-footer.mjs` — il componente Footer potenziato
- Non modificare mai direttamente i file sorgente della CLI
- Testa con `gemini-hud.cmd` prima di fare commit

---

Copyright © 2026 Francesco Avigliano.
*Developed with rigor for the evolution of human control over AI.*
