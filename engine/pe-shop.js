/* ==== Paul Engine template: shop management (บริหารร้าน) + PE.boot ====
   Works with any scene that has service points: 'counter' assets (walk-in customers) or 'pump' assets (cars).
   Customers come from 'spawn-walk' / 'spawn-car' markers (or the front edge), queue, show what they want,
   the player taps to serve (or hired staff serve on their own), pays, sometimes buys an extra, then leaves.
   Settings come from scene.game: {title, cur, unit, money, items:[{k,name,price,col}], extras:[...], open, close, lang}. */
(function(){
'use strict';
const T = THREE, P = window.PPL, PE = window.PE;
const W = {
  th: { start: 'เริ่มเปิดร้าน', day: 'วันที่', rep: 'ชื่อเสียง', up: 'อัปเกรด', close: 'ปิด', next: 'เปิดวันถัดไป', cust: 'ลูกค้า', earn: 'รายได้', lost: 'ลูกค้าเดินออก', wage: 'ค่าแรง', net: 'สุทธิ', ended: 'ปิดร้าน วันที่ ', busy: 'ยังไม่ว่าง', slow: 'รอนานไป!', poor: 'เงินไม่พอ', done: 'มีแล้ว', how: 'แตะฟองเหนือลูกค้าเพื่อขาย · แตะข้อเสนอสีเขียวเพื่อขายเพิ่ม · ลากเพื่อเลื่อน หมุนด้วยปุ่ม ⟳',
    u_staff: ['จ้างพนักงาน', 'พนักงานบริการลูกค้าเองเมื่อรอเกิน 3 วินาที'], u_fast: ['อุปกรณ์เร็วขึ้น', 'บริการเร็วขึ้น 35%'], u_ads: ['ติดป้ายโฆษณา', 'ลูกค้ามากขึ้น 30%'], u_decor: ['ตกแต่งร้าน', 'ลูกค้าใจเย็นขึ้น และชื่อเสียงขึ้นเร็วขึ้น'] },
  en: { start: 'Open the shop', day: 'Day', rep: 'Rep', up: 'Upgrades', close: 'Close', next: 'Next day', cust: 'Customers', earn: 'Income', lost: 'Walked out', wage: 'Wages', net: 'Net', ended: 'Closed · day ', busy: 'Busy', slow: 'Too slow!', poor: 'Not enough money', done: 'Owned', how: 'Tap the bubble over a customer to sell · tap green offers to upsell · drag to look around, ⟳ to turn',
    u_staff: ['Hire staff', 'Staff serve customers who wait over 3 s'], u_fast: ['Faster gear', 'Serve 35% faster'], u_ads: ['Street sign', '30% more customers'], u_decor: ['Decorate', 'Customers wait longer, rep grows faster'] },
  ja: { start: '開店する', day: '', rep: '評判', up: 'アップグレード', close: '閉じる', next: '次の日へ', cust: 'お客さん', earn: '売上', lost: '帰った客', wage: '人件費', net: '純利益', ended: '閉店 ', busy: '対応中', slow: '遅い!', poor: 'お金が足りない', done: '購入済み', how: 'お客さんの吹き出しをタップして販売 · 緑のおすすめで追加販売 · ドラッグで移動',
    u_staff: ['スタッフを雇う', '3秒待つと自動で接客'], u_fast: ['速い機械', '接客が35%速くなる'], u_ads: ['看板', 'お客さん+30%'], u_decor: ['内装', '待ち時間が延び、評判が上がりやすい'] } };
const DEF = { title: 'My Shop', cur: '$', unit: 1, money: 300, open: 8, close: 22, lang: 'th',
  items: [{ k: 'C', name: 'กาแฟ', price: 5, col: '#7d532e' }, { k: 'T', name: 'ชาเย็น', price: 4, col: '#d4802a' }, { k: 'S', name: 'แซนด์วิช', price: 8, col: '#2f8f3c' }],
  extras: [{ k: '+', name: 'ขนม', price: 3 }, { k: '+', name: 'น้ำเปล่า', price: 2 }],
  carItems: [{ k: 'R', name: 'ธรรมดา', price: 60, col: '#d43a2c' }, { k: 'H', name: 'ไฮออกเทน', price: 75, col: '#d99a00' }, { k: 'D', name: 'ดีเซล', price: 55, col: '#2fae55' }],
  carExtras: [{ k: '+', name: 'ล้างรถ', price: 12 }, { k: '+', name: 'เติมลม', price: 3 }] };

PE.Shop = class {
  constructor(world, fx, hud, cfg) {
    this.w = world; this.ui = new PE.UI(world, fx); this.hud = hud; this.c = Object.assign({}, DEF, cfg || {}); this.lang = this.c.lang || 'th';
    this.money = this.c.money * this.c.unit; this.rep = 2.5; this.dayN = 1; this.min = this.c.open * 60; this.speed = 1; this.up = { staff: 0, fast: 0, ads: 0, decor: 0 };
    this.cust = []; this.stats = { n: 0, earn: 0, lost: 0 }; this.spawnT = 1; this.paused = true;
    this.points = world.nodes.filter(n => { const d = PE.assets[n.userData.asset]; return d.role === 'counter' || d.role === 'pump'; }).map(n => {
      const d = PE.assets[n.userData.asset], a = n.rotation.y, s = d.serve || [0, 1.5], q = [n.position.x + s[0] * Math.cos(a) + s[1] * Math.sin(a), n.position.z - s[0] * Math.sin(a) + s[1] * Math.cos(a)];
      return { n, kind: d.role === 'pump' ? 'car' : 'walk', q, busy: null, line: [] };
    });
    this.spawns = world.nodes.filter(n => PE.assets[n.userData.asset].role === 'spawn').map(n => ({ kind: PE.assets[n.userData.asset].kind, x: n.position.x, z: n.position.z }));
    this.UPG = [['staff', [60, 150, 320], 3], ['fast', [120, 300], 2], ['ads', [100, 260], 2], ['decor', [80, 220], 2]];
    this.drawHud();
  }
  t(k) { return (W[this.lang] || W.th)[k] || W.en[k]; }
  name(it) { return (it[this.lang + 'Name'] || it.name); }
  get open() { return this.min < this.c.close * 60; }
  fmt(n) { return PE.yen(n, this.c.cur); }
  /* ---- customers ---- */
  spawn() {
    const free = this.points.filter(p => p.line.length < 2); if (!free.length) return; const p = free[(Math.random() * free.length) | 0];
    const sp = this.spawns.filter(s => s.kind === p.kind); let s0 = sp.length ? sp[(Math.random() * sp.length) | 0] : null;
    const [gw, gd] = this.w.groundSize; if (!s0) s0 = { x: P.clamp(p.q[0] + (Math.random() - .5) * 10, -gw / 2 + 1, gw / 2 - 1), z: gd / 2 - 1 };
    const items = p.kind === 'car' ? this.c.carItems : this.c.items, it = items[(Math.random() * items.length) | 0];
    let o; if (p.kind === 'car') { const cars = PE.list('vehicle').filter(a => a.mover && !a.id.startsWith('rrr-camper')); o = PE.make(cars[(Math.random() * cars.length) | 0].id, { c: ['#f6f2e6', '#2c4683', '#d43a2c', '#9aa0aa', '#18181c', '#ff6a1a', '#2f9cff'][(Math.random() * 7) | 0] }); }
    else o = PE.make('person', { c: PE.SHIRTS[(Math.random() * PE.SHIRTS.length) | 0], seed: (Math.random() * 99) | 0 });
    o.position.set(s0.x, 0, s0.z); this.w.moverRoot.add(o);
    const c = { o, p, it, s0, st: 'in', kind: p.kind, pat: 0, patMax: 16 + this.up.decor * 5 }; p.line.push(c); this.cust.push(c); this.route(c);
  }
  spot(c) { const i = c.p.line.indexOf(c), back = c.kind === 'car' ? 5.5 : 1.3; const dx = c.s0.x - c.p.q[0], dz = c.s0.z - c.p.q[1], L = Math.hypot(dx, dz) || 1; return [c.p.q[0] + dx / L * back * i, c.p.q[1] + dz / L * back * i]; }
  route(c) { const [qx, qz] = this.spot(c), x = c.o.position.x, z = c.o.position.z; c.path = c.kind === 'car' ? [[x, z], [qx, z], [qx, qz]] : [[x, z], [x, qz], [qx, qz]]; c.d = 0; c.len = PE.pathLen(c.path); c.sp = c.kind === 'car' ? 8 : 2.4; }
  leave(c, angry) {
    if (c.bub) { c.bub.remove(); c.bub = null; } if (c.up) { c.up.remove(); c.up = null; } const i = c.p.line.indexOf(c); if (i >= 0) c.p.line.splice(i, 1); if (c.p.busy === c) c.p.busy = null;
    if (angry) { this.rep = Math.max(0, this.rep - .15); this.stats.lost++; this.ui.pop(c.o.position, this.t('slow'), 'bad'); PE.sfx.bad(); }
    const x = c.o.position.x, z = c.o.position.z; c.path = c.kind === 'car' ? [[x, z], [x, c.s0.z], [c.s0.x, c.s0.z]] : [[x, z], [c.s0.x, z], [c.s0.x, c.s0.z]]; c.d = 0; c.len = PE.pathLen(c.path); c.st = 'out';
    this.cust.filter(o => o.p === c.p && o.st !== 'out').forEach(o => { if (o.st === 'in' || o.st === 'wait') this.route(o); if (o.st === 'wait') { o.st = 'in'; } });
  }
  move(c, dt) { c.d = Math.min(c.len, c.d + c.sp * dt * Math.min(1, .3 + (c.len - c.d) / 3)); const [x, z, a] = PE.along(c.path, c.d); c.o.position.x = x; c.o.position.z = z; c.o.rotation.y = a;
    if (c.kind === 'walk') { const l = c.o.getObjectByName('legL'), r = c.o.getObjectByName('legR'); const sw = c.d < c.len ? Math.sin(this.w.t * 8) * .5 : 0; if (l) l.rotation.z = sw; if (r) r.rotation.z = -sw; }
    return c.d >= c.len - 1e-3; }
  serve(c, auto) {
    if (c.st !== 'wait') return; if (c.p.busy && c.p.busy !== c) return; if (c.p.line[0] !== c) { this.ui.pop(c.o.position, this.t('busy'), 'bad'); return; }
    c.p.busy = c; c.st = 'serve'; c.prog = 0; c.dur = (c.kind === 'car' ? 4 : 2.4) * (1 - .35 * Math.min(1, this.up.fast)) * (this.up.fast > 1 ? .8 : 1); c.auto = auto; if (!auto) { PE.sfx.tap(); }
    c.bub.remove(); c.bub = this.ui.bubble(c.o, `<span>${this.name(c.it)}</span><i><u style="width:0"></u></i>`, { cls: 'prog', y: c.kind === 'car' ? 2.2 : 2.2 });
    const ex = c.kind === 'car' ? this.c.carExtras : this.c.extras; if (ex && ex.length && Math.random() < .45) { const e = ex[(Math.random() * ex.length) | 0]; c.ex = e; c.exT = 3.5;
      c.up = this.ui.bubble(c.o, `<span>${this.name(e)}</span><b>+${this.fmt(e.price * this.c.unit)}</b><i><u></u></i>`, { cls: 'up', y: 3.4, onTap: () => { this.money += e.price * this.c.unit; this.stats.earn += e.price * this.c.unit; this.rep = Math.min(5, this.rep + .03); this.ui.pop(c.o.position, '+' + this.fmt(e.price * this.c.unit)); PE.sfx.coin(); c.up.remove(); c.up = null; } }); }
  }
  step(dt) {
    if (this.paused) return; const sdt = dt * this.speed; this.min += sdt * 6;
    if (!this.open && !this.cust.length) { this.endDay(); return; }
    if (this.open) { this.spawnT -= sdt; if (this.spawnT <= 0) { this.spawnT = 4.2 / ((.55 + this.rep / 5 * .9) * (1 + .3 * this.up.ads)) * (.7 + Math.random() * .6); if (this.points.length) this.spawn(); } }
    const busyStaff = this.cust.filter(c => c.st === 'serve' && c.auto).length;
    for (const c of this.cust.slice()) {
      if (c.st === 'in') { if (this.move(c, sdt)) { if (c.p.line.indexOf(c) === 0 || !c.bub) { c.st = 'wait'; c.pat = c.patMax; c.waited = 0; if (!c.bub) c.bub = this.ui.bubble(c.o, `<span class="k" style="background:${c.it.col || '#333'};color:#fff;padding:1px 6px">${c.it.k}</span><span>${this.name(c.it)}</span><i><u></u></i>`, { cls: 'wait', y: c.kind === 'car' ? 2.2 : 2.2, onTap: () => this.serve(c, false) }); } } }
      else if (c.st === 'wait') { c.pat -= sdt; c.waited += sdt; c.bub.bar(c.pat / c.patMax); c.bub.el.classList.toggle('low', c.pat / c.patMax < .35);
        if (this.up.staff > busyStaff && c.waited > 3 && c.p.line[0] === c) this.serve(c, true); if (c.st === 'wait' && c.pat <= 0) this.leave(c, true); }
      else if (c.st === 'serve') { c.prog += sdt / c.dur; c.bub.bar(c.prog); if (c.up) { c.exT -= sdt; c.up.bar(c.exT / 3.5); if (c.exT <= 0) { c.up.remove(); c.up = null; } }
        if (c.prog >= 1) { const v = c.it.price * this.c.unit; this.money += v; this.stats.earn += v; this.stats.n++; this.rep = Math.min(5, this.rep + .04 * (1 + .5 * this.up.decor)); this.ui.pop(c.o.position, '+' + this.fmt(v)); PE.sfx.coin(); this.leave(c, false); } }
      else if (c.st === 'out') { if (this.move(c, sdt)) { this.w.moverRoot.remove(c.o); this.cust.splice(this.cust.indexOf(c), 1); } }
    }
    this.ui.update();
  }
  /* ---- day ---- */
  endDay() { this.paused = true; const wage = this.up.staff * 20 * this.c.unit; this.wage = wage; this.sheet('day'); }
  nextDay() { this.money -= this.wage; this.dayN++; this.min = this.c.open * 60; this.stats = { n: 0, earn: 0, lost: 0 }; this.paused = false; this.closeSheet(); }
  /* ---- HUD ---- */
  drawHud() {
    const h = this.hud; h.innerHTML = `<div class="pe-hud"><span class="chip" id="peDay"></span><span class="chip m" id="peMoney"></span><span class="chip" id="peRep"></span><span class="sp"></span>
      <button class="tb main" id="peUp"></button><button class="tb" id="peSpd">▶ ×1</button><button class="tb" id="peRot" aria-label="turn">⟳</button><button class="tb" id="peLang">TH</button></div><div class="pe-sheet" id="peSheet" hidden></div>`;
    const $ = s => h.querySelector(s); $('#peUp').onclick = () => this.sheetKind === 'up' ? this.closeSheet() : this.sheet('up');
    $('#peSpd').onclick = e => { this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1; e.currentTarget.textContent = '▶ ×' + this.speed; };
    $('#peRot').onclick = () => this.w.turn(1); $('#peLang').onclick = () => { this.lang = { th: 'en', en: 'ja', ja: 'th' }[this.lang]; this.words(); };
    this.words();
  }
  words() { const $ = s => this.hud.querySelector(s); $('#peUp').textContent = this.t('up'); $('#peLang').textContent = this.lang.toUpperCase(); this.tick(); if (this.sheetKind) this.sheet(this.sheetKind); }
  tick() { const $ = s => this.hud.querySelector(s), m = Math.floor(this.min) % 1440; $('#peDay').innerHTML = (this.lang === 'ja' ? this.dayN + '日目' : this.t('day') + ' ' + this.dayN) + ' <b>' + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60 / 10) * 10).padStart(2, '0') + '</b>';
    $('#peMoney').textContent = this.fmt(this.money); $('#peRep').innerHTML = this.t('rep') + ' <b>★' + this.rep.toFixed(1) + '</b>'; }
  sheet(kind) {
    this.sheetKind = kind; const el = this.hud.querySelector('#peSheet'); el.hidden = false; let h = '';
    if (kind === 'up') { h = `<h2>${this.t('up')} <button class="x" data-x>${this.t('close')}</button></h2><div class="grid">` + this.UPG.map(([k, costs, max]) => { const lv = this.up[k], [nm, ds] = this.t('u_' + k), full = lv >= max, cost = full ? 0 : costs[Math.min(lv, costs.length - 1)] * this.c.unit;
        return `<div class="card${full ? ' done' : ''}"><h3>${nm} <small>${lv}/${max}</small></h3><p>${ds}</p><button data-u="${k}" ${full || this.money < cost ? 'disabled' : ''}>${full ? this.t('done') : (this.money < cost ? this.t('poor') + ' · ' : '') + this.fmt(cost)}</button></div>`; }).join('') + '</div>'; }
    else if (kind === 'day') { const s = this.stats, net = s.earn - this.wage; h = `<h2>${this.lang === 'ja' ? this.t('ended') + this.dayN + '日目' : this.t('ended') + this.dayN}</h2><div class="sum"><span>${this.t('cust')}</span><b>${s.n}</b><span>${this.t('lost')}</span><b>${s.lost}</b><span>${this.t('earn')}</span><b class="pos">${this.fmt(s.earn)}</b><span>${this.t('wage')}</span><b class="neg">${this.fmt(-this.wage)}</b><span>${this.t('net')}</span><b class="${net < 0 ? 'neg' : 'pos'}">${this.fmt(net)}</b><span>${this.t('rep')}</span><b>★${this.rep.toFixed(1)}</b></div><p><button class="tb main" data-next>${this.t('next')}</button></p>`; }
    el.innerHTML = h;
    el.onclick = e => { const u = e.target.closest('[data-u]'); if (u && !u.disabled) { const k = u.dataset.u, row = this.UPG.find(r => r[0] === k), cost = row[1][Math.min(this.up[k], row[1].length - 1)] * this.c.unit; if (this.money >= cost) { this.money -= cost; this.up[k]++; PE.sfx.build(); this.sheet('up'); this.tick(); } }
      if (e.target.closest('[data-x]')) this.closeSheet(); if (e.target.closest('[data-next]')) this.nextDay(); };
  }
  closeSheet() { this.sheetKind = null; const el = this.hud.querySelector('#peSheet'); el.hidden = true; }
};
PE.Shop.css = `.pe-game{position:absolute;inset:0;background:#14121c;color:#f3efe6;font:15px/1.4 "Mitr","DotGothic16",system-ui,sans-serif;overflow:hidden}
.pe-game .stage{position:absolute;inset:0}.pe-game .fx{position:absolute;inset:0;pointer-events:none}
.pe-hud{position:absolute;left:0;right:0;top:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:calc(8px + env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) 8px max(10px,env(safe-area-inset-left,0px));pointer-events:none}
.pe-hud>*{pointer-events:auto}.pe-hud .sp{flex:1;pointer-events:none}.pe-hud .chip{background:#221e2ee6;border:2px solid #3d3654;padding:3px 9px;font-variant-numeric:tabular-nums;white-space:nowrap}.pe-hud .chip b{color:#ffc23a;font-weight:400}.pe-hud .chip.m{color:#9be02f}
.pe-game .tb{font:inherit;color:inherit;background:#221e2e;border:2px solid #3d3654;padding:6px 11px;cursor:pointer;box-shadow:0 3px 0 #0008}.pe-game .tb.main{background:#2a5bd7;border-color:#4a7bf0}
.pe-sheet{position:absolute;left:0;right:0;bottom:0;max-height:75%;overflow:auto;background:#221e2e;border-top:3px solid #9be02f;padding:14px max(16px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));box-shadow:0 -10px 30px #000a}
.pe-sheet h2{margin:0 0 10px;font-size:19px;font-weight:400;display:flex;justify-content:space-between;align-items:center}.pe-sheet .x{font:inherit;color:inherit;background:#2d2840;border:2px solid #3d3654;padding:3px 10px;cursor:pointer}
.pe-sheet .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}.pe-sheet .card{background:#2d2840;border:2px solid #3d3654;padding:10px;display:grid;gap:6px}.pe-sheet .card.done{border-color:#9be02f}
.pe-sheet h3{margin:0;font-size:15px;font-weight:400}.pe-sheet h3 small{color:#a9a2bd}.pe-sheet p{margin:0;color:#a9a2bd;font-size:13px}.pe-sheet .card button{font:inherit;color:#fff;background:#2a5bd7;border:2px solid #4a7bf0;padding:5px 8px;cursor:pointer}.pe-sheet .card button[disabled]{background:#221e2e;border-color:#3d3654;color:#a9a2bd;cursor:default}
.pe-sheet .sum{display:grid;grid-template-columns:1fr auto;gap:4px 18px;max-width:320px;font-variant-numeric:tabular-nums}.pe-sheet .sum b{font-weight:400;text-align:right}.pe-sheet .pos{color:#9be02f}.pe-sheet .neg{color:#ff4a3a}
.pe-title{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:linear-gradient(#14121cb0,#14121cee 75%);padding:24px 16px;z-index:5}.pe-title h1{margin:0;font:400 clamp(30px,8vw,58px)/1 "Mitr",system-ui,sans-serif;text-shadow:3px 3px 0 #2a5bd7}
.pe-title p{color:#a9a2bd;max-width:460px;margin:12px auto}.pe-title .tb{font-size:19px;padding:11px 26px}.pe-title small{display:block;color:#6f6889;margin-top:14px;font-size:12px}`;

