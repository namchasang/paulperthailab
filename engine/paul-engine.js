/* ==== Paul Engine (PE) v0.1 · core runtime ====
   A small game engine for Paul Perth games, on three.js r128 + the Paul Perth Library (PPL kit + models).
   - World: scene from JSON, iso camera (pan, zoom, 8-way turn), time of day with night glow, shadows, movers on paths.
   - Two looks: 'smooth' (normal 3D) and 'pixel' (true pixel art: low-res render, limited palette, 1px outlines, dither).
   - Asset registry: PE.reg(id, def), PE.make(id, opts). Every asset is sized in metres (people 1.7 m, cars ~4.4 m).
   - Picking, screen projection, thumbnails, bubbles and pops for game UI, tiny sound kit.
   Load order: three.js r128, lib/core/kit.js (+ PPL models you want), paul-engine.js, pe-assets.js, then a template. */
(function(){
'use strict';
const T = THREE, P = window.PPL;
if (!P) throw new Error('Paul Engine needs the PPL kit (lib/core/kit.js) loaded first');
const PE = window.PE = window.PE || {};
PE.ver = '0.1';
PE.assets = {};
PE.CATS = [
  ['ground', 'พื้น'], ['building', 'อาคาร'], ['service', 'จุดบริการ'], ['nature', 'ต้นไม้'], ['garden', 'สวน'],
  ['prop', 'ของตกแต่ง'], ['vehicle', 'ยานพาหนะ'], ['people', 'คนและสัตว์'], ['marker', 'จุดระบบ']];

/* ---------- asset registry ---------- */
PE.reg = (id, def) => { def.id = id; def.cat = def.cat || 'prop'; PE.assets[id] = def; return def; };
const box3 = new T.Box3(), v3 = new T.Vector3();
/* make one asset: build, scale to its declared size (fit), sit it on the ground, centre it */
PE.make = (id, o = {}) => {
  const d = PE.assets[id]; if (!d) throw new Error('unknown asset ' + id);
  const oo = Object.assign({}, d.defaults || {}); for (const k in o) if (o[k] !== undefined && o[k] !== null && o[k] !== '') oo[k] = o[k];
  const inner = d.build(oo);
  const wrap = new T.Group(); wrap.add(inner);
  if (d.fit) {
    box3.setFromObject(inner); const s = box3.getSize(v3);
    const k = d.fit.h ? d.fit.h / Math.max(s.y, 1e-3) : d.fit.len ? d.fit.len / Math.max(s.x, s.z, 1e-3) : d.fit.w ? d.fit.w / Math.max(s.x, 1e-3) : 1;
    inner.scale.multiplyScalar(k);
  }
  if (!d.raw) { box3.setFromObject(inner); const c = box3.getCenter(v3); inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= box3.min.y; }
  if (d.lift) inner.position.y += d.lift;
  wrap.traverse(m => { if (m.isMesh && m.castShadow === false && !d.noShadow && !(m.material && m.material.isMeshBasicMaterial)) { m.castShadow = true; } if (m.isMesh) m.receiveShadow = true; });
  wrap.userData.asset = id; return wrap;
};

/* ---------- small builders shared by assets ---------- */
const G = () => new T.Group();
const mesh = (g, geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
PE.B = (g, w, h, d, c, x, y, z, o) => mesh(g, new T.BoxGeometry(w, h, d), c && c.isMaterial ? c : P.mat(c, o), x, y, z);
PE.C = (g, r, h, c, x, y, z, seg, r2) => mesh(g, new T.CylinderGeometry(r2 === undefined ? r : r2, r, h, seg || 10), c && c.isMaterial ? c : P.mat(c), x, y, z);
PE.S = (g, r, c, x, y, z, sx = 1, sy = 1, sz = 1, det = 1) => { const m = mesh(g, new T.IcosahedronGeometry(r, det), P.mat(c, { flatShading: true }), x, y, z); m.scale.set(sx, sy, sz); return m; };
/* gable roof prism: ridge along x */
PE.roof = (g, w, d, h, c, y, x = 0, z = 0, over = .3) => {
  const s = new T.Shape(); s.moveTo(-d / 2 - over, 0); s.lineTo(d / 2 + over, 0); s.lineTo(0, h); s.lineTo(-d / 2 - over, 0);
  const geo = new T.ExtrudeGeometry(s, { depth: w + over * 2, bevelEnabled: false }); geo.translate(0, 0, -(w + over * 2) / 2); geo.rotateY(Math.PI / 2);
  return mesh(g, geo, P.mat(c, { flatShading: true }), x, y, z);
};
/* lights and glows: night look */
PE.glow = (g, geo, day, night, x, y, z) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: P.lin(day) })); m.position.set(x, y, z); m.userData.glow = [day, night]; g.add(m); return m; };
PE.glowBox = (g, w, h, d, day, night, x, y, z) => PE.glow(g, new T.BoxGeometry(w, h, d), day, night, x, y, z);
PE.light = (g, x, y, z, col = '#ffe2b0', range = 14) => { const o = new T.Object3D(); o.position.set(x, y, z); o.userData.light = { col, range }; g.add(o); return o; };
/* text on a panel (signs); pixel-sharp */
PE.textTex = (lines, w, h, fg, bg, px) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = 'bold ' + (px || Math.floor(h / lines.length * .72)) + 'px "Mitr","Noto Sans Thai",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((t, i) => x.fillText(t, w / 2, h * (i + .5) / lines.length + 1));
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
};
PE.panel = (g, tex, w, h, x, y, z, ry = 0, glowNight) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = ry; if (glowNight) m.userData.glowMap = true; g.add(m); return m; };

