# Surviving is not an option — Phase 3

Based on the approved 0.2.4.50 gameplay build and Phase 2 asset/CSS extraction.

## Project structure
- `index.html`: page markup and module entry point
- `css/style.css`: stylesheet
- `assets/`: 17 external image assets
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
