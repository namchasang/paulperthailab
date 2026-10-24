/* ---------- main loop ---------- */
let last = performance.now(), clock = 0;
function frame(now){ requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; tick(dt); }
function tick(dt, noRender){
  clock += dt;
  if (S.mode === 'aim') {
    if (keys.ArrowLeft) { S.yaw += dt * .6; placeGolfer(); } if (keys.ArrowRight) { S.yaw -= dt * .6; placeGolfer(); }
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
  /* aim helpers */
  const reach = (c, pw) => c.k === 'putter' ? 92 * pw * pw : c.carry * Math.pow(c.k === 'driver' ? .45 + .55 * pw : .25 + .75 * pw, 2);
  const showAim = S.mode === 'aim'; ring.visible = showAim; aimDots.forEach(d => d.visible = showAim);
  if (showAim) { const c = CLUBS[S.club], d = aimDir(), full = S.charging ? reach(c, Math.max(.03, S.power)) : c.k === 'putter' ? Math.min(distToPin(), 16) : c.carry;
    aimDots.forEach((m, i) => { const k = (i + 1) / aimDots.length * full, x = S.pos.x + d.x * k, z = S.pos.z + d.z * k; m.position.set(x, H(x, z) + .08, z); m.scale.setScalar(c.k === 'putter' ? .35 : 1 + k / 120); });
    const x = S.pos.x + d.x * full, z = S.pos.z + d.z * full; ring.position.set(x, H(x, z) + .1, z); ring.scale.setScalar(c.k === 'putter' ? .25 : 1 + full / 150); }
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

