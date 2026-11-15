import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld } from './world.js';
import { drawWorld } from './render.js';
import { createHud } from './hud.js';
import { setupShotMode } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(globalThis.location.search);
const hasShot = params.has('shot');
const defaultSeed = hasShot ? 1 : Date.now() % 100000;
const parsedSeed = Number.parseInt(params.get('seed') ?? String(defaultSeed), 10);
const seed = Number.isFinite(parsedSeed) ? parsedSeed : defaultSeed;

const audio = createAudio();
const world = createWorld(seed, { audio });
const input = createInput(canvas);
let hud;

function startRun() {
  world.startRun();
  hud.showScreen(null);
}

function restartRun() {
  world.startRun();
  hud.showScreen(null);
}

function chooseUpgrade(upgrade) {
  world.applyUpgrade(upgrade);
  hud.showScreen(null);
}

hud = createHud(world, audio, {
  onStart: startRun,
  onRestart: restartRun,
  onUpgrade: chooseUpgrade,
  onResume: () => world.togglePause(),
});
hud.showScreen('title');

let gestureHandled = false;
function resumeAudioOnce() {
  if (gestureHandled) return;
  gestureHandled = true;
  audio.resume();
}
window.addEventListener('pointerdown', resumeAudioOnce, { once: true });
window.addEventListener('keydown', resumeAudioOnce, { once: true });

const isShot = setupShotMode(world, hud);
if (isShot) {
  drawWorld(ctx, world, performance.now() / 1000);
  hud.update();
}

const screenForState = {
  title: 'title',
  upgrade: 'upgrade',
  over: 'over',
  paused: 'pause',
  playing: null,
};
let lastState = world.state;
let last = performance.now();

function frame(now) {
  const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 30));
  last = now;

  if (input.pressed('Escape') || input.pressed('KeyP')) {
    if (world.state === 'playing' || world.state === 'paused') world.togglePause();
  }
  if (input.pressed('KeyM')) audio.toggleMute();
  if (input.pressed('Enter')) {
    if (world.state === 'title') startRun();
    else if (world.state === 'over') restartRun();
  }

  if (!isShot && world.state === 'playing') world.update(dt, input);

  if (world.state !== lastState) {
    hud.showScreen(screenForState[world.state] ?? null);
    lastState = world.state;
  }

  drawWorld(ctx, world, now / 1000);
  hud.update();
  input.postUpdate?.();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
