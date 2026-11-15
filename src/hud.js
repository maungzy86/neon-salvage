import { CONFIG } from './config.js';

export function createHud(world, audio, callbacks = {}) {
  const get = id => globalThis.document?.getElementById(id) || null;
  const scoreValue = get('score-value'), best = get('hud-best'), waveValue = get('wave-value'), quotaValue = get('quota-value');
  const timerFill = get('hud-timerbar')?.querySelector('.fill'), hullFill = get('hud-hullbar')?.querySelector('.fill');
  const cargo = get('cargo-pips'), pulse = get('hud-pulse'), pulseFill = pulse?.querySelector('.fill');
  const combo = get('hud-combo'), comboFill = combo?.querySelector('.fill');
  let toastTimer;

  function update() {
    if (scoreValue) scoreValue.textContent = String(world.score).padStart(6, '0');
    if (best) best.textContent = `BEST ${String(world.best || 0).padStart(6, '0')}`;
    if (waveValue) waveValue.textContent = String(world.wave || 0).padStart(2, '0');
    if (quotaValue) quotaValue.textContent = `${world.delivered || 0}/${world.quota || 0}`;
    const maxTime = world.spec?.timeSec || CONFIG.waveTimeSec;
    const timeRatio = maxTime > 0 ? Math.max(0, Math.min(1, (world.timeLeft || 0) / maxTime)) : 0;
    if (timerFill) { timerFill.style.width = `${timeRatio * 100}%`; timerFill.classList.toggle('danger', (world.timeLeft || 0) < 15); }
    const ship = world.ship || {};
    const hullRatio = ship.maxHull > 0 ? Math.max(0, Math.min(1, (ship.hull || 0) / ship.maxHull)) : 0;
    if (hullFill) { hullFill.style.width = `${hullRatio * 100}%`; hullFill.style.backgroundColor = hullRatio < 0.3 ? '#ff4f8b' : hullRatio < 0.6 ? '#ffd166' : ''; }
    if (cargo) {
      cargo.replaceChildren();
      for (let i = 0; i < (ship.holdCap || 0); i++) {
        const pip = document.createElement('span');
        if (i < (ship.hold?.length || 0)) pip.classList.add('filled');
        cargo.appendChild(pip);
      }
    }
    const cooldown = Math.max(0, ship.pulseCd || 0);
    if (pulse) {
      const label = pulse.querySelector('.label');
      if (label) label.textContent = cooldown <= 0 ? 'PULSE READY' : `PULSE ${cooldown.toFixed(1)}s`;
    }
    if (pulseFill) pulseFill.style.width = `${(1 - Math.min(1, cooldown / CONFIG.pulse.cooldownSec)) * 100}%`;
    if (combo) {
      combo.hidden = (world.combo || 1) <= 1;
      const text = combo.querySelector('strong');
      if (text) text.textContent = `COMBO x${world.combo || 1}`;
    }
    if (comboFill) comboFill.style.width = `${Math.max(0, Math.min(1, (world.comboT || 0) / CONFIG.combo.windowSec)) * 100}%`;
  }

  function showScreen(name) {
    for (const screenName of ['title', 'upgrade', 'over', 'pause']) get(`screen-${screenName}`)?.classList.toggle('show', name === screenName);
    if (name === 'upgrade') {
      const cards = get('upgrade-cards');
      if (!cards) return;
      cards.replaceChildren();
      for (const upgrade of world.pendingUpgrades || []) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'upgrade-card';
        const title = document.createElement('strong'); title.textContent = upgrade.name;
        const desc = document.createElement('span'); desc.textContent = upgrade.desc;
        button.append(title, desc);
        button.addEventListener('click', () => callbacks.onUpgrade?.(upgrade));
        cards.appendChild(button);
      }
    }
    if (name === 'over') {
      const stats = get('over-stats');
      if (stats) stats.textContent = `SCORE ${world.score} · WAVE ${world.wave} · PODS ${world.totalDelivered ?? world.delivered ?? 0} · BEST ${world.best || 0}`;
    }
    if (name === 'title') { const titleBest = get('title-best'); if (titleBest) titleBest.textContent = `BEST RUN · ${String(world.best || 0).padStart(6, '0')}`; }
  }

  get('btn-start')?.addEventListener('click', () => { audio?.resume?.(); callbacks.onStart?.(); });
  get('btn-restart')?.addEventListener('click', () => { audio?.resume?.(); callbacks.onRestart?.(); });
  function toast(msg) {
    const el = get('toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
    globalThis.clearTimeout(toastTimer);
    toastTimer = globalThis.setTimeout(() => el.classList.remove('show'), 1600);
  }
  return { update, showScreen, toast };
}
