// Application entry point: persistent data, menu navigation and gameplay startup.
import { SaveManager } from './saveManager.js';
import './game.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const menu = $('#mainMenu');
const screens = $$('.menu-screen', menu);
const levelNames = { 1: 'Palestra', 2: 'Ufficio', 3: 'Aula 5F', 4: 'Piscina' };

function showScreen(name) {
  screens.forEach(screen => screen.classList.toggle('active', screen.dataset.screen === name));
  if (name === 'levels') refreshLevelCards();
  if (name === 'settings') refreshDifficulty();
  if (name === 'statistics') refreshStatistics();
}

function refreshLevelCards() {
  const unlocked = SaveManager.getUnlockedLevel();
  $$('.level-card', menu).forEach(card => {
    const level = Number(card.dataset.menuLevel);
    const available = level <= unlocked;
    card.disabled = !available;
    card.classList.toggle('locked', !available);
    $('small', card).textContent = available ? 'SBLOCCATO · GIOCA' : '🔒 BLOCCATO';
    card.setAttribute('aria-label', `${levelNames[level]}${available ? ', sbloccato' : ', bloccato'}`);
  });
  // Keep the legacy in-game level picker in sync with the same unlock limit.
  $$('[data-level]').forEach(button => {
    const level = Number(button.dataset.level);
    button.disabled = level > unlocked;
    button.setAttribute('aria-disabled', String(button.disabled));
    button.classList.toggle('locked', button.disabled);
  });
  $('#saveStatus').textContent = SaveManager.isStorageAvailable()
    ? `SALVATAGGIO LOCALE ATTIVO · LIVELLO ${unlocked} SBLOCCATO${unlocked > 1 ? ' · ' + unlocked + ' LIVELLI DISPONIBILI' : ''}`
    : 'ATTENZIONE · SALVATAGGIO LOCALE NON DISPONIBILE';
}

function refreshDifficulty() {
  const selected = SaveManager.getDifficulty();
  $$('[data-menu-diff]', menu).forEach(button => button.classList.toggle('selected', button.dataset.menuDiff === selected));
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return [hours, minutes, secs].map(value => String(value).padStart(2, '0')).join(':');
}

function refreshStatistics() {
  const save = SaveManager.getData();
  const stats = save.statistics;
  $('#statDeaths').textContent = stats.deaths;
  $('#statVictories').textContent = stats.victories;
  $('#statPlayTime').textContent = formatDuration(stats.playTimeSeconds);
  $('#statUnlocked').textContent = `${save.campaign.unlockedLevel} / 4`;
  $('#statGames').textContent = stats.gamesStarted;
  $('#statWinRate').textContent = stats.gamesStarted ? `${Math.round(stats.victories / stats.gamesStarted * 100)}%` : '0%';
  $('#levelStats').innerHTML = Object.keys(levelNames).map(key => {
    const attempts = stats.levelAttempts[key] || 0;
    const best = stats.bestSurvivalTimes[key] || 0;
    return `<div class="level-stats-row"><span>Livello ${key} · ${levelNames[key]}</span><span>${attempts} tentativi · record ${best.toFixed(1)} s</span></div>`;
  }).join('');
}

function showMainMenu() {
  $('#overlay').classList.add('hidden');
  $('#overlay').classList.remove('game-over-menu','victory-menu');
  $('#wrap').classList.remove('defeat-sequence-clean');
  menu.classList.remove('hidden');
  showScreen('home');
  refreshLevelCards();
  if (window.SIOTA?.pause) window.SIOTA.pause();
}

menu.addEventListener('click', event => {
  const actionButton = event.target.closest('[data-action]');
  const levelButton = event.target.closest('[data-menu-level]');
  const difficultyButton = event.target.closest('[data-menu-diff]');

  if (levelButton) {
    if (levelButton.disabled) return;
    const level = Number(levelButton.dataset.menuLevel);
    if (window.SIOTA?.startLevel) window.SIOTA.startLevel(level);
    return;
  }
  if (difficultyButton) {
    SaveManager.setDifficulty(difficultyButton.dataset.menuDiff);
    refreshDifficulty();
    return;
  }
  if (!actionButton) return;

  switch (actionButton.dataset.action) {
    case 'new-game':
      // Do not alter the current campaign until the player explicitly confirms.
      showScreen('new-game-confirm');
      break;
    case 'new-game-confirm':
      // A confirmed new campaign always starts immediately at level 1.
      // The level picker is reserved for Continue, where replaying unlocked
      // stages is useful. Lifetime statistics and settings remain untouched.
      SaveManager.startNewCampaign();
      if (!window.SIOTA?.startLevel?.(1)) {
        showMainMenu();
      }
      break;
    case 'continue':
      $('#levelsHeading').textContent = 'CONTINUA';
      $('#levelsDescription').textContent = 'Scegli liberamente uno dei livelli che hai già sbloccato.';
      showScreen('levels');
      break;
    case 'settings': showScreen('settings'); break;
    case 'statistics': showScreen('statistics'); break;
    case 'reset-confirm': showScreen('reset'); break;
    case 'reset-now':
      SaveManager.resetAll();
      showScreen('settings');
      refreshDifficulty();
      refreshLevelCards();
      break;
    case 'home': showScreen('home'); refreshLevelCards(); break;
    case 'exit': showScreen('exit'); break;
  }
});

$('#returnToMenu')?.addEventListener('click', showMainMenu);
window.addEventListener('siota:show-main-menu', showMainMenu);

// Called by the menu after the player chooses an unlocked level.
window.addEventListener('siota:game-ready', () => {
  refreshLevelCards();
});

// The game module exposes its small public interface after initialization.
window.addEventListener('load', () => {
  showMainMenu();
});
