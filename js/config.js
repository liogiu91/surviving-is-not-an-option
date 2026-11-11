// Shared game dimensions, difficulty presets and utility helpers.
export const W=960,H=600,WORLD_W=2160;
export const difficulties={easy:{label:'FACILE',hp:7},normal:{label:'NORMALE',hp:5},hard:{label:'DIFFICILE',hp:4}};
export const MAX_STAMINA=100;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