/* ---------- time of day ---------- */
const KF = [[0, '#1d2140', .06, '#8090ff', .18, '#5060a0'], [5, '#2a2f55', .1, '#ffb070', .2, '#6070a0'], [6.5, '#f0c49a', .7, '#ffc890', .45, '#ffd8b0'],
  [9, '#a9c8e0', 1.05, '#fff0d8', .55, '#dfeefa'], [15, '#a9c8e0', 1.05, '#fff0d8', .62, '#dfeefa'], [17.5, '#eab07e', 1, '#ffa860', .48, '#ffc898'],
  [19, '#5a4a78', .3, '#ff8a60', .28, '#8a7ab0'], [20, '#1d2140', .07, '#8090ff', .18, '#5060a0'], [24.01, '#1d2140', .06, '#8090ff', .18, '#5060a0']];
const cA = new T.Color(), cB = new T.Color();
function lerpHex(a, b, f) { return cA.set(a).lerp(cB.set(b), f).getHex(); }

/* ---------- World ---------- */
PE.World = class {
  constructor(host, opt = {}) {
    this.host = host; this.opt = opt; this.time = 12; this.mode = opt.mode || 'smooth'; this.px = opt.px || 0; this.palette = opt.palette || 40;
    this.outline = opt.outline !== false; this.dither = opt.dither !== false; this.hueShift = !!opt.hueShift; this.shadows = opt.shadows !== false;
    this.view = { yaw8: 0, zoom: 1, tx: 0, tz: 0, size: 18 }; this.nodes = []; this.paths = []; this.movers = []; this.hidden = {}; this.editor = !!opt.editor;
    this.groundSize = [48, 36]; this.groundColor = '#a6b58a'; this.ticks = []; this.t = 0; this._lit = null; this._palDirty = true; this.nid = 1;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const R = this.R = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: !!opt.preserve });
    R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .95;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    this.gl = R.domElement; this.gl.style.cssText = 'position:absolute;left:0;top:0;display:block';
    this.pxc = document.createElement('canvas'); this.pxc.style.cssText = 'position:absolute;left:0;top:0;image-rendering:pixelated;image-rendering:crisp-edges;display:none';
    host.appendChild(this.gl); host.appendChild(this.pxc);
    const S = this.scene = new T.Scene(); this.root = new T.Group(); S.add(this.root); this.moverRoot = new T.Group(); S.add(this.moverRoot);
    this.hemi = new T.HemisphereLight(0xdfeefa, 0x6b6a60, .62); S.add(this.hemi);
    this.sun = new T.DirectionalLight(0xfff0d8, 1.2); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -.0004; this.sun.shadow.normalBias = .02; S.add(this.sun); S.add(this.sun.target);
    this.pool = []; for (let i = 0; i < 8; i++) { const l = new T.PointLight(0xffe2b0, 0, 14, 1.6); S.add(l); this.pool.push(l); }
    this.cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, 600);
    this.groundMesh = new T.Mesh(new T.PlaneGeometry(1, 1), P.mat(this.groundColor)); this.groundMesh.rotation.x = -Math.PI / 2; this.groundMesh.receiveShadow = true; S.add(this.groundMesh);
    this.gridLines = null; this.ray = new T.Raycaster(); this.plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    this.idMats = new Map(); this.GHOST = new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); this.depthMat = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking });
    this.resize(); this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(host);
  }
  /* ---- size and look ---- */
  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight); this.W = w; this.H = h;
    this.R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); this.R.setSize(w, h, true);
    let sc = this.px || (w < 620 ? 2 : w < 1300 ? 3 : 4); while ((w / sc) * (h / sc) > 180000) sc++;
    this.sc = sc; const pw = Math.ceil(w / sc), ph = Math.ceil(h / sc);
    if (pw !== this.pw || ph !== this.ph) {
      this.pw = pw; this.ph = ph; this.pxc.width = pw; this.pxc.height = ph; this.pxc.style.width = pw * sc + 'px'; this.pxc.style.height = ph * sc + 'px';
      const o = { minFilter: T.NearestFilter, magFilter: T.NearestFilter, format: T.RGBAFormat };
      [this.rtC, this.rtI, this.rtD].forEach(r => r && r.dispose());
      this.rtC = new T.WebGLRenderTarget(pw, ph, o); this.rtC.texture.encoding = T.sRGBEncoding; this.rtI = new T.WebGLRenderTarget(pw, ph, o); this.rtD = new T.WebGLRenderTarget(pw, ph, o);
      this.bufC = new Uint8Array(pw * ph * 4); this.bufI = new Uint8Array(pw * ph * 4); this.bufD = new Uint8Array(pw * ph * 4); this.img = new ImageData(pw, ph); this._palDirty = true;
    }
    this.dirty = true;
  }
  setMode(m) { this.mode = m; this.gl.style.display = m === 'pixel' ? 'none' : 'block'; this.pxc.style.display = m === 'pixel' ? 'block' : 'none'; this._palDirty = true; this.dirty = true; }
  setPixel(px) { this.px = px; this.pw = 0; this.resize(); }
  setTime(h) { this.time = ((h % 24) + 24) % 24; this.dirty = true; }
  /* ---- scene ---- */
  setGround(w, d, color) {
    this.groundSize = [w, d]; if (color) this.groundColor = color;
    this.groundMesh.scale.set(w, d, 1); this.groundMesh.material = P.mat(this.groundColor);
    if (this.gridLines) { this.scene.remove(this.gridLines); this.gridLines = null; }
    if (this.editor) {
      const pts = []; for (let x = -w / 2; x <= w / 2 + 1e-6; x += 2) pts.push(x, .03, -d / 2, x, .03, d / 2); for (let z = -d / 2; z <= d / 2 + 1e-6; z += 2) pts.push(-w / 2, .03, z, w / 2, .03, z);
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
      this.gridLines = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .16, toneMapped: false })); this.gridLines.userData.noId = true; this.scene.add(this.gridLines);
    }
    const s = Math.max(w, d); const c = this.sun.shadow.camera; c.left = -s * .75; c.right = s * .75; c.top = s * .75; c.bottom = -s * .75; c.near = 1; c.far = s * 4 + 100; c.updateProjectionMatrix();
    this.view.size = Math.max(10, Math.min(60, Math.max(w, d) * .42)); this.dirty = true;
  }
  showGrid(on) { if (this.gridLines) this.gridLines.visible = on; this.dirty = true; }
  clear() { this.nodes.forEach(n => this.root.remove(n)); this.nodes = []; this.paths = []; this.clearMovers(); this._lit = null; this.dirty = true; }
  add(spec) {
    const d = PE.assets[spec.a]; if (!d) { console.warn('PE: unknown asset', spec.a); return null; }
    const n = PE.make(spec.a, { c: spec.c, t: spec.t, seed: spec.seed });
    n.userData.spec = Object.assign({}, spec); n.userData.nid = this.nid++; n.position.set(spec.x || 0, spec.y || 0, spec.z || 0); n.rotation.y = (spec.r || 0) * Math.PI / 2;
    if (spec.s && spec.s !== 1) n.scale.setScalar(spec.s);
    n.visible = !this.hidden[d.cat] && !(d.cat === 'marker' && !this.editor);
    this.root.add(n); this.nodes.push(n); this.dirty = true; this._lit = null; this._palDirty = true; return n;
  }
  update(n, patch) { const s = Object.assign({}, n.userData.spec, patch); const i = this.nodes.indexOf(n); this.root.remove(n); this.nodes.splice(i, 1); const m = this.add(s); this.nodes.pop(); this.nodes.splice(i, 0, m); return m; }
  move(n, x, z) { n.position.x = x; n.position.z = z; n.userData.spec.x = x; n.userData.spec.z = z; this.dirty = true; this._lit = null; }
  remove(n) { const i = this.nodes.indexOf(n); if (i >= 0) this.nodes.splice(i, 1); this.root.remove(n); this.dirty = true; this._lit = null; }
  setHidden(cat, hide) { this.hidden[cat] = hide; this.nodes.forEach(n => { const d = PE.assets[n.userData.asset]; if (d.cat === cat) n.visible = !hide && !(cat === 'marker' && !this.editor); }); this.dirty = true; }
  load(json) {
    const s = typeof json === 'string' ? JSON.parse(json) : json; this.clear(); this.meta = { name: s.name || 'ฉากใหม่', template: s.template || null, game: s.game || {} };
    this.setGround((s.ground && s.ground.w) || 48, (s.ground && s.ground.d) || 36, s.ground && s.ground.color);
    if (s.style) { if (s.style.palette) this.palette = s.style.palette; if (s.style.outline !== undefined) this.outline = s.style.outline; if (s.style.dither !== undefined) this.dither = s.style.dither; if (s.style.mode) this.setMode(s.style.mode); }
    if (s.time !== undefined) this.setTime(s.time);
    (s.objects || []).forEach(o => this.add(o)); this.paths = (s.paths || []).map(p => Object.assign({}, p)); this.spawnMovers();
    if (s.view) Object.assign(this.view, s.view); this.dirty = true; return this;
  }
  toJSON() {
    return { v: 1, name: (this.meta && this.meta.name) || 'ฉากใหม่', template: this.meta && this.meta.template, game: this.meta && this.meta.game,
      ground: { w: this.groundSize[0], d: this.groundSize[1], color: this.groundColor }, time: Math.round(this.time * 10) / 10,
      style: { mode: this.mode, palette: this.palette, outline: this.outline, dither: this.dither }, view: { yaw8: this.view.yaw8, zoom: this.view.zoom, tx: this.view.tx, tz: this.view.tz },
      objects: this.nodes.map(n => { const s = n.userData.spec, o = { a: s.a, x: +(+s.x).toFixed(2), z: +(+s.z).toFixed(2) }; if (s.r) o.r = s.r; if (s.c) o.c = s.c; if (s.t) o.t = s.t; if (s.s && s.s !== 1) o.s = s.s; if (s.seed) o.seed = s.seed; return o; }),
      paths: this.paths.map(p => ({ kind: p.kind, n: p.n, sp: p.sp, loop: p.loop, pts: p.pts.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)]) })) };
  }
  /* ---- movers: people and cars walking/driving along paths ---- */
  clearMovers() { this.movers.forEach(m => this.moverRoot.remove(m.o)); this.movers = []; }
  spawnMovers() {
    this.clearMovers(); const R = P.rng(7);
    this.paths.forEach((p, pi) => {
      const len = PE.pathLen(p.pts); if (len < 1) return; const n = p.n || (p.kind === 'car' ? 3 : 4);
      for (let i = 0; i < n; i++) {
        let id; if (p.kind === 'car') { const cars = PE.list('vehicle').filter(a => a.mover); id = cars[(R() * cars.length) | 0].id; }
        else if (p.kind === 'animal') id = R() < .5 ? 'quokka' : 'kangaroo'; else id = 'person';
        const o = PE.make(id, { c: PE.SHIRTS[(R() * PE.SHIRTS.length) | 0], seed: i + pi * 7 }); this.moverRoot.add(o);
        this.movers.push({ o, p, off: len * i / n, sp: (p.sp || (p.kind === 'car' ? 8 : 1.3)) * (.85 + R() * .3), len, ph: R() * 9 });
      }
    });
    this.dirty = true;
  }
  stepMovers(dt) {
    for (const m of this.movers) {
      m.off += m.sp * dt; let d = m.off % (m.p.loop === 'pp' ? m.len * 2 : m.len); let back = false; if (d > m.len) { d = m.len * 2 - d; back = true; }
      const [x, z, a] = PE.along(m.p.pts, d); m.o.position.set(x, 0, z); m.o.rotation.y = back ? a + Math.PI : a;
      if (m.p.kind !== 'car') { m.o.position.y = Math.abs(Math.sin((this.t + m.ph) * 7)) * .05; const arm = m.o.getObjectByName('legL'); if (arm) { arm.rotation.z = Math.sin((this.t + m.ph) * 7) * .5; const r = m.o.getObjectByName('legR'); if (r) r.rotation.z = -arm.rotation.z; } }
    }
  }
  /* ---- camera ---- */
  setView(v) { Object.assign(this.view, v); this.dirty = true; }
  turn(d) { this.view.yaw8 = ((this.view.yaw8 + d) % 8 + 8) % 8; this.dirty = true; }
  camUpdate() {
    const v = this.view, yaw = Math.PI / 4 + v.yaw8 * Math.PI / 4, el = Math.PI / 6, ax = this.W / this.H, h = Math.max(6, v.size / Math.min(1, Math.sqrt(ax * 1.1))) / v.zoom;
    const c = this.cam; c.left = -h * ax; c.right = h * ax; c.top = h; c.bottom = -h; c.updateProjectionMatrix();
    const d = 200; c.position.set(v.tx + Math.sin(yaw) * Math.cos(el) * d, Math.sin(el) * d, v.tz + Math.cos(yaw) * Math.cos(el) * d); c.lookAt(v.tx, 0, v.tz); c.updateMatrixWorld();
    this.unitPx = this.H / (2 * h);
  }
  /* screen-pixel drag -> pan the camera target on the ground */
  panBy(dx, dy) {
    const yaw = Math.PI / 4 + this.view.yaw8 * Math.PI / 4, u = 1 / this.unitPx, rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    this.view.tx += -rx * dx * u + fx * dy * u * 2; this.view.tz += -rz * dx * u + fz * dy * u * 2;
    const [w, d] = this.groundSize; this.view.tx = P.clamp(this.view.tx, -w / 2, w / 2); this.view.tz = P.clamp(this.view.tz, -d / 2, d / 2); this.dirty = true;
  }
  zoomBy(f) { this.view.zoom = P.clamp(this.view.zoom * f, .35, 4); this.dirty = true; }
  /* ---- picking ---- */
  _ndc(cx, cy) { const r = this.host.getBoundingClientRect(); return new T.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); }
  pickGround(cx, cy) { this.camUpdate(); this.ray.setFromCamera(this._ndc(cx, cy), this.cam); const p = new T.Vector3(); return this.ray.ray.intersectPlane(this.plane, p) ? p : null; }
  pickNode(cx, cy, filter) {
    this.camUpdate(); this.ray.setFromCamera(this._ndc(cx, cy), this.cam);
    const hits = this.ray.intersectObjects(this.nodes.filter(n => n.visible), true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.nid) o = o.parent; if (o && (!filter || filter(o))) return o; }
    return null;
  }
  toScreen(pos, y = 0) { this.camUpdate(); v3.set(pos.x, (pos.y || 0) + y, pos.z).project(this.cam); return [(v3.x + 1) / 2 * this.W, (1 - v3.y) / 2 * this.H]; }
  /* ---- light ---- */
  lightsOn() { return this.time >= 18.6 || this.time < 6; }
  _applyLight() {
    const h = this.time; let i = 0; while (i < KF.length - 2 && KF[i + 1][0] <= h) i++; const a = KF[i], b = KF[i + 1], f = P.clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    this.sky = new T.Color(lerpHex(a[1], b[1], f)).convertSRGBToLinear(); this.sun.intensity = a[2] + (b[2] - a[2]) * f; this.sun.color.setHex(lerpHex(a[3], b[3], f)).convertSRGBToLinear();
    this.hemi.intensity = a[4] + (b[4] - a[4]) * f; this.hemi.color.setHex(lerpHex(a[5], b[5], f)).convertSRGBToLinear();
    const sa = P.clamp((h - 6) / 13, 0, 1) * Math.PI, s = Math.max(...this.groundSize); this.sun.position.set(-Math.cos(sa) * s * 1.2 + this.view.tx, Math.max(s * .5, Math.sin(sa) * s * 1.6), s * .8 + this.view.tz); this.sun.target.position.set(this.view.tx, 0, this.view.tz);
    this.sun.castShadow = this.shadows;
    const lit = this.lightsOn();
    if (lit !== this._lit || this._litCount !== this.nodes.length) {
      this._lit = lit; this._litCount = this.nodes.length; const srcs = [];
      this.scene.traverse(o => {
        if (o.userData.glow) { const [dc, nc] = o.userData.glow; o.material.color = P.lin(lit ? nc : dc); }
        if (o.userData.emis) [].concat(o.material).forEach(m => { if (m.emissiveMap) m.emissiveIntensity = lit ? o.userData.emis : 0; });
        if (o.userData.light) { o.updateMatrixWorld(); srcs.push([o.getWorldPosition(new T.Vector3()), o.userData.light]); }
      });
      srcs.sort((p, q) => p[0].distanceToSquared(v3.set(this.view.tx, 0, this.view.tz)) - q[0].distanceToSquared(v3.set(this.view.tx, 0, this.view.tz)));
      this.pool.forEach((l, k) => { const s = srcs[k]; if (s && lit) { l.position.copy(s[0]); l.color = P.lin(s[1].col); l.distance = s[1].range; l.intensity = 1.6; } else l.intensity = 0; });
      this._palDirty = true;
    }
  }
  /* ---- frame ---- */
  step(dt) { this.t += dt; this.stepMovers(dt); for (const n of this.nodes) if (n.userData.tick || n.children[0].userData.tick) (n.userData.tick || n.children[0].userData.tick)(this.t, dt); this.ticks.forEach(f => f(dt, this.t)); }
  render() {
    this.camUpdate(); this._applyLight(); const R = this.R;
    if (this.mode !== 'pixel') { R.setRenderTarget(null); R.setClearColor(this.sky, 1); R.render(this.scene, this.cam); this.dirty = false; return; }
    this._pixel(); this.dirty = false;
  }
  _idMat(g) { if (!this.idMats.has(g)) { const m = new T.MeshBasicMaterial({ color: new T.Color((g & 255) / 255, ((g >> 8) & 255) / 255, (((g >> 16) & 127) + 17) / 255), toneMapped: false }); this.idMats.set(g, m); } return this.idMats.get(g); }
  _idCut(g, m) { const k = g + ':' + m.uuid; this._cuts = this._cuts || new Map(); if (!this._cuts.has(k)) { const b = this._idMat(g); this._cuts.set(k, new T.MeshBasicMaterial({ color: b.color, alphaMap: (m.userData && m.userData.mask) || m.map, alphaTest: m.alphaTest, side: m.side, toneMapped: false })); } return this._cuts.get(k); }
  _depthCut(m) { this._dcuts = this._dcuts || new Map(); if (!this._dcuts.has(m.uuid)) this._dcuts.set(m.uuid, new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: m.map, alphaTest: m.alphaTest, side: m.side })); return this._dcuts.get(m.uuid); }
  _pixel() {
    const R = this.R, S = this.scene, pw = this.pw, ph = this.ph, list = [];
    S.traverse(o => { if (o.isMesh || o.isLineSegments || o.isPoints) { let g = o, id = 0; while (g && !id) { id = g.userData.nid || g.userData.mid; g = g.parent; } const m = o.material, cut = m && m.alphaTest > 0 && m.map; list.push([o, m, o.userData.ghost || o.isLineSegments || o.isPoints ? this.GHOST : cut ? this._idCut(id || 1, m) : this._idMat(id || 1), cut ? this._depthCut(m) : null]); } });
    R.setClearColor(this.sky, 1); R.setRenderTarget(this.rtC); R.render(S, this.cam); R.readRenderTargetPixels(this.rtC, 0, 0, pw, ph, this.bufC);
    const sb = S.background; list.forEach(([o, m, im]) => o.material = im); R.setClearColor(0, 0); R.setRenderTarget(this.rtI); R.render(S, this.cam); R.readRenderTargetPixels(this.rtI, 0, 0, pw, ph, this.bufI);
    list.forEach(([o, m, im, dc]) => o.material = im === this.GHOST ? this.GHOST : dc || this.depthMat); R.setRenderTarget(this.rtD); R.render(S, this.cam); R.readRenderTargetPixels(this.rtD, 0, 0, pw, ph, this.bufD);
    list.forEach(([o, m]) => o.material = m); R.setRenderTarget(null); S.background = sb;
    this._post();
  }
  _post() {
    const W = this.pw, H = this.ph, N = W * H, C = this.bufC, I = this.bufI, D = this.bufD; const id = this._id && this._id.length === N ? this._id : (this._id = new Int32Array(N)), dep = this._dep && this._dep.length === N ? this._dep : (this._dep = new Float32Array(N)), rgb = this._rgb && this._rgb.length === N * 3 ? this._rgb : (this._rgb = new Uint8ClampedArray(N * 3));
    for (let y = 0; y < H; y++) { const ry = (H - 1 - y) * W; for (let x = 0; x < W; x++) { const s = (ry + x) * 4, i = y * W + x; id[i] = I[s + 3] ? ((I[s + 2] << 16) | (I[s + 1] << 8) | I[s]) : 0; dep[i] = (D[s] / 16777216 + D[s + 1] / 65536 + D[s + 2] / 256 + D[s + 3]) / 255; rgb[i * 3] = C[s]; rgb[i * 3 + 1] = C[s + 1]; rgb[i * 3 + 2] = C[s + 2]; if (this.hueShift && id[i]) { const L = (C[s] * .3 + C[s + 1] * .59 + C[s + 2] * .11) / 255 - .5; rgb[i * 3] = C[s] + L * 26; rgb[i * 3 + 1] = C[s + 1] + L * 6; rgb[i * 3 + 2] = C[s + 2] - L * 30; } } }
    if (this._palDirty || !this.pal || this.pal.length !== this.palette || Math.abs(this.time - (this._palT || 0)) > .6) { this._palT = this.time; this.pal = PE.kmeans(rgb, this.palette); this._palDirty = false; this.cache = new Int16Array(1 << 18).fill(-1); }
    const pal = this.pal, cache = this.cache, out = this.img.data, BAY = PE.BAYER, dith = this.dither, ol = this.outline;
    const near = (r, g, b) => { r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b; const k = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2); let q = cache[k]; if (q < 0) { let bd = 1e12; for (let j = 0; j < pal.length; j++) { const p = pal[j], dd = (p[0] - r) ** 2 * .3 + (p[1] - g) ** 2 * .59 + (p[2] - b) ** 2 * .11; if (dd < bd) { bd = dd; q = j; } } cache[k] = q; } return q; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, j = i * 3; let r = rgb[j], g = rgb[j + 1], b = rgb[j + 2]; if (dith && id[i]) { const o = (BAY[(y & 3) * 4 + (x & 3)] / 16 - .5) * 9; r += o; g += o; b += o; }
      let col = pal[near(r, g, b)];
      if (ol && id[i]) {
        if ((x > 0 && !id[i - 1]) || (x < W - 1 && !id[i + 1]) || (y > 0 && !id[i - W]) || (y < H - 1 && !id[i + W])) col = PE.INK;
        else for (const n of [i - 1, i + 1, i - W, i + W]) { if (n >= 0 && n < N && id[n] && id[n] !== id[i] && dep[n] > dep[i] + .0012) { col = pal[near(col[0] * .55, col[1] * .55, col[2] * .62)]; break; } }
      }
      const k = i * 4; out[k] = col[0]; out[k + 1] = col[1]; out[k + 2] = col[2]; out[k + 3] = 255;
    }
    this.pxc.getContext('2d').putImageData(this.img, 0, 0);
  }
  /* run: step + render every frame (pixel look at ~14 fps to stay light on phones) */
  run(onFrame) {
    let last = performance.now(), lastR = 0; const loop = now => {
      this._raf = requestAnimationFrame(loop); if (document.hidden) return; const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (!this.paused) this.step(dt); if (onFrame) onFrame(dt, now);
      const gap = this.mode === 'pixel' ? 70 : 0; if (now - lastR >= gap) { lastR = now; this.render(); }
    }; this._raf = requestAnimationFrame(loop); return this;
  }
  stop() { cancelAnimationFrame(this._raf); }
  /* drag to pan, wheel/pinch to zoom; returns a detach function. onTap(e) gets clicks that did not move. */
  controls(onTap, opt = {}) {
    const el = this.host, pts = new Map(); let moved = false, start = null, pinch = 0;
    const down = e => { if (opt.ignore && opt.ignore(e)) return; pts.set(e.pointerId, [e.clientX, e.clientY]); el.setPointerCapture(e.pointerId); if (pts.size === 1) { start = [e.clientX, e.clientY]; moved = false; } if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } };
    const move = e => {
      if (!pts.has(e.pointerId)) { if (opt.hover) opt.hover(e); return; } const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) this.zoomBy(d / pinch); pinch = d; moved = true; return; }
      if (!moved && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6) moved = true;
      if (moved) { if (opt.drag && opt.drag(e, prev)) return; this.panBy(e.clientX - prev[0], e.clientY - prev[1]); }
    };
    const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size === 0) { if (!moved && onTap) onTap(e); if (opt.dragEnd) opt.dragEnd(e, moved); } };
    const wheel = e => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('wheel', wheel, { passive: false });
    el.style.touchAction = 'none'; return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('wheel', wheel); };
  }
};

