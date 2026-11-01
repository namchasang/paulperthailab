/* ==== Paul Engine asset set v0.1 ====
   Every asset: PE.reg(id, {name, cat, build(o) -> Object3D, fit?, snap?, tint?, text?, role?, serve?}).
   Sizes are metres. Fronts face +z, cars drive along +x. o.c = tint colour, o.t = sign text, o.seed = variation.
   PPL models (kangaroo, magpie, Roo Road cars, verandah shop, fountain, flora, garden set...) are wrapped at the end when loaded. */
(function(){
'use strict';
const T = THREE, P = window.PPL, PE = window.PE, { B, C, S, roof, glowBox, light, panel, textTex } = PE;
const G = () => new T.Group();
const reg = PE.reg;

/* ---------------- ground tiles (4 x 4 m, snap to 4) ---------------- */
const tile = (id, name, col, extra) => reg(id, { name, cat: 'ground', snap: 4, raw: true, noShadow: true, tint: !!extra?.tint, defaults: { c: col },
  build(o) { const g = G(), m = new T.Mesh(new T.BoxGeometry(4, .06, 4), P.mat(o.c || col, { roughness: .95 })); m.position.y = .03; m.receiveShadow = true; g.add(m); if (extra && extra.deco) extra.deco(g, o); return g; } });
tile('tile-grass', 'หญ้า', '#7fa05a', { tint: 1, deco: (g, o) => { const R = P.rng(o.seed || 3); for (let i = 0; i < 6; i++) B(g, .25, .05, .25, '#6c8f4c', (R() - .5) * 3.4, .08, (R() - .5) * 3.4); } });
tile('tile-sand', 'ทราย', '#e6d3a3', { tint: 1 });
tile('tile-paving', 'ลานปูน', '#c9c4ba', { tint: 1, deco: g => { for (let k = -1; k <= 1; k++) { B(g, 4, .005, .05, '#b3ada2', 0, .065, k * 1.33); B(g, .05, .005, 4, '#b3ada2', k * 1.33, .065, 0); } } });
tile('tile-asphalt', 'ยางมะตอย', '#4f5159');
tile('tile-road', 'ถนน (เส้นกลาง)', '#4f5159', { deco: g => { for (let k = -1; k <= 1; k++) B(g, .7, .005, .14, '#f2f2ee', k * 1.4, .065, 0); } });
tile('tile-crossing', 'ทางม้าลาย', '#4f5159', { deco: g => { for (let k = -3; k <= 3; k++) B(g, .3, .005, 3.4, '#f2f2ee', k * .55, .065, 0); } });
tile('tile-footpath', 'ทางเท้า', '#b8b4ac', { deco: g => B(g, 4, .14, .25, '#d6d3cb', 0, .1, 1.87) });
tile('tile-wood', 'พื้นไม้', '#a9764a', { tint: 1, deco: g => { for (let k = -3; k <= 3; k++) B(g, 4, .005, .04, '#7d532e', 0, .065, k * .55); } });
tile('tile-dirt', 'ดินแดง', '#b86b3c', { tint: 1 });
reg('tile-water', { name: 'น้ำ', cat: 'ground', snap: 4, raw: true, noShadow: true, tint: true, defaults: { c: '#3d8fb0' },
  build(o) { const g = G(), m = new T.Mesh(new T.BoxGeometry(4, .04, 4), P.mat(o.c, { roughness: .2, metalness: .1 })); m.position.y = -.02; g.add(m);
    const sh = []; const R = P.rng(o.seed || 5); for (let i = 0; i < 3; i++) sh.push(PE.glowBox(g, .9, .01, .08, '#9fd2e6', '#4c7fd0', (R() - .5) * 3, .02, (R() - .5) * 3));
    g.userData.tick = t => sh.forEach((s, i) => { s.position.x = ((t * .3 + i * 1.3) % 3.6) - 1.8; }); return g; } });

/* ---------------- buildings ---------------- */
const windows = (g, w, h, z, rows, cols, y0, lit) => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) PE.glowBox(g, w * .5 / cols, .9, .06, '#2b3442', (r + c) % 3 ? '#2b3442' : lit || '#ffd890', (c - (cols - 1) / 2) * w / cols, y0 + r * h, z); };
reg('house', { name: 'บ้านหลังคาจั่ว', cat: 'building', snap: 1, tint: true, defaults: { c: '#e7d9c8' }, colors: ['#e7d9c8', '#f2f1ec', '#dcc7a0', '#cfd2d8', '#b9d0c3', '#e3b9a4'],
  build(o) { const g = G(); B(g, 7, 4, 6, o.c, 0, 2, 0); roof(g, 7, 6, 2.4, '#6b3a2a', 4, 0, 0);
    PE.glowBox(g, 1.1, 2, .08, '#5a3b26', '#5a3b26', 0, 1, 3.02); windows(g, 7, 1, 3.03, 1, 2, 2.1); B(g, 1.6, .15, .8, '#d6d3cb', 0, .07, 3.4); light(g, 0, 2.2, 3.4); return g; } });