/* ---------- PE.boot: turn a scene into a running game inside an element ---------- */
PE.boot = (scene, host, opt = {}) => {
  PE.injectCss(); if (!document.getElementById('pe-shop-css')) { const s = document.createElement('style'); s.id = 'pe-shop-css'; s.textContent = PE.Shop.css; document.head.appendChild(s); }
  host.classList.add('pe-game'); host.innerHTML = '<div class="stage"></div><div class="fx"></div><div class="hud"></div>';
  const stage = host.querySelector('.stage'), fx = host.querySelector('.fx'), hud = host.querySelector('.hud');
  const w = new PE.World(stage, { mode: (scene.style && scene.style.mode) || 'smooth' }); w.load(scene);
  const hasShop = w.nodes.some(n => { const r = PE.assets[n.userData.asset].role; return r === 'counter' || r === 'pump'; }) && scene.template !== 'viewer';
  let game = null; if (hasShop) game = new PE.Shop(w, fx, hud, Object.assign({ title: scene.name }, scene.game || {}));
  w.controls(null, { ignore: e => e.target.closest('.pe-bub,.pe-sheet,.pe-hud button,.pe-title') });
  let hourAcc = 0; w.run(dt => { if (game) { game.step(dt); w.setTime(game.min / 60 % 24); hourAcc += dt; if (hourAcc > .25) { game.tick(); hourAcc = 0; } } });
  if (game) { const t = document.createElement('div'); t.className = 'pe-title'; t.innerHTML = `<div><h1>${(scene.name || 'Game').replace(/</g, '&lt;')}</h1><p>${game.t('how')}</p><button class="tb main">${game.t('start')}</button><small>Made with Paul Engine</small></div>`; host.appendChild(t);
    t.querySelector('button').onclick = () => { t.remove(); game.paused = false; PE.sfx.tap(); }; }
  return { world: w, game, destroy: () => { w.stop(); w._ro.disconnect(); w.R.dispose(); w.R.forceContextLoss(); host.innerHTML = ''; } };
};
})();
