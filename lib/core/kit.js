/* ==== PPL core kit: shared helpers for every Paul Perth library item ====
   Needs THREE r128 loaded first. Everything lives on window.PPL. */
(function(){
const P = window.PPL = window.PPL || {};
P.ver = '0.1';
P.items = P.items || {};
P.reg = (id, meta) => { P.items[id] = meta; };

/* seeded random: same seed -> same tree, rock, mob of roos */
P.rng = seed => { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
P.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
P.lerp = (a, b, t) => a + (b - a) * t;
P.smooth = (a, b, x) => { const t = P.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
P.V3 = (x, y, z) => new THREE.Vector3(x, y, z);
/* colours are written as sRGB hex (what you see in a colour picker); the renderer works in linear light */
P.lin = c => new THREE.Color(c).convertSRGBToLinear();

/* value noise 2D (cheap, tileable enough for ground breakup) */
P.noise2 = (() => {
  const p = new Uint8Array(512), R = P.rng(1337);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = (R() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const g = (h, x, y) => { h &= 7; const u = h < 4 ? x : y, v = h < 4 ? y : x; return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v); };
  const f = t => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = f(x), v = f(y), a = p[X] + Y, b = p[X + 1] + Y;
    return P.lerp(P.lerp(g(p[a], x, y), g(p[b], x - 1, y), u), P.lerp(g(p[a + 1], x, y - 1), g(p[b + 1], x - 1, y - 1), u), v) * 0.25;
  };
})();
P.fbm = (x, y, oct = 4) => { let s = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { s += a * P.noise2(x * f, y * f); f *= 2; a *= .5; } return s; };

/* geometry helpers: transform, vertex-paint, merge (vertex colours keep draw calls low) */
P.tr = (g, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
  if (sx !== 1 || sy !== 1 || sz !== 1) g.scale(sx, sy, sz);
  if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz);
  g.translate(x, y, z); return g;
};
P.paint = (g, cols, jitter = 0, seed = 1) => {
  g = g.index ? g.toNonIndexed() : g;
  const n = g.attributes.position.count, c = new Float32Array(n * 3), R = P.rng(seed), cs = cols.map(x => P.lin(x));
  for (let f = 0; f < n; f += 3) {
    const col = cs[(R() * cs.length) | 0].clone(); if (jitter) col.offsetHSL(0, 0, (R() - .5) * jitter);
    for (let k = 0; k < 3 && f + k < n; k++) { c[(f + k) * 3] = col.r; c[(f + k) * 3 + 1] = col.g; c[(f + k) * 3 + 2] = col.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
};
P.merge = list => {
  const gs = list.map(g => { g = g.index ? g.toNonIndexed() : g; if (!g.attributes.normal) g.computeVertexNormals(); return g; });
  let n = 0; gs.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  gs.forEach(g => {
    const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); o += c;
  });
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  m.computeBoundingSphere(); return m;
};

/* materials (cached) */
const MC = {};
P.mat = (color, o) => { const k = color + JSON.stringify(o || {}); if (MC[k]) return MC[k]; const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: .85 }, o || {})); m.color = P.lin(color); return MC[k] = m; };
P.vmat = o => P.mat('#ffffff', Object.assign({ vertexColors: true }, o || {}));

/* canvas texture helper */
P.ctex = (w, h, draw, repeat) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  t.anisotropy = 4; return t;
};
/* soft grey noise used as a detail map on terrain, bark, rock */
P.detailTex = (() => { let t; return () => t || (t = P.ctex(256, 256, (x, w, h) => {
  const d = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = 178 + 90 * (0.45 * P.fbm(i / 20, j / 20, 4) + 0.55 * P.noise2(i / 2.2, j / 2.2));
    const k = (j * w + i) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = P.clamp(v, 95, 255); d.data[k + 3] = 255;
  }
  x.putImageData(d, 0, 0);
}, 1)); })();

P.shadowAll = (o, cast = true, recv = false) => { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return o; };
})();
