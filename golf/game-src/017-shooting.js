/* ---------- shooting ---------- */
function launch(){
  $('tip').style.display = 'none';
  const c = CLUBS[S.club], pw = Math.max(.03, S.power), v = c.v * (c.k === 'putter' ? pw : c.k === 'driver' ? .45 + .55 * pw : .25 + .75 * pw);
  const miss = (pw > .97 ? (R() - .5) * .08 : 0) + (R() - .5) * .012 * (c.k === 'putter' ? .2 : 1);
  const yaw = S.yaw + miss, el = c.el * Math.PI / 180;
  S.vel.set(Math.sin(yaw) * Math.cos(el) * v, Math.sin(el) * v, Math.cos(yaw) * Math.cos(el) * v);
  S.last.copy(S.pos); S.strokes++; S.flightT = 0; S.spinT = 0; S.mode = c.k === 'putter' ? 'roll' : 'flight';
  S.pos.y += .02; trail.userData.clear(); sfx(c.k === 'putter' ? 'putt' : 'hit'); hud();
}
function penalty(msg){ S.strokes++; toast(msg, 'เสีย 1 แต้ม · วางลูกที่เดิม'); S.pos.copy(S.last); S.vel.set(0, 0, 0); S.mode = 'settle'; S.rest = 0; sfx('splash'); }
const G = 9.81, KD = .0047, KL = .003;
function stepBall(dt){
  const p = S.pos, v = S.vel;
  if (S.mode === 'flight') {
    S.flightT += dt;
    const rel = v.clone().sub(S.wind), sp = rel.length();
    const acc = rel.multiplyScalar(-KD * sp); acc.y -= G;
    const lift = KL * v.lengthSq() * Math.exp(-S.flightT / 5); if (v.lengthSq() > 1) { const hz = V(v.x, 0, v.z), up = V(-v.y * v.x, hz.lengthSq(), -v.y * v.z).normalize(); acc.addScaledVector(up, lift); }
    v.addScaledVector(acc, dt); p.addScaledVector(v, dt);
    rooHit();
    if (!inNear(p.x, p.z, 4)) return penalty('ลูกออกนอกเขต (OB)');
    const gy = H(p.x, p.z);
    if (p.y < gy + BR) {
      const sf = surface(p.x, p.z, gy);
      if (sf === 'water') return penalty('ลูกลงทะเล!');
      const [e, fr] = SURF[sf]; const n = T0.normal(p.x, p.z, .8, H), vn = v.dot(n);
      p.y = gy + BR;
      if (vn < 0) { v.addScaledVector(n, -(1 + e) * vn); const vt = v.clone().addScaledVector(n, -v.dot(n)); v.addScaledVector(vt, -fr); }
      if (Math.abs(vn) < 2.2 || v.length() < 3) { S.mode = 'roll'; }
      if (S.flightT > .3 && !S.landed) { const keep = { driver: .85, iron: .55, wedge: .3, putter: 1 }[CLUBS[S.club].k] * (sf === 'green' ? .8 : 1); v.x *= keep; v.z *= keep; /* backspin bite on first bounce */ S.landed = true; startle(p.x, p.z, 16); if (sf === 'bunker') sfx('sand'); else sfx('land'); }
    }
  } else if (S.mode === 'roll') {
    const gy = H(p.x, p.z), sf = surface(p.x, p.z, gy);
    if (sf === 'water') return penalty('ลูกกลิ้งลงทะเล!');
    if (!inNear(p.x, p.z, 4)) return penalty('ลูกออกนอกเขต (OB)');
    const n = T0.normal(p.x, p.z, .6, H), mu = SURF[sf][2];
    const gt = V(0, -G, 0).addScaledVector(n, G * n.y);
    v.addScaledVector(n, -v.dot(n));
    const sp = v.length();
    if (sp > 1e-4) v.addScaledVector(v, -Math.min(sp, mu * G * n.y * dt) / sp);
    v.addScaledVector(gt, dt);
    p.addScaledVector(v, dt); p.y = H(p.x, p.z) + BR;
    rooHit();
    /* the cup */
    const dc = Math.hypot(p.x - PIN.x, p.z - PIN.z);
    if (dc < .085 && v.length() < 1.9) return holed();
    if (dc < .07 && v.length() >= 1.9) { v.multiplyScalar(.7); v.applyAxisAngle(V(0, 1, 0), (R() - .5) * 1.4); sfx('lip'); }
    if (v.length() < .07 && gt.length() < mu * G * 1.6) { v.set(0, 0, 0); S.mode = 'settle'; S.rest = 0; }
    S.flightT += dt; if (S.flightT > 40) { v.set(0, 0, 0); S.mode = 'settle'; S.rest = 0; }
  }
}
function rooHit(){
  if (S.hitRoo) return; const p = S.pos;
  for (const r of roos) { const dx = p.x - r.position.x, dz = p.z - r.position.z, d = Math.hypot(dx, dz), top = r.userData.poseName === 'lie' ? .7 : 1.5;
    if (d < .6 && p.y < r.position.y + top) { S.hitRoo = true; const nx = dx / (d || 1), nz = dz / (d || 1), vh = Math.hypot(S.vel.x, S.vel.z) * .35;
      S.vel.set(nx * vh, Math.abs(S.vel.y) * .3 + 1.5, nz * vh); if (S.mode === 'roll') S.mode = 'flight'; S.landed = false;
      toast('ลูกโดนจิงโจ้!', 'มันไม่เป็นไร แต่โกรธนิดหน่อย'); sfx('thump'); startle(p.x, p.z, 3); return; } }
}
function holed(){
  S.holed = true; S.mode = 'holed'; S.vel.set(0, 0, 0); S.pos.set(PIN.x, H(PIN.x, PIN.z) - .06, PIN.z); sfx('cup');
  const d = S.strokes - PAR, names = { '-3': 'อัลบาทรอส!', '-2': 'อีเกิล!', '-1': 'เบอร์ดี้!', '0': 'พาร์', '1': 'โบกี้', '2': 'ดับเบิลโบกี้' };
  const nm = S.strokes === 1 ? 'โฮลอินวัน!!' : names[d] || `+${d}`;
  toast(nm, `${S.strokes} ครั้ง`);
  setTimeout(() => { $('eName').textContent = nm; $('eLine').textContent = `ลงหลุมใน ${S.strokes} ครั้ง (พาร์ ${PAR})` + (MG.done ? ' · โดนนกแม็กพายแกล้งด้วย' : ''); $('end').classList.remove('hide'); }, 2200);
}