reg('house-jp', { name: 'บ้านญี่ปุ่นสองชั้น', cat: 'building', snap: 1, tint: true, defaults: { c: '#f2f1ec' }, colors: ['#f2f1ec', '#d8cfc0', '#c9cfd6', '#e8e0cc'],
  build(o) { const g = G(); B(g, 6, 5.6, 6, o.c, 0, 2.8, 0); B(g, 6.6, .25, 6.6, '#3a4150', 0, 2.9, 0); roof(g, 6, 6, 1.8, '#3a4150', 5.6, 0, 0, .4);
    B(g, 5.2, .9, .9, '#8a8f99', 0, 3.6, 3.4); for (let k = -2; k <= 2; k++) B(g, .05, .9, .05, '#5a6170', k * 1.2, 3.6, 3.84);
    windows(g, 6, 2.8, 3.02, 2, 2, 1.4); B(g, 1.1, 2, .08, '#7d532e', -1.8, 1, 3.03); B(g, .7, 1.5, .5, '#c8ccd5', 2.4, .75, 3.3); return g; } });
reg('apartment', { name: 'อพาร์ตเมนต์', cat: 'building', snap: 1, tint: true, defaults: { c: '#dcdfe4' }, colors: ['#dcdfe4', '#e8dccb', '#cdd6cf', '#d9c6c0'],
  build(o) { const g = G(); B(g, 12, 13, 9, o.c, 0, 6.5, 0); B(g, 12.3, .3, 9.3, '#9aa0aa', 0, 13.15, 0); windows(g, 12, 2.6, 4.53, 5, 5, 1.6);
    for (let r = 1; r < 5; r++) B(g, 11, .12, 1, '#b8bcc4', 0, r * 2.6 + .3, 5); B(g, 2.4, 2.4, .1, '#7d8fa8', 0, 1.2, 4.55); B(g, 2, .8, 1.6, '#aab0ba', 3, 13.7, -2); return g; } });
reg('shop-front', { name: 'ร้านค้าหน้ากระจก', cat: 'building', snap: 1, tint: true, text: 'SHOP', defaults: { c: '#f2f1ec', t: 'SHOP' }, colors: ['#f2f1ec', '#1c3f8f', '#d43a2c', '#2f6b4a', '#e9b62c'],
  build(o) { const g = G(); B(g, 8, 4, 6, '#f2f1ec', 0, 2, 0); B(g, 8.3, .7, 6.3, o.c, 0, 4.1, 0);
    PE.glowBox(g, 6.4, 2.4, .08, '#8db4c8', '#ffe9b8', 0, 1.4, 3.02); for (let k = -3; k <= 3; k++) B(g, .1, 2.4, .1, '#3f4d66', k * 1.05, 1.4, 3.06);
    const aw = B(g, 8, .12, 1.6, o.c, 0, 3.05, 3.7); aw.rotation.x = .25; panel(g, textTex([o.t || 'SHOP'], 160, 24, '#ffffff', '#222222'), 5, .75, 0, 4.1, 3.17); light(g, 0, 3, 4); return g; } });
reg('kiosk', { name: 'คีออสกาแฟ', cat: 'building', snap: 1, tint: true, role: 'counter', serve: [0, 2.4], text: 'CAFE', defaults: { c: '#2f8f83', t: 'CAFE' }, colors: ['#2f8f83', '#d43a2c', '#e9b62c', '#1c3f8f', '#8a5cc8'],
  build(o) { const g = G(); B(g, 4, 2.8, 3, '#f4efe4', 0, 1.4, 0); const r = B(g, 4.8, .2, 3.8, o.c, 0, 2.95, 0); B(g, 4.2, 1.2, .08, '#2b3442', 0, 1.9, 1.52);
    PE.glowBox(g, 3.6, .9, .06, '#a8c8d8', '#ffe2a8', 0, 1.9, 1.55); B(g, 4.2, .12, .9, '#7d532e', 0, 1.15, 1.9); const aw = B(g, 4.6, .1, 1.3, o.c, 0, 2.6, 2.2); aw.rotation.x = .3;
    panel(g, textTex([o.t || 'CAFE'], 128, 28, '#ffffff', '#3a2a1a'), 2.4, .5, 0, 3.4, .2); B(g, .1, .7, .1, '#3a2a1a', -1, 3.1, .2); B(g, .1, .7, .1, '#3a2a1a', 1, 3.1, .2); light(g, 0, 2.6, 2.4); return g; } });
reg('restaurant', { name: 'ร้านอาหาร', cat: 'building', snap: 1, tint: true, text: 'ร้านอาหารไทย', defaults: { c: '#c8452f', t: 'ร้านอาหารไทย' }, colors: ['#c8452f', '#2f6b4a', '#1c3f8f', '#7d3a8a', '#d4a02a'],
  build(o) { const g = G(); B(g, 10, 4.6, 8, '#f0e6d4', 0, 2.3, 0); roof(g, 10, 8, 2.2, o.c, 4.6, 0, 0, .5); PE.glowBox(g, 8, 2.2, .08, '#8db4c8', '#ffd28a', 0, 1.5, 4.02);
    for (let k = -4; k <= 4; k++) B(g, .12, 2.2, .12, '#5a3b26', k * 1, 1.5, 4.06); panel(g, textTex([o.t || 'ร้านอาหาร'], 256, 40, '#ffe9a8', '#5a1f14'), 5.2, .8, 0, 3.6, 4.08, 0, true);
    for (let k = -2; k <= 2; k++) { const l = PE.glow(g, new T.SphereGeometry(.22, 8, 6), '#e04a2a', '#ff7a3a', k * 2, 3.05, 4.4); } light(g, -2, 3, 4.8); light(g, 2, 3, 4.8); return g; } });
