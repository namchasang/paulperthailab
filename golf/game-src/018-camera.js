/* ---------- camera ---------- */
const aimDir = () => V(Math.sin(S.yaw), 0, Math.cos(S.yaw));
function camAim(snap){
  const put = CLUBS[S.club].k === 'putter', d = aimDir(), tall = camera.aspect < 1 ? 1.45 : 1, back = (put ? 3.2 : 6.2) * tall, up = (put ? 1.35 : 2.3) * tall;
  const side = V(-d.z, 0, d.x), c = S.pos.clone().addScaledVector(d, -back).addScaledVector(side, (put ? .4 : 1.1) / tall); c.y = Math.max(H(c.x, c.z) + .8, S.pos.y + up);
  const l = S.pos.clone().addScaledVector(d, put ? 10 : 40); l.y = H(l.x, l.z) + (put ? 0 : 2.5);
  if (snap) { S.cam.copy(c); S.look.copy(l); } else { S.cam.lerp(c, .12); S.look.lerp(l, .12); }
}
function camFollow(dt){
  const hv = V(S.vel.x, 0, S.vel.z); if (hv.lengthSq() < .01) hv.copy(aimDir()); hv.normalize();
  const c = S.pos.clone().addScaledVector(hv, -14); c.y = Math.max(H(c.x, c.z) + 2, S.pos.y + 5);
  const k = 1 - Math.exp(-dt * 2.2); S.cam.lerp(c, k); S.look.lerp(S.pos, 1 - Math.exp(-dt * 6));
}

/* ---------- input ---------- */
let drag = null;
$('c').addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw: S.yaw }; });
addEventListener('pointermove', e => { if (!drag || S.mode !== 'aim' || S.charging) return; const k = CLUBS[S.club].k === 'putter' ? .0025 : .004; S.yaw = drag.yaw - (e.clientX - drag.x) * k; placeGolfer(); });
addEventListener('pointerup', () => { drag = null; });
const startCharge = () => { if (S.mode !== 'aim') return; S.charging = true; S.chargeT = 0; ensureAudio(); };
const release = () => { if (!S.charging) return; S.charging = false; S.mode = 'swing'; S.swingT = 0; $('shoot').classList.add('dis'); };
$('shoot').addEventListener('pointerdown', e => { e.stopPropagation(); startCharge(); });
$('shoot').addEventListener('pointerup', release); $('shoot').addEventListener('pointerleave', release);
$('club').addEventListener('click', () => { if (S.mode !== 'aim') return; S.club = (S.club + 1) % 4; showClub(); });
addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'Space') startCharge(); if (e.code === 'KeyC') $('club').click(); });
addEventListener('keyup', e => { if (e.code === 'Space') release(); });
const keys = {}; addEventListener('keydown', e => keys[e.code] = 1); addEventListener('keyup', e => keys[e.code] = 0);
const WXS = [['🌅 เย็นทอง', 17.9, 'clear'], ['☀️ บ่าย', 14, 'clear'], ['🌤 เช้า', 8.3, 'hazy'], ['☁️ ครึ้ม', 15, 'overcast'], ['🌧 ฝน', 16, 'rain']];
let wxi = 0; function applyWx(){ const [l, h, w] = WXS[wxi]; $('wx').textContent = l; W.set({ hour: h, weather: w }); }
$('wx').addEventListener('click', () => { wxi = (wxi + 1) % WXS.length; applyWx(); });
$('start').addEventListener('click', () => { $('title').classList.add('hide'); ensureAudio(); resetHole(); });
$('again').addEventListener('click', resetHole);

/* ---------- tiny sound kit (WebAudio, made in code) ---------- */
let AC = null; function ensureAudio(){ if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === 'suspended') AC.resume(); }
function sfx(k){
  if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination);
  const env = (a, d, v) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); };
  if (k === 'hit') { o.type = 'triangle'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(140, t + .08); env(.002, .12, .5); }
  else if (k === 'putt') { o.type = 'sine'; o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(300, t + .05); env(.002, .07, .3); }
  else if (k === 'cup') { o.type = 'square'; o.frequency.setValueAtTime(1300, t); o.frequency.setValueAtTime(900, t + .07); o.frequency.setValueAtTime(1500, t + .14); env(.005, .3, .12); }
  else if (k === 'warble') { o.type = 'sine'; [0, .08, .16, .24, .32].forEach((d, i) => o.frequency.setValueAtTime([1200, 1700, 1050, 1900, 1400][i], t + d)); env(.02, .45, .18); }
  else if (k === 'thump') { o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(50, t + .15); env(.005, .2, .4); }
  else if (k === 'splash' || k === 'sand') { o.type = 'sawtooth'; o.frequency.setValueAtTime(k === 'sand' ? 200 : 400, t); o.frequency.exponentialRampToValueAtTime(60, t + .3); env(.01, .35, .12); }
  else { o.type = 'sine'; o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(120, t + .06); env(.002, .08, .2); }
  o.start(t); o.stop(t + .8);
}

