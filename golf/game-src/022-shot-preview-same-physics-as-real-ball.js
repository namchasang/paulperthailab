/* ---------- shot preview (same physics as the real ball), top view, mini map ---------- */
const PV = { dirty: true, res: null, key: '', t: 0 };
function predictShot(pw){
  const c = CLUBS[S.club]; pw = Math.max(.03, pw);
  const v0 = c.v * (c.k === 'putter' ? pw : c.k === 'driver' ? .45 + .55 * pw : .25 + .75 * pw), el = c.el * Math.PI / 180, yaw = S.yaw;
  const p = S.pos.clone(), v = V(Math.sin(yaw) * Math.cos(el) * v0, Math.sin(el) * v0, Math.cos(yaw) * Math.cos(el) * v0);
  let mode = c.k === 'putter' ? 'roll' : 'flight', t = 0, land = null; const fly = [p.clone()], roll = [], dt = 1 / 60;
  const done = (out, holed) => ({ fly, roll, land: land || p.clone(), end: p.clone(), out, holed });
  p.y += .02;
  for (let i = 0; i < 60 * 16; i++) {
    if (mode === 'flight') {
      t += dt;
      const rel = v.clone().sub(S.wind), sp = rel.length(), acc = rel.multiplyScalar(-KD * sp); acc.y -= G;
      const lift = KL * v.lengthSq() * Math.exp(-t / 5); if (v.lengthSq() > 1) { const hz = V(v.x, 0, v.z), up = V(-v.y * v.x, hz.lengthSq(), -v.y * v.z).normalize(); acc.addScaledVector(up, lift); }
      v.addScaledVector(acc, dt); p.addScaledVector(v, dt);
      if (!inNear(p.x, p.z, 4)) return done('ob');
      const gy = H(p.x, p.z);
      if (p.y < gy + BR) {
        const sf = surface(p.x, p.z, gy); if (sf === 'water') { land = land || p.clone(); return done('water'); }
        const [e, fr] = SURF[sf], n = T0.normal(p.x, p.z, .8, H), vn = v.dot(n); p.y = gy + BR;
        if (vn < 0) { v.addScaledVector(n, -(1 + e) * vn); const vt = v.clone().addScaledVector(n, -v.dot(n)); v.addScaledVector(vt, -fr); }
        if (!land) { land = p.clone(); const keep = { driver: .85, iron: .55, wedge: .3, putter: 1 }[c.k] * (sf === 'green' ? .8 : 1); v.x *= keep; v.z *= keep; }
        if (Math.abs(vn) < 2.2 || v.length() < 3) mode = 'roll';
      }
      if (i % 3 === 0) (land ? roll : fly).push(p.clone());
    } else {
      const gy = H(p.x, p.z), sf = surface(p.x, p.z, gy); if (sf === 'water') return done('water'); if (!inNear(p.x, p.z, 4)) return done('ob');
      const n = T0.normal(p.x, p.z, .6, H), mu = SURF[sf][2], gt = V(0, -G, 0).addScaledVector(n, G * n.y);
      v.addScaledVector(n, -v.dot(n)); const sp = v.length(); if (sp > 1e-4) v.addScaledVector(v, -Math.min(sp, mu * G * n.y * dt) / sp);
      v.addScaledVector(gt, dt); p.addScaledVector(v, dt); p.y = H(p.x, p.z) + BR;
      if (Math.hypot(p.x - PIN.x, p.z - PIN.z) < .085 && v.length() < 1.9) { p.set(PIN.x, p.y, PIN.z); roll.push(p.clone()); return done(null, true); }
      if (i % 4 === 0) roll.push(p.clone());
      if (v.length() < .07 && gt.length() < mu * G * 1.6) break;
    }
  }
  return done(null);
}
/* power the preview uses before you press: full swing, or the putt that reaches the hole */
const previewPower = () => S.charging ? S.power : CLUBS[S.club].k === 'putter' ? P.clamp(Math.sqrt(distToPin() * 1.08 / 92), .03, 1) : 1;
/* dots: big white for the flight, small gold for the roll */
const dotTex = P.ctex(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
const mkDots = (n, col) => Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: col, depthTest: false, transparent: true, fog: false })); s.renderOrder = 5; s.visible = false; scene.add(s); return s; });
const flyDots = mkDots(70, '#ffffff'), rollDots = mkDots(40, '#ffcf5a');
const endMark = new THREE.Mesh(new THREE.RingGeometry(.5, .75, 28), new THREE.MeshBasicMaterial({ color: '#ffcf5a', transparent: true, opacity: .95, depthTest: false, side: THREE.DoubleSide })); endMark.rotation.x = -Math.PI / 2; endMark.renderOrder = 6; scene.add(endMark);
ring.material.depthTest = false; ring.renderOrder = 6; aimDots.forEach(d => d.visible = false);
function placeDots(pool, list, size){
  const step = Math.max(1, Math.ceil(list.length / pool.length));
  pool.forEach((s, i) => { const p = list[i * step]; s.visible = !!p; if (!p) return; s.position.copy(p).y += .12;
    const d = camera.position.distanceTo(p); s.scale.setScalar(Math.max(size * .4, d * size * .018)); });
}
function updateAim(dt){
  const on = S.mode === 'aim';
  if (!on) { flyDots.forEach(s => s.visible = false); rollDots.forEach(s => s.visible = false); ring.visible = endMark.visible = false; return; }
  const pw = previewPower(), key = [S.club, S.yaw.toFixed(3), pw.toFixed(2), S.pos.x.toFixed(2), S.pos.z.toFixed(2)].join('|');
  PV.t += dt;
  if ((key !== PV.key || PV.dirty) && (!S.charging || PV.t > .08)) { PV.res = predictShot(pw); PV.key = key; PV.dirty = false; PV.t = 0; }
  const r = PV.res; if (!r) return;
  placeDots(flyDots, r.fly.slice(1), .28); placeDots(rollDots, r.roll, .18);
  const put = CLUBS[S.club].k === 'putter';
  ring.visible = !put; ring.position.copy(r.land).y += .08; ring.scale.setScalar(Math.max(.6, camera.position.distanceTo(r.land) * .012));
  endMark.visible = true; endMark.position.copy(r.end).y += .06; endMark.scale.setScalar(Math.max(.25, camera.position.distanceTo(r.end) * .01));
  endMark.material.color.set(r.out ? '#ff6a4a' : r.holed ? '#7fd36a' : '#ffcf5a');
  const carry = Math.hypot(r.land.x - S.pos.x, r.land.z - S.pos.z), total = Math.hypot(r.end.x - S.pos.x, r.end.z - S.pos.z), left = Math.hypot(r.end.x - PIN.x, r.end.z - PIN.z);
  $('pred').innerHTML = r.out === 'water' ? '<b style="color:#ff8a6a">ลงทะเล</b>' : r.out === 'ob' ? '<b style="color:#ff8a6a">ออกนอกเขต</b>' : r.holed ? '<b style="color:#9ff07f">ลงหลุม!</b>' :
    (put ? `กลิ้ง ${total.toFixed(1)} ม.` : `ลอย ${Math.round(carry)} ม.<br>รวม ${Math.round(total)} ม.`) + `<br>เหลือ ${left < 20 ? left.toFixed(1) : Math.round(left)} ม.`;
}
$('topBtn').addEventListener('click', () => { S.top = !S.top; $('topBtn').classList.toggle('on', S.top); $('topBtn').textContent = S.top ? 'มุมหลัง' : 'มุมบน'; });