/* ---------- maths ---------- */
PE.BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
PE.INK = [28, 26, 38];
PE.SHIRTS = ['#d43a2c', '#2f73b0', '#e2e4e7', '#3f8f3c', '#d4a02a', '#8a5cc8', '#e2608a', '#1f949e', '#f0f0ea', '#3b3f4a'];
PE.pathLen = p => { let s = 0; for (let i = 0; i < p.length - 1; i++) s += Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]); return s; };
PE.along = (path, d) => {
  for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-6) continue; if (d <= l) { const f = d / l; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(-(b[1] - a[1]), b[0] - a[0])]; } d -= l; }
  const n = path.length, b = path[n - 1], a = path[n - 2] || b; return [b[0], b[1], Math.atan2(-(b[1] - a[1]), b[0] - a[0])];
};
PE.kmeans = (rgb, K) => {
  const n = rgb.length / 3, cnt = new Map();
  for (let i = 0; i < n; i += 2) { const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2], k = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3); const e = cnt.get(k); if (e) { e[0] += r; e[1] += g; e[2] += b; e[3]++; } else cnt.set(k, [r, g, b, 1]); }
  const U = [...cnt.values()].map(e => [e[0] / e[3], e[1] / e[3], e[2] / e[3], e[3]]).sort((a, b) => b[3] - a[3]); let C = [];
  for (const u of U) { if (C.length >= K) break; if (C.every(c => (c[0] - u[0]) ** 2 + (c[1] - u[1]) ** 2 + (c[2] - u[2]) ** 2 > 160)) C.push(u.slice(0, 3)); }
  while (C.length < K && C.length < U.length) C.push(U[C.length].slice(0, 3));
  for (let it = 0; it < 8; it++) {
    const A = C.map(() => [0, 0, 0, 0]);
    for (const u of U) { let bi = 0, bd = 1e12; for (let j = 0; j < C.length; j++) { const c = C[j], d = (c[0] - u[0]) ** 2 * .3 + (c[1] - u[1]) ** 2 * .59 + (c[2] - u[2]) ** 2 * .11; if (d < bd) { bd = d; bi = j; } } const a = A[bi]; a[0] += u[0] * u[3]; a[1] += u[1] * u[3]; a[2] += u[2] * u[3]; a[3] += u[3]; }
    C = C.map((c, j) => A[j][3] ? [A[j][0] / A[j][3], A[j][1] / A[j][3], A[j][2] / A[j][3]] : c);
  }
  return C.map(c => c.map(Math.round));
};
PE.list = cat => Object.values(PE.assets).filter(a => !cat || a.cat === cat);

