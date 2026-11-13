/**
 * Gestione dei salvataggi persistenti.
 *
 * Il modulo è indipendente dal motore: menu e gameplay usano esclusivamente
 * l'API SaveManager, senza accedere direttamente a localStorage.
 * I dati vengono normalizzati prima dell'uso per gestire salvataggi incompleti
 * o creati da versioni precedenti del gioco.
 */

const STORAGE_KEY = 'siota.saveData';
const SAVE_VERSION = 2;
const VALID_DIFFICULTIES = new Set(['normal', 'hard']);
const MAX_LEVEL = 5;

// Crea la struttura iniziale completa del salvataggio.
function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    settings: {
      difficulty: 'normal'
    },
    campaign: {
      unlockedLevel: 1,
      selectedLevel: 1
    },
    statistics: {
      deaths: 0,
      victories: 0,
      playTimeSeconds: 0,
      gamesStarted: 0,
      levelAttempts: {},
      bestSurvivalTimes: {}
    }
  };
}

// Restituisce una copia profonda per non esporre lo stato interno.
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Converte un valore numerico; valori non validi o negativi diventano zero.
function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

// Convalida e riporta i dati salvati allo schema corrente.
function normalizeSave(raw) {
  const defaults = createDefaultSave();
  if (!raw || typeof raw !== 'object') return defaults;

  const difficulty = raw.settings?.difficulty;
  const unlockedLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(raw.campaign?.unlockedLevel) || 1)));
  const selectedLevel = Math.min(unlockedLevel, Math.max(1, Math.floor(Number(raw.campaign?.selectedLevel) || 1)));
  const stats = raw.statistics || {};

  const levelAttempts = {};
  const bestSurvivalTimes = {};
  for (let level = 1; level <= MAX_LEVEL; level += 1) {
    const key = String(level);
    const attempts = Math.floor(asNonNegativeNumber(stats.levelAttempts?.[key]));
    const best = asNonNegativeNumber(stats.bestSurvivalTimes?.[key]);
    if (attempts > 0) levelAttempts[key] = attempts;
    if (best > 0) bestSurvivalTimes[key] = best;
  }

  return {
    version: SAVE_VERSION,
    settings: {
      difficulty: VALID_DIFFICULTIES.has(difficulty) ? difficulty : defaults.settings.difficulty
    },
    campaign: { unlockedLevel, selectedLevel },
    statistics: {
      deaths: Math.floor(asNonNegativeNumber(stats.deaths)),
      victories: Math.floor(asNonNegativeNumber(stats.victories)),
      playTimeSeconds: asNonNegativeNumber(stats.playTimeSeconds),
      gamesStarted: Math.floor(asNonNegativeNumber(stats.gamesStarted)),
      levelAttempts,
      bestSurvivalTimes
    }
  };
}

// Recupera localStorage in modo sicuro, gestendo le restrizioni del browser.
function getStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (error) {
    // La navigazione privata o le politiche del browser possono bloccare localStorage.
    return null;
  }
}

let data = createDefaultSave();
let storageAvailable = false;

// Scrive lo stato corrente su localStorage e aggiorna l’indicatore di disponibilità.
function persist() {
  const storage = getStorage();
  if (!storage) {
    storageAvailable = false;
    return false;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    storageAvailable = true;
    return true;
  } catch (error) {
    storageAvailable = false;
    console.warn('[SaveManager] Salvataggio non riuscito:', error);
    return false;
  }
}

// Legge il salvataggio, applica eventuali migrazioni o crea i dati iniziali.
function load() {
  const storage = getStorage();
  if (!storage) {
    data = createDefaultSave();
    storageAvailable = false;
    return getData();
  }
  try {
    const stored = storage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    data = stored ? normalizeSave(parsed) : createDefaultSave();
    storageAvailable = true;
    // Salva le migrazioni, inclusa la rimozione della vecchia difficoltà Facile.
    if (!stored || parsed?.version !== SAVE_VERSION || !VALID_DIFFICULTIES.has(parsed?.settings?.difficulty)) persist();
  } catch (error) {
    console.warn('[SaveManager] Salvataggio illeggibile: vengono caricati i dati iniziali.', error);
    data = createDefaultSave();
    persist();
  }
  return getData();
}

// Restituisce una copia completa dei dati di gioco.
function getData() {
  return clone(data);
}

// Restituisce la difficoltà selezionata.
function getDifficulty() {
  return data.settings.difficulty;
}

// Modifica la difficoltà solo se appartiene ai valori supportati.
function setDifficulty(difficulty) {
  if (!VALID_DIFFICULTIES.has(difficulty)) return false;
  data.settings.difficulty = difficulty;
  persist();
  return true;
}

