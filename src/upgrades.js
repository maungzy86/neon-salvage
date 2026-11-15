// Upgrade effects are intentionally small, direct mutations of the run state.
export const UPGRADES = [
  { id: 'reinforced-hull', name: 'Reinforced Hull', desc: 'Max hull +25; heal 25 hull.', apply(world) { world.ship.maxHull += 25; world.ship.hull = Math.min(world.ship.maxHull, world.ship.hull + 25); } },
  { id: 'cargo-rack', name: 'Cargo Rack', desc: 'Cargo hold capacity +1 pod.', apply(world) { world.ship.holdCap += 1; } },
  { id: 'pulse-amp', name: 'Pulse Amplifier', desc: 'Pulse radius multiplier +0.35.', apply(world) { world.mods.pulseMul += 0.35; } },
  { id: 'ion-thrusters', name: 'Ion Thrusters', desc: 'Thrust multiplier +0.18; speed multiplier +0.08.', apply(world) { world.mods.thrustMul += 0.18; world.mods.speedMul += 0.08; } },
  { id: 'tractor-magnet', name: 'Tractor Magnet', desc: 'Salvage magnet radius +70.', apply(world) { world.mods.magnetR += 70; } },
  { id: 'field-repair', name: 'Field Repair', desc: 'Heal 40 hull.', apply(world) { world.ship.hull = Math.min(world.ship.maxHull, world.ship.hull + 40); } },
  { id: 'salvage-credits', name: 'Salvage Credits', desc: 'Score +150.', apply(world) { world.score += 150; } },
  { id: 'shield-plating', name: 'Shield Plating', desc: 'Max hull +10; heal 15 hull; gain 2 seconds of invulnerability.', apply(world) { world.ship.maxHull += 10; world.ship.hull = Math.min(world.ship.maxHull, world.ship.hull + 15); world.ship.invuln = 2; } },
];

export function pickUpgrades(rng) {
  const pool = [...UPGRADES];
  const picks = [];
  while (picks.length < 3 && pool.length) {
    const index = typeof rng.int === 'function' ? rng.int(0, pool.length - 1) : pool.indexOf(rng.pick(pool));
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}
