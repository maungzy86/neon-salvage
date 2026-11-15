import { CONFIG } from './config.js';

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

export function drawWorld(ctx, world, tNow) {
  const { W, H } = CONFIG.world;
  const t = tNow / 1000;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050914'); bg.addColorStop(0.55, '#091328'); bg.addColorStop(1, '#080817');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  for (const [x, y, radius, color] of [[260, 230, 260, '65,40,150'], [950, 500, 300, '0,110,150'], [900, 100, 180, '150,30,105']]) {
    const nebula = ctx.createRadialGradient(x, y, 0, x, y, radius);
    nebula.addColorStop(0, `rgba(${color},0.11)`); nebula.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = nebula; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const parallaxX = ((world.ship?.x ?? W / 2) - W / 2) * 0.025;
  const parallaxY = ((world.ship?.y ?? H / 2) - H / 2) * 0.025;
  for (const s of world.backgroundStars) {
    const x = (s.x - parallaxX + W) % W;
    const y = (s.y - parallaxY + H) % H;
    ctx.globalAlpha = s.alpha; ctx.fillStyle = '#c9e9ff';
    ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  const dock = CONFIG.dock, carrying = world.ship?.hold?.length > 0;
  ctx.save(); ctx.translate(dock.x, dock.y);
  const pulse = carrying ? 1 + Math.sin(t * 5) * 0.06 : 1;
  ctx.scale(pulse, pulse);
  ctx.shadowColor = CONFIG.colors.dock; ctx.shadowBlur = carrying ? 24 : 12;
  ctx.strokeStyle = 'rgba(69,244,255,0.72)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, dock.r, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(69,244,255,0.2)'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(0, 0, dock.r - 8, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([8, 10]); ctx.lineDashOffset = -t * 18;
  ctx.strokeStyle = '#9afaff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, dock.r + 7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(69,244,255,0.08)'; ctx.beginPath(); ctx.arc(0, 0, dock.r - 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8cfaff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DOCK', 0, 4);
  ctx.restore();

  for (const pod of world.pods) {
    const bob = Math.sin((pod.bob || 0) + t * 2.2) * 4;
    ctx.save(); ctx.translate(pod.x, pod.y + bob); ctx.rotate(Math.sin(t + (pod.bob || 0)) * 0.08);
    ctx.shadowColor = CONFIG.colors.pod; ctx.shadowBlur = 15;
    roundedRect(ctx, -8, -12, 16, 24, 5); ctx.fillStyle = '#183023'; ctx.fill();
    ctx.strokeStyle = CONFIG.colors.pod; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0; roundedRect(ctx, -4, -7, 8, 14, 3); ctx.fillStyle = CONFIG.colors.pod; ctx.fill();
    ctx.fillStyle = '#e8ffab'; ctx.fillRect(-2, -5, 3, 10); ctx.restore();
  }

  for (const shard of world.shards) {
    ctx.save(); ctx.translate(shard.x, shard.y); ctx.rotate(shard.rot);
    const verts = shard.verts || [1, 0.8, 1.1, 0.75, 1.2, 0.9, 1.05];
    ctx.beginPath();
    verts.forEach((v, i) => { const a = i / verts.length * Math.PI * 2; const x = Math.cos(a) * shard.r * v, y = Math.sin(a) * shard.r * v; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.closePath(); ctx.fillStyle = shard.big ? '#211321' : '#171e2a'; ctx.fill();
    ctx.strokeStyle = shard.big ? '#ff4f8b' : '#8c9aaa'; ctx.lineWidth = shard.big ? 2.4 : 1.5;
    ctx.shadowColor = shard.big ? '#ff4f8b' : '#78899c'; ctx.shadowBlur = shard.big ? 11 : 5; ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.11)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-shard.r * 0.25, 0); ctx.lineTo(shard.r * 0.35, -shard.r * 0.3); ctx.stroke(); ctx.restore();
  }

  if (world.pulseFx) {
    const fx = world.pulseFx, progress = 1 - fx.t / fx.life;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - progress); ctx.strokeStyle = CONFIG.colors.pulse;
    ctx.shadowColor = CONFIG.colors.pulse; ctx.shadowBlur = 18; ctx.lineWidth = 4 * (1 - progress) + 1;
    ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * progress, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.t / p.life); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + p.t / p.life * 0.5), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.t / f.life); ctx.fillStyle = f.color;
    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = f.color; ctx.shadowBlur = 8; ctx.fillText(f.text, f.x, f.y); ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  const ship = world.ship;
  if (ship) {
    ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle);
    if (ship.thrusting) {
      const flicker = 0.7 + (Math.sin(t * 38) + 1) * 0.2;
      ctx.fillStyle = 'rgba(255,79,216,0.8)'; ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(-11, -5); ctx.lineTo(-11 - 16 * flicker, 0); ctx.lineTo(-11, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#baffff'; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-10 - 9 * flicker, 0); ctx.lineTo(-10, 2); ctx.fill();
    }
    if (ship.invuln > 0 && Math.floor(t * 18) % 2 === 0) {
      ctx.strokeStyle = 'rgba(119,250,255,0.75)'; ctx.lineWidth = 2; ctx.shadowColor = '#45f4ff'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(0, 0, CONFIG.ship.radius + 8, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowColor = CONFIG.colors.ship; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(-11, -10); ctx.lineTo(-6, 0); ctx.lineTo(-11, 10); ctx.closePath();
    ctx.fillStyle = '#102c38'; ctx.fill(); ctx.strokeStyle = CONFIG.colors.ship; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.ellipse(3, 0, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    for (let i = 0; i < ship.hold.length; i++) {
      ctx.fillStyle = CONFIG.colors.pod; ctx.shadowColor = CONFIG.colors.pod; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(ship.x - (ship.hold.length - 1) * 5 + i * 10, ship.y + 23, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}
