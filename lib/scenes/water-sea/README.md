# Water Sea Engine (Paul Perth Library)

Clear shallow sea for three.js r128, made for Quokka Cafe's Rottnest and reusable in any game.

- `water-sea.js`: the engine. `WaterSea.create({renderer, scene, camera, size, heightAt, ground, palette, level})`, then `sea.render(t)` every frame (it renders the scene twice: without water for colour + depth, then with it), `sea.setLevel(y)`, `sea.setQuality(0|1)`, `sea.setSun(dir, colour, sky)`.
- `demo.html`: smallest working page.
- `lab.html`: the full lab Paul approved (13 Nov 2026): shallow sandy bay, Rottnest colours, swash, wet sand, breakers, boats, jetty, level slider, tide, time of day, fps.

What it draws: colour by real depth (seabed from the depth buffer), see-through water with refraction, caustics, sand ripples, wet sand that dries, backwash foam lines, swash running up the beach and back, waves breaking over sand bars, foam round anything at the waterline, sun glints and sky reflection.

Palette (Rottnest, from Paul's Thomson Bay and Bathurst photos): shallow `#5fe3d2`, mid `#20c3c8`, deep `#1593c4`, sand `#f2eedf`, foam `#fbfaf4`.

In Quokka Cafe the island sea (part `188-sea-beach-...`) uses these colours on its own distance-to-shore water; anchored boats are part `188-bay-boats-...`.
