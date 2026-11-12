# Surviving is not an option — Phase 3

Based on the approved 0.2.4.50 gameplay build and Phase 2 asset/CSS extraction.

## Project structure
- `index.html`: page markup and module entry point
- `css/style.css`: stylesheet
- `assets/`: image assets for backgrounds, sprites, effects and defeat scenes
- `js/main.js`: JavaScript entry point
- `js/game.js`: game loop, gameplay state, rendering, input wiring and level flow
- `js/assets.js`: image objects, asset paths and sprite-sheet dimensions
- `js/config.js`: shared dimensions, difficulty presets and utility helpers

## Run locally
Serve this folder over HTTP (recommended on Android):
1. Set this folder as the HTTP server root.
2. Start the server.
3. Open its local URL in Chrome, for example `http://127.0.0.1:8080/`.

ES modules require HTTP(S); opening `index.html` directly with `file://` may be blocked by the browser.

## GitHub Pages
Upload the contents of this folder to the root of a GitHub repository and enable GitHub Pages from the `main` branch, `/ (root)`.

## Progress
- Phase 1: extracted 17 embedded images into `assets/`.
- Phase 2: moved CSS into `css/style.css`.
- Phase 3: introduced native JavaScript ES modules for the entry point, shared configuration, and image assets. Core gameplay remains in `js/game.js` to preserve behavior during this first modularization pass.


## Fase 4 — Configurazioni dei livelli

Le introduzioni, i sottotitoli e i parametri delle schermate di sconfitta dei tre livelli sono separati in `js/levels/`. La logica di gioco e le meccaniche restano in `js/game.js`.


## Correzione finisher — allineamento suola

Le animazioni finisher dei tre livelli sono state riallineate al centro dell'ombra ovale (Y=555), mantenendo invariati tempi, frame e sequenze.


## Allineamento effetti finisher

Pozza, impatto e residui di sangue dei livelli 1 e 2 condividono l'ancoraggio del terreno Y=555. Nel livello 3 la scia di sangue è stata separata dall'ancoraggio grafico della scarpa e posizionata sul riferimento del terreno Y=555.


## Fase 5 — Livello 4: Piscina scolastica
- Aggiunto il livello selezionabile `Piscina` con introduzione e schermata di sconfitta dedicate.
- Nuovo fondale panoramico della piscina scolastica.
- Nuovo spritesheet trasparente a 8 frame della zeppa rosa, estratto dal greenscreen e integrato nel rendering.
- IA, movimento del PG, stamina, difficoltà e ciclo d'attacco riutilizzano il motore condiviso.
- Le configurazioni e gli asset dei livelli 1–3 restano separati e invariati.


## Fase 6 — Finisher piscina
- Integrato lo spritesheet composito trasparente `pool-finisher.png` (8 frame, 4×2).
- La sequenza mostra impatto, scivolamento laterale progressivo e sollevamento finale.
- Acqua e scia rossa scenografica sono già incorporate nei frame: non vengono sovrapposti effetti separati.
- La direzione dello scivolamento e il mirroring seguono il lato da cui arriva il PG.
- La finisher mantiene l'ancoraggio al piano di gioco e resta visibile nella schermata di attesa dopo la sequenza.
- I livelli 1–3 non sono stati modificati nella loro logica.


## Fase 7 — Schermata di sconfitta piscina
- Aggiunta l'illustrazione dedicata `assets/scenes/pool-defeat.jpg`, coerente con luci, colori e ambiente del fondale del livello.
- La sequenza di sconfitta apre con uno zoom sulla zeppa rosa nella pozza d'acqua e sangue, poi allarga progressivamente fino a mostrare l'intera scena.
- Aggiornata la descrizione del livello: “La piscina della scuola è deserta, ma non sei al sicuro. Tra piastrelle bagnate e riflessi d'acqua, qualcuno passeggia tranquillamente lungo il bordo vasca. Per te, ogni passo potrebbe essere l'ultimo.”
- Aggiornata la battuta di sconfitta: “Ahi, la caviglia! Ma su cosa sono scivolata?”
- La schermata di sconfitta del livello 4 usa ora un'immagine dedicata; il fondale di gioco resta invariato.


## Sistema di salvataggio — prima integrazione
- Aggiunto `js/saveManager.js`, indipendente dal motore di gioco.
- I dati vengono memorizzati in `localStorage` con chiave `siota.saveData`.
- La struttura separa impostazioni, progressione della campagna e statistiche globali.
- `startNewCampaign()` riporta la progressione al livello 1 senza azzerare statistiche o difficoltà.
- `selectLevel()` consente di selezionare qualsiasi livello già sbloccato.
- `recordVictory()` registra una vittoria e sblocca il livello successivo (fino al livello 4).
- Sono disponibili metodi per registrare avvii, morti, tempo giocato e migliori tempi di sopravvivenza.
- Sono predisposte funzioni di esportazione/importazione JSON e reset completo.
- Il modulo viene caricato prima del motore di gioco, ma in questa fase non modifica ancora il gameplay né l'interfaccia esistente.

## v0.2.4.22 — Main Menu

- Added the main menu with New Game, Continue, Settings and Exit screens.
- Continue opens the unlocked-level selector; locked levels remain visible but unavailable.
- New Game restarts campaign progression at level 1 while preserving lifetime statistics and personal records.
- Added persistent difficulty selection, statistics view and a double-confirmation save reset.
- Connected game starts and deaths to SaveManager; play time is persisted periodically and when leaving the page.
- Added a return-to-main-menu action after Game Over.

## Versione 0.2.4.23 — Defeat menu fix
- La schermata GAME OVER presenta soltanto RIPROVA (stesso livello) e MENÙ PRINCIPALE.
- La selezione dei livelli nell'interfaccia rispetta il livello massimo sbloccato.
- Il controllo della progressione è applicato anche all'avvio del livello, così i livelli bloccati non possono essere avviati aggirando l'interfaccia.
- Rimossi i comandi di ripartenza alternativi dalla schermata di sconfitta: si usano i due pulsanti dedicati.


## Versione 0.2.5.3 — Difficulty & New Game Flow
- Normale: 30 secondi; Difficile: 40 secondi.
- Nuova Partita confermata avvia direttamente il livello 1, senza mostrare la selezione livelli.
- La selezione dei livelli rimane disponibile esclusivamente tramite Continua.

- Rimosso il livello di difficoltà Facile: sono disponibili soltanto Normale e Difficile.
- Normale: 5 HP e obiettivo di sopravvivenza di 30 secondi.
- Difficile: 4 HP e obiettivo di sopravvivenza di 40 secondi.
- Il timer è indipendente dagli FPS e usa il tempo reale trascorso durante la partita.
- Al raggiungimento dell'obiettivo la minaccia si arresta e il personaggio corre fuori dallo schermo.
- La vittoria viene registrata una sola volta, aggiorna le statistiche e sblocca il livello successivo.
- La schermata di vittoria permette di avviare il livello successivo (se disponibile) oppure tornare al menù principale.
- I salvataggi precedenti con difficoltà Facile vengono normalizzati su Normale.
