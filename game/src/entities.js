import { CONFIG } from './config.js';

let nextPodId = 1;

const worldW = CONFIG.world.W;
const worldH = CONFIG.world.H;
const dock = CONFIG.dock;
const shipStart = { x: worldW / 2, y: worldH - 140 };

function separated(x, y, point, minimum) {
  return Math.hypot(x - point.x, y - point.y) >= minimum;
}

function randomPosition(rng, dockDistance, shipDistance, taken = []) {
  let point;
  for (let attempt = 0; attempt < 40; attempt++) {
    point = { x: rng.range(24, worldW - 24), y: rng.range(24, worldH - 24) };
    if (separated(point.x, point.y, dock, dockDistance) &&
        separated(point.x, point.y, shipStart, shipDistance) &&
        taken.every(other => separated(point.x, point.y, other, 70))) return point;
  }
  return point;
}

export function createShip() {
  return {
    x: shipStart.x, y: shipStart.y, vx: 0, vy: 0, angle: -Math.PI / 2,
    hull: 100, maxHull: 100, hold: [], holdCap: CONFIG.holdBase,
    invuln: 0, pulseCd: 0, thrusting: false,
  };
}

export function createPod(rng, taken = []) {
  const { x, y } = randomPosition(rng, 90, 70, taken);
  return { x, y, r: CONFIG.pod.radius, bob: rng.range(0, Math.PI * 2), id: nextPodId++ };
}

export function createShard(rng, big, speed) {
  const { x, y } = randomPosition(rng, 80, 120);
  const angle = rng.range(0, Math.PI * 2);
  const magnitude = rng.range(speed * 0.65, speed * 1.35);
  const count = Math.floor(rng.range(7, 10));
  const verts = Array.from({ length: count }, () => rng.range(0.72, 1.28));
  return {
    x, y, vx: Math.cos(angle) * magnitude, vy: Math.sin(angle) * magnitude,
    r: big ? CONFIG.shard.radiusBig : CONFIG.shard.radiusSmall,
    big, rot: rng.range(0, Math.PI * 2), vr: rng.range(-1.8, 1.8), verts,
  };
}

export function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function circlesHit(a, b) {
  const radius = a.r + b.r;
  return dist2(a, b) <= radius * radius;
}

export function wrapOrBounce(e, margin = e.r || 0) {
  const minX = margin;
  const maxX = worldW - margin;
  const minY = margin;
  const maxY = worldH - margin;
  if (e.x < minX) { e.x = minX; e.vx = Math.abs(e.vx); }
  else if (e.x > maxX) { e.x = maxX; e.vx = -Math.abs(e.vx); }
  if (e.y < minY) { e.y = minY; e.vy = Math.abs(e.vy); }
  else if (e.y > maxY) { e.y = maxY; e.vy = -Math.abs(e.vy); }
}

export function stepShip(ship, input, dt, mods = {}) {
  const axis = input.axis();
  const thrust = CONFIG.ship.thrust * (mods.thrustMul || 1);
  ship.vx += axis.x * thrust * dt;
  ship.vy += axis.y * thrust * dt;
  const damping = Math.pow(CONFIG.ship.damping, dt * 60);
  ship.vx *= damping;
  ship.vy *= damping;
  const maxSpeed = CONFIG.ship.maxSpeed * (mods.speedMul || 1);
  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > maxSpeed) {
    ship.vx = ship.vx / speed * maxSpeed;
    ship.vy = ship.vy / speed * maxSpeed;
  }
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  const radius = CONFIG.ship.radius;
  if (ship.x < radius) { ship.x = radius; ship.vx = Math.abs(ship.vx) * 0.35; }
  else if (ship.x > worldW - radius) { ship.x = worldW - radius; ship.vx = -Math.abs(ship.vx) * 0.35; }
  if (ship.y < radius) { ship.y = radius; ship.vy = Math.abs(ship.vy) * 0.35; }
  else if (ship.y > worldH - radius) { ship.y = worldH - radius; ship.vy = -Math.abs(ship.vy) * 0.35; }
  if (input.mouse?.moved) ship.angle = Math.atan2(input.mouse.y - ship.y, input.mouse.x - ship.x);
  ship.invuln = Math.max(0, ship.invuln - dt);
  ship.pulseCd = Math.max(0, ship.pulseCd - dt);
  ship.thrusting = Math.hypot(axis.x, axis.y) > 0;
}

export function magnetStep(pods, ship, dt, magnetR) {
  if (magnetR <= 0) return;
  for (const pod of pods) {
    const dx = ship.x - pod.x;
    const dy = ship.y - pod.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0 && distance < magnetR) {
      const travel = Math.min(distance, 140 * dt);
      pod.x += dx / distance * travel;
      pod.y += dy / distance * travel;
    }
  }
}
