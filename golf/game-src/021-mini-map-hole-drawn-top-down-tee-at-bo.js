/* mini map: the hole drawn top-down, tee at the bottom, green at the top */
const MM = (() => {
  const cv = $('mini'), cx = cv.getContext('2d'), Wp = cv.width, Hp = cv.height, A0 = -30, A1 = LEN + 40, PW = 70;
  const sy = Hp / (A1 - A0), sx = Wp / (PW * 2);
  const toXY = (x, z) => { const [a, p] = toAP(x, z); return [Wp / 2 + p * sx, Hp - (a - A0) * sy]; };
  const base = document.createElement('canvas'); base.width = Wp; base.height = Hp; const b = base.getContext('2d'), img = b.createImageData(Wp, Hp);
  const COL = { water: [46, 120, 170], beach: [221, 205, 168], native: [112, 120, 82], rough: [64, 104, 46], fairway: [104, 166, 70], fringe: [92, 160, 64], green: [126, 200, 92], tee: [110, 172, 74], bunker: [232, 214, 168] };
  for (let j = 0; j < Hp; j++) for (let i = 0; i < Wp; i++) {
    const a = A0 + (Hp - j) / sy, p = (i - Wp / 2) / sx, q = fromAP(a, p), sf = inNear(q.x, q.z) ? surface(q.x, q.z) : 'native', c = COL[sf] || COL.native, k = (j * Wp + i) * 4;
    img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
  }
  b.putImageData(img, 0, 0);
  pts.pep.concat(pts.gum).forEach(t => { const [x, y] = toXY(t.x, t.z); if (x < -4 || x > Wp + 4 || y < -4 || y > Hp + 4) return; b.fillStyle = 'rgba(30,52,26,.85)'; b.beginPath(); b.arc(x, y, 2.6, 0, 7); b.fill(); });
  const dot = (x, y, r, f, st) => { cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fillStyle = f; cx.fill(); if (st) { cx.lineWidth = 1.5; cx.strokeStyle = st; cx.stroke(); } };
  let acc = 0;
  return dt => {
    acc += dt; if (acc < .1) return; acc = 0;
    cx.drawImage(base, 0, 0);
    roos.forEach(r => { const [x, y] = toXY(r.position.x, r.position.z); dot(x, y, 2.6, '#8a5a3a'); });
    const r = S.mode === 'aim' && PV.res;
    if (r) { cx.lineWidth = 2; cx.strokeStyle = 'rgba(255,255,255,.95)'; cx.setLineDash([4, 3]); cx.beginPath(); [S.pos].concat(r.fly).forEach((p, i) => { const [x, y] = toXY(p.x, p.z); i ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke();
      cx.strokeStyle = '#ffcf5a'; cx.beginPath(); [r.land].concat(r.roll).forEach((p, i) => { const [x, y] = toXY(p.x, p.z); i ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.setLineDash([]);
      const [ex, ey] = toXY(r.end.x, r.end.z); dot(ex, ey, 4, 'rgba(0,0,0,0)', r.out ? '#ff6a4a' : '#ffcf5a'); }
    const [px, py] = toXY(PIN.x, PIN.z); cx.fillStyle = '#fff'; cx.fillRect(px - .75, py - 12, 1.5, 12); cx.fillStyle = '#e0322b'; cx.fillRect(px + .75, py - 12, 7, 5);
    if (mag.visible) { const [x, y] = toXY(mag.position.x, mag.position.z); dot(x, y, 3.2, '#111', '#fff'); }
    const [bx, by] = toXY(S.pos.x, S.pos.z); dot(bx, by, 4.2, '#ffffff', '#1d2a12');
  };
})();
/* ---------- main loop ---------- */
let last = performance.now(), clock = 0;
function frame(now){ requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; tick(dt); }
function tick(dt, noRender){
  clock += dt;
  if (S.mode === 'aim') {
    if (keys.ArrowLeft) { S.yaw += dt * .6; placeGolfer(); PV.dirty = true; } if (keys.ArrowRight) { S.yaw -= dt * .6; placeGolfer(); PV.dirty = true; }
    if (S.charging) { S.chargeT += dt; const ph = (S.chargeT / 1.15) % 2; S.power = ph < 1 ? ph : 2 - ph; }
    camAim(false);
  }
  if (S.mode === 'swing') {
    S.swingT += dt / .95; golfer.userData.swing(Math.min(1, S.swingT));
    if (S.swingT >= .56 && S.mode === 'swing') { S.landed = false; launch(); }
  } else if (S.swingT >= 0 && S.swingT < 1) { S.swingT += dt / .95; golfer.userData.swing(Math.min(1, S.swingT)); }
  if (S.mode === 'flight' || S.mode === 'roll') {
    const n = 4; for (let i = 0; i < n; i++) { if (S.mode !== 'flight' && S.mode !== 'roll') break; stepBall(dt / n); }
    ball.position.copy(S.pos); if (S.mode === 'flight' || S.vel.length() > 3) trail.userData.push(S.pos);
    camFollow(dt); hud();
  }
  if (S.mode === 'settle') {
    S.rest += dt; ball.position.copy(S.pos); camFollow(dt);
    if (S.rest > 1.1) {
      const sf = surface(S.pos.x, S.pos.z);
      if (Math.hypot(S.pos.x - PIN.x, S.pos.z - PIN.z) < .35) { S.strokes++; toast('แตะลงหลุม', 'ระยะใกล้มาก นับเพิ่ม 1 ครั้ง'); holed(); return; }
      startle(S.pos.x, S.pos.z, 12);
      if (!MG.done && !S.noEvent && S.strokes >= 1 && (sf === 'fairway' || sf === 'rough') && (S.events > 0 || R() < .7) && magpieSteal()) {}
      else { S.events++; readyShot(); }
    }
  }
  if (S.mode === 'magpie') { tickMagpie(dt); S.look.lerp(mag.position, 1 - Math.exp(-dt * 4)); const c = mag.position.clone().add(V(-8, 4, 8)); c.y = Math.max(c.y, H(c.x, c.z) + 2); S.cam.lerp(c, 1 - Math.exp(-dt * 1.5)); }
  else if (MG.on) tickMagpie(dt);
  if (S.mode === 'holed') { const a = clock * .25; S.cam.lerp(V(PIN.x + Math.sin(a) * 9, H(PIN.x, PIN.z) + 3.5, PIN.z + Math.cos(a) * 9), .03); S.look.lerp(V(PIN.x, H(PIN.x, PIN.z) + .5, PIN.z), .1); }
  if (S.mode === 'title') { const a = Math.sin(clock * .05) * 18; const q = fromAP(-25, -14 + a); S.cam.set(q.x, HT + 9, q.z); const l = fromAP(LEN * .7, a * .5); S.look.set(l.x, HG + 2, l.z); }
  updateAim(dt); MM(dt);
  $('meter').querySelector('i').style.height = (S.power * 100) + '%';
  roos.forEach(r => { P.kangarooTick(r, dt); if (r.userData.calm > 0) { r.userData.calm -= dt; if (r.userData.calm <= 0 && r.userData.state !== 'hop') { r.userData.restPose = 'graze'; r.userData.setPose('graze'); } } });
  flag.userData.tick(clock, S.wind.length() / 5, Math.atan2(S.wind.x, S.wind.z) - Math.PI / 2);
  sea.userData.tick(dt);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('on'); }
  camera.position.copy(S.cam); camera.lookAt(S.look);
  W.update(dt, camera, S.mode === 'title' ? V(GRN.x, HG, GRN.z) : S.pos);
  if (!noRender) renderer.render(scene, camera);
}
applyWx(); S.pos.set(TEE.x, HT, TEE.z); placeGolfer(); ball.position.copy(S.pos);
$('load').remove(); requestAnimationFrame(frame);
if (Q.has('play')) { $('title').classList.add('hide'); resetHole(); }

