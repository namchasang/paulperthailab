/* ==== Paul Engine HD pixel set (Look Lab, Nov 2026) ====
   Buildings and nature with hand-style pixel skins painted at 32 px per metre (same scale as PXKIT and the
   32 px people), so they stay sharp when the camera comes close in pixel mode.
   - Walls, roofs, windows, doors: PXKIT painters (lib/models/buildings/pxkit.js) + a few new ones here
     (awning stripes, roller shutter, window grille, iron lace, sign boards).
   - Foliage: a solid painted core + cut-out leaf cards, so tree outlines are ragged clusters, not balls.
   - Night: windows glow through emissive maps (lit minus day), no extra geometry.
   Category 'hd' in the editor. All names on signs are fictional. */
(function(){
'use strict';
const T = THREE, P = window.PPL, PE = window.PE, K = window.PXK;
if (!K) { console.warn('pe-hd needs lib/models/buildings/pxkit.js'); return; }
const PPM = 32, INK = '#2a2230';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
const px = (x, c, X, Y, W = 1, H = 1) => { x.fillStyle = c; x.fillRect(X | 0, Y | 0, W | 0, H | 0); };
let S = 1; const rnd = () => (S = (S * 16807) % 2147483647) / 2147483647, seed = s => { S = (s | 0) % 2147483646 + 1; };
const sh = K.sh, mix = K.mix;
/* nearest when close (crisp texels), mipmapped when far (no sparkle when a 32 px/m wall is seen small) */
const tex = c => { const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.encoding = T.sRGBEncoding; return t; };
const MAT = new Map();
const mat = (c, o = {}) => { const m = new T.MeshStandardMaterial(Object.assign({ map: tex(c), roughness: .92 }, o)); return m; };
/* a material whose glass lights up at night: day canvas + lit canvas -> emissive map of the difference */
const glowMat = (day, lit) => { const m = mat(day); m.emissive = new T.Color(1, 1, 1); m.emissiveMap = tex(K.glowDiff(day, lit)); m.emissiveIntensity = 0; return m; };
const plain = c => P.mat(c);
/* box with one canvas (or colour) per face: order +x -x +y -y +z -z */
function box(g, w, h, d, faces, x, y, z, glowFaces) {
  const ms = faces.map((f, i) => !f ? plain('#888888') : typeof f === 'string' ? plain(f) : f.isMaterial ? f : mat(f));
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), ms); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  if (glowFaces) m.userData.emis = 1; g.add(m); return m;
}
/* gable roof, ridge along x: two textured slopes + plain gable ends */
function gable(g, w, d, h, roofCanvas, endColor, y, over = .35) {
  const L = Math.hypot(d / 2 + over, h), a = Math.atan2(h, d / 2 + over), m = mat(roofCanvas), m2 = mat(roofCanvas);
  [[1, m], [-1, m2]].forEach(([s, mm]) => { const p = new T.Mesh(new T.PlaneGeometry(w + over * 2, L), mm); p.material.side = T.DoubleSide; p.rotation.order = 'YXZ'; p.rotation.x = -Math.PI / 2 + s * a; if (s < 0) p.rotation.y = Math.PI; p.position.set(0, y + h / 2, s * (d / 2 + over) / 2); p.castShadow = p.receiveShadow = true; g.add(p); });
  const sh2 = new T.Shape(); sh2.moveTo(-d / 2, 0); sh2.lineTo(d / 2, 0); sh2.lineTo(0, h); sh2.lineTo(-d / 2, 0);
  [-1, 1].forEach(s => { const e = new T.Mesh(new T.ShapeGeometry(sh2), plain(endColor)); e.rotation.y = Math.PI / 2; e.position.set(s * w / 2, y, 0); e.material.side = T.DoubleSide; e.castShadow = true; g.add(e); });
}
/* ---------- new painters ---------- */
function stripes(w, h, a, b, n = 8) { const [c, x] = cv(w * PPM, h * PPM); const sw = c.width / n; for (let i = 0; i < n; i++) { px(x, i % 2 ? a : b, i * sw, 0, sw + 1, c.height); px(x, sh(i % 2 ? a : b, 1.15), i * sw, 0, 1, c.height); } for (let X = 0; X < c.width; X += 2) px(x, sh(a, .6), X, c.height - 2, 1, 2); px(x, INK, 0, c.height - 1, c.width, 1); return c; }
function valance(w, a, b) { const [c, x] = cv(w * PPM, 10); const sw = c.width / (w * 3); for (let i = 0; i * sw < c.width; i++) { const col = i % 2 ? a : b; px(x, col, i * sw, 0, sw, 7); for (let k = 0; k < sw; k++) { const yy = 7 + Math.round(Math.sin(k / sw * Math.PI) * 3); px(x, col, i * sw + k, 7, 1, yy - 7); } } px(x, INK, 0, 0, c.width, 1); return c; }
function shutter(w, h, open = .55, base = '#9aa0aa', lit = false) {
  const [c, x] = cv(w * PPM, h * PPM), H = c.height, W = c.width, top = Math.round(H * (1 - open));
  for (let y = 0; y < top; y += 3) { px(x, sh(base, .95 + ((y / 3) % 2) * .08), 0, y, W, 3); px(x, sh(base, 1.15), 0, y, W, 1); px(x, sh(base, .7), 0, y + 2, W, 1); }
  px(x, sh(base, .55), 0, top, W, 3); px(x, '#c9a35a', W / 2 - 3, top + 1, 6, 1);
  const shop = K.glass(W, H - top - 3, { lit, tint: '#8a7a68', seed: 5 }); x.drawImage(shop, 0, top + 3);
  px(x, INK, 0, 0, 2, H); px(x, INK, W - 2, 0, 2, H); return c;
}
function grilleWindow(x, X, Y, w, h, lit) {
  K.win(x, X, Y, w, h, { lit, box: false, sash: false, frame: '#e9e2d0' });
  const g = '#3a3f4a'; for (let k = -h; k < w; k += 6) for (let j = 0; j < h; j++) { const a = X + k + j, b = X + k + h - j; if (a >= X && a < X + w && (j % 2 === 0)) px(x, g, a, Y + j); if (b >= X && b < X + w && (j % 2 === 0)) px(x, g, b, Y + j); }
  px(x, g, X, Y, w, 1); px(x, g, X, Y + h - 1, w, 1); px(x, g, X, Y, 1, h); px(x, g, X + w - 1, Y, 1, h);
}
function shophouseFloor(w, h, base, lit, sd) {
  seed(sd); const [c, x] = cv(w * PPM, h * PPM), W = c.width, H = c.height; K.seed(sd); K.plaster(x, W, H, base);
  for (let i = 0; i < 6; i++) { const X = rnd() * W | 0; for (let y = 0; y < H * (.3 + rnd() * .5); y++) if (rnd() < .7) px(x, sh(base, .82), X + (rnd() < .2 ? 1 : 0), y); }
  const ww = Math.min(W - 24, 70), wh = Math.min(H - 34, 50); grilleWindow(x, (W - ww) / 2, 18, ww, wh, lit);
  px(x, sh(base, 1.1), 0, H - 6, W, 2); px(x, sh(base, .6), 0, H - 4, W, 1); return c;
}
function lace(w) { const [c, x] = cv(w * PPM, 14); for (let X = 0; X < c.width; X++) { px(x, '#e8e4dc', X, 0); px(x, '#e8e4dc', X, 13); const k = X % 12; if (k === 0 || k === 6) px(x, '#e8e4dc', X, 1, 1, 12); const r = Math.abs(6 - k); px(x, '#e8e4dc', X, 2 + r, 1, 1); px(x, '#e8e4dc', X, 11 - r, 1, 1); if (k === 3 || k === 9) px(x, '#e8e4dc', X, 6, 1, 2); } return c; }
function maskOf(c) { const [m, x] = cv(c.width, c.height); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height), o = x.createImageData(c.width, c.height); for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i + 3] > 127 ? 255 : 0; o.data[i] = o.data[i + 1] = o.data[i + 2] = v; o.data[i + 3] = 255; } x.putImageData(o, 0, 0); const t = new T.CanvasTexture(m); t.magFilter = t.minFilter = T.NearestFilter; t.generateMipmaps = false; return t; }
/* cut-out card (leaves, lace, grass): alpha-tested, both sides, casts a matching shadow */
function card(c, w, h) {
  const m = new T.MeshStandardMaterial({ map: tex(c), alphaTest: .5, side: T.DoubleSide, roughness: .95 }); m.userData.mask = maskOf(c);
  const mesh = new T.Mesh(new T.PlaneGeometry(w, h), m); mesh.castShadow = mesh.receiveShadow = true;
  mesh.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: m.map, alphaTest: .5 }); return mesh;
}
function sign(text, w, h, fg, bg, sd) {
  const [c, x] = cv(w * PPM, h * PPM), W = c.width, H = c.height; px(x, INK, 0, 0, W, H); px(x, bg, 2, 2, W - 4, H - 4); px(x, sh(bg, 1.2), 2, 2, W - 4, 1); px(x, sh(bg, .7), 2, H - 3, W - 4, 1);
  x.font = `bold ${Math.floor(H * .56)}px "Mitr","Noto Sans Thai",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = sh(bg, .45); x.fillText(text, W / 2 + 1, H / 2 + 2); x.fillStyle = fg; x.fillText(text, W / 2, H / 2 + 1);
  return c;
}
/* ---------- foliage ---------- */
const RAMPS = {
  gum: ['#33482f', '#4f6a48', '#6f8a62', '#93a982', '#b9c8a2'], green: ['#24461f', '#356329', '#4f8536', '#73a84a', '#a5cc6a'],
  sakura: ['#9a4a64', '#c86a86', '#e796ac', '#f6bfcd', '#fde4ea'], palm: ['#2a4a1c', '#3f6a26', '#5a8c32', '#82b048', '#b0d070'], dry: ['#6a6a3a', '#8a8a4a', '#aaa45a', '#c8bc72', '#e0d490'] };
function leafCanvas(ramp, sd, size = 40) {
  seed(sd); const [c, x] = cv(size, size), r = size / 2;
  for (let i = 0; i < size * 5; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * .92, X = r + Math.cos(a) * d, Y = r + Math.sin(a) * d * .9; const t = (Y / size) * .9 + rnd() * .25, k = Math.min(4, Math.max(0, Math.floor((1 - t) * 4.2)));
    px(x, ramp[k], X, Y, 2 + (rnd() < .4 ? 1 : 0), 2); if (k >= 3 && rnd() < .3) px(x, ramp[4], X, Y); }
  const d = x.getImageData(0, 0, size, size), D = d.data; for (let y = 1; y < size - 1; y++) for (let X = 1; X < size - 1; X++) { const i = (y * size + X) * 4; if (D[i + 3] && !D[((y + 1) * size + X) * 4 + 3]) { D[i] = D[i] * .55; D[i + 1] = D[i + 1] * .55; D[i + 2] = D[i + 2] * .6; } }
  x.putImageData(d, 0, 0); return c;
}
function crown(g, cx, cy, cz, r, rampKey, sd, cards = 9, squash = .8) { cards = Math.round(cards * 1.5);
  const ramp = RAMPS[rampKey], core = new T.Mesh(P.shadeY(P.paint(new T.IcosahedronGeometry(r * .6, 1), ramp.slice(0, 2), .05, sd), .55, 1.05), P.vmat({ flatShading: true })); core.scale.y = squash; core.position.set(cx, cy, cz); core.castShadow = core.receiveShadow = true; g.add(core);
  seed(sd * 7 + 3); for (let i = 0; i < cards; i++) { const a = rnd() * Math.PI * 2, el = (rnd() - .3) * 1.1, s = r * (.75 + rnd() * .5); const m = card(leafCanvas(ramp, sd * 31 + i), s * 1.2, s * 1.05);
    m.position.set(cx + Math.cos(a) * Math.cos(el) * r * .72, cy + Math.sin(el) * r * squash * .8, cz + Math.sin(a) * Math.cos(el) * r * .72); m.rotation.y = -a + Math.PI / 2 + (rnd() - .5) * .6; g.add(m); }
}
function barkCanvas(base, h, pale) { const [c, x] = cv(24, Math.max(8, h * PPM)); K.seed(9); K.plaster(x, c.width, c.height, base); for (let i = 0; i < c.height / 3; i++) { const X = rnd() * 24 | 0, Y = rnd() * c.height | 0, L = 3 + rnd() * 8 | 0; px(x, pale && rnd() < .5 ? '#e8e2d4' : sh(base, .7), X, Y, 2, L); } return c; }
function trunk(g, r0, r1, h, x, y, z, base, pale, tilt = 0, rotY = 0) { const m = new T.Mesh(new T.CylinderGeometry(r1, r0, h, 7), mat(barkCanvas(base, h, pale))); m.position.set(x, y + h / 2, z); m.rotation.z = tilt; m.rotation.y = rotY; m.castShadow = m.receiveShadow = true; g.add(m); return m; }
function grassCanvas(sd, w = 32, h = 24, flowers) { seed(sd); const [c, x] = cv(w, h); const ramp = RAMPS.green; for (let i = 0; i < w * 1.6; i++) { const X = rnd() * w | 0, L = 6 + rnd() * (h - 6) | 0, lean = rnd() < .5 ? -1 : 1; for (let j = 0; j < L; j++) px(x, ramp[Math.min(4, Math.floor(j / L * 4) + (rnd() < .2 ? 1 : 0))], X + Math.round(lean * j * j / (L * 3)), h - 1 - j); }
  if (flowers) for (let i = 0; i < 6; i++) { const X = 2 + rnd() * (w - 4), Y = 2 + rnd() * h * .4; px(x, flowers[i % flowers.length], X, Y, 2, 2); px(x, '#fff4c8', X, Y); } return c; }

/* ---------- buildings ---------- */
const reg = (id, name, build, extra) => PE.reg(id, Object.assign({ name, cat: 'hd', snap: 1, build }, extra || {}));
reg('hd-jp-corner', 'ร้านหัวมุมญี่ปุ่น (HD)', o => {
  const g = new T.Group(), W = 7, D = 6, H1 = 3.2, H2 = 3, base = '#e4ddcf', sd = o.seed || 3; K.seed(sd);
  const front = (w, h, lit) => { const [c, x] = cv(w * PPM, h * PPM); K.plaster(x, c.width, c.height, base); x.drawImage(K.glass(c.width - 16, c.height - 26, { lit, tint: '#6a8aa6', seed: sd }), 8, 18); K.plinth(x, c.width, c.height, '#8a8e96'); return c; };
  box(g, W, H1, D, [glowMat(front(D, H1, false), front(D, H1, true)), K.wall(D, H1, { base, kind: 'plaster', win: 1, door: false, rows: 1, plinth: true }), '#8a8e96', '#666', glowMat(front(W, H1, false), front(W, H1, true)), K.wall(W, H1, { base, kind: 'plaster', win: 0, rows: 1 })], 0, H1 / 2, 0, true);
  const up = (w, n, lit) => K.wall(w, H2, { base: '#d9d2c2', kind: 'plaster', win: n, rows: 1, plinth: false, cornice: true, lit, seed: sd + n });
  box(g, W, H2, D, [glowMat(up(D, 2, false), up(D, 2, true)), up(D, 1, false), K.roof(W, D, { kind: 'tin', base: '#8a8e96', seed: sd }), '#666', glowMat(up(W, 2, false), up(W, 2, true)), up(W, 2, false)], 0, H1 + H2 / 2, 0, true);
  box(g, W + .2, .5, D + .2, ['#cfc8b8', '#cfc8b8', '#bfb8a8', '#cfc8b8', '#cfc8b8', '#cfc8b8'], 0, H1 + H2 + .25, 0);
  const aw = new T.Mesh(new T.BoxGeometry(W, .08, 1.3), [plain('#c43a2c'), plain('#c43a2c'), mat(stripes(W, 1.3, '#c43a2c', '#f2efe6', 14)), plain('#c43a2c'), plain('#c43a2c'), plain('#c43a2c')]); aw.position.set(0, H1 - .25, D / 2 + .62); aw.rotation.x = .22; aw.castShadow = true; g.add(aw);
  const v = card(valance(W, '#c43a2c', '#f2efe6'), W, .32); v.position.set(0, H1 - .5, D / 2 + 1.27); g.add(v);
  const aw2 = new T.Mesh(new T.BoxGeometry(1.3, .08, D), [plain('#c43a2c'), plain('#c43a2c'), mat(stripes(1.3, D, '#c43a2c', '#f2efe6', 2)), plain('#c43a2c'), plain('#c43a2c'), plain('#c43a2c')]); aw2.position.set(W / 2 + .62, H1 - .25, 0); aw2.rotation.z = -.22; g.add(aw2);
  box(g, 4.2, .8, .12, [null, null, null, null, sign(o.t || 'まるや', 4.2, .8, '#ffffff', '#1f4a8a'), '#1f4a8a'], 0, H1 + .45, D / 2 + .08);
  box(g, .9, .6, .45, ['#c8ccd5', '#c8ccd5', '#d8dce2', '#999', K.pane(false, 18, 12, '#c8ccd5'), '#c8ccd5'], W / 2 + .25, H1 + 1.2, -1.6);
  box(g, .12, H1 + H2, .12, ['#8a8e96', '#8a8e96', '#8a8e96', '#8a8e96', '#8a8e96', '#8a8e96'], -W / 2 + .2, (H1 + H2) / 2, D / 2 + .08);
  box(g, 1.2, 1, 1, ['#aab0ba', '#aab0ba', '#b8bec8', '#999', '#aab0ba', '#aab0ba'], 1.6, H1 + H2 + 1, -1.2);
  PE.light(g, 0, H1 - .6, D / 2 + 1.2, '#ffe2b0', 12); return g;
}, { text: 'まるや', defaults: { t: 'まるや' } });
reg('hd-thai-shophouse', 'ตึกแถวไทย (HD)', o => {
  const g = new T.Group(), W = 4.6, D = 10, FH = 3.2, base = o.c || '#e8d6b0', sd = o.seed || 5;
  box(g, W, FH, D, ['#d8c8a0', '#d8c8a0', '#999', '#999', glowMat(shutter(W, FH, .55, '#9aa0aa', false), shutter(W, FH, .55, '#9aa0aa', true)), '#d8c8a0'], 0, FH / 2, 0, true);
  for (let f = 1; f < 3; f++) box(g, W, FH, D, [K.wall(D, FH, { base: sh(base, .95), kind: 'plaster', win: 0, rows: 1, cornice: false, plinth: false, seed: sd + f }), K.wall(D, FH, { base: sh(base, .95), kind: 'plaster', win: 0, rows: 1, cornice: false, plinth: false, seed: sd + f + 9 }), '#999', '#999', glowMat(shophouseFloor(W, FH, base, false, sd + f), shophouseFloor(W, FH, base, true, sd + f)), '#d8c8a0'], 0, FH * f + FH / 2, 0, true);
  box(g, W + .1, .7, D, ['#d8c8a0', '#d8c8a0', K.roof(W, D, { kind: 'tin', base: '#9a9a90' }), '#999', K.wall(W, .7, { base: sh(base, 1.05), kind: 'plaster', win: 0, rows: 1, plinth: false, cornice: true }), '#d8c8a0'], 0, FH * 3 + .35, 0);
  box(g, W - .2, .75, .12, [null, null, null, null, sign(o.t || 'ข้าวแกงแม่ศรี', W - .2, .75, '#fff2c8', '#b8261f'), '#b8261f'], 0, FH + .1, D / 2 + .08);
  box(g, W, .15, .9, ['#c8bca0', '#c8bca0', '#d8ccb0', '#a89c80', '#c8bca0', '#c8bca0'], 0, FH * 2, D / 2 + .45);
  for (let k = 0; k < 9; k++) box(g, .05, .8, .05, ['#3a3f4a', '#3a3f4a', '#3a3f4a', '#3a3f4a', '#3a3f4a', '#3a3f4a'], -W / 2 + .25 + k * .52, FH * 2 + .45, D / 2 + .85);
  box(g, W, .05, .05, ['#3a3f4a', '#3a3f4a', '#3a3f4a', '#3a3f4a', '#3a3f4a', '#3a3f4a'], 0, FH * 2 + .85, D / 2 + .85);
  [[-1.4, '#3f8f3c'], [.2, '#d84a6a'], [1.5, '#5a9a40']].forEach(([x0, c], i) => { box(g, .35, .3, .35, ['#a85a3a', '#a85a3a', '#3a2a1a', '#a85a3a', '#a85a3a', '#a85a3a'], x0, FH * 2 + .23, D / 2 + .55); crown(g, x0, FH * 2 + .62, D / 2 + .55, .32, i === 1 ? 'sakura' : 'green', sd + i, 3, .9); });
  box(g, .9, .6, .45, ['#c8ccd5', '#c8ccd5', '#d8dce2', '#999', K.pane(false, 18, 12, '#c8ccd5'), '#c8ccd5'], W / 2 - .7, FH * 2 + 1.9, D / 2 + .25);
  PE.light(g, 0, FH - .3, D / 2 + .8, '#ffd8a0', 10); return g;
}, { tint: true, text: 'ข้าวแกงแม่ศรี', defaults: { c: '#e8d6b0', t: 'ข้าวแกงแม่ศรี' }, colors: ['#e8d6b0', '#d8e4d0', '#e8c8c0', '#d0dce8', '#f0e4a8'] });
reg('hd-perth-victorian', 'ร้านวิกตอเรียน Perth (HD)', o => {
  const g = new T.Group(), W = 8, D = 7, H1 = 3.4, H2 = 3.2, brick = o.c || '#b8644a', sd = o.seed || 7;
  const gf = lit => K.wall(W, H1, { base: brick, kind: 'brick', win: 2, door: true, rows: 1, lit, seed: sd, winW: 34, winH: 40 });
  const ff = lit => K.wall(W, H2, { base: brick, kind: 'brick', win: 3, rows: 1, arch: true, shutter: '#2f5a4a', lit, seed: sd + 1 });
  box(g, W, H1, D, [K.wall(D, H1, { base: brick, kind: 'brick', win: 1, rows: 1, seed: sd + 2 }), K.wall(D, H1, { base: brick, kind: 'brick', win: 1, rows: 1, seed: sd + 3 }), '#999', '#999', glowMat(gf(false), gf(true)), K.wall(W, H1, { base: brick, kind: 'brick', win: 2, rows: 1 })], 0, H1 / 2, 0, true);
  box(g, W, H2, D, [K.wall(D, H2, { base: brick, kind: 'brick', win: 2, rows: 1, seed: sd + 4 }), K.wall(D, H2, { base: brick, kind: 'brick', win: 2, rows: 1, seed: sd + 5 }), '#999', '#999', glowMat(ff(false), ff(true)), K.wall(W, H2, { base: brick, kind: 'brick', win: 3, rows: 1 })], 0, H1 + H2 / 2, 0, true);
  box(g, W, 1.1, .4, [null, null, '#e8dcc0', null, (() => { const [c, x] = cv(W * PPM, 1.1 * PPM); K.blocks(x, c.width, c.height, '#ecdcb8', { rowH: 8 }); K.cornice(x, c.width, c.height, '#f4ecd8'); x.font = 'bold 18px serif'; x.fillStyle = '#7a5a3a'; x.textAlign = 'center'; x.fillText('1898', c.width / 2, 28); return c; })(), '#e8dcc0'], 0, H1 + H2 + .55, D / 2 - .2);
  gable(g, W, D - .4, 1.6, K.roof(W + .7, 2.5, { kind: 'tin', base: '#7a8a8e', across: false }), brick, H1 + H2, .3);
  const vd = 2.2, vh = H1 - .1; for (let k = 0; k < 5; k++) { box(g, .14, vh, .14, ['#2f5a4a', '#2f5a4a', '#2f5a4a', '#2f5a4a', '#2f5a4a', '#2f5a4a'], -W / 2 + .3 + k * (W - .6) / 4, vh / 2, D / 2 + vd); }
  const vr = new T.Mesh(new T.BoxGeometry(W + .3, .1, vd + .2), [plain('#7a8a8e'), plain('#7a8a8e'), mat(K.roof(W + .3, vd + .2, { kind: 'tin', base: '#8a9a9e', across: true })), plain('#6a7a7e'), plain('#7a8a8e'), plain('#7a8a8e')]); vr.position.set(0, vh + .15, D / 2 + vd / 2); vr.rotation.x = .12; vr.castShadow = true; g.add(vr);
  const l = card(lace(W), W, .45); l.position.set(0, vh - .25, D / 2 + vd + .02); g.add(l);
  [-1, 1].forEach(s => { const l2 = card(lace(vd), vd, .45); l2.rotation.y = Math.PI / 2; l2.position.set(s * (W / 2 + .05), vh - .25, D / 2 + vd / 2); g.add(l2); });
  PE.light(g, -2, vh - .4, D / 2 + 1, '#ffd8a0', 10); PE.light(g, 2, vh - .4, D / 2 + 1, '#ffd8a0', 10); return g;
}, { tint: true, defaults: { c: '#b8644a' }, colors: ['#b8644a', '#c88a5a', '#e4d2a8', '#9a5a4a'] });
reg('hd-cafe-wood', 'คาเฟ่ไม้ (HD)', o => {
  const g = new T.Group(), W = 6, D = 5, H = 3, board = o.c || '#d8e4e0', sd = o.seed || 11;
  const f = lit => K.wall(W, H, { base: board, kind: 'board', win: 2, door: true, rows: 1, lit, seed: sd, winW: 30, winH: 34, shutter: '#c8605a' });
  box(g, W, H, D, [K.wall(D, H, { base: board, kind: 'board', win: 1, rows: 1, seed: sd + 1 }), K.wall(D, H, { base: board, kind: 'board', win: 1, rows: 1, seed: sd + 2 }), '#999', '#999', glowMat(f(false), f(true)), K.wall(W, H, { base: board, kind: 'board', win: 1, rows: 1 })], 0, H / 2, 0, true);
  gable(g, W, D, 1.9, K.roof(W + .7, 3.5, { kind: 'tile', base: '#b85434', seed: sd }), board, H, .35);
  const aw = new T.Mesh(new T.BoxGeometry(W - .6, .08, 1.1), [plain('#2f7a74'), plain('#2f7a74'), mat(stripes(W - .6, 1.1, '#2f7a74', '#f2efe6', 12)), plain('#2f7a74'), plain('#2f7a74'), plain('#2f7a74')]); aw.position.set(0, H - .4, D / 2 + .52); aw.rotation.x = .25; aw.castShadow = true; g.add(aw);
  const v = card(valance(W - .6, '#2f7a74', '#f2efe6'), W - .6, .3); v.position.set(0, H - .62, D / 2 + 1.05); g.add(v);
  box(g, .9, 1.2, .08, [null, null, null, null, (() => { const [c, x] = cv(.9 * PPM, 1.2 * PPM); px(x, '#5a3a22', 0, 0, c.width, c.height); px(x, '#22302a', 2, 2, c.width - 4, c.height - 4); x.fillStyle = '#f2efe6'; x.font = 'bold 7px sans-serif'; ['COFFEE', 'TEA', 'CAKE'].forEach((t, i) => x.fillText(t, 4, 11 + i * 9)); px(x, '#e8b860', 4, 32, 10, 1); return c; })(), '#5a3a22'], 2.4, .6, D / 2 + .9);
  box(g, .5, .45, .5, ['#a85a3a', '#a85a3a', '#3a2a1a', '#a85a3a', '#a85a3a', '#a85a3a'], -2.6, .23, D / 2 + .5); crown(g, -2.6, .85, D / 2 + .5, .45, 'green', sd, 4, .9);
  PE.light(g, 0, H - .6, D / 2 + .9, '#ffe2b0', 10); return g;
}, { tint: true, defaults: { c: '#d8e4e0' }, colors: ['#d8e4e0', '#f2ecd8', '#e8d0c8', '#d0dcec', '#e8e4a8'] });

/* ---------- nature ---------- */
reg('hd-gum', 'ต้นยูคาลิปตัส (HD)', o => { const g = new T.Group(), sd = o.seed || 2; trunk(g, .26, .16, 4.2, 0, 0, 0, '#d8d0c0', true); trunk(g, .13, .08, 2.6, .5, 3.2, .2, '#d8d0c0', true, -.6); trunk(g, .12, .08, 2.4, -.4, 3.4, -.3, '#d8d0c0', true, .55, .8);
  crown(g, 1.6, 6.3, .4, 1.5, 'gum', sd, 10, .7); crown(g, -1.3, 6.6, -.6, 1.4, 'gum', sd + 1, 9, .7); crown(g, .2, 7.6, -.1, 1.3, 'gum', sd + 2, 8, .75); return g; }, { snap: .5 });
reg('hd-sakura', 'ต้นซากุระ (HD)', o => { const g = new T.Group(), sd = o.seed || 4; trunk(g, .22, .14, 2.2, 0, 0, 0, '#4a3226', false); trunk(g, .11, .07, 1.8, .45, 1.8, 0, '#4a3226', false, -.8); trunk(g, .1, .07, 1.7, -.4, 1.9, .1, '#4a3226', false, .75, .5);
  crown(g, 1.2, 3.4, .1, 1.25, 'sakura', sd, 10, .65); crown(g, -1.1, 3.5, .2, 1.15, 'sakura', sd + 1, 9, .65); crown(g, 0, 4.2, -.4, 1.2, 'sakura', sd + 2, 9, .65);
  const pc = (() => { seed(sd); const [c, x] = cv(64, 64); for (let i = 0; i < 70; i++) px(x, RAMPS.sakura[2 + (rnd() * 3 | 0)], rnd() * 64, rnd() * 64, 2, 1); return c; })(); const pet = card(pc, 4.5, 4.5); pet.rotation.x = -Math.PI / 2; pet.position.y = .03; pet.castShadow = false; g.add(pet); return g; }, { snap: .5 });
reg('hd-palm', 'ต้นมะพร้าว (HD)', o => { const g = new T.Group(), sd = o.seed || 6; seed(sd);
  const ring = (() => { const [c, x] = cv(16, 96); for (let y = 0; y < 96; y++) px(x, y % 6 < 2 ? '#7a5a3a' : y % 6 < 4 ? '#a07a52' : '#b89068', 0, y, 16, 1); return c; })();
  for (let k = 0; k < 6; k++) { const s = new T.Mesh(new T.CylinderGeometry(.17 - k * .012, .19 - k * .012, 1, 7), mat(ring)); s.position.set(k * k * .025, .5 + k, 0); s.rotation.z = -k * .025; s.castShadow = true; g.add(s); }
  const frond = (() => { const [c, x] = cv(64, 16); for (let X = 0; X < 64; X++) { const w = Math.round(Math.sin(X / 64 * Math.PI) * 7); px(x, '#5a4a28', X, 8, 1, 1); for (let j = 1; j <= w; j++) { const col = RAMPS.palm[Math.min(4, 4 - Math.floor(j / w * 3) - (X % 4 === 0 ? 1 : 0))]; if ((X + j) % 3) { px(x, col, X, 8 - j); px(x, sh(col, .8), X, 8 + j); } } } return c; })();
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + rnd() * .3, f = card(frond, 3.2, .8); f.geometry.translate(1.6, 0, 0); f.position.set(.9, 6.1, 0); f.rotation.order = 'YZX'; f.rotation.y = a; f.rotation.z = -.35 - rnd() * .3; f.rotation.x = Math.PI / 2 * (i % 2 ? .15 : -.1); g.add(f); }
  for (let k = 0; k < 4; k++) { const n = new T.Mesh(new T.IcosahedronGeometry(.16, 0), P.mat('#6a4a22', { flatShading: true })); n.position.set(.9 + Math.cos(k * 1.6) * .22, 5.8, Math.sin(k * 1.6) * .22); g.add(n); } return g; }, { snap: .5 });
reg('hd-bush', 'พุ่มไม้ดอก (HD)', o => { const g = new T.Group(), sd = o.seed || 8; crown(g, 0, .55, 0, .7, 'green', sd, 6, .75); crown(g, .7, .45, .3, .55, 'green', sd + 1, 5, .75);
  seed(sd); for (let i = 0; i < 9; i++) { const f = new T.Mesh(new T.BoxGeometry(.09, .09, .09), P.mat(['#e05a6a', '#f4d04a', '#f2f2f2'][i % 3])); f.position.set((rnd() - .4) * 1.4, .55 + rnd() * .5, (rnd() - .5) * 1.1); g.add(f); } return g; }, { snap: .5 });
reg('hd-grass', 'กอหญ้าและดอกไม้ (HD)', o => { const g = new T.Group(), sd = o.seed || 10; seed(sd);
  for (let i = 0; i < 9; i++) { const c = grassCanvas(sd + i, 32, 24, i % 3 === 0 ? ['#f4d04a', '#e05a6a', '#f2f2f2', '#9a6ae0'] : null), x0 = (rnd() - .5) * 1.8, z0 = (rnd() - .5) * 1.8;
    for (let k = 0; k < 2; k++) { const m = card(c, .9, .65); m.position.set(x0, .32, z0); m.rotation.y = k * Math.PI / 2 + rnd(); m.castShadow = false; g.add(m); } } return g; }, { snap: .5 });
reg('hd-rock', 'หินริมน้ำมีตะไคร่ (HD)', o => { const g = new T.Group(), sd = o.seed || 12;
  const sc = (() => { const [c, x] = cv(48, 48); K.seed(sd); K.blocks(x, 48, 48, '#9a968e', { rowH: 9, minW: 12, varW: 10, mortar: .72 }); K.moss(x, 48, 48, 2.5); return c; })();
  [[0, 0, 0, 1, .7], [.9, 0, .4, .6, .55], [-.7, 0, .5, .5, .45]].forEach(([x0, y0, z0, r, sy], i) => { const m = new T.Mesh(new T.DodecahedronGeometry(r, 0), mat(sc, { flatShading: true })); m.scale.set(1.2, sy, 1); m.position.set(x0, r * sy * .7, z0); m.rotation.y = i; m.castShadow = m.receiveShadow = true; g.add(m); });
  for (let k = 0; k < 2; k++) { const m = card(grassCanvas(sd + k, 32, 20), .8, .5); m.position.set(.4 - k * 1.1, .25, .8); m.rotation.y = k; m.castShadow = false; g.add(m); } return g; }, { snap: .5 });
PE.CATS.splice(1, 0, ['hd', 'HD พิกเซล (ทดลอง)']);
})();