reg('gas-canopy', { name: 'หลังคาปั๊มน้ำมัน', cat: 'building', snap: 2, tint: true, text: 'KAZE', defaults: { c: '#1c3f8f', t: 'KAZE' }, colors: ['#1c3f8f', '#d43a2c', '#2f8f3c', '#e9b62c', '#18181c'],
  build(o) { const g = G(); [[-8.5, -3.5], [8.5, -3.5], [-8.5, 3.5], [8.5, 3.5]].forEach(([x, z]) => B(g, .45, 5.2, .45, '#e9ebee', x, 2.6, z));
    [[20, .9, .35, 0, 4.6], [20, .9, .35, 0, -4.6], [.35, .9, 9.6, 10, 0], [.35, .9, 9.6, -10, 0]].forEach(([w, h, d, x, z]) => { B(g, w, h, d, o.c, x, 5.55, z); B(g, w + .3, .2, d + .3, '#9be02f', x, 5.12, z); });
    const ghost = new T.Mesh(new T.BoxGeometry(20, .9, 9.6), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); ghost.position.set(0, 5.55, 0); ghost.castShadow = true; ghost.userData.ghost = true; g.add(ghost);
    for (let x = -7.5; x <= 7.5; x += 5) for (let z = -3; z <= 3; z += 6) { PE.glowBox(g, 1.4, .06, .45, '#cfd6de', '#ffffff', x, 5.06, z); light(g, x, 4.8, z, '#fff6e0', 16); }
    panel(g, textTex([o.t || 'KAZE'], 128, 24, '#ffffff', '#1c3f8f'), 5, .9, 0, 5.55, 4.8); return g; } });
reg('garage', { name: 'อู่ซ่อม / แต่งรถ', cat: 'building', snap: 1, text: 'TUNE', defaults: { t: 'TUNE' },
  build(o) { const g = G(); B(g, .4, 4.4, 8, '#5a6170', -5, 2.2, 0); B(g, .4, 4.4, 8, '#5a6170', 5, 2.2, 0); B(g, 10.4, 4.4, .4, '#5a6170', 0, 2.2, -4); B(g, 10.8, .5, 8.6, '#2a2d36', 0, 4.65, 0);
    B(g, 10.8, .7, .3, '#18181c', 0, 4.1, 4.1); panel(g, textTex([o.t || 'TUNE'], 96, 22, '#ff3ad0', '#18181c'), 3.4, .7, 0, 4.1, 4.27, 0, true);
    PE.glowBox(g, 9, .08, .08, '#5a2050', '#ff3ad0', 0, 4.45, 4.3); [-2.5, 2.5].forEach(x => { B(g, .3, 2, .3, '#d43a2c', x, 1, -2); B(g, .3, 2, .3, '#d43a2c', x, 1, 1.5); }); B(g, 5.4, .15, 2.2, '#d43a2c', 0, 1.3, -.25);
    B(g, 1.2, 1.4, .6, '#d43a2c', -4.2, .7, -3.4); light(g, 0, 4, 1, '#ffe0ff', 14); return g; } });
reg('torii', { name: 'โทริอิ', cat: 'building', snap: 1, build() { const g = G(); C(g, .22, 4.4, '#d43a2c', -1.8, 2.2, 0, 10); C(g, .22, 4.4, '#d43a2c', 1.8, 2.2, 0, 10); B(g, 5.2, .35, .5, '#18181c', 0, 4.6, 0); B(g, 4.4, .25, .35, '#d43a2c', 0, 3.8, 0); return g; } });

/* ---------------- service points (games use these) ---------------- */
reg('counter', { name: 'เคาน์เตอร์ขาย', cat: 'service', role: 'counter', serve: [0, 1.4], snap: 1, tint: true, defaults: { c: '#7d532e' }, colors: ['#7d532e', '#f2f1ec', '#2f8f83', '#18181c'],
  build(o) { const g = G(); B(g, 2.4, 1.05, .8, o.c, 0, .52, 0); B(g, 2.6, .08, 1, '#e9e2d4', 0, 1.08, 0); B(g, .45, .35, .35, '#3a3f4a', -.7, 1.3, -.1); PE.glowBox(g, .3, .2, .02, '#6be0ff', '#9ff0ff', -.7, 1.32, .08); B(g, .3, .28, .3, '#d4a02a', .6, 1.26, 0); return g; } });
reg('pump', { name: 'ตู้จ่ายน้ำมัน', cat: 'service', role: 'pump', serve: [0, 2.4], snap: 1,
  build() { const g = G(); B(g, 1.4, .22, 3.6, '#d8d6d0', 0, .11, 0); B(g, 1.5, .06, 3.7, '#e9b62c', 0, .25, 0); B(g, .9, 1.9, .6, '#f4f5f7', 0, 1.17, 0); B(g, .92, .35, .62, '#1c3f8f', 0, 1.95, 0);
    PE.glowBox(g, .4, .22, .02, '#6be0ff', '#9ff0ff', 0, 1.42, .32); [-.3, 0, .3].forEach((dx, k) => B(g, .08, .18, .08, ['#d43a2c', '#e9b62c', '#2fae55'][k], dx, 1.05, .33)); C(g, .03, 1.2, '#18181c', .42, .9, .2, 5); return g; } });
