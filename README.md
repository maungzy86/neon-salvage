# Neon Salvage

An original orbital salvage arcade game — pilot a salvage skiff, haul supply pods back to the station dock against the clock, chain deliveries for combo multipliers, blast debris with a pulse, draft upgrades between waves, and survive escalating waves.

![make.fun best-game-01](https://make.fun/badge/best-game-01.svg) ![rank](https://make.fun/badge/best-game-01/maungzy86/neon-salvage/rank.svg) ![reward](https://make.fun/badge/best-game-01/maungzy86/neon-salvage/reward.svg)

[make.fun — best-game-01](https://make.fun/bounty/best-game-01)

## How to play

- WASD/arrows thrust with inertia; mouse aims.
- Touch pods to load them (hold capacity 3, upgradeable).
- Fly into the dock ring to deliver (100 pts x combo; deliveries within 6 seconds chain the combo up to x5).
- Space or click fires the pulse blast (destroys small debris, shoves big debris, 2.5s cooldown).
- Debris collisions damage the hull.
- Each wave has a delivery quota and a 75-second timer (missing quota costs hull).
- Clearing a wave drafts 1 of 3 upgrades.
- Hull at zero ends the run.
- P/Esc pause; M mute.
- Best score is kept in localStorage.

## Run it locally

Use any static file server over the `game/` folder, e.g. `npx serve game` or `python3 -m http.server --directory game`, then open in desktop Chrome. No build step, no network requests, everything is a local file.

## Tech

Vanilla JavaScript ES modules split by job under `game/src/` (config, random, input, audio, entities, world, render, hud, upgrades, shots, main), canvas 2D rendering, WebAudio synthesized sound and music, deterministic seeded runs and `?shot=` screenshot modes. `main.ts` at the root packages `game/` + `screenshots/` into the make.fun dossier format.

Building on make.fun too? [Join with referral code 7vbpbe2y](https://make.fun/r/7vbpbe2y)

## License

MIT (see LICENSE).
