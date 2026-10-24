# Paul Perth Library (PPL)

Shared building blocks for every Paul Perth game. Browse: https://namchasang.github.io/paulperthailab/lib/

- `catalog.json` lists every item: `ready` (code is in lib/ now) or `planned` (still inside a game; `from` says where).
- Groups: core, models/fauna, models/flora, models/people, models/vehicles, models/buildings, models/props,
  env, terrain, systems, audio, brand.
- Items are plain scripts for three.js r128 that add functions to `window.PPL` (no build step, no modules).
- Colours are written as sRGB hex; use `PPL.lin(hex)` / `PPL.mat(hex)` so they render true under sRGB + ACES output.

## Use in a game (games stay single files)
```
python3 lib/tools/libpack.py --into <game>/index.html kangaroo sky-weather ...   # replaces the PPL-LIB block
```
The game needs the markers `/* PPL-LIB-START */` and `/* PPL-LIB-END */` inside a `<script>` after three.js.
Dependencies (kit first) are added automatically. For a game in another repo, copy the generated block in.

## Add or move an item
1. Put the code in the right folder as a self-contained IIFE that uses `window.PPL` helpers, ends with `P.reg(id, {...})`.
2. Add or update its catalog entry (`status: ready`, `file`, `deps`, `from`, `th`).
3. Add a preview to `index.html` (PREV map) so Paul can see it.
4. When moving a `planned` item out of a game, keep the game working: re-pack the game with libpack and test it.

## Real terrain
`python3 lib/tools/terrain-pack.py LAT LON SIZE_M N out.js` cuts real elevation (Terrain Tiles on AWS) into a JS constant
for `PPL.heightfield`. Then `PPL.seaFloor`, `PPL.limitSlope` (keep grades playable, Roo Road lesson) and `PPL.terrainMesh`.
