// Small synthesized soundscape; audio is created only after a user gesture.
export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let step = 0;
  const bpm = 140;
  const beatMs = 60000 / bpm;
  const bass = [55, 55, 65.41, 55, 82.41, 73.42, 65.41, 73.42]; // A1, C2, E2, D2
  const arp = [440, 523.25, 659.25, 523.25, 392, 523.25, 659.25, 523.25];

  function tone(freq, dur, type = 'sine', vol = 0.1, when = ctx?.currentTime ?? 0, slideTo) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, freq), when);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), when + dur);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function startMusic() {
    if (musicTimer) return;
    const tick = () => {
      if (!ctx || muted) return;
      const now = ctx.currentTime + 0.015;
      const i = step++ % bass.length;
      // Bass through a gentle low-pass; arp stays quiet and rounded.
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bass[i], now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + beatMs / 1000 * 0.82);
      osc.connect(filter).connect(gain).connect(musicGain);
      osc.start(now);
      osc.stop(now + beatMs / 1000 * 0.85);
      tone(arp[i], 0.11, 'triangle', 0.018, now + beatMs / 2000);
    };
    tick();
    musicTimer = setInterval(tick, beatMs);
  }

  function sfx(freq, dur, type, vol, slide) {
    if (ctx && !muted) tone(freq, dur, type, vol, ctx.currentTime, slide);
  }

  return {
    resume() {
      if (!ctx) {
        const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContextClass) return;
        ctx = new AudioContextClass();
        master = ctx.createGain();
        master.gain.value = 0.35;
        master.connect(ctx.destination);
        musicGain = ctx.createGain();
        musicGain.gain.value = 0.12;
        musicGain.connect(master);
      }
      if (ctx.state === 'suspended') ctx.resume();
      startMusic();
    },
    setMuted(m) {
      muted = Boolean(m);
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.35, ctx.currentTime, 0.015);
    },
    toggleMute() { this.setMuted(!muted); return muted; },
    get muted() { return muted; },
    pickup() { sfx(660, 0.09, 'sine', 0.075, 880); },
    deliver(combo = 1) { sfx(440 + Math.min(5, combo - 1) * 85, 0.2, 'triangle', 0.1, 880 + Math.min(5, combo - 1) * 110); },
    pulse() { sfx(180, 0.3, 'sine', 0.12, 720); },
    hit() { sfx(150, 0.2, 'sawtooth', 0.09, 65); },
    upgrade() { sfx(520, 0.22, 'triangle', 0.09, 1040); },
    gameOver() { sfx(330, 0.65, 'sawtooth', 0.1, 82); },
    waveClear() { sfx(392, 0.4, 'triangle', 0.1, 784); },
    click() { sfx(900, 0.045, 'square', 0.035, 650); },
  };
}
