// Persistent player data for Surviving is not an option.
// This module is intentionally independent from the gameplay engine.

const STORAGE_KEY = 'siota.saveData';
const SAVE_VERSION = 2;
const VALID_DIFFICULTIES = new Set(['normal', 'hard']);
const MAX_LEVEL = 4;

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

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

function getStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (error) {
    // Private browsing or browser policy can make localStorage unavailable.
    return null;
  }
}

let data = createDefaultSave();
let storageAvailable = false;

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
    // Persist migrations, including removal of the retired Easy difficulty.
    if (!stored || parsed?.version !== SAVE_VERSION || !VALID_DIFFICULTIES.has(parsed?.settings?.difficulty)) persist();
  } catch (error) {
    console.warn('[SaveManager] Salvataggio illeggibile: vengono caricati i dati iniziali.', error);
    data = createDefaultSave();
    persist();
  }
  return getData();
}

function getData() {
  return clone(data);
}

function getDifficulty() {
  return data.settings.difficulty;
}

function setDifficulty(difficulty) {
  if (!VALID_DIFFICULTIES.has(difficulty)) return false;
  data.settings.difficulty = difficulty;
  persist();
  return true;
}

// Starts a fresh campaign but deliberately preserves lifetime statistics and settings.
function startNewCampaign() {
  data.campaign.unlockedLevel = 1;
  data.campaign.selectedLevel = 1;
  persist();
  return getData();
}

function selectLevel(level) {
  const requested = Math.floor(Number(level));
  if (!Number.isInteger(requested) || requested < 1 || requested > data.campaign.unlockedLevel) return false;
  data.campaign.selectedLevel = requested;
  persist();
  return true;
}

function getUnlockedLevel() {
  return data.campaign.unlockedLevel;
}

function getSelectedLevel() {
  return data.campaign.selectedLevel;
}

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

function updateBestSurvivalTime(level, seconds) {
  const key = String(Math.floor(Number(level)));
  const value = asNonNegativeNumber(seconds);
  if (!/^[1-4]$/.test(key) || value <= 0) return;
  data.statistics.bestSurvivalTimes[key] = Math.max(data.statistics.bestSurvivalTimes[key] || 0, value);
}

function recordDeath(level = data.campaign.selectedLevel, survivalSeconds = 0) {
  data.statistics.deaths += 1;
  updateBestSurvivalTime(level, survivalSeconds);
  persist();
  return getData();
}

function recordVictory(level = data.campaign.selectedLevel, survivalSeconds = 0) {
  const completedLevel = Math.floor(Number(level));
  if (!Number.isInteger(completedLevel) || completedLevel < 1 || completedLevel > MAX_LEVEL) return false;

  data.statistics.victories += 1;
  updateBestSurvivalTime(completedLevel, survivalSeconds);
  data.campaign.unlockedLevel = Math.min(MAX_LEVEL, Math.max(data.campaign.unlockedLevel, completedLevel + 1));
  // After a victory, Continue naturally points to the newly unlocked level.
  data.campaign.selectedLevel = Math.min(data.campaign.unlockedLevel, completedLevel + 1);
  persist();
  return getData();
}

function addPlayTime(seconds) {
  const amount = asNonNegativeNumber(seconds);
  if (amount <= 0) return false;
  data.statistics.playTimeSeconds += amount;
  persist();
  return true;
}

function getStatistics() {
  return clone(data.statistics);
}

function resetAll() {
  data = createDefaultSave();
  persist();
  return getData();
}

function exportSave() {
  return JSON.stringify(data, null, 2);
}

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

// Expose a convenient browser API for the upcoming menu/gameplay integration.
if (typeof window !== 'undefined') window.SaveManager = SaveManager;

// Load once as soon as this module is evaluated.
SaveManager.load();
