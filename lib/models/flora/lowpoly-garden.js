/* ==== PPL low-poly garden set (3d, flat-shaded) ====
   From Paul's reference sheets (Oct 2026): 30 garden plants built from faceted leaves, petals and clumps.
   PPL.LP_GARDEN[id].make(opts) -> THREE.Group sitting on y=0, about 1 unit tall (trees ~3).
   opts: {seed, scale, colour} — colour overrides the main flower or leaf colour where it makes sense.
   Note: Quokka Cafe draws its plants as pixel sprites; these models are for the low-poly games (Magpie, golf, new games). */
(function(){
const P = window.PPL;
const FLAT = {}; const fm = (c, o) => { const k = c + JSON.stringify(o || {}); if (FLAT[k]) return FLAT[k]; const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: .78, metalness: 0, flatShading: true }, o || {})); m.color = P.lin(c); return FLAT[k] = m; };
const rng = s => { s = (s | 0) || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const G = () => new THREE.Group();
const mesh = (geo, mat, g) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; if (g) g.add(m); return m; };
const GREEN = ['#3f9a3a', '#58b844', '#7ccc4c', '#2f8a46', '#4caa3c', '#9ad84e'];
const tint = (r, a) => a[(r() * a.length) | 0];

/* a faceted leaf: a folded diamond (midrib crease), length along +y, width on x, the crease lifts on z */
function leafGeo(len, wid, fold = .35, tipBend = 0) {
  const v = [0, 0, 0, -wid / 2, len * .42, wid * fold * .2, 0, len * .5, wid * fold, wid / 2, len * .42, wid * fold * .2, 0, len, len * tipBend,
             -wid * .32, len * .75, wid * fold * .1 + len * tipBend * .5, wid * .32, len * .75, wid * fold * .1 + len * tipBend * .5];
  const idx = [0, 1, 2, 0, 2, 3, 1, 5, 2, 2, 5, 4, 2, 4, 6, 2, 6, 3];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
const DS = THREE.DoubleSide;
/* place a leaf: from (x,y,z), pointing with yaw (around y) and tilt (from vertical) */
function leaf(g, len, wid, col, x, y, z, yaw, tilt, o = {}) { const m = mesh(leafGeo(len, wid, o.fold == null ? .35 : o.fold, o.bend || 0), fm(col, { side: DS }), null); const h = G(); h.position.set(x, y, z); h.rotation.y = yaw; m.rotation.x = tilt; h.add(m); g.add(h); return h; }
/* a lumpy faceted ball */
function blob(r, detail = 0, seed = 1, jit = .18) { const geo = new THREE.IcosahedronGeometry(r, detail); const p = geo.attributes.position, rr = rng(seed), seen = new Map();
  for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); let s = seen.get(k); if (s == null) { s = 1 + (rr() - .5) * jit * 2; seen.set(k, s); } p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s); }
  geo.computeVertexNormals(); return geo; }
/* a five-petal daisy facing up (tilt tips it) */
function daisy(g, x, y, z, r, petal, centre = '#f2b02a', tilt = 0, yaw = 0, n = 5) { const h = G(); h.position.set(x, y, z); h.rotation.set(tilt, yaw, 0);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const m = mesh(new THREE.CylinderGeometry(r * .5, r * .22, r * .12, 5), fm(petal), h); m.position.set(Math.cos(a) * r * .62, 0, Math.sin(a) * r * .62); m.rotation.y = -a; m.scale.set(1.2, 1, .72); }
  const c = mesh(new THREE.DodecahedronGeometry(r * .3, 0), fm(centre), h); c.position.y = r * .06; c.scale.y = .7; g.add(h); return h; }
