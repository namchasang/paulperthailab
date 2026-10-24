# Roo Point Links (golf): notes for Claude

One-hole golf prototype on REAL terrain of the WA coast near Cape Naturaliste (fictional course name).
Live: https://namchasang.github.io/paulperthailab/golf/ (GitHub Pages of this repo). Owner: Paul (Paul Perth AI Lab). Reply in Thai.

## Files
- `index.html` is the whole game (single file, three.js r128 from cdnjs). Source parts live in `game-src/` (gamekit).
- Open `game-src/MAP.md`, grep, edit a part, then `python3 tools/gamekit.py build`. Never read index.html whole.
- The block between `/* PPL-LIB-START */` and `/* PPL-LIB-END */` is generated from the shared library `../lib/`.
  Change the library file in `lib/`, then from the repo root:
  `python3 lib/tools/libpack.py --into golf/index.html kangaroo magpie aussie-flora golfer golf-props sky-weather ocean heightfield`
  and `cd golf && python3 tools/gamekit.py build` (it re-splits). Do not edit the library parts inside game-src.
  Order matters: build any pending game-src edits FIRST, then run libpack, then build again. Running libpack while parts
  are edited makes gamekit stop (both changed), and a re-split renames parts and drops stale files.
- Terrain data: `const TERRAIN` part, made by `lib/tools/terrain-pack.py -33.5598 115.0089 2540 200 out.js` (200x200 samples, 12.7 m).

## Layout (game coords: metres, +x east, -z north, sea to the west)
- Tee (-60,-12) to green (-392,22), par 4, 334 m downhill toward the ocean. Pin = green centre + 3 m along, -2.5 m across.
- `H(x,z)` = real ground, softened in the course corridor, shaped green/tee/bunkers. `surface()` names the lie.
- Sea floor carved with `PPL.seaFloor` (tiles report sea as 0 m).
- Kangaroo mob 165-223 m from the tee; they startle and hop when a ball lands near. A ball can hit one.
- Aim helpers: `predictShot()` runs the same flight/roll physics as the real ball (wind included) and draws white flight
  dots, gold roll dots, a landing ring and an end marker; "มุมบน" button (or T) = top-down aim camera; mini map is baked once
  from `surface()` and redraws markers every 0.1 s; club chooser is the 2x2 grid bottom-left.
- Magpie: once per round, after a shot rests on fairway/rough, it carries the ball 20-35 m (no penalty).

## Test
`node tools/smoke.mjs` aborts the three.js CDN, so use a route to a local npm three@0.128 (see Game Builder lessons).
Hook: `window.__g` (`shoot(power, club)`, `step(n, dt, render)`, `setWx(i)`, `readyShot()`). Use `step(n)` without rendering for
long simulations, then render once and read the canvas with toDataURL: queued software-WebGL renders make screenshots time out.

## Rules
Fictional course name; no real club or brand names. Credit "Terrain Tiles on AWS (SRTM)". Look changes: show Paul a preview first.