reg('stall', { name: 'แผงขายของ', cat: 'service', role: 'counter', serve: [0, 1.8], snap: 1, tint: true, defaults: { c: '#d43a2c' }, colors: ['#d43a2c', '#2f73b0', '#2f8f3c', '#e9b62c'],
  build(o) { const g = G(); B(g, 2.6, .9, 1.2, '#a9764a', 0, .45, 0); [-1.2, 1.2].forEach(x => [-.5, .5].forEach(z => B(g, .08, 2.4, .08, '#7d532e', x, 1.2, z)));
    const a = B(g, 2.9, .08, 1.6, o.c, 0, 2.4, .1); a.rotation.x = .18; for (let k = 0; k < 5; k++) S(g, .14, ['#e2608a', '#e9b62c', '#5cb050', '#d43a2c', '#f0f0ea'][k], -1 + k * .5, 1, .1); PE.glow(g, new T.SphereGeometry(.16, 8, 6), '#e9b62c', '#ffcf6a', 0, 2.1, .6); light(g, 0, 2, .6); return g; } });
reg('vending', { name: 'ตู้กดน้ำ', cat: 'service', snap: 1, tint: true, defaults: { c: '#d43a2c' }, colors: ['#d43a2c', '#2f73b0', '#2fae55', '#f0f0ea'],
  build(o) { const g = G(); B(g, .95, 1.85, .75, o.c, 0, .93, 0); PE.glowBox(g, .7, .8, .04, '#f3f4f6', '#ffffff', 0, 1.25, .39); B(g, .5, .12, .05, '#18181c', 0, .4, .39); light(g, 0, 1.2, .8, '#eaf4ff', 6); return g; } });
reg('table-set', { name: 'โต๊ะกับเก้าอี้', cat: 'service', snap: .5, tint: true, defaults: { c: '#f2f1ec' }, colors: ['#f2f1ec', '#7d532e', '#2f8f83', '#d43a2c'],
  build(o) { const g = G(); C(g, .5, .06, o.c, 0, .75, 0, 12); C(g, .05, .75, '#5a6170', 0, .37, 0, 6); [-1, 1].forEach(s => { B(g, .45, .06, .45, '#7d532e', s * .85, .45, 0); B(g, .06, .5, .45, '#7d532e', s * 1.06, .72, 0); }); return g; } });
reg('umbrella-table', { name: 'โต๊ะร่มริมหาด', cat: 'service', snap: .5, tint: true, defaults: { c: '#e2608a' }, colors: ['#e2608a', '#2f73b0', '#e9b62c', '#2f8f83', '#f0f0ea'],
  build(o) { const g = G(); C(g, .5, .06, '#f2f1ec', 0, .75, 0, 12); C(g, .04, 2.4, '#e9ebee', 0, 1.2, 0, 6); const u = mesh(g, new T.ConeGeometry(1.5, .6, 8), P.mat(o.c, { flatShading: true }), 0, 2.4, 0); [-1, 1].forEach(s => B(g, .45, .06, .45, '#7d532e', s * .85, .45, 0)); return g; } });
function mesh(g, geo, m, x, y, z) { const k = new T.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = k.receiveShadow = true; g.add(k); return k; }
reg('menu-board', { name: 'ป้ายเมนู', cat: 'service', snap: .5, text: 'MENU', defaults: { t: 'MENU' }, build(o) { const g = G(); B(g, .9, 1.2, .08, '#3a2a1a', 0, .9, 0); panel(g, textTex([o.t || 'MENU', '—', '—'], 72, 96, '#f3efe6', '#22302a'), .8, 1.05, 0, .9, .05); B(g, .06, .4, .5, '#3a2a1a', 0, .2, -.2); return g; } });

/* ---------------- nature (simple; PPL flora added below) ---------------- */
reg('tree-round', { name: 'ต้นไม้พุ่มกลม', cat: 'nature', snap: .5, build(o) { const g = G(), R = P.rng(o.seed || 2); C(g, .18, 2.2, '#5c3b20', 0, 1.1, 0, 6); S(g, 1.5 + R() * .3, R() < .5 ? '#3f7a3c' : '#4f8f45', 0, 3.1, 0); S(g, .9, '#5a9a4c', .7, 3.6, .3); return g; } });
reg('tree-pine', { name: 'ต้นสน', cat: 'nature', snap: .5, build() { const g = G(); C(g, .16, 1.4, '#5c3b20', 0, .7, 0, 6); for (let k = 0; k < 3; k++) mesh(g, new T.ConeGeometry(1.3 - k * .3, 1.6, 7), P.mat('#2d5a3a', { flatShading: true }), 0, 2 + k * .9, 0); return g; } });
reg('palm', { name: 'ต้นมะพร้าว', cat: 'nature', snap: .5, build(o) { const g = G(), R = P.rng(o.seed || 4); for (let k = 0; k < 7; k++) { const s = C(g, .16 - k * .01, .75, '#9c7a52', k * .08, .4 + k * .72, 0, 6); s.rotation.z = -.06; }
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + R(), l = B(g, 2.2, .05, .45, '#3f8f3c', .55 + Math.cos(a) * 1.05, 5.2, Math.sin(a) * 1.05); l.rotation.y = -a; l.rotation.z = -.35; } return g; } });
reg('bush', { name: 'พุ่มไม้', cat: 'nature', snap: .5, build(o) { const g = G(), R = P.rng(o.seed || 6); for (let k = 0; k < 3; k++) S(g, .5 + R() * .25, k % 2 ? '#4f8f45' : '#3f7a3c', (R() - .5) * .8, .45, (R() - .5) * .8); return g; } });
reg('flowerbed', { name: 'แปลงดอกไม้', cat: 'nature', snap: .5, build(o) { const g = G(), R = P.rng(o.seed || 8); B(g, 2, .25, 1, '#8c6b4c', 0, .12, 0); for (let k = 0; k < 10; k++) S(g, .11, ['#e2608a', '#e9b62c', '#f0f0ea', '#8a5cc8'][k % 4], (R() - .5) * 1.7, .35, (R() - .5) * .7, 1, 1, 1, 0); return g; } });
reg('rock', { name: 'ก้อนหิน', cat: 'nature', snap: .5, build(o) { const g = G(); S(g, .7, '#8e8b86', 0, .35, 0, 1.3, .7, 1, 0); return g; } });

