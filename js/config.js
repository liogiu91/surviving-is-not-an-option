/**
 * Configurazione condivisa del gioco.
 * Contiene dimensioni del mondo, parametri delle difficoltà e funzioni comuni.
 */
// Dimensioni logiche del canvas e larghezza complessiva dell'area di gioco.
export const W=960,H=600,WORLD_W=2160;

// Parametri di salute e durata richiesti per completare ciascuna difficoltà.
export const difficulties={normal:{label:'NORMALE',hp:5,survivalSeconds:30},hard:{label:'DIFFICILE',hp:4,survivalSeconds:40}};

// Riserva massima di energia disponibile per la corsa.
export const MAX_STAMINA=100;

// Limita un valore all'intervallo [minimo, massimo].
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
