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