/* ---------------- props ---------------- */
reg('street-lamp', { name: 'เสาไฟถนน', cat: 'prop', snap: .5, build() { const g = G(); C(g, .08, 5.6, '#5a6170', 0, 2.8, 0, 6); B(g, 1.3, .08, .1, '#5a6170', .55, 5.6, 0); PE.glowBox(g, .5, .12, .3, '#cfd6de', '#ffe0a0', 1.1, 5.53, 0); light(g, 1.1, 5.2, 0, '#ffd8a0', 16); return g; } });
reg('lantern-post', { name: 'โคมไฟญี่ปุ่น', cat: 'prop', snap: .5, build() { const g = G(); B(g, .5, .8, .5, '#8e8b86', 0, .4, 0); PE.glowBox(g, .45, .5, .45, '#f0e6cc', '#ffd890', 0, 1.05, 0); B(g, .7, .12, .7, '#6a6e78', 0, 1.36, 0); light(g, 0, 1.1, 0, '#ffd890', 8); return g; } });
reg('paper-lantern', { name: 'โคมกระดาษแดง', cat: 'prop', snap: .5, build() { const g = G(); C(g, .03, 2.6, '#3a2a1a', 0, 1.3, 0, 5); const l = PE.glow(g, new T.SphereGeometry(.3, 10, 8), '#d43a2c', '#ff7a3a', 0, 2.3, .25); l.scale.y = 1.3; light(g, 0, 2.2, .3, '#ff9a5a', 7); return g; } });
reg('power-pole', { name: 'เสาไฟฟ้า', cat: 'prop', snap: .5, build() { const g = G(); C(g, .17, 9.5, '#b8b4ac', 0, 4.75, 0, 6); B(g, 2.2, .14, .14, '#8a8780', 0, 8.8, 0); C(g, .32, .7, '#6a6e78', .4, 7.6, .3, 6); return g; } });
reg('bench', { name: 'ม้านั่ง', cat: 'prop', snap: .5, tint: true, defaults: { c: '#a9764a' }, build(o) { const g = G(); B(g, 1.8, .08, .5, o.c, 0, .45, 0); B(g, 1.8, .4, .06, o.c, 0, .72, -.24); [-.75, .75].forEach(x => B(g, .08, .45, .5, '#3a3f4a', x, .22, 0)); return g; } });
reg('bin', { name: 'ถังขยะ', cat: 'prop', snap: .5, build() { const g = G(); C(g, .3, .9, '#2f6b4a', 0, .45, 0, 10); C(g, .33, .08, '#244f38', 0, .93, 0, 10); return g; } });
reg('cone', { name: 'กรวยจราจร', cat: 'prop', snap: .5, build() { const g = G(); mesh(g, new T.ConeGeometry(.22, .7, 8), P.mat('#ff7a1a'), 0, .35, 0); B(g, .45, .04, .45, '#ff7a1a', 0, .02, 0); C(g, .15, .08, '#ffffff', 0, .4, 0, 8, .13); return g; } });
reg('fence', { name: 'รั้วไม้ (4 ม.)', cat: 'prop', snap: 1, tint: true, defaults: { c: '#f2f1ec' }, build(o) { const g = G(); for (let k = 0; k <= 8; k++) B(g, .09, 1, .05, o.c, -2 + k * .5, .5, 0); B(g, 4, .08, .05, o.c, 0, .75, .03); B(g, 4, .08, .05, o.c, 0, .3, .03); return g; } });
reg('sign', { name: 'ป้ายข้อความ', cat: 'prop', snap: .5, tint: true, text: 'OPEN', defaults: { c: '#1c3f8f', t: 'OPEN' }, colors: ['#1c3f8f', '#d43a2c', '#2f8f3c', '#18181c', '#e9b62c'],
  build(o) { const g = G(); C(g, .07, 2.6, '#8a8780', 0, 1.3, 0, 6); B(g, 2, .8, .1, o.c, 0, 2.7, 0); panel(g, textTex([o.t || 'OPEN'], 160, 64, '#ffffff', o.c), 1.84, .66, 0, 2.7, .06, 0, true); return g; } });