/* ---------- thumbnails (asset palette, car book, shop icons) ---------- */
let TR = null, TS, TC; const thumbs = {};
PE.thumb = (id, size = 72, o = {}) => {
  const key = id + size + JSON.stringify(o); if (thumbs[key]) return thumbs[key];
  if (!TR) {
    TR = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); TR.outputEncoding = T.sRGBEncoding; TR.toneMapping = T.ACESFilmicToneMapping;
    TS = new T.Scene(); TS.add(new T.HemisphereLight(0xeef4ff, 0x887766, .9)); const d = new T.DirectionalLight(0xffffff, 1.2); d.position.set(-4, 8, 6); TS.add(d); TC = new T.OrthographicCamera(-1, 1, 1, -1, .1, 500);
  }
  TR.setSize(size, size, false); const obj = PE.make(id, o); TS.add(obj); box3.setFromObject(obj); const c = box3.getCenter(new T.Vector3()), s = box3.getSize(new T.Vector3());
  const r = Math.max(s.x, s.y * 1.2, s.z) * .78 + .05, y = Math.PI / 4; TC.left = -r; TC.right = r; TC.top = r; TC.bottom = -r; TC.updateProjectionMatrix();
  TC.position.set(c.x + Math.sin(y) * 100, c.y + 60, c.z + Math.cos(y) * 100); TC.lookAt(c); TR.setClearColor(0, 0); TR.render(TS, TC); TS.remove(obj);
  return thumbs[key] = TR.domElement.toDataURL();
};