const stem = (g, x1, y1, z1, x2, y2, z2, r, col) => { const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), L = a.distanceTo(b); const m = mesh(new THREE.CylinderGeometry(r * .7, r, L, 5), fm(col), g); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; };
/* a pinnate frond (fern): a curved stem with leaflet pairs shrinking to the tip */
function frond(g, len, col, yaw, tilt, seed) { const h = G(); h.rotation.set(0, yaw, 0); g.add(h); const n = 9, r = rng(seed); let px = 0, py = 0, pz = 0;
  for (let i = 0; i < n; i++) { const t = i / n, ang = tilt + t * .9, seg = len / n, nx = px, ny = py + Math.cos(ang) * seg, nz = pz + Math.sin(ang) * seg;
    stem(h, px, py, pz, nx, ny, nz, .012, '#4a8a2a'); const s = (1 - t) * .9 + .2;
    [-1, 1].forEach(sd => leaf(h, len * .22 * s, len * .1 * s, col, nx, ny, nz, sd * 1.4, ang + .3, { fold: .2 })); px = nx; py = ny; pz = nz; }
  leaf(h, len * .12, len * .05, col, px, py, pz, 0, tilt + .9, { fold: .2 }); return h; }
/* a lily pad: a flat faceted disc with a notch */
function pad(g, r, col, x, z, rot) { const s = new THREE.Shape(); const n = 12, gap = .5; s.moveTo(0, 0); for (let i = 0; i <= n; i++) { const a = gap / 2 + i / n * (Math.PI * 2 - gap); s.lineTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: r * .08, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); const m = mesh(geo, fm(col), g); m.position.set(x, 0, z); m.rotation.y = rot || 0;
  const top = mesh(new THREE.CircleGeometry(r * .5, 6, gap / 2, Math.PI * 2 - gap), fm('#7ccc4c'), g); top.rotation.x = -Math.PI / 2; top.position.set(x, r * .081, z); top.rotation.z = rot || 0; return m; }
/* ivy leaf: a five-point star, flat */
function ivyLeaf(g, r, col, x, y, z, yaw, tilt) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI * 2, rr = i % 2 ? r * .5 : r * (i === 0 ? 1.15 : 1); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? s.lineTo(px, py) : s.moveTo(px, py); } s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: r * .06, bevelEnabled: false }); const m = mesh(geo, fm(col), null); const h = G(); h.position.set(x, y, z); h.rotation.set(tilt || 0, yaw || 0, 0); h.add(m); g.add(h); return h; }
/* a hanging chain of leaves (vines) */
function hangChain(g, x, y, z, len, r, cols, seed, flowers) { const rr = rng(seed); const n = Math.round(len / (r * 1.2));
  for (let i = 0; i < n; i++) { const yy = y - i * r * 1.15, s = 1 - i / n * .45; [-1, 1].forEach(sd => leaf(g, r * 1.3 * s, r * 1.1 * s, tint(rr, cols), x + sd * r * .25, yy, z, sd * 1.2 + rr() * .4, Math.PI * .72, { fold: .3 }));
    if (flowers && i % 3 === 1) daisy(g, x + (rr() - .5) * r, yy - r * .3, z + r * .3, r * .55, flowers[i % flowers.length], '#f2b02a', Math.PI / 2.2); }
  if (flowers) { const b = mesh(new THREE.ConeGeometry(r * .3, r * .7, 5), fm(flowers[0]), g); b.position.set(x, y - n * r * 1.15, z); b.rotation.x = Math.PI; } }
