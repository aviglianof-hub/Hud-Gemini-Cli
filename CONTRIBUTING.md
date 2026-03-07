# Contribution Protocol - F. Avigliano Research Lab

This project is a personal research laboratory focused on algorithmic rigor. To contribute, follow these guidelines:

## 1. Open Challenges (Help Wanted)
The lab periodically identifies technical "bottlenecks" listed in the **Issues** section with the `[HELP WANTED]` label.
- If you intend to work on one of these challenges, write a comment in the corresponding issue to announce the start of your research. This avoids work overlap.

## 2. External Proposals
For any other modification not explicitly requested:
**Do not submit Pull Requests without prior discussion.**
1. Open a new Issue describing the problem and the proposed algorithmic approach.
2. Wait for feedback on the proposal's coherence with the lab's philosophy.

## 3. Technical Standards
- **Commit Messages:** Use the Conventional Commits standard (e.g. `feat:`, `fix:`, `refactor:`).
- **Documentation:** Any change to the logic must be accompanied by an update to README.md.

## 4. Project Architecture (v2.0)
The HUD is now a **standalone ESM module** (`hud-module/`). When modifying the HUD:
- Edit `hud-module/hud-footer.mjs` — the enhanced Footer component
- Never modify CLI source files directly
- Test with `gemini-hud.cmd` before submitting

## 5. Final Note
This is a research environment, not a community-driven project. Every contribution will be reviewed with extreme rigor to ensure logical integrity.

---

# Protocollo di Contribuzione - Laboratorio di Ricerca F. Avigliano

Questo progetto è un laboratorio di ricerca personale focalizzato sul rigore algoritmico. Per contribuire, segui queste linee guida:

## 1. Sfide Aperte (Help Wanted)
Il laboratorio identifica periodicamente dei "colli di bottiglia" tecnici segnalati nella sezione **Issues** con l'etichetta `[HELP WANTED]`.
- Se intendi lavorare su una di queste sfide, scrivi un commento nella issue corrispondente per annunciare l'inizio della tua ricerca. Questo evita sovrapposizioni di lavoro.

## 2. Proposte Esterne
Per qualsiasi altra modifica non esplicitamente richiesta:
**Non inviare Pull Request senza discussione preventiva.**
1. Apri una nuova Issue descrivendo il problema e l'approccio algoritmico proposto.
2. Attendi un riscontro sulla coerenza della proposta con la filosofia del laboratorio.

## 3. Standard Tecnico
- **Messaggi di Commit:** Usa lo standard Conventional Commits (es. `feat:`, `fix:`, `refactor:`).
- **Documentazione:** Ogni modifica alla logica deve essere accompagnata dall'aggiornamento del README.md.

## 4. Architettura del Progetto (v2.0)
L'HUD è ora un **modulo ESM standalone** (`hud-module/`). Quando modifichi l'HUD:
- Modifica `hud-module/hud-footer.mjs` — il componente Footer potenziato
- Non modificare mai direttamente i file sorgente della CLI
- Testa con `gemini-hud.cmd` prima di inviare

## 5. Nota Finale
Questo è un ambiente di ricerca, non un progetto guidato dalla comunità. Ogni contributo verrà esaminato con estremo rigore per garantirne l'integrità logica.

---
Copyright (c) 2026 Francesco Avigliano.
*Developed with rigor for the evolution of human control over AI.*