reg('nobori', { name: 'ธงโนโบริ', cat: 'prop', snap: .5, tint: true, defaults: { c: '#d43a2c' }, colors: ['#d43a2c', '#9be02f', '#2f73b0', '#e9b62c'], build(o) { const g = G(); C(g, .04, 3.4, '#d6d3cb', 0, 1.7, 0, 5); B(g, .9, 2.4, .05, o.c, .48, 2, 0); B(g, .91, .4, .055, '#ffffff', .48, 2.95, 0); return g; } });
reg('tyre-stack', { name: 'กองยาง', cat: 'prop', snap: .5, build() { const g = G(); for (let k = 0; k < 4; k++) { const t = mesh(g, new T.TorusGeometry(.32, .13, 6, 10), P.mat('#18181c'), 0, .13 + k * .25, 0); t.rotation.x = Math.PI / 2; } return g; } });
reg('bollard', { name: 'เสากั้น', cat: 'prop', snap: .5, build() { const g = G(); C(g, .1, .9, '#e9b62c', 0, .45, 0, 8); B(g, .22, .1, .22, '#18181c', 0, .7, 0); return g; } });
reg('planter', { name: 'กระถางต้นไม้', cat: 'prop', snap: .5, build() { const g = G(); B(g, 1.6, .55, .7, '#7d532e', 0, .28, 0); for (let k = 0; k < 3; k++) S(g, .4, '#3f8f3c', -.5 + k * .5, .8, 0); return g; } });

/* ---------------- vehicles (fictional designs; nose along +x) ---------------- */
const CARS = {
  kei: { L: 3.4, Wd: 1.48, body: [[-1.7, .3], [1.7, .3], [1.72, .65], [1.6, .85], [-1.68, .85], [-1.7, .6]], cab: [[-1.66, .84], [1.25, .84], [1.05, 1.75], [-1.62, 1.75], [-1.66, .9]] },
  sedan: { L: 4.6, Wd: 1.75, body: [[-2.3, .28], [2.3, .28], [2.35, .58], [2.2, .8], [-2.2, .84], [-2.33, .6]], cab: [[-1.3, .82], [.85, .82], [.2, 1.3], [-.95, 1.3], [-1.6, .84]] },
  hatch: { L: 4, Wd: 1.7, body: [[-2, .28], [2, .28], [2.05, .6], [1.85, .82], [-1.95, .86], [-2.02, .6]], cab: [[-1.95, .84], [.6, .84], [-.1, 1.33], [-1.85, 1.33], [-1.98, .9]] },
  coupe: { L: 4.4, Wd: 1.75, body: [[-2.2, .25], [2.2, .25], [2.25, .55], [2.1, .78], [-2.1, .86], [-2.25, .6]], cab: [[-1.55, .8], [.7, .8], [.05, 1.25], [-1.25, 1.25], [-1.6, .86]], wing: true },
  wagon: { L: 4.7, Wd: 1.75, body: [[-2.35, .3], [2.35, .3], [2.4, .6], [2.25, .82], [-2.3, .86], [-2.36, .62]], cab: [[-2.25, .84], [.85, .84], [.25, 1.38], [-2.2, 1.38], [-2.3, .9]] },
  van: { L: 4.8, Wd: 1.8, body: [[-2.4, .3], [2.4, .3], [2.45, .7], [2.3, .9], [-2.4, .9], [-2.42, .6]], cab: [[-2.38, .88], [1.5, .88], [1.15, 2.2], [-2.35, 2.2], [-2.38, .95]] }
};
const prof = pts => { const s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => s.lineTo(p[0], p[1])); return s; };
PE.car = (type, color, tuned) => {
  const C0 = CARS[type] || CARS.sedan, g = G(), bodyM = P.mat(color, { roughness: .45, metalness: .25 }), glass = P.mat('#1d2433', { roughness: .15 }), dark = P.mat('#18181c');
  const ex = (pts, depth, mat, y = 0) => { const geo = new T.ExtrudeGeometry(prof(pts), { depth, bevelEnabled: false }); const m = new T.Mesh(geo, mat); m.position.set(0, y, -depth / 2); m.castShadow = true; g.add(m); return m; };
  const low = tuned ? .06 : 0, wd = C0.Wd; ex(C0.body, wd, bodyM, -low); ex(C0.cab, wd - .18, glass, -low);
  const top = C0.cab[2][1]; ex(C0.cab.map(p => [p[0] * .92, Math.max(p[1], top - .06)]), wd - .22, bodyM, -low + .05);
  const wr = type === 'kei' ? .27 : .32; [C0.L / 2 - .75, -C0.L / 2 + .75].forEach(x => [-1, 1].forEach(s => { const t = new T.Mesh(new T.CylinderGeometry(wr, wr, .22, 12), dark); t.rotation.x = Math.PI / 2; t.position.set(x, wr, s * (wd / 2 - .06 + (tuned ? .05 : 0))); t.castShadow = true; g.add(t);
    const rim = new T.Mesh(new T.CylinderGeometry(wr * .62, wr * .62, .24, 8), P.mat(tuned ? '#c9a35a' : '#b8bcc6', { metalness: .6, roughness: .3 })); rim.rotation.x = Math.PI / 2; rim.position.copy(t.position); g.add(rim); }));
  [-1, 1].forEach(s => { PE.glowBox(g, .06, .12, .32, '#fff2c4', '#ffffff', C0.L / 2 + .02, .6 - low, s * (wd / 2 - .3)); PE.glowBox(g, .06, .12, .36, '#c8302a', '#ff3a32', -C0.L / 2 - .02, .68 - low, s * (wd / 2 - .3)); });
  if (tuned) { if (C0.wing) { [-.55, .55].forEach(z => B(g, .08, .3, .06, '#18181c', -C0.L / 2 + .3, 1.02 - low, z)); B(g, .38, .05, wd + .05, '#18181c', -C0.L / 2 + .28, 1.2 - low, 0); }
    B(g, .25, .06, wd + .04, '#18181c', C0.L / 2 - .05, .22 - low, 0); [-1, 1].forEach(s => B(g, C0.L * .7, .08, .02, '#f2f2f2', -.1, .62 - low, s * (wd / 2 + .012))); }
  return g;
};
const carDefs = [['car-kei', 'รถเคอิ', 'kei', '#f6f2e6'], ['car-sedan', 'รถเก๋ง', 'sedan', '#2c4683'], ['car-hatch', 'รถแฮทช์แบ็ก', 'hatch', '#d43a2c'], ['car-wagon', 'รถแวกอน', 'wagon', '#9aa0aa'],
  ['car-van', 'รถตู้', 'van', '#e2e4e7'], ['car-coupe', 'รถคูเป้', 'coupe', '#3b3f4a'], ['car-tuner', 'รถซิ่งแต่ง', 'coupe', '#ff6a1a', true], ['car-tuner-hatch', 'รถซิ่งแฮทช์', 'hatch', '#ffd21f', true]];