/* a hedge clump of leafy balls along a path (straight or curved) */
function hedgeAlong(g, pts, h, w, seed, cols, flowers) { const rr = rng(seed); let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], l]); L += l; }
  const at = d => { for (const [a, b, l] of seg) { if (d <= l) { const t = d / l; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[0] - a[0], b[1] - a[1])]; } d -= l; } const [a, b] = seg[seg.length - 1]; return [b[0], b[1], Math.atan2(b[0] - a[0], b[1] - a[1])]; };
  /* the core: a clipped box (chamfered top corners) swept along the path, corners nudged a little so the faces read as facets */
  const c = Math.min(w, h) * .22, sec = [[-w / 2, 0], [w / 2, 0], [w / 2, h - c], [w / 2 - c, h], [-w / 2 + c, h], [-w / 2, h - c]], NS = sec.length;
  const n = Math.max(2, Math.ceil(L / (w * .45))), V = [], I = [];
  for (let r = 0; r <= n; r++) { const [x, z, dir] = at(r / n * L), nx = Math.cos(dir), nz = -Math.sin(dir), tx = Math.sin(dir), tz = Math.cos(dir), end = r === 0 || r === n;
    sec.forEach(([sx, sy]) => { const j = sy > 0 ? (rr() - .5) * w * .1 : 0, k = end ? 0 : (rr() - .5) * w * .08; const ox = sx + Math.sign(sx) * j, oy = sy > 0 ? sy + (rr() - .5) * h * .06 : 0;
      V.push(x + nx * ox + tx * k, oy, z + nz * ox + tz * k); }); }
  for (let r = 0; r < n; r++) for (let q = 0; q < NS; q++) { const a = r * NS + q, b = r * NS + (q + 1) % NS, a2 = a + NS, b2 = b + NS; I.push(a, b, b2, a, b2, a2); }
  /* end caps, pulled out a touch so the ends look rounded off rather than sawn */
  [[0, -1], [n, 1]].forEach(([r, sg]) => { const [x, z, dir] = at(r / n * L), tx = Math.sin(dir) * sg, tz = Math.cos(dir) * sg, base = V.length / 3; V.push(x + tx * w * .05, h * .45, z + tz * w * .05);
    for (let q = 0; q < NS; q++) sg > 0 ? I.push(base, r * NS + q, r * NS + (q + 1) % NS) : I.push(base, r * NS + (q + 1) % NS, r * NS + q); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(V, 3)); geo.setIndex(I); geo.computeVertexNormals(); mesh(geo, fm(cols[0], { side: DS }), g);
  /* leaves laid flat on the faces: two sides and the top */
  for (let k = 0; k < L * 90; k++) { const [x, z, dir] = at(.03 + rr() * (L - .06)); const side = rr() < .5 ? -1 : 1, ny = rr(); const nx = Math.cos(dir) * side, nz = -Math.sin(dir) * side; const yy = h * (.08 + ny * .72);
    leaf(g, w * .32, w * .27, tint(rr, cols), x + nx * w * .5, yy, z + nz * w * .5, Math.atan2(nx, nz), 1.45 + (rr() - .5) * .3, { fold: .35 }); }
  for (let k = 0; k < L * 55; k++) { const [x, z, dir] = at(.03 + rr() * (L - .06)); const o = (rr() - .5) * (w - c * 2); leaf(g, w * .3, w * .25, tint(rr, cols), x + Math.cos(dir) * o, h + .005, z - Math.sin(dir) * o, rr() * 6.3, 1.35 + rr() * .2, { fold: .3 }); }
  if (flowers) for (let k = 0; k < L * 15; k++) { const [x, z, dir] = at(.05 + rr() * (L - .1)); const o = (rr() - .5) * w * .7; daisy(g, x + Math.cos(dir) * o, h + .04, z - Math.sin(dir) * o, w * .17, tint(rr, flowers), '#f2b02a', (rr() - .5) * .3, rr() * 6); } }
/* a leafy shrub dome */
function shrub(g, r, h, cols, seed, flowers, centre) { const rr = rng(seed); const core = mesh(blob(r * .72, 1, seed, .1), fm(cols[0]), g); core.position.y = h * .48; core.scale.set(1, h / r * .85, 1);
  for (let k = 0; k < 70; k++) { const a = rr() * Math.PI * 2, el = -.15 + rr() * Math.PI * .5, x = Math.cos(a) * Math.cos(el) * r * .6, y = h * .48 + Math.sin(el) * h * .62, z = Math.sin(a) * Math.cos(el) * r * .6;
    leaf(g, r * .46, r * .38, tint(rr, cols), x, y, z, Math.PI / 2 - a, Math.PI / 2 - el - .2, { fold: .45 }); }
  for (let k = 0; k < 8; k++) { const a = rr() * 6.28; leaf(g, r * .4, r * .34, tint(rr, cols), Math.cos(a) * r * .2, h * .95, Math.sin(a) * r * .2, Math.PI / 2 - a, .5, { fold: .45 }); }
  if (flowers) for (let k = 0; k < 7; k++) { const a = rr() * Math.PI * 2, el = .35 + rr() * .9; daisy(g, Math.cos(a) * Math.cos(el) * r * .88, h * .48 + Math.sin(el) * h * .62, Math.sin(a) * Math.cos(el) * r * .88, r * .24, flowers[k % flowers.length], centre || '#f2b02a', (Math.PI / 2 - el) * .8, -a); } }

