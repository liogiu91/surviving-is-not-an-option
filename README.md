# Surviving is not an option — v0.2.7.01

Questa è la nuova base di sviluppo del progetto, riorganizzata a partire dalla
versione ufficiale 0.2.7.00. La revisione privilegia leggibilità, documentazione
in italiano e conservazione del comportamento esistente.

## Avvio

Aprire `index.html` tramite un server HTTP locale (consigliato, perché il gioco
usa moduli JavaScript ES) oppure tramite l'ambiente di hosting già utilizzato
per il progetto.

## Struttura del progetto

- `index.html`: struttura HTML, canvas, HUD, menu e pannelli.
- `css/style.css`: aspetto grafico, layout responsive, menu e interfaccia.
- `js/main.js`: punto di ingresso dell'interfaccia e navigazione dei menu.
- `js/game.js`: motore di gioco, input, simulazione, IA, collisioni, disegno,
  vittoria, sconfitta e finisher specifiche dei livelli.
- `js/config.js`: dimensioni logiche, difficoltà e funzioni condivise.
- `js/assets.js`: caricamento centralizzato delle immagini e dimensioni degli
  sprite sheet.
- `js/saveManager.js`: persistenza, normalizzazione e statistiche.
- `js/levels/`: dati e testi specifici dei cinque livelli.
- `assets/`: sfondi, illustrazioni, sprite sheet ed effetti.

## Mappa delle responsabilità

Il menu comunica con il motore attraverso `window.SIOTA` e gli eventi
personalizzati `siota:*`. Il motore legge le configurazioni dei livelli da
`js/levels/`, mentre il caricamento delle immagini è centralizzato in
`js/assets.js`. La gestione dei dati persistenti è affidata a `SaveManager`.

## Convenzioni per le modifiche future

1. I parametri specifici di un livello (testi, focus della sconfitta e tempi)
   vanno mantenuti nel relativo file dentro `js/levels/`.
2. I percorsi delle immagini e le dimensioni degli sprite sheet vanno dichiarati
   in `js/assets.js`.
3. Le preferenze, la progressione e le statistiche vanno gestite tramite
   `SaveManager`, evitando accessi diretti a `localStorage` dagli altri moduli.
4. Prima di modificare una finisher, annotare la relazione tra tempi, coordinate,
   punto di pivot e fotogrammi: queste sequenze dipendono da valori calibrati.
5. Le funzioni del motore sono raggruppate per responsabilità e commentate in
   italiano. I commenti descrivono il comportamento, non sostituiscono il codice.

## Note sulla revisione

La revisione 0.2.7.01 è principalmente una ristrutturazione documentale e di
manutenibilità. Non è stata intenzionalmente modificata la logica di gioco,
l'equilibrio dei livelli, le coordinate delle finisher o i parametri di
collisione. I file di cronologia delle revisioni precedenti sono conservati
come documentazione storica.
