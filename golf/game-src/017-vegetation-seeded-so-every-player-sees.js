/* ---------- vegetation (seeded so every player sees the same course) ---------- */
const R = P.rng(2026), pts = { pep: [], gum: [], gt: [], heath: [], tus: [], rock: [] };
const freeAt = (x, z) => { const y = H(x, z), s = surface(x, z, y); return s === 'native' || s === 'beach' ? y : null; };
const put = (k, x, z, s, sink = 0) => { const y = freeAt(x, z); if (y == null) return false; pts[k].push({ x, y: y - sink, z, s, ry: R() * 6.28 }); return true; };
for (let i = 0; i < 2600 && pts.pep.length < 95; i++) { const a = -60 + R() * (LEN + 140), p = (R() < .5 ? -1 : 1) * (48 + R() * 120), q = fromAP(a, p); put('pep', q.x, q.z, .8 + R() * .5); }
for (let i = 0; i < 3000 && pts.gum.length < 70; i++) { const x = -260 + R() * 1400, z = -700 + R() * 1400; if (T0.h(x, z) > 18) put('gum', x, z, .85 + R() * .45, .2); }
for (let i = 0; i < 6000 && pts.gt.length < 160; i++) { const x = -560 + R() * 900, z = -420 + R() * 840; put('gt', x, z, .8 + R() * .6); }
for (let i = 0; i < 26000 && pts.heath.length < (Q.has('lo') ? 1400 : 2800); i++) { const near = R() < .7, x = near ? -560 + R() * 700 : -560 + R() * 1100, z = near ? -250 + R() * 500 : -500 + R() * 1000; put('heath', x, z, .7 + R() * 1.1, .1); }
for (let i = 0; i < 9000 && pts.tus.length < 1100; i++) { const x = -575 + R() * 640, z = -260 + R() * 560; put('tus', x, z, .8 + R() * .8); }
for (let i = 0; i < 4000 && pts.rock.length < 60; i++) { const x = -560 + R() * 900, z = -400 + R() * 800; if (T0.slope(x, z) > .06 || R() < .25) put('rock', x, z, .5 + R() * 1.6, .35); }
/* granite boulders along the waterline and a big offshore rock (like the real coast) */
for (let z = -600; z < 600; z += 9) { let x = -700; while (x < -300 && T0.h(x, z) < .2) x += 4; if (R() < .55) pts.rock.push({ x: x - R() * 14, y: -.6, z: z + R() * 6, s: 1.5 + R() * 3.5, ry: R() * 6 }); }
pts.rock.push({ x: -790, y: -4, z: -240, s: 26, ry: .6 }, { x: -760, y: -3, z: -222, s: 12, ry: 2 });
const split = (arr, n) => { const o = Array.from({ length: n }, () => []); arr.forEach((p, i) => o[i % n].push(p)); return o; };
const veg = new THREE.Group(); scene.add(veg);
const TREE = { h: .12, l: .14 }, LOW = { h: .18, l: .18 };
split(pts.pep, 4).forEach((a, i) => veg.add(P.scatter(P.peppermintGeo(i + 1), a, null, { tint: TREE, seed: i + 1 })));
split(pts.gum, 3).forEach((a, i) => veg.add(P.scatter(P.gumGeo(i + 11), a, null, { tint: TREE, seed: i + 11 })));
split(pts.gt, 3).forEach((a, i) => veg.add(P.scatter(P.grassTreeGeo(i + 21), a, null, { tint: LOW, seed: i + 21 })));
split(pts.heath, 4).forEach((a, i) => { const m = P.scatter(P.heathGeo(i + 31), a, null, { tint: LOW, seed: i + 31 }); m.castShadow = false; veg.add(m); });
split(pts.tus, 3).forEach((a, i) => { const m = P.scatter(P.tussockGeo(i + 41), a, null, { tint: LOW, seed: i + 41 }); m.castShadow = false; veg.add(m); });
split(pts.rock, 4).forEach((a, i) => veg.add(P.scatter(P.boulderGeo(i + 51), a, null, { tint: { l: .1 }, seed: i + 51 })));
/* short green clumps along the rough, thickest at the fairway edge */
const turf = [];
for (let i = 0; i < 14000 && turf.length < (Q.has('lo') ? 700 : 2200); i++) { const a = -10 + R() * (LEN + 40), p = (R() < .5 ? -1 : 1) * (fwHalf(a) + Math.pow(R(), 1.6) * 30), q = fromAP(a, p), y = H(q.x, q.z);
  if (surface(q.x, q.z, y) === 'rough') turf.push({ x: q.x, y: y - .02, z: q.z, s: .8 + R() * .9, ry: R() * 6.28 }); }
split(turf, 3).forEach((a, i) => { const m = P.scatter(P.turfGeo(i + 61), a, null, { tint: LOW, seed: i + 61 }); m.castShadow = false; veg.add(m); });
/* contact shade on the ground under trees and shrubs (soft, baked into the terrain colours) */
(function bakeShade(){
  const cell = 8, gridS = new Map(), key = (i, k) => i * 100003 + k;
  const add = (arr, r, d) => arr.forEach(p => { const i = Math.floor(p.x / cell), k = Math.floor(p.z / cell); const kk = key(i, k); if (!gridS.has(kk)) gridS.set(kk, []); gridS.get(kk).push([p.x, p.z, r * (p.s || 1), d]); });
  add(pts.pep, 4.2, .42); add(pts.gum, 5.2, .32); add(pts.heath, 1.1, .3); add(pts.gt, 1.2, .25); add(pts.rock, 1.4, .3);
  const pos = near.geometry.attributes.position, col = near.geometry.attributes.color;
  for (let v = 0; v < pos.count; v++) { const x = pos.getX(v), z = pos.getZ(v), i0 = Math.floor(x / cell), k0 = Math.floor(z / cell); let dark = 0;
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let k = k0 - 1; k <= k0 + 1; k++) { const g = gridS.get(key(i, k)); if (!g) continue;
      for (const [px, pz, r, d] of g) { const dd = Math.hypot(x - px, z - pz); if (dd < r) dark = Math.max(dark, d * (1 - dd / r)); } }
    if (dark > 0) { const f = 1 - dark; col.setXYZ(v, col.getX(v) * f, col.getY(v) * f, col.getZ(v) * f); } }
  col.needsUpdate = true;
})();