carDefs.forEach(([id, name, ty, col, tuned]) => reg(id, { name, cat: 'vehicle', snap: .5, tint: true, mover: true, defaults: { c: col }, colors: ['#f6f2e6', '#2c4683', '#d43a2c', '#9aa0aa', '#18181c', '#ff6a1a', '#2f9cff', '#ffd21f'], build: o => PE.car(ty, o.c || col, tuned) }));
reg('bicycle', { name: 'จักรยาน', cat: 'vehicle', snap: .5, build() { const g = G(), d = P.mat('#18181c'); [-.55, .55].forEach(x => { const w = new T.Mesh(new T.TorusGeometry(.33, .04, 6, 14), d); w.position.set(x, .35, 0); g.add(w); }); B(g, 1.1, .05, .05, '#2f9cff', 0, .55, 0); B(g, .05, .5, .05, '#2f9cff', -.2, .65, 0); B(g, .25, .06, .12, '#18181c', -.2, .92, 0); B(g, .05, .1, .5, '#5a6170', .5, .95, 0); return g; } });

/* ---------------- people & animals ---------------- */
PE.person = (shirt = '#2f73b0', o = {}) => {
  const g = G(), R = P.rng(o.seed || 1), skin = ['#e8b08a', '#c68c63', '#8a5a3c', '#f2c9a5'][(R() * 4) | 0], hair = ['#33221a', '#18181c', '#7a4a2a', '#c9a35a'][(R() * 4) | 0];
  const legs = P.mat(o.pants || ['#2c4683', '#3b3f4a', '#5a4a3a'][(R() * 3) | 0]);
  const lL = new T.Group(); lL.name = 'legL'; lL.position.set(0, .82, -.09); g.add(lL); const lR = new T.Group(); lR.name = 'legR'; lR.position.set(0, .82, .09); g.add(lR);
  [lL, lR].forEach(l => { const m = new T.Mesh(new T.BoxGeometry(.15, .8, .15), legs); m.position.y = -.4; m.castShadow = true; l.add(m); });
  B(g, .26, .6, .44, shirt, 0, 1.12, 0); [-1, 1].forEach(s => { const a = B(g, .11, .55, .11, shirt, 0, 1.1, s * .28); a.name = s < 0 ? 'armL' : 'armR'; });
  S(g, .17, skin, 0, 1.56, 0, 1, 1.1, 1, 1); if (o.cap) B(g, .36, .08, .36, o.cap, .03, 1.71, 0); else S(g, .17, hair, -.03, 1.64, 0, 1, .7, 1, 1);
  return g;
};
reg('person', { name: 'คน', cat: 'people', snap: .5, tint: true, defaults: { c: '#2f73b0' }, colors: PE.SHIRTS, build: o => PE.person(o.c, o) });
reg('staff', { name: 'พนักงาน', cat: 'people', snap: .5, tint: true, defaults: { c: '#1c3f8f' }, colors: ['#1c3f8f', '#2f8f83', '#d43a2c', '#18181c'], build: o => PE.person(o.c, Object.assign({ cap: '#9be02f', pants: '#1d2433' }, o)) });
reg('quokka', { name: 'ควอกก้า', cat: 'people', snap: .5, build() { const g = G(), f = '#9a7350', l = '#c9a37a'; S(g, .32, f, 0, .38, 0, 1, 1.15, .95, 1); S(g, .2, l, .12, .36, 0, .7, .9, .8, 1); S(g, .2, f, .1, .78, 0, 1.05, 1, 1, 1);
    [-1, 1].forEach(s => { S(g, .07, f, .05, .97, s * .12, 1, 1, 1, 0); }); S(g, .05, '#2a1a10', .29, .76, 0, 1, 1, 1, 0); [-1, 1].forEach(s => S(g, .03, '#18181c', .24, .84, s * .09, 1, 1, 1, 0)); const t = B(g, .4, .07, .07, f, -.38, .18, 0); t.rotation.z = .3; return g; } });
