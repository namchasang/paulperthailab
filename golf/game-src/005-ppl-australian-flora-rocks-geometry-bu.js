/* ==== PPL Australian flora & rocks (geometry builders; one draw call each with vertex colours) ====
   Each returns a BufferGeometry (cached per seed). Place many with PPL.scatter(geo, points).
   PPL.gumGeo(seed)        eucalyptus / marri: pale trunk, open clumpy crown       ~14 m
   PPL.peppermintGeo(seed) WA peppermint: dark trunk, weeping layered crown        ~7 m
   PPL.grassTreeGeo(seed)  grass tree: black trunk, green skirt, spike             ~2.2 m
   PPL.heathGeo(seed)      coastal heath shrub, grey-green dome                    ~1 m
   PPL.tussockGeo(seed)    tussock grass clump                                     ~0.5 m
   PPL.turfGeo(seed)       short green rough-grass clump                       ~0.25 m
   PPL.boulderGeo(seed)    granite boulder, lichen speckles                        ~1 m (scale it)  */
(function(){
const P = window.PPL, C = {};
const cache = (k, f) => C[k] || (C[k] = f());
const blob = (R, cols, x, y, z, s, sy, det = 1) => P.shadeY(P.paint(P.tr(new THREE.IcosahedronGeometry(1, det), x, y, z, s * (0.85 + R() * .3), s * (sy || .7), s * (0.85 + R() * .3), 0, R() * 6), cols, .12, (R() * 1e6) | 0), .62, 1.18);
const branch = (R, cols, x0, y0, z0, x1, y1, z1, r0, r1) => {
  const a = P.V3(x0, y0, z0), b = P.V3(x1, y1, z1), len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, 6); g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(P.V3(0, 1, 0), b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); g.translate(x0, y0, z0);
  return P.paint(g, cols, .08, (R() * 1e6) | 0);
};
P.gumGeo = (seed = 1) => cache('gum' + seed, () => {
  const R = P.rng(seed), L = [], bark = ['#d9d2c2', '#cfc6b2', '#e4ddcd', '#b9ad96'], leaf = ['#5a6b4f', '#66775a', '#4e5e45', '#72825f', '#5f6a44'];
  const H = 9 + R() * 6; L.push(branch(R, bark, 0, 0, 0, (R() - .5) * 1.2, H * .55, (R() - .5) * 1.2, .45, .3));
  const top = P.V3(0, H * .55, 0);
  const nb = 4 + (R() * 3 | 0);
  for (let i = 0; i < nb; i++) {
    const a = i / nb * 6.28 + R(), r = 2 + R() * 3.5, y = H * (.75 + R() * .25);
    const ex = Math.cos(a) * r, ez = Math.sin(a) * r;
    L.push(branch(R, bark, top.x, top.y, top.z, ex, y, ez, .26, .1));
    const n = 3 + (R() * 3 | 0);
    for (let k = 0; k < n; k++) L.push(blob(R, leaf, ex + (R() - .5) * 2.6, y + (R() - .2) * 1.8, ez + (R() - .5) * 2.6, 1.2 + R() * 1.1, .8));
  }
  return P.merge(L);
});
P.peppermintGeo = (seed = 1) => cache('pep' + seed, () => {
  const R = P.rng(seed), L = [], bark = ['#4b3b2e', '#5a4636', '#3e3027'], leaf = ['#34502a', '#3e5c30', '#2e4724', '#4a6a36'];
  const lean = (R() - .5) * .8; L.push(branch(R, bark, 0, 0, 0, lean, 2.6, (R() - .5) * .6, .28, .18));
  for (let i = 0; i < 4; i++) { const a = i * 1.7 + R(), r = 1.4 + R() * 1.3; L.push(branch(R, bark, lean, 2.5, 0, lean + Math.cos(a) * r, 4 + R() * 1.4, Math.sin(a) * r, .14, .06)); }
  for (let k = 0; k < 22; k++) { // dense rounded crown that droops at the rim
    const a = R() * 6.28, r = Math.sqrt(R()) * 3.2, y = 4.4 + (1 - r / 3.2) * 2.2 - r * .25 + R() * .6;
    L.push(blob(R, leaf, lean + Math.cos(a) * r, y, Math.sin(a) * r, 1 + R() * .6, .75));
  }
  return P.merge(L);
});
P.grassTreeGeo = (seed = 1) => cache('gt' + seed, () => {
  const R = P.rng(seed), L = [], h = .7 + R() * .9;
  L.push(P.paint(P.tr(new THREE.CylinderGeometry(.16, .22, h, 8), 0, h / 2, 0), ['#211b17', '#2b241f'], .1, seed));
  for (let k = 0; k < 70; k++) { // fountain of thin leaves
    const a = R() * 6.28, tilt = .25 + R() * 1.15, len = .9 + R() * .5;
    const c = new THREE.ConeGeometry(.018, len, 3); c.translate(0, len / 2, 0); c.rotateZ(tilt); c.rotateY(a); c.translate(0, h, 0);
    L.push(P.paint(c, tilt > 1.1 ? ['#9a8a56', '#8a7a4a'] : ['#6f8a3c', '#7d9846', '#5f7a32'], .1, k + seed * 99));
  }
  if (R() < .6) L.push(P.paint(P.tr(new THREE.CylinderGeometry(.02, .035, 1.6, 5), 0, h + .8, 0), ['#5a4a32'], 0, seed), P.paint(P.tr(new THREE.CylinderGeometry(.045, .045, .7, 6), 0, h + 1.35, 0), ['#6b5a3c', '#7a6a4a'], .1, seed));
  return P.merge(L);
});
P.heathGeo = (seed = 1) => cache('heath' + seed, () => {
  const R = P.rng(seed), L = [], cols = R() < .5 ? ['#7d8c6a', '#8a9a74', '#6f7e5e'] : ['#5f6e4a', '#6c7b55', '#56653f'];
  for (let k = 0; k < 6; k++) L.push(blob(R, cols, (R() - .5) * .9, .35 + R() * .3, (R() - .5) * .9, .35 + R() * .3, .75, 0));
  if (R() < .35) for (let k = 0; k < 8; k++) L.push(P.paint(P.tr(new THREE.IcosahedronGeometry(.05, 0), (R() - .5) * 1, .55 + R() * .35, (R() - .5) * 1), [R() < .5 ? '#e8c43a' : '#f0f0e8'], 0, k));
  return P.merge(L);
});
P.tussockGeo = (seed = 1) => cache('tus' + seed, () => {
  const R = P.rng(seed), L = [];
  for (let k = 0; k < 22; k++) {
    const a = R() * 6.28, tilt = R() * .7, len = .35 + R() * .3;
    const c = new THREE.ConeGeometry(.02, len, 3); c.translate(0, len / 2, 0); c.rotateZ(tilt); c.rotateY(a);
    L.push(P.paint(c, ['#a8a46a', '#9a9a5e', '#b8b07a', '#8a8f55'], .1, k + seed * 31));
  }
  return P.merge(L);
});
P.turfGeo = (seed = 1) => cache('turf' + seed, () => { // short green rough-grass clump, ~0.25 m
  const R = P.rng(seed), L = [];
  for (let k = 0; k < 9; k++) { const a = R() * 6.28, tilt = .15 + R() * .5, len = .16 + R() * .14;
    const c = new THREE.ConeGeometry(.025, len, 3); c.translate(0, len / 2, 0); c.rotateZ(tilt); c.rotateY(a); c.translate((R() - .5) * .15, 0, (R() - .5) * .15);
    L.push(P.shadeY(P.paint(c, ['#4f7a30', '#5b8838', '#466e2a', '#6f8a3e'], .08, k + seed * 13), .7, 1.15)); }
  return P.merge(L);
});
P.boulderGeo = (seed = 1) => cache('rock' + seed, () => {
  const R = P.rng(seed), g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = P.V3(p.getX(i), p.getY(i), p.getZ(i)), n = 1 + .22 * P.fbm(v.x * 1.3 + seed, v.y * 1.3 + v.z, 3);
    v.multiplyScalar(n); v.y = v.y > 0 ? v.y * .75 : v.y * .4; p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return P.paint(g, ['#9a948a', '#a8a298', '#8c867c', '#b3ab9c', '#7f8c6a'], .1, seed);
});
