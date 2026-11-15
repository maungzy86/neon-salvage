export const CONFIG = {
  world: { W: 1280, H: 720 },
  ship: { radius: 14, thrust: 620, damping: 0.92, maxSpeed: 460 },
  pod: { radius: 11 },
  holdBase: 3,
  dock: { x: 640, y: 84, r: 46 },
  shard: { radiusSmall: 13, radiusBig: 26 },
  collisionDamage: { small: 14, big: 26 },
  pulse: { radius: 150, cooldownSec: 2.5 },
  combo: { windowSec: 6, maxMultiplier: 5 },
  deliveryScore: 100,
  waveTimeSec: 75,
  invulnerabilitySec: 1.2,
  colors: {
    ship: '#45f4ff',
    pod: '#c8ff5a',
    shard: '#ff4f8b',
    dock: '#45f4ff',
    pulse: '#ff4fd8',
  },
};

export function waveSpec(n) {
  const wave = Math.max(1, Math.floor(n));
  const quota = Math.min(3 + 2 * (wave - 1), 12);
  return {
    quota,
    timeSec: 75,
    shards: Math.min(5 + 2 * (wave - 1), 16),
    shardSpeed: Math.min(40 + 8 * (wave - 1), 120),
    pods: quota + 3,
  };
}