// Avvia una nuova campagna, conservando impostazioni e statistiche complessive.
// Riporta la campagna al primo livello senza cancellare statistiche e preferenze.
function startNewCampaign() {
  data.campaign.unlockedLevel = 1;
  data.campaign.selectedLevel = 1;
  persist();
  return getData();
}

// Seleziona un livello soltanto se è già stato sbloccato.
function selectLevel(level) {
  const requested = Math.floor(Number(level));
  if (!Number.isInteger(requested) || requested < 1 || requested > data.campaign.unlockedLevel) return false;
  data.campaign.selectedLevel = requested;
  persist();
  return true;
}

// Sblocca tutti i livelli: funzione destinata al codice sviluppatore.
function unlockAllLevels() {
  data.campaign.unlockedLevel = MAX_LEVEL;
  data.campaign.selectedLevel = Math.min(MAX_LEVEL, Math.max(1, data.campaign.selectedLevel));
  persist();
  return data.campaign.unlockedLevel;
}

// Restituisce il livello più alto sbloccato.
function getUnlockedLevel() {
  return data.campaign.unlockedLevel;
}

// Restituisce il livello attualmente selezionato.
function getSelectedLevel() {
  return data.campaign.selectedLevel;
}

// Registra l’avvio di un tentativo valido.
function recordLevelStart(level = data.campaign.selectedLevel) {
  const requested = Math.floor(Number(level));
  if (!Number.isInteger(requested) || requested < 1 || requested > data.campaign.unlockedLevel) return false;
  data.campaign.selectedLevel = requested;
  data.statistics.gamesStarted += 1;
  const key = String(requested);
  data.statistics.levelAttempts[key] = (data.statistics.levelAttempts[key] || 0) + 1;
  persist();
  return true;
}

// Aggiorna il record di sopravvivenza del livello, se migliorato.
function updateBestSurvivalTime(level, seconds) {
  const key = String(Math.floor(Number(level)));
  const value = asNonNegativeNumber(seconds);
  if (!/^[1-5]$/.test(key) || value <= 0) return;
  data.statistics.bestSurvivalTimes[key] = Math.max(data.statistics.bestSurvivalTimes[key] || 0, value);
}

// Registra una sconfitta e aggiorna l’eventuale record di sopravvivenza.
function recordDeath(level = data.campaign.selectedLevel, survivalSeconds = 0) {
  data.statistics.deaths += 1;
  updateBestSurvivalTime(level, survivalSeconds);
  persist();
  return getData();
}

// Registra la vittoria e sblocca il livello successivo.
function recordVictory(level = data.campaign.selectedLevel, survivalSeconds = 0) {
  const completedLevel = Math.floor(Number(level));
  if (!Number.isInteger(completedLevel) || completedLevel < 1 || completedLevel > MAX_LEVEL) return false;

  data.statistics.victories += 1;
  updateBestSurvivalTime(completedLevel, survivalSeconds);
  data.campaign.unlockedLevel = Math.min(MAX_LEVEL, Math.max(data.campaign.unlockedLevel, completedLevel + 1));
  // Dopo una vittoria, «Continua» punta automaticamente al livello appena sbloccato.
  data.campaign.selectedLevel = Math.min(data.campaign.unlockedLevel, completedLevel + 1);
  persist();
  return getData();
}

// Aggiunge al totale il tempo effettivamente trascorso in gioco.
function addPlayTime(seconds) {
  const amount = asNonNegativeNumber(seconds);
  if (amount <= 0) return false;
  data.statistics.playTimeSeconds += amount;
  persist();
  return true;
}

// Restituisce una copia delle sole statistiche.
function getStatistics() {
  return clone(data.statistics);
}

// Ripristina l’intero salvataggio ai valori iniziali.
function resetAll() {
  data = createDefaultSave();
  persist();
  return getData();
}

// Esporta il salvataggio in formato JSON leggibile.
function exportSave() {
  return JSON.stringify(data, null, 2);
}

// Importa e normalizza un salvataggio JSON; restituisce false se non valido.
function importSave(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object' || !parsed.campaign || !parsed.statistics) return false;
    data = normalizeSave(parsed);
    persist();
    return true;
  } catch (error) {
    return false;
  }
}

export const SaveManager = Object.freeze({
  key: STORAGE_KEY,
  version: SAVE_VERSION,
  load,
  getData,
  getDifficulty,
  setDifficulty,
  startNewCampaign,
  selectLevel,
  getUnlockedLevel,
  unlockAllLevels,
  getSelectedLevel,
  recordLevelStart,
  recordDeath,
  recordVictory,
  addPlayTime,
  getStatistics,
  resetAll,
  exportSave,
  importSave,
  isStorageAvailable: () => storageAvailable
});

// Espone l’API anche su window per strumenti di debug e integrazioni esterne.
if (typeof window !== 'undefined') window.SaveManager = SaveManager;

// Carica i dati una sola volta quando il modulo viene inizializzato.
SaveManager.load();