const L = {};
const def = (id, n, th, make) => { L[id] = { id, n, th, make: (o = {}) => { const g = G(); make(g, Object.assign({ seed: 7 }, o)); if (o.scale) g.scale.setScalar(o.scale); g.userData.asset = id; return g; } }; };
/* --- sheet 1: ponds and walls --- */
def('crevice-fern', 'Rock Crevice Fern', 'เฟิร์นซอกหิน', (g, o) => { const r = rng(o.seed); for (let i = 0; i < 13; i++) frond(g, .7 + r() * .3, tint(r, ['#7ccc4c', '#8ad85a', '#6abc3e']), i / 13 * 6.28 + r() * .3, .35 + r() * .5, o.seed + i); });
def('pond-broadleaf', 'Pond Edge Broadleaf', 'ไม้ใบกว้างริมบ่อ', (g, o) => { const r = rng(o.seed); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + r() * .4, t = .15 + r() * .55; stem(g, 0, 0, 0, Math.sin(a) * t * .35, .35 + r() * .2, Math.cos(a) * t * .35, .02, '#4a9a34');
  leaf(g, .75 + r() * .3, .34 + r() * .1, tint(r, ['#3f9a3a', '#58b844', '#2f8a46']), Math.sin(a) * t * .35, .4, Math.cos(a) * t * .35, a, t, { fold: .5 }); } });
def('grass-fan', 'Pond Grass Fan', 'หญ้าพัดริมบ่อ', (g, o) => { const r = rng(o.seed); for (let i = 0; i < 22; i++) { const a = (i / 22 - .5) * 2.6; leaf(g, .8 + r() * .5, .07 + r() * .03, tint(r, ['#58b844', '#7ccc4c', '#3f9a3a']), (r() - .5) * .12, 0, (r() - .5) * .08, (r() - .5) * .5, a * .45, { fold: .15, bend: .05 }); } });
def('water-lily', 'Pink Water Lily', 'บัวสีชมพู', (g, o) => { pad(g, .55, '#58b844', 0, 0, .3); const c = o.colour || '#f2a8d0'; [[8, .34, .7], [8, .26, 1.0], [6, .18, 1.25]].forEach(([n, len, tilt], k) => { for (let i = 0; i < n; i++) leaf(g, len, len * .55, k === 2 ? '#f8c8e0' : c, 0, .06, 0, i / n * 6.28 + k * .3, tilt, { fold: .55 }); });
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; const s = mesh(new THREE.CylinderGeometry(.012, .012, .1, 4), fm('#f2b02a'), g); s.position.set(Math.cos(a) * .05, .13, Math.sin(a) * .05); } mesh(new THREE.CylinderGeometry(.05, .06, .05, 6), fm('#e8c030'), g).position.y = .1; });
def('lily-pads', 'Lily Pad Set', 'ชุดใบบัว', (g, o) => { pad(g, .42, '#58b844', -.3, -.15, .2); pad(g, .36, '#4caa3c', .35, .3, 2.2); pad(g, .26, '#62bc48', .45, -.4, 4); const b = G(); b.position.set(.15, 0, -.35); g.add(b); for (let i = 0; i < 5; i++) leaf(b, .2, .12, i % 2 ? '#7ccc4c' : '#f2a8d0', 0, 0, 0, i / 5 * 6.28, .2, { fold: .6 }); });
def('lily-bud', 'Water Lily Bud', 'ดอกบัวตูม', (g, o) => { pad(g, .4, '#58b844', -.25, 0, .5); pad(g, .32, '#4caa3c', .3, .1, 2.8); stem(g, 0, 0, 0, .02, .75, 0, .025, '#5a9a34'); const top = G(); top.position.set(.02, .75, 0); g.add(top);
  for (let i = 0; i < 6; i++) leaf(top, .3, .14, i % 2 ? '#f2a8d0' : '#f8c0dc', 0, 0, 0, i / 6 * 6.28, .18, { fold: .5 }); for (let i = 0; i < 4; i++) leaf(top, .18, .1, '#5aa03a', 0, -.02, 0, i / 4 * 6.28 + .4, .5, { fold: .4 }); });
