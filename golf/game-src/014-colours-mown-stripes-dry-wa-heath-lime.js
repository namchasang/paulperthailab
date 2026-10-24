/* colours: mown stripes, dry WA heath, limestone on steep ground, white beach */
const CC = {}; const cc = h => CC[h] || (CC[h] = P.lin(h));
function groundColor(x, z, y, s, out){
  const sf = surface(x, z, y), [a, p] = toAP(x, z), n = P.fbm(x / 14, z / 14, 3), n2 = P.noise2(x / 3.3, z / 3.3);
  if (sf === 'water') { out.copy(cc('#c8b88f')).lerp(cc('#6e8a7a'), P.clamp(-y / 6, 0, 1)); return; }
  if (sf === 'green') { out.copy(((Math.floor((a + p * .5) / 3.2) & 1) ? cc('#6dbb4a') : cc('#63b043'))); }
  else if (sf === 'fringe' || sf === 'tee') out.copy(cc('#5ea83f'));
  else if (sf === 'fairway') out.copy((Math.floor(a / 9) & 1) ? cc('#6cad45') : cc('#5c9a39'));
  else if (sf === 'bunker') { out.copy(cc('#ead9ae')); out.offsetHSL(0, 0, n2 * .03); return; }
  else if (sf === 'rough') { out.copy(cc('#4f7d34')).lerp(cc('#77803f'), P.clamp(n * 1.4 + .3, 0, 1) * .6); }
  else if (sf === 'beach') { out.copy(cc('#ddcfac')).lerp(cc('#cdb991'), P.smooth(1.2, .2, y)); return; }
  else { out.copy(cc('#5d6a42')).lerp(cc('#948f62'), P.clamp(n * 1.5 + .35, 0, 1)); if (n2 > .3) out.lerp(cc('#c9b994'), .45);
    if (s > .12) out.lerp(cc('#b9ad90'), P.smooth(.12, .3, s)); }
  /* soften fairway/rough edges */
  if (sf === 'rough' || sf === 'fairway') { const e = Math.abs(Math.abs(p) - fwHalf(a)); if (a > 62 && a < LEN - 10 && e < 1.8) out.lerp(cc('#5a8e3a'), (1 - e / 1.8) * .5); }
  out.offsetHSL(0, 0, n2 * .025);
}
const NEAR = { x0: -575, x1: 35, z0: -165, z1: 185 };
const near = P.terrainMesh({ x0: NEAR.x0, z0: NEAR.z0, w: NEAR.x1 - NEAR.x0, d: NEAR.z1 - NEAR.z0, step: Q.has('lo') ? 4 : 2.5, height: H, color: groundColor, skirt: 4 });
scene.add(near);
const inNear = (x, z, m = 0) => x > NEAR.x0 + m && x < NEAR.x1 - m && z > NEAR.z0 + m && z < NEAR.z1 - m;
const far = P.terrainMesh({ x0: -3000, z0: -3000, w: 6000, d: 6000, step: 25, height: (x, z) => H(x, z) - (inNear(x, z, -3) ? 2 : 0), color: (x, z, y, s, o) => groundColor(x, z, y + (inNear(x, z, -3) ? 2 : 0), s, o) });
scene.add(far);
const sea = P.ocean({ size: 9000, seg: 260, cx: -1500, depth: (x, z) => -T0.h(x, z), env: W }); scene.add(sea);

/* ---------- vegetation (seeded so every player sees the same course) ---------- */
const R = P.rng(2026), pts = { pep: [], gum: [], gt: [], heath: [], tus: [], rock: [] };
const freeAt = (x, z) => { const y = H(x, z), s = surface(x, z, y); return s === 'native' || s === 'beach' ? y : null; };
const put = (k, x, z, s, sink = 0) => { const y = freeAt(x, z); if (y == null) return false; pts[k].push({ x, y: y - sink, z, s, ry: R() * 6.28 }); return true; };
for (let i = 0; i < 2600 && pts.pep.length < 95; i++) { const a = -60 + R() * (LEN + 140), p = (R() < .5 ? -1 : 1) * (48 + R() * 120), q = fromAP(a, p); put('pep', q.x, q.z, .8 + R() * .5); }
for (let i = 0; i < 3000 && pts.gum.length < 70; i++) { const x = -260 + R() * 1400, z = -700 + R() * 1400; if (T0.h(x, z) > 18) put('gum', x, z, .85 + R() * .45, .2); }
for (let i = 0; i < 6000 && pts.gt.length < 160; i++) { const x = -560 + R() * 900, z = -420 + R() * 840; put('gt', x, z, .8 + R() * .6); }
for (let i = 0; i < 16000 && pts.heath.length < 1700; i++) { const near = R() < .7, x = near ? -560 + R() * 700 : -560 + R() * 1100, z = near ? -250 + R() * 500 : -500 + R() * 1000; put('heath', x, z, .7 + R() * 1.1, .1); }
for (let i = 0; i < 9000 && pts.tus.length < 1100; i++) { const x = -575 + R() * 640, z = -260 + R() * 560; put('tus', x, z, .8 + R() * .8); }
for (let i = 0; i < 4000 && pts.rock.length < 60; i++) { const x = -560 + R() * 900, z = -400 + R() * 800; if (T0.slope(x, z) > .06 || R() < .25) put('rock', x, z, .5 + R() * 1.6, .35); }
/* granite boulders along the waterline and a big offshore rock (like the real coast) */
for (let z = -600; z < 600; z += 9) { let x = -700; while (x < -300 && T0.h(x, z) < .2) x += 4; if (R() < .55) pts.rock.push({ x: x - R() * 14, y: -.6, z: z + R() * 6, s: 1.5 + R() * 3.5, ry: R() * 6 }); }
pts.rock.push({ x: -790, y: -4, z: -240, s: 26, ry: .6 }, { x: -760, y: -3, z: -222, s: 12, ry: 2 });
const split = (arr, n) => { const o = Array.from({ length: n }, () => []); arr.forEach((p, i) => o[i % n].push(p)); return o; };
const veg = new THREE.Group(); scene.add(veg);
split(pts.pep, 4).forEach((a, i) => veg.add(P.scatter(P.peppermintGeo(i + 1), a)));
split(pts.gum, 3).forEach((a, i) => veg.add(P.scatter(P.gumGeo(i + 11), a)));
split(pts.gt, 3).forEach((a, i) => veg.add(P.scatter(P.grassTreeGeo(i + 21), a)));
split(pts.heath, 4).forEach((a, i) => { const m = P.scatter(P.heathGeo(i + 31), a); m.castShadow = false; veg.add(m); });
split(pts.tus, 3).forEach((a, i) => { const m = P.scatter(P.tussockGeo(i + 41), a); m.castShadow = false; veg.add(m); });
split(pts.rock, 4).forEach((a, i) => veg.add(P.scatter(P.boulderGeo(i + 51), a)));

