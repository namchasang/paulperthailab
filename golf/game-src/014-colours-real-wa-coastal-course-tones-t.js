/* colours: real WA coastal course tones. Turf = kikuyu/couch greens with mowing stripes and worn patches,
   rough = longer greener grass with straw seed heads, native = grey-green heath mosaic over pale sand. */
const CC = {}; const cc = h => CC[h] || (CC[h] = P.lin(h));
const hash2 = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function groundColor(x, z, y, s, out){
  const sf = surface(x, z, y), [a, p] = toAP(x, z);
  const n = P.fbm(x / 14, z / 14, 3), big = P.fbm(x / 60 + 7, z / 60, 2), n2 = P.noise2(x / 3.3, z / 3.3), j = hash2(x, z) - .5;
  if (sf === 'water') { out.copy(cc('#cdbb8e')).lerp(cc('#5f8476'), P.clamp(-y / 6, 0, 1)); return; }
  if (sf === 'green') { out.copy(cc('#5aa843')).lerp(cc('#67b44c'), (Math.floor((a + p * .5) / 3.2) & 1) * .8); out.lerp(cc('#4f9a3c'), P.clamp(n * .8 + .2, 0, 1) * .25); }
  else if (sf === 'fringe') out.copy(cc('#559b3c')).lerp(cc('#4c8f36'), P.clamp(n + .5, 0, 1) * .4);
  else if (sf === 'tee') out.copy(cc('#5aa23f')).lerp(cc('#64ab46'), (Math.floor(p / 1.5) & 1) * .6);
  else if (sf === 'fairway') {
    out.copy(cc('#5a9638')).lerp(cc('#6aa944'), (Math.floor(a / 9) & 1) * .85);            // mowing stripes
    out.lerp(cc('#7f9a45'), P.smooth(.05, .35, big) * .45);                                     // drier, yellower patches
    out.lerp(cc('#4a8530'), P.smooth(.1, .4, -big) * .35);                                      // lush hollows
    if (n2 > .32) out.lerp(cc('#8d9b55'), .25);                                                  // worn spots
  }
  else if (sf === 'bunker') { out.copy(cc('#e6d4a6')).lerp(cc('#d6c18e'), P.clamp(n + .5, 0, 1) * .5); out.offsetHSL(0, 0, j * .03); return; }
  else if (sf === 'rough') {
    out.copy(cc('#47752e')).lerp(cc('#567f34'), P.clamp(n * 1.2 + .5, 0, 1) * .7);
    out.lerp(cc('#9a965a'), P.smooth(.0, .4, big + n * .4) * .55);                              // straw seed heads
  }
  else if (sf === 'beach') { out.copy(cc('#ddcfab')).lerp(cc('#c4ae86'), P.smooth(1.2, .2, y)); if (y > 1.8) out.lerp(cc('#a8a375'), P.smooth(1.8, 3, y) * .5 * P.clamp(n + .6, 0, 1)); out.offsetHSL(0, 0, j * .03); return; }
  else { // native heath mosaic
    const m1 = P.clamp(n * 1.6 + .5, 0, 1), m2 = P.clamp(big * 2 + .5, 0, 1);
    out.copy(cc('#56653d')).lerp(cc('#6a7a52'), m1).lerp(cc('#9c9468'), m2 * .32);             // olive -> grey-green -> a little straw
    if (n2 > .36) out.lerp(cc('#cdbf98'), P.smooth(.36, .5, n2) * .6);                           // bare limesand, only in clearings
    if (n2 < -.3) out.lerp(cc('#465232'), .4);                                                   // dense shrub shade
    if (s > .12) out.lerp(cc('#b6aa8c'), P.smooth(.12, .32, s));                                 // limestone on steep ground
  }
  /* first cut between fairway and rough */
  if (sf === 'rough' || sf === 'fairway') { const e = Math.abs(Math.abs(p) - fwHalf(a)); if (a > 62 && a < LEN - 10 && e < 2.2) out.lerp(cc('#4f8a35'), (1 - e / 2.2) * .55); }
  out.offsetHSL(j * .006, 0, n2 * .02 + j * .025);
}
const NEAR = { x0: -575, x1: 35, z0: -165, z1: 185 };
const near = P.terrainMesh({ x0: NEAR.x0, z0: NEAR.z0, w: NEAR.x1 - NEAR.x0, d: NEAR.z1 - NEAR.z0, step: Q.has('lo') ? 4 : 2.5, height: H, color: groundColor, skirt: 4 });
scene.add(near);
const inNear = (x, z, m = 0) => x > NEAR.x0 + m && x < NEAR.x1 - m && z > NEAR.z0 + m && z < NEAR.z1 - m;
const far = P.terrainMesh({ x0: -3000, z0: -3000, w: 6000, d: 6000, step: 25, height: (x, z) => H(x, z) - (inNear(x, z, -3) ? 2 : 0), color: (x, z, y, s, o) => groundColor(x, z, y + (inNear(x, z, -3) ? 2 : 0), s, o) });
scene.add(far);
const sea = P.ocean({ size: 9000, seg: 260, cx: -1500, depth: (x, z) => -T0.h(x, z), env: W }); scene.add(sea);