def('pink-vine', 'Pink Blossom Vine', 'เถาดอกชมพู', (g, o) => { const r = rng(o.seed); { const c = mesh(blob(.3, 1, 3, .12), fm('#3f9a3a'), g); c.position.y = 1.55; c.scale.set(1.5, .45, .8); } [-.3, -.12, .08, .28].forEach((x, i) => hangChain(g, x, 1.45, (i % 2) * .08, .7 + r() * .6, .07, GREEN.slice(0, 3), o.seed + i, [o.colour || '#f2a8c8', '#f8c8dc'])); });
def('purple-vine', 'Purple Blossom Vine', 'เถาดอกม่วง', (g, o) => { const r = rng(o.seed + 3); { const c = mesh(blob(.3, 1, 4, .12), fm('#3f9a3a'), g); c.position.y = 1.55; c.scale.set(1.5, .45, .8); } [-.3, -.1, .1, .3].forEach((x, i) => hangChain(g, x, 1.45, (i % 2) * .08, .7 + r() * .6, .07, GREEN.slice(0, 3), o.seed + 9 + i, [o.colour || '#a888e8', '#c8b0f4'])); });
def('ivy', 'Wall Climbing Ivy', 'ไอวี่เลื้อยผนัง', (g, o) => { const r = rng(o.seed); let x = 0, y = 0; const pts = [[0, 0]]; for (let i = 0; i < 7; i++) { x += (r() - .5) * .25; y += .2; pts.push([x, y]); }
  for (let i = 1; i < pts.length; i++) stem(g, pts[i - 1][0], pts[i - 1][1], 0, pts[i][0], pts[i][1], 0, .025 * (1 - i / 9), '#7a6a40');
  pts.forEach(([px, py], i) => { if (i % 2) { const s = r() < .5 ? -1 : 1; stem(g, px, py, 0, px + s * .22, py + .05, .02, .012, '#7a6a40'); ivyLeaf(g, .1, tint(r, ['#3f9a3a', '#58b844']), px + s * .28, py + .06, .04, 0, -.1); } ivyLeaf(g, .11 + r() * .03, tint(r, ['#3f9a3a', '#58b844', '#2f8a46']), px + (r() - .5) * .1, py, .03, 0, -.15); }); });
def('reeds', 'Pond Edge Reeds', 'กกริมบ่อ', (g, o) => { const r = rng(o.seed); for (let i = 0; i < 30; i++) { const a = r() * 6.28, d = r() * .14; leaf(g, .9 + r() * .7, .05 + r() * .03, tint(r, ['#58b844', '#7ccc4c', '#3f9a3a', '#9ad84e']), Math.cos(a) * d, 0, Math.sin(a) * d, a, r() * .35, { fold: .2, bend: .04 }); } });
/* --- sheet 2: flowers and borders --- */
const clump = (col) => (g, o) => { const r = rng(o.seed); for (let i = 0; i < 12; i++) leaf(g, .26 + r() * .1, .2, tint(r, ['#3f9a3a', '#58b844', '#2f8a46']), 0, 0, 0, i / 12 * 6.28, 1.15 + r() * .25, { fold: .45 });
  [[0, .32, 0, .2], [-.18, .22, .12, .16], [.18, .2, .1, .16], [.05, .2, -.18, .15]].forEach(([x, y, z, rr]) => { stem(g, 0, 0, 0, x, y, z, .015, '#4a9a34'); daisy(g, x, y, z, rr, o.colour || col, '#f2b02a', (x ? .3 : 0) * Math.sign(x || 1), Math.atan2(x, z)); }); };