reg('dog', { name: 'สุนัข', cat: 'people', snap: .5, build() { const g = G(), c = '#c9a37a'; B(g, .7, .3, .3, c, 0, .45, 0); B(g, .3, .28, .26, c, .42, .65, 0); B(g, .12, .1, .14, '#3a2a1a', .6, .62, 0); [[.25, .14], [-.25, .14], [.25, -.14], [-.25, -.14]].forEach(([x, z]) => B(g, .08, .32, .08, c, x, .16, z)); const t = B(g, .3, .06, .06, c, -.45, .6, 0); t.rotation.z = .6; return g; } });

/* ---------------- markers: where game customers come from (hidden when playing) ---------------- */
const marker = (id, name, col, kind) => reg(id, { name, cat: 'marker', snap: 1, role: 'spawn', kind, noShadow: true,
  build() { const g = G(); const r = new T.Mesh(new T.CylinderGeometry(.9, .9, .06, 20), new T.MeshBasicMaterial({ color: P.lin(col), toneMapped: false })); r.position.y = .05; g.add(r);
    const a = new T.Mesh(new T.ConeGeometry(.35, .9, 4), new T.MeshBasicMaterial({ color: P.lin(col), toneMapped: false })); a.position.y = 1.2; a.rotation.x = Math.PI; g.add(a); return g; } });
marker('spawn-walk', 'จุดลูกค้าเดินมา', '#58e1ff', 'walk');
marker('spawn-car', 'จุดรถลูกค้าเข้ามา', '#ffc23a', 'car');

/* ---------------- PPL models (wrapped when their scripts are loaded) ---------------- */
const has = f => typeof P[f] === 'function';
if (has('kangaroo')) reg('kangaroo', { name: 'จิงโจ้', cat: 'people', snap: .5, fit: { h: 1.5 }, build: o => P.kangaroo({ pose: 'stand', seed: o.seed || 3 }) });
if (has('magpie')) reg('magpie', { name: 'นกแม็กพาย', cat: 'people', snap: .5, fit: { len: .55 }, build: () => P.magpie() });
if (has('retroHatch')) reg('retro-hatch', { name: 'รถเรโทร (Quokka)', cat: 'vehicle', snap: .5, fit: { len: 3.9 }, mover: true, build: () => P.retroHatch({}) });
if (has('rrrCar')) [['kestrel', 'ยูท V8'], ['brumby', '4x4 ลุยป่า'], ['corella', 'ไฮบริด'], ['wren', 'แฮทช์ในเมือง'], ['camper', 'แคมเปอร์แวน'], ['suv', 'SUV เอาท์แบ็ก']].forEach(([k, n]) =>
  reg('rrr-' + k, { name: n + ' (Roo Road)', cat: 'vehicle', snap: .5, fit: { len: k === 'camper' ? 5.4 : 4.7 }, mover: true, build: () => { const c = P.rrrCar(k); c.rotation.y = -Math.PI / 2; return c; } }));
if (has('verandahShop')) reg('verandah-shop', { name: 'ร้านระเบียงวิกตอเรียน', cat: 'building', snap: 1, fit: { h: 7.5 }, build: () => P.verandahShop({}) });
if (has('fountain')) reg('fountain', { name: 'น้ำพุ', cat: 'prop', snap: .5, fit: { w: 4 }, build: () => P.fountain({}) });
if (has('freewaySign')) reg('freeway-sign', { name: 'ป้ายทางด่วน', cat: 'prop', snap: .5, fit: { w: 4.5 }, build: () => P.freewaySign({}) });
if (has('jetPlane')) reg('jet-plane', { name: 'เครื่องบิน', cat: 'vehicle', snap: 1, fit: { len: 32 }, build: () => P.jetPlane({}) });
const flora = [['gumGeo', 'ต้นยูคาลิปตัส', 9], ['peppermintGeo', 'ต้นเปปเปอร์มินต์', 6], ['grassTreeGeo', 'ต้นหญ้า (grass tree)', 2.2], ['heathGeo', 'ไม้พุ่มฮีธ', 1], ['tussockGeo', 'กอหญ้า', .7], ['boulderGeo', 'หินก้อนใหญ่', 1.4]];
flora.forEach(([f, n, h]) => { if (has(f)) reg('ppl-' + f.replace('Geo', ''), { name: n, cat: 'nature', snap: .5, fit: { h }, build: o => { const m = new T.Mesh(P[f](o.seed || 1), P.vmat({ flatShading: true })); m.castShadow = true; return m; } }); });
if (P.LP_GARDEN) Object.values(P.LP_GARDEN).forEach(d => reg('lp-' + d.id, { name: d.th, cat: 'garden', snap: .5, build: o => d.make({ seed: o.seed || 7 }) }));
})();
