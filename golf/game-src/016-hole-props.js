/* ---------- hole props ---------- */
const flag = P.flagPin({ color: '#e0322b' }); flag.position.set(PIN.x, H(PIN.x, PIN.z), PIN.z); scene.add(flag);
const tees = P.teeMarkers('#2a6fd6'); { const q = fromAP(1.5, 0); tees.position.set(q.x, HT, q.z); tees.rotation.y = Math.atan2(PERP.x, PERP.z) + Math.PI / 2; } scene.add(tees);
const golfer = P.golfer({ shirt: '#f3f1ea', pants: '#2b3a55', cap: '#1f6f8b' }); scene.add(golfer);
const ball = P.golfBall(); ball.scale.setScalar(2.2); scene.add(ball);
const trail = P.trail(160); scene.add(trail);
const BR = .0214 * 2.2; /* render radius used for ground contact */
const aimLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .0, depthWrite: false }));
const aimDots = []; for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(.22, 10), new THREE.MeshBasicMaterial({ color: '#fffbe8', transparent: true, opacity: .75, depthWrite: false })); d.rotation.x = -Math.PI / 2; scene.add(d); aimDots.push(d); }
const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.1, 40), new THREE.MeshBasicMaterial({ color: '#ffcf5a', transparent: true, opacity: .85, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; scene.add(ring);

/* ---------- kangaroos on the fairway ---------- */
const roos = [];
[[165, -6, 'graze'], [172, 4, 'lie'], [181, -11, 'graze'], [190, 9, 'lie'], [199, -2, 'stand'], [214, 12, 'graze'], [223, -14, 'lie']].forEach(([a, p, pose], i) => {
  const q = fromAP(a, p), r = P.kangaroo({ pose, seed: i + 3, fur: i % 3 ? '#8a7563' : '#7a6a5e' }); r.scale.setScalar(1.05 + (i % 2) * .15);
  r.position.set(q.x, H(q.x, q.z), q.z); r.rotation.y = R() * 6.28; r.userData.restPose = pose; r.userData.calm = 0; scene.add(r); roos.push(r);
});
function startle(x, z, rad){
  roos.forEach(r => { const d = Math.hypot(r.position.x - x, r.position.z - z); if (d < rad && r.userData.state !== 'hop') {
    const ax = (r.position.x - x) / (d || 1), az = (r.position.z - z) / (d || 1), k = 14 + R() * 12;
    const tx = r.position.x + ax * k + (R() - .5) * 8, tz = r.position.z + az * k + (R() - .5) * 8;
    r.userData.restPose = 'alert'; r.userData.calm = 7 + R() * 4; r.userData.hop(V(tx, H(tx, tz), tz), H); sfx('thump'); } });
}

/* ---------- magpie ---------- */
const mag = P.magpie(); mag.scale.setScalar(2.4); mag.visible = false; scene.add(mag);
const MG = { on: false, done: false, t: 0, phase: '' };
function magpieSteal(){
  /* swoop from the nearest peppermint, grab the ball, drop it 20-35 m away on dry land */
  let best = pts.pep[0], bd = 1e9; pts.pep.forEach(p => { const d = Math.hypot(p.x - S.pos.x, p.z - S.pos.z); if (d < bd && d > 25) { bd = d; best = p; } });
  let drop = null;
  for (let i = 0; i < 40 && !drop; i++) { const a = R() * 6.28, d = 20 + R() * 15, x = S.pos.x + Math.cos(a) * d, z = S.pos.z + Math.sin(a) * d, s = surface(x, z);
    if (inNear(x, z, 10) && s !== 'water' && s !== 'green' && s !== 'beach' && Math.hypot(x - PIN.x, z - PIN.z) > Math.hypot(S.pos.x - PIN.x, S.pos.z - PIN.z) - 6) drop = { x, z }; }
  if (!drop) return false;
  Object.assign(MG, { on: true, done: true, t: 0, phase: 'in', from: V(best.x, best.y + 6 * best.s, best.z), at: S.pos.clone(), drop: V(drop.x, H(drop.x, drop.z) + 9, drop.z) });
  mag.visible = true; mag.position.copy(MG.from); S.mode = 'magpie'; toast('นกแม็กพายบินมา!', 'ระวังลูก...'); sfx('warble'); return true;
}
function tickMagpie(dt){
  MG.t += dt; const U = mag.userData;
  if (MG.phase === 'in') { const k = Math.min(1, MG.t / 2.2), p = MG.from.clone().lerp(MG.at, k); p.y += Math.sin(k * Math.PI) * 4 - k * .2; mag.position.copy(p);
    mag.lookAt(MG.at.x, mag.position.y, MG.at.z); U.flap(MG.t, k < .85 ? 1 : .3); if (k >= 1) { MG.phase = 'grab'; MG.t = 0; U.fold(); } }
  else if (MG.phase === 'grab') { mag.position.set(MG.at.x, MG.at.y + .45 + Math.abs(Math.sin(MG.t * 12)) * .06, MG.at.z); if (MG.t > .7) { trail.userData.clear(); MG.phase = 'carry'; MG.t = 0; toast('นกแม็กพายคาบลูกไป!', 'ตีต่อจากจุดที่ลูกตก ไม่เสียแต้ม'); sfx('warble'); } }
  else if (MG.phase === 'carry') { const k = Math.min(1, MG.t / 2.8), p = MG.at.clone().lerp(MG.drop, k); p.y = P.lerp(MG.at.y + .5, MG.drop.y, Math.min(1, k * 2.5)); mag.position.copy(p);
    mag.lookAt(MG.drop.x, p.y, MG.drop.z); U.flap(MG.t, 1); ball.position.set(p.x, p.y - .35, p.z);
    if (k >= 1) { MG.phase = 'away'; MG.t = 0; S.pos.copy(ball.position); S.vel.set(0, -1, 0); S.mode = 'flight'; S.flightT = 9; S.noEvent = true; } }
  else if (MG.phase === 'away') { mag.position.y += dt * 4; mag.position.x += dt * 9; U.flap(MG.t, 1); if (MG.t > 3) { MG.phase = ''; mag.visible = false; MG.on = false; } }
}