def('daisy-pink', 'Pink Daisy Clump', 'ดอกเดซี่ชมพู', clump('#f2a8c8'));
def('daisy-white', 'White Daisy Clump', 'ดอกเดซี่ขาว', clump('#f8f6f0'));
def('daisy-yellow', 'Yellow Daisy Clump', 'ดอกเดซี่เหลือง', clump('#f8d040'));
def('border-straight', 'Straight Flower Border', 'แปลงดอกไม้แนวตรง', (g, o) => hedgeAlong(g, [[-.9, 0], [.9, 0]], .3, .36, o.seed, ['#3f9a3a', '#58b844', '#7ccc4c'], ['#f2a8c8', '#f8f6f0', '#f8d040']));
def('border-curved', 'Curved Flower Border', 'แปลงดอกไม้แนวโค้ง', (g, o) => { const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (.15 + i / 10 * .7); pts.push([Math.cos(a) * 1.1, -Math.sin(a) * 1.1 + .8]); } hedgeAlong(g, pts, .3, .36, o.seed, ['#3f9a3a', '#58b844', '#7ccc4c'], ['#f2a8c8', '#f8f6f0', '#f8d040']); });
def('groundcover', 'Groundcover Mat', 'ไม้คลุมดิน', (g, o) => { const r = rng(o.seed); const mound = mesh(blob(.55, 1, o.seed, .08), fm('#3f9a3a'), g); mound.scale.set(1, .16, 1); mound.position.y = .02; for (let i = 0; i < 110; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * .55; leaf(g, .16 + r() * .05, .14, tint(r, ['#58b844', '#7ccc4c', '#9ad84e', '#3f9a3a']), Math.cos(a) * d, .03 + (1 - d / .55) * .08, Math.sin(a) * d, r() * 6.28, 1.3 + r() * .2, { fold: .4 }); } });
def('lavender', 'Lavender Flower Spike', 'ลาเวนเดอร์', (g, o) => { const r = rng(o.seed); for (let i = 0; i < 10; i++) leaf(g, .3 + r() * .1, .1, tint(r, ['#3f9a3a', '#58b844']), 0, 0, 0, i / 10 * 6.28, .9 + r() * .3, { fold: .35 });
  [[0, .75, 0], [-.14, .65, .06], [.14, .62, -.04]].forEach(([x, h, z], k) => { stem(g, 0, 0, 0, x, h * .55, z, .014, '#4a8a34'); for (let j = 0; j < 7; j++) { const m = mesh(new THREE.OctahedronGeometry(.05 - j * .003, 0), fm(j % 2 ? '#9a70d8' : o.colour || '#8060c8'), g); m.position.set(x, h * .55 + j * .055, z); m.scale.y = 1.3; } }); });
def('vine-long', 'Long Hanging Vine', 'เถาห้อยยาว', (g, o) => { { const c = mesh(blob(.18, 1, 5, .12), fm('#58b844'), g); c.position.y = 1.58; c.scale.y = .5; } hangChain(g, 0, 1.5, 0, 1.4, .09, ['#58b844', '#7ccc4c', '#3f9a3a'], o.seed); });
def('vine-short', 'Short Hanging Vine', 'เถาห้อยสั้น', (g, o) => { { const c = mesh(blob(.2, 1, 6, .12), fm('#58b844'), g); c.position.y = .98; c.scale.y = .5; } hangChain(g, 0, .9, 0, .7, .1, ['#58b844', '#7ccc4c', '#3f9a3a'], o.seed + 2); });
def('vine-curtain', 'Vine Curtain', 'ม่านเถาวัลย์', (g, o) => { const r = rng(o.seed); for (let i = 0; i < 6; i++) { const c = mesh(blob(.2, 1, 10 + i, .12), fm(tint(r, ['#58b844', '#7ccc4c'])), g); c.position.set(-.75 + i * .3, 1.58, 0); c.scale.y = .5; }
  [-.7, -.35, 0, .35, .7].forEach((x, i) => hangChain(g, x, 1.5, 0, .8 + r() * .7, .085, ['#58b844', '#7ccc4c', '#3f9a3a'], o.seed + 20 + i)); });
