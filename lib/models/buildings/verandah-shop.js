/* ==== PPL verandah shop: a two-storey Victorian or Spanish-style shop with an iron-lace verandah (3d) ====
   Approved by Paul for Quokka Cafe's Fremantle and Perth CBD (Oct 2026): lit shop windows, a pediment (or a curved Spanish gable with
   terracotta), a balcony with lace rail and frieze, a corrugated iron roof on posts, the verandah can wrap round a corner. Fictional names only.
   PPL.verandahShop({name, col, trim, signBg, signFg, iron, roof, spanish, wrap:'w'|'e', w:4.4, d:2}) -> Group, front faces +z.
   group.userData.night(n) lights the windows (0 day .. 1 night). */
(function(){
const P = window.PPL;
const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
P.verandahShop = (o = {}) => {
  const W = o.w || 4.4, D = o.d || 2, H = 3.6, c = o.col || '#e8d8b0', trim = o.trim || '#f2e8d4', g = new THREE.Group(), vd = .95;
  const put = (geo, m, x, y, z, ry = 0) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.rotation.y = ry; k.castShadow = k.receiveShadow = true; g.add(k); return k; };
  const plane = (w, h, m, x, y, z, ry = 0) => { const k = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); k.position.set(x, y, z); k.rotation.y = ry; g.add(k); return k; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  put(B(W, H, D), P.mat(c), 0, H / 2, 0);
  const winTex = cv(32, 16, (x) => { x.fillStyle = c; x.fillRect(0, 0, 32, 16); x.fillStyle = '#ffe8b8'; x.fillRect(2, 4, 11, 10); x.fillRect(19, 4, 11, 10); x.fillStyle = '#3a2a20'; x.fillRect(14, 3, 4, 13); x.fillStyle = 'rgba(60,40,30,.55)'; for (let i = 2; i < 13; i += 3) x.fillRect(i, 4, 1, 10); for (let i = 19; i < 30; i += 3) x.fillRect(i, 4, 1, 10); });
  const upTex = cv(16, 16, (x) => { x.fillStyle = c; x.fillRect(0, 0, 16, 16); x.fillStyle = '#f2e8d4'; x.fillRect(2, 2, 5, 11); x.fillRect(9, 2, 5, 11); x.fillStyle = '#ffe2a8'; x.fillRect(3, 3, 3, 9); x.fillRect(10, 3, 3, 9); });
  const lit = []; [[winTex, .78, 1.5], [upTex, 2.55, 1.4]].forEach(([t, y, h]) => { const m = new THREE.MeshStandardMaterial({ map: t, roughness: .8, emissive: new THREE.Color(0), emissiveMap: t }); lit.push(m); plane(W - .1, h, m, 0, y, D / 2 + .01); });
  if (o.spanish) { const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, .4); s.quadraticCurveTo(W / 4, .45, W / 6, .85); s.quadraticCurveTo(0, 1.15, -W / 6, .85); s.quadraticCurveTo(-W / 4, .45, -W / 2, .4); s.closePath();
    const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: false }), P.mat(c)); pm.position.set(0, H, D / 2 - .2); pm.castShadow = true; g.add(pm); put(B(W + .1, .1, D + .1), P.mat('#b8603a'), 0, H + .02, 0); }
  else { put(B(W + .06, .5, .18), P.mat(c), 0, H + .25, D / 2 - .09); put(B(W + .14, .08, .24), P.mat(trim), 0, H + .52, D / 2 - .09);
    const tri = new THREE.Shape(); tri.moveTo(-.8, 0); tri.lineTo(.8, 0); tri.lineTo(0, .5); tri.closePath(); const pd = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: .18, bevelEnabled: false }), P.mat(trim)); pd.position.set(0, H + .56, D / 2 - .18); g.add(pd); }
  if (o.name) { const st = cv(Math.max(64, o.name.length * 6 + 8), 12, (x, w, h) => { x.fillStyle = o.signBg || '#1c1c1e'; x.fillRect(0, 0, w, h); x.fillStyle = o.signFg || '#f6e8c8'; x.font = 'bold 8px monospace'; x.textAlign = 'center'; x.fillText(o.name, w / 2, 9); });
    plane(Math.min(W - .4, o.name.length * .17 + .4), .3, new THREE.MeshBasicMaterial({ map: st }), 0, H + .25, D / 2 + .012); }
  const lace = cv(16, 8, (x) => { x.strokeStyle = '#e8e4d8'; x.beginPath(); x.arc(8, 8, 7, Math.PI, 0); x.stroke(); x.beginPath(); x.arc(8, 8, 4, Math.PI, 0); x.stroke(); x.fillStyle = '#e8e4d8'; x.fillRect(0, 0, 16, 1); }), rail = cv(16, 8, (x) => { x.fillStyle = '#e8e4d8'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 7, 16, 1); for (let i = 0; i < 16; i += 2) x.fillRect(i, 1, 1, 6); });
  const lm = (t, n) => { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(n, 1); return new THREE.MeshStandardMaterial({ map: tt, transparent: true, alphaTest: .4, side: THREE.DoubleSide }); };
  const iron = P.mat(o.iron || '#2c4a3a'), roofM = P.mat(o.roof || '#b8bcc0', { metalness: .3, roughness: .5 }), deckM = P.mat('#7a5a3a');
  const wl = o.wrap === 'w' ? vd : 0, wr = o.wrap === 'e' ? vd : 0, xa = -W / 2 - wl, xb = W / 2 + wr, zv = D / 2 + vd;
  const deck = (cx, cz, gx, gz) => { put(B(gx, .08, gz), deckM, cx, 1.75, cz); put(B(gx + .05, .06, gz + .05), roofM, cx, 3.35, cz); };
  const trims = (cx, cz, len, ry) => { plane(len, .45, lm(rail, len / 1.3), cx, 2.0, cz, ry); plane(len, .3, lm(lace, len / 1.3), cx, 1.5, cz, ry); plane(len, .3, lm(lace, len / 1.3), cx, 3.18, cz, ry); };
  deck((xa + xb) / 2, D / 2 + vd / 2, xb - xa, vd); trims((xa + xb) / 2, zv, xb - xa, 0); const n = Math.max(2, Math.round((xb - xa) / 1.3)); for (let k = 0; k <= n; k++) put(B(.07, 3.35, .07), iron, xa + k * (xb - xa) / n, 1.68, zv);
  [[-1, wl], [1, wr]].forEach(([sd, w]) => { if (!w) return; const ex = sd * (W / 2 + vd); deck(sd * (W / 2 + vd / 2), 0, vd, D); trims(ex, 0, D, Math.PI / 2); [-D / 2, 0].forEach(z => put(B(.07, 3.35, .07), iron, ex, 1.68, z)); });
  g.userData.night = n => lit.forEach(m => m.emissive.setRGB(n * 1.2, n, n * .75));
  return g;
};
P.reg('verandah-shop', { group: 'models/buildings', from: 'quokka-cafe: vic()' });
})();
