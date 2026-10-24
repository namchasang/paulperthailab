/* ==== PPL ocean: depth-tinted sea with moving ripples, sun glitter and shore foam ====
   const sea = PPL.ocean({size:6000, seg:220, depth:(x,z)=>metres below sea level (>0 = water)});
   scene.add(sea); each frame: sea.userData.tick(dt)   ·  add env: W (skyWeather) to reflect the sky
   Colours: turquoise over sand shallows, deep Indian-Ocean blue offshore, white foam band at the shore. */
(function(){
const P = window.PPL;
P.ocean = (o = {}) => {
  const size = o.size || 6000, seg = o.seg || 200, depth = o.depth || (() => 20);
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  const foam = P.lin('#f4f7f6'), shal = P.lin(o.shallow || '#3fc0bd'), mid = P.lin(o.mid || '#1a7fa6'), deep = P.lin(o.deep || '#0b3d6e');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (o.cx || 0), z = p.getZ(i) + (o.cz || 0), d = depth(x, z), c = new THREE.Color();
    if (d < .4) c.copy(foam); else if (d < 1.6) c.copy(foam).lerp(shal, (d - .4) / 1.2); else if (d < 8) c.copy(shal).lerp(mid, (d - 1.6) / 6.4); else c.copy(mid).lerp(deep, P.clamp((d - 8) / 30, 0, 1));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  /* ripple normal map drawn from layered noise */
  const nTex = P.ctex(256, 256, (x, w, h) => {
    const d = x.createImageData(w, h), H = (i, j) => P.fbm(i / 22, j / 22, 4) + .35 * P.noise2(i / 6, j / 6);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const dx = H(i + 1, j) - H(i - 1, j), dy = H(i, j + 1) - H(i, j - 1), k = (j * w + i) * 4;
      d.data[k] = 128 + dx * 160; d.data[k + 1] = 128 + dy * 160; d.data[k + 2] = 255; d.data[k + 3] = 255;
    }
    x.putImageData(d, 0, 0);
  }, size / 40);
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .24, metalness: 0, normalMap: nTex, normalScale: new THREE.Vector2(.4, .4) });
  if (o.env) { const use = t => { m.envMap = t; m.envMapIntensity = 1; m.needsUpdate = true; }; if (o.env.env) use(o.env.env); o.env.onEnv.push(use); } // pass the skyWeather object
  const sea = new THREE.Mesh(g, m); sea.receiveShadow = true; sea.position.set(o.cx || 0, o.y || 0, o.cz || 0);
  let t = 0; sea.userData.tick = dt => { t += dt; nTex.offset.set(t * .012, t * .007); sea.position.y = (o.y || 0) + Math.sin(t * .5) * .08; };
  return sea;
};
P.reg('ocean', { group: 'env', from: 'new (golf)' });
})();
/* ==== PPL real-terrain heightfield + terrain mesh builder ====
   Real elevation comes from Terrain Tiles on AWS (terrarium PNG), cut and packed by
   lib/tools/terrain-pack.py into base64 Int16 decimetres (n x n samples over `size` metres).

   const T = PPL.heightfield({b64, n:200, size:2540});    // centre of the grid = world (0,0)
   T.h(x,z) smooth height in metres (Catmull-Rom), T.normal(x,z), T.slope(x,z) (0 flat .. 1 vertical)
   PPL.limitSlope(T, maxGrade=.15, passes)  // Roo Road lesson: real data is too steep to play, ease it
   PPL.terrainMesh({x0,z0,w,d,step,height:(x,z)=>y,color:(x,z,y,slope,out)=>void, skirt:3}) -> Mesh  */
(function(){
const P = window.PPL;
P.heightfield = (o) => {
  const n = o.n, size = o.size, cell = size / (n - 1), half = size / 2;
  let H = o.data;
  if (!H) { const bin = atob(o.b64), dv = new DataView(new ArrayBuffer(2)); H = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) { dv.setUint8(0, bin.charCodeAt(i * 2)); dv.setUint8(1, bin.charCodeAt(i * 2 + 1)); H[i] = dv.getInt16(0, true) / 10 * (o.scaleY || 1); } }
  const at = (i, j) => H[P.clamp(j, 0, n - 1) * n + P.clamp(i, 0, n - 1)];
  const cr = (a, b, c, d, t) => b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
  const T = { n, size, cell, data: H, at };
  T.h = (x, z) => {
    const fx = (x + half) / cell, fz = (z + half) / cell, i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
    const r = k => cr(at(i - 1, j + k), at(i, j + k), at(i + 1, j + k), at(i + 2, j + k), tx);
    return cr(r(-1), r(0), r(1), r(2), tz);
  };
  T.normal = (x, z, e = 1.5, fn) => { const f = fn || T.h; return P.V3(f(x - e, z) - f(x + e, z), 2 * e, f(x, z - e) - f(x, z + e)).normalize(); };
  T.slope = (x, z, fn) => 1 - T.normal(x, z, 1.5, fn).y;
  return T;
};
P.limitSlope = (T, maxGrade = .15, passes = 6) => {
  const { n, cell, data: H } = T, lim = maxGrade * cell;
  for (let p = 0; p < passes; p++) for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
    const k = j * n + i; let avg = (H[k - 1] + H[k + 1] + H[k - n] + H[k + n]) / 4;
    if (Math.abs(H[k] - avg) > lim) H[k] = avg + Math.sign(H[k] - avg) * lim;
  }
};
