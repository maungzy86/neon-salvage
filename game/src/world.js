import { CONFIG, waveSpec } from './config.js';
import { createRng } from './random.js';
import { createShip, createPod, createShard, stepShip, magnetStep, circlesHit, wrapOrBounce, dist2 } from './entities.js';
import { pickUpgrades } from './upgrades.js';

const BEST_KEY = 'neon-salvage-best';

function readBest() {
  try { return Number(globalThis.localStorage?.getItem(BEST_KEY)) || 0; } catch { return 0; }
}

export function createWorld(seed, hooks = {}) {
  const rng = createRng(seed);
  const audio = hooks.audio || {};
  const world = {
    state: 'title', ship: createShip(), pods: [], shards: [], particles: [], floaters: [],
    score: 0, best: readBest(), wave: 0, delivered: 0, quota: 0, timeLeft: 0,
    combo: 1, comboT: 0, kills: 0,
    mods: { thrustMul: 1, speedMul: 1, pulseMul: 1, magnetR: 0 },
    pendingUpgrades: [], pulseFx: null, spec: null,
    startRun, nextWave, update, waveClear, applyUpgrade, gameOver, togglePause,
    spawnParticles,
  };

  function sound(name, ...args) { if (typeof audio[name] === 'function') audio[name](...args); }
  function floater(x, y, text, color = '#c8ff5a') {
    world.floaters.push({ x, y, text, t: 1, life: 1, color });
  }
  function spawnParticles(x, y, color = '#45f4ff', n = 10, speed = 130) {
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, Math.PI * 2), v = rng.range(speed * 0.25, speed);
      const life = rng.range(0.3, 0.8);
      world.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, t: life, r: rng.range(1.5, 3.5), color });
    }
  }
  function startRun() {
    world.ship = createShip(); world.pods = []; world.shards = []; world.particles = []; world.floaters = [];
    world.score = 0; world.wave = 0; world.delivered = 0; world.quota = 0; world.timeLeft = 0;
    world.combo = 1; world.comboT = 0; world.kills = 0; world.pendingUpgrades = [];
    world.mods = { thrustMul: 1, speedMul: 1, pulseMul: 1, magnetR: 0 }; world.pulseFx = null;
    nextWave();
  }
  function nextWave() {
    world.wave++;
    world.spec = waveSpec(world.wave);
    world.quota = world.spec.quota; world.timeLeft = world.spec.timeSec; world.delivered = 0;
    world.pods = []; world.shards = [];
    const taken = [];
    for (let i = 0; i < world.spec.pods; i++) {
      const pod = createPod(rng, taken); world.pods.push(pod); taken.push(pod);
    }
    for (let i = 0; i < world.spec.shards; i++) {
      world.shards.push(createShard(rng, rng.next() < 0.3, world.spec.shardSpeed));
    }
    world.state = 'playing';
  }
  function waveClear() {
    if (world.state !== 'playing') return;
    world.score += 50 * world.wave;
    floater(CONFIG.world.W / 2, CONFIG.world.H / 2, `WAVE ${world.wave} CLEAR +${50 * world.wave}`, '#45f4ff');
    world.state = 'upgrade'; world.pendingUpgrades = pickUpgrades(rng); sound('waveClear');
  }
  function applyUpgrade(u) {
    if (world.state !== 'upgrade' || !u) return;
    u.apply(world); sound('upgrade'); nextWave();
  }
  function gameOver() {
    if (world.state === 'over') return;
    world.state = 'over'; world.best = Math.max(world.best, world.score);
    try { globalThis.localStorage?.setItem(BEST_KEY, String(world.best)); } catch {}
    sound('gameOver');
  }
  function togglePause() {
    if (world.state === 'playing') world.state = 'paused';
    else if (world.state === 'paused') world.state = 'playing';
  }
  function update(dt, input = {}) {
    if (world.state !== 'playing') return;
    dt = Math.max(0, Math.min(dt, 0.05));
    const ship = world.ship;
    stepShip(ship, input, dt, world.mods);
    magnetStep(world.pods, ship, dt, world.mods.magnetR);

    for (let i = world.pods.length - 1; i >= 0; i--) {
      const pod = world.pods[i];
      if (ship.hold.length < ship.holdCap && circlesHit({ x: ship.x, y: ship.y, r: CONFIG.ship.radius }, pod)) {
        ship.hold.push(pod.id); world.pods.splice(i, 1); sound('pickup');
        floater(ship.x, ship.y - 22, '+POD'); spawnParticles(pod.x, pod.y, CONFIG.colors.pod, 9, 100);
      }
    }

    const dock = CONFIG.dock;
    if (ship.hold.length && Math.hypot(ship.x - dock.x, ship.y - dock.y) < dock.r) {
      const count = ship.hold.length;
      world.combo = world.comboT > 0 ? Math.min(CONFIG.combo.maxMultiplier, world.combo + 1) : 1;
      world.comboT = CONFIG.combo.windowSec;
      const points = CONFIG.deliveryScore * world.combo * count;
      world.score += points; world.delivered += count; ship.hold = [];
      sound('deliver', world.combo); floater(ship.x, ship.y - 25, `+${points}  x${world.combo}`, '#c8ff5a');
      spawnParticles(dock.x, dock.y, CONFIG.colors.dock, 16, 120);
      if (world.delivered >= world.quota) { waveClear(); return; }
    }

    const clicked = input.mouse?.clicked;
    if ((input.pressed?.('Space') || input.pressed?.(' ') || clicked) && ship.pulseCd <= 0) {
      const radius = CONFIG.pulse.radius * world.mods.pulseMul;
      world.pulseFx = { x: ship.x, y: ship.y, r: radius, t: 0.35, life: 0.35 };
      ship.pulseCd = CONFIG.pulse.cooldownSec; sound('pulse');
      for (let i = world.shards.length - 1; i >= 0; i--) {
        const shard = world.shards[i];
        if (dist2(ship, shard) > radius * radius) continue;
        if (!shard.big) {
          world.shards.splice(i, 1); world.score += 10; world.kills++;
          spawnParticles(shard.x, shard.y, CONFIG.colors.shard, 10, 150);
        } else {
          const dx = shard.x - ship.x, dy = shard.y - ship.y, d = Math.hypot(dx, dy) || 1;
          shard.vx += dx / d * 260; shard.vy += dy / d * 260;
        }
      }
    }

    for (let i = world.shards.length - 1; i >= 0; i--) {
      const shard = world.shards[i];
      shard.x += shard.vx * dt; shard.y += shard.vy * dt; shard.rot += shard.vr * dt;
      wrapOrBounce(shard);
      if (ship.invuln <= 0 && circlesHit({ x: ship.x, y: ship.y, r: CONFIG.ship.radius }, shard)) {
        ship.hull -= shard.big ? CONFIG.collisionDamage.big : CONFIG.collisionDamage.small;
        ship.invuln = CONFIG.invulnerabilitySec;
        const dx = ship.x - shard.x, dy = ship.y - shard.y, d = Math.hypot(dx, dy) || 1;
        ship.vx += dx / d * 180; ship.vy += dy / d * 180;
        sound('hit'); spawnParticles(ship.x, ship.y, CONFIG.colors.shard, 18, 190);
        floater(ship.x, ship.y - 24, `-${shard.big ? CONFIG.collisionDamage.big : CONFIG.collisionDamage.small} HULL`, '#ff4f8b');
        if (ship.hull <= 0) { gameOver(); return; }
      }
    }
    if (world.comboT > 0 && (world.comboT = Math.max(0, world.comboT - dt)) === 0) world.combo = 1;
    world.timeLeft -= dt;
    if (world.timeLeft <= 0) {
      if (world.delivered < world.quota) {
        ship.hull -= 20; floater(ship.x, ship.y - 28, 'QUOTA MISSED -20 HULL', '#ff4f8b');
        if (ship.hull <= 0) { gameOver(); return; }
      }
      world.timeLeft = world.spec.timeSec;
    }
    for (const p of world.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.t -= dt; }
    world.particles = world.particles.filter(p => p.t > 0);
    for (const f of world.floaters) { f.y -= 28 * dt; f.t -= dt; }
    world.floaters = world.floaters.filter(f => f.t > 0);
    if (world.pulseFx && (world.pulseFx.t -= dt) <= 0) world.pulseFx = null;
  }
  return world;
}