/* --- sheet 3: trees, hedges and shrubs --- */
def('pine', 'Pine Tree', 'ต้นสน', (g, o) => { mesh(new THREE.CylinderGeometry(.12, .17, .6, 6), fm('#8a5a2a'), g).position.y = .3; [[.85, .9, .6], [.7, .8, 1.15], [.54, .7, 1.65], [.36, .6, 2.1]].forEach(([r, h, y], i) => { const c = mesh(new THREE.ConeGeometry(r, h, 7), fm(i % 2 ? '#2f9a50' : '#28884a'), g); c.position.y = y + h / 2 - .1; c.rotation.y = i * .4; }); });
def('round-tree', 'Round Canopy Tree', 'ต้นไม้พุ่มกลม', (g, o) => { mesh(new THREE.CylinderGeometry(.12, .18, .8, 6), fm('#8a5a2a'), g).position.y = .4; const c = mesh(blob(.75, 1, o.seed, .06), fm(o.colour || '#8ad84a'), g); c.position.y = 1.45; });
def('hedge-straight', 'Straight Hedge', 'รั้วต้นไม้แนวตรง', (g, o) => hedgeAlong(g, [[-1, 0], [1, 0]], .55, .5, o.seed, ['#3faa3a', '#58b844', '#8ad84a', '#2f9a46']));
def('hedge-curved', 'Curved Hedge', 'รั้วต้นไม้แนวโค้ง', (g, o) => { const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (.15 + i / 10 * .7); pts.push([Math.cos(a) * 1.2, -Math.sin(a) * 1.2 + .9]); } hedgeAlong(g, pts, .55, .5, o.seed, ['#3faa3a', '#58b844', '#8ad84a', '#2f9a46']); });
def('shrub-round', 'Rounded Shrub', 'พุ่มกลม', (g, o) => shrub(g, .5, .6, ['#58b844', '#7ccc4c', '#9ad84e', '#4caa3c'], o.seed));
def('shrub-dark', 'Dark Shrub', 'พุ่มเขียวเข้ม', (g, o) => shrub(g, .52, .55, ['#1f7a4a', '#28885a', '#2f9a5e', '#1a6a40'], o.seed + 1));
def('blossom-pink', 'Pink Blossom Bush', 'พุ่มดอกชมพู', (g, o) => shrub(g, .5, .55, ['#3faa3a', '#58b844', '#7ccc4c'], o.seed + 2, [o.colour || '#f2a8c8', '#f8b8d4']));
def('blossom-white', 'White Blossom Bush', 'พุ่มดอกขาว', (g, o) => shrub(g, .5, .55, ['#3faa3a', '#58b844', '#7ccc4c'], o.seed + 3, ['#f8f6f0', '#ffffff']));
def('fern-small', 'Small Fern', 'เฟิร์นเล็ก', (g, o) => { const r = rng(o.seed + 5); for (let i = 0; i < 8; i++) frond(g, .55 + r() * .2, tint(r, ['#7ccc4c', '#8ad85a']), i / 8 * 6.28, .25 + r() * .4, o.seed + 30 + i); });
def('broadleaf', 'Broadleaf Plant', 'ไม้ใบใหญ่', (g, o) => { const r = rng(o.seed + 6); for (let i = 0; i < 6; i++) leaf(g, .6 + r() * .15, .42, tint(r, ['#58b844', '#7ccc4c', '#9ad84e']), 0, .02, 0, i / 6 * 6.28, .7 + r() * .35, { fold: .55 }); leaf(g, .45, .32, '#7ccc4c', 0, .02, 0, .5, .15, { fold: .55 }); });
P.LP_GARDEN = L;
P.lpGarden = (id, o) => L[id] ? L[id].make(o) : null;
})();
