# Paul Engine (PE) v0.1

A small game engine for Paul Perth games: three.js r128 + the Paul Perth Library (`lib/`).
Editor: https://namchasang.github.io/paulperthailab/engine/editor/ · Samples: `engine/play/<cafe|gas|thai>/`

## Files
| File | What it is |
| --- | --- |
| `paul-engine.js` | Core: `PE.World` (scene from JSON, iso camera, time of day, shadows, night glow, movers, picking), smooth + true-pixel renderer, asset registry, thumbnails, `PE.UI` bubbles/pops, sounds, save |
| `pe-assets.js` | ~80 assets in metres (tiles, buildings, service points, nature, props, cars, people, markers) + wrappers for PPL models |
| `pe-hd.js` | HD pixel set (Look Lab, waiting for Paul's OK): 4 buildings + 6 nature pieces painted at 32 px/m with PXKIT (`lib/models/buildings/pxkit.js`), cut-out leaf cards, night windows via emissive maps. Compare page: `engine/lab/hd/` |
| `pe-shop.js` | Shop-management template `PE.Shop` and `PE.boot(scene, element)` |
| `pe-samples.js` | Sample scenes: `cafe` (Rottnest), `gas` (Osaka, pixel look), `thai` (Perth Thai restaurant), `blank` |
| `editor.src.html` | Scene editor source. Build with `python3 engine/tools/pack.py` → `editor/index.html` (GitHub Pages) and `editor/artifact.html` (Claude artifact) |

Load order: three.js r128 → `lib/core/kit.js` (+ PPL models) → `paul-engine.js` → `pe-assets.js` → `pe-shop.js` → `pe-samples.js`.

## Scene JSON (what the editor saves and exports)
```json
{ "v":1, "name":"KAZE Station", "template":"shop|viewer",
  "ground":{"w":52,"d":40,"color":"#8e8b86"}, "time":16,
  "style":{"mode":"smooth|pixel","palette":40,"outline":true,"dither":true},
  "view":{"yaw8":0,"zoom":1,"tx":0,"tz":0},
  "objects":[{"a":"gas-canopy","x":0,"z":0,"r":0,"c":"#1c3f8f","t":"KAZE","s":1}],
  "paths":[{"kind":"walk|car|animal","pts":[[-26,15],[26,15]],"n":2,"sp":9,"loop":"pp"}],
  "game":{"cur":"¥","unit":100,"money":300,"items":[{"k":"C","name":"กาแฟ","enName":"Coffee","price":5,"col":"#7d532e"}],"extras":[],"carItems":[],"carExtras":[]} }
```
`a` = asset id, `r` = quarter turns, `c` = colour, `t` = sign text, `s` = scale. Units are metres; fronts face +z, cars drive along +x.

## Add an asset
```js
PE.reg('my-thing', { name:'ของใหม่', cat:'prop', snap:.5, tint:true, defaults:{c:'#d43a2c'},
  build(o){ const g=new THREE.Group(); PE.B(g,1,1,1,o.c,0,.5,0); PE.light(g,0,1.2,0); return g; } });
```
Pixel skins: give a material `emissiveMap` + mesh `userData.emis` for night glow; cut-out cards need `material.userData.mask` (white = solid) so the pixel outline pass sees their shape. `PE.World({hueShift:true})` warms lights and cools shadows before the palette step.
Helpers: `PE.B` box, `PE.C` cylinder, `PE.S` blob, `PE.roof` gable roof, `PE.glowBox` (day/night colour), `PE.light` (night point light), `PE.panel` + `PE.textTex` (signs).
Service roles: `role:'counter'` (walk-in customers) or `role:'pump'` (cars), `serve:[dx,dz]` = where the customer stands. Markers `spawn-walk` / `spawn-car` set where customers come from.
`fit:{h|len|w}` scales a model to real size (used for PPL models with their own units).

## Game templates
- `shop` (บริหารร้าน): needs at least one service point. Tap bubbles to serve, green offers to upsell, staff auto-serve, upgrades, day summary, TH/EN/JA.
- `viewer`: walk around the scene, movers only.
Planned next: driving template (Roo Road style), Godot export of scene JSON, more PPL assets as they get approved.

## Rules (from Paul)
Fictional brands and car designs only. Look changes go through a lab/preview before going live. Deliver playable links, not zip files.
