// Arrange stable game states for automated screenshot capture.
export function setupShotMode(world, hud) {
  const params = new URLSearchParams(globalThis.location?.search || '');
  const shot = params.get('shot');
  if (!['title', 'play', 'upgrade', 'over'].includes(shot)) return false;
  const seed = Number.parseInt(params.get('seed') || '1', 10);
  void seed; // createWorld owns RNG initialization; the caller supplies the URL seed.

  if (shot === 'title') {
    world.state = 'title';
    hud.showScreen('title');
  } else if (shot === 'play') {
    world.startRun();
    const input = {
      axis: () => ({ x: 0.4, y: -0.6 }),
      mouse: { x: 900, y: 200, down: false, clicked: false },
      pressed: () => false,
      postUpdate: () => {},
    };
    for (let i = 0; i < 150; i++) world.update(1 / 60, input);
    world.ship.hold = ['shot-pod-1', 'shot-pod-2'];
    world.combo = 3; world.comboT = 4;
    hud.showScreen(null);
  } else if (shot === 'upgrade') {
    world.startRun(); world.waveClear(); hud.showScreen('upgrade');
  } else {
    world.startRun(); world.score = 2450; world.wave = 4; world.gameOver(); hud.showScreen('over');
  }
  hud.update();
  globalThis.requestAnimationFrame?.(() => { globalThis.__shotReady = true; });
  globalThis.__shotReady = true;
  return true;
}