/* ---------- game UI helpers: bubbles over objects, floating numbers, toast ---------- */
PE.UI = class {
  constructor(world, layer) { this.w = world; this.layer = layer; this.items = new Set(); layer.style.cssText += ';position:absolute;inset:0;pointer-events:none;overflow:hidden'; }
  bubble(target, html, opt = {}) {
    const b = document.createElement(opt.onTap ? 'button' : 'div'); b.className = 'pe-bub ' + (opt.cls || ''); b.innerHTML = html; if (opt.onTap) { b.type = 'button'; b.style.pointerEvents = 'auto'; b.onclick = e => { e.stopPropagation(); opt.onTap(b); }; b.onpointerdown = e => e.stopPropagation(); }
    const it = { el: b, target, y: opt.y || 2.4 }; this.layer.appendChild(b); this.items.add(it); this.place(it); return { el: b, set: h => { b.innerHTML = h; }, bar: f => { const u = b.querySelector('u'); if (u) u.style.width = Math.max(0, Math.min(1, f)) * 100 + '%'; }, remove: () => { b.remove(); this.items.delete(it); } };
  }
  place(it) { const p = it.target.position ? it.target.position : it.target; const [x, y] = this.w.toScreen(p, it.y); it.el.style.left = x + 'px'; it.el.style.top = y + 'px'; }
  update() { this.items.forEach(it => this.place(it)); }
  pop(pos, txt, cls) { const [x, y] = this.w.toScreen(pos, 2.2), d = document.createElement('div'); d.className = 'pe-pop ' + (cls || ''); d.textContent = txt; d.style.left = x + 'px'; d.style.top = y + 'px'; this.layer.appendChild(d); setTimeout(() => d.remove(), 1400); }
  clear() { this.items.forEach(it => it.el.remove()); this.items.clear(); }
};
PE.css = `.pe-bub{position:absolute;transform:translate(-50%,-100%);background:#f3efe6;color:#14121c;border:2px solid #14121c;padding:3px 8px 5px;display:grid;justify-items:center;gap:2px;min-width:44px;box-shadow:0 3px 0 #0009;font:13px/1.15 "Mitr","DotGothic16",system-ui,sans-serif;cursor:pointer}
.pe-bub::after{content:"";position:absolute;left:50%;bottom:-7px;margin-left:-5px;border:5px solid transparent;border-top-color:#14121c;border-bottom:0}
.pe-bub .k{font-size:18px;line-height:1}.pe-bub i{display:block;width:100%;height:4px;background:#0002}.pe-bub i u{display:block;height:100%;background:#14121c;width:100%}
.pe-bub.wait{animation:pe-bob 1s steps(2) infinite}.pe-bub.prog{background:#2d2840;color:#f3efe6;pointer-events:none}.pe-bub.prog i u{background:#9be02f}.pe-bub.up{background:#9be02f}.pe-bub.low i u{background:#ff4a3a}
@keyframes pe-bob{50%{margin-top:-3px}}.pe-pop{position:absolute;transform:translate(-50%,-100%);color:#9be02f;text-shadow:2px 2px 0 #000,-1px -1px 0 #000;font:16px "Mitr",system-ui,sans-serif;white-space:nowrap;animation:pe-rise 1.3s steps(8) forwards}
.pe-pop.bad{color:#ff4a3a}@keyframes pe-rise{to{margin-top:-34px;opacity:0}}@media (prefers-reduced-motion:reduce){.pe-bub.wait,.pe-pop{animation:none}}`;
PE.injectCss = () => { if (document.getElementById('pe-css')) return; const s = document.createElement('style'); s.id = 'pe-css'; s.textContent = PE.css; document.head.appendChild(s); };

/* ---------- sound: tiny square-wave blips (start after a tap) ---------- */
let AC = null;
PE.beep = (f = 660, d = .06, type = 'square', vol = .04) => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d + .05); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + d + .06); } catch (e) { } };
PE.sfx = { coin: () => { PE.beep(880, .05); setTimeout(() => PE.beep(1320, .07), 60); }, tap: () => PE.beep(660, .04), bad: () => PE.beep(160, .12, 'sawtooth'), build: () => { PE.beep(523, .06); setTimeout(() => PE.beep(784, .08), 70); } };

/* ---------- save (per browser) ---------- */
PE.store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
PE.yen = (n, cur = '¥') => (n < 0 ? '−' : '') + cur + Math.abs(Math.round(n)).toLocaleString('en-US');
})();
