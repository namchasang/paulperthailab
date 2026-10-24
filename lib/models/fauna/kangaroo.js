/* ==== PPL kangaroo (from Roo Road Rescue makeRoo3, smooth-shaded) ====
   const r = PPL.kangaroo({fur:'#8c7766', pose:'graze', seed:3});  scene.add(r);
   r.userData.setPose('stand'|'graze'|'lie'|'alert');
   r.userData.hop(target THREE.Vector3, groundFn(x,z)->y)   // hops there in bounds
   PPL.kangarooTick(r, dt, groundFn)                         // call every frame
   Size: ~1.5 m standing at scale 1 (real western grey ~1.3-1.6 m). */
(function(){
const P = window.PPL;
const SPH = (r, w, h) => new THREE.SphereGeometry(r, w || 12, h || 9);
const sm = (c, o) => { const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: .82 }, o || {})); m.color = (c.isColor ? c.clone() : P.lin(c)); return m; };
function kit(){
  const g = new THREE.Group(), pose = new THREE.Group(), body = new THREE.Group(); g.add(pose); pose.add(body);
  const B = (geo, m, p, s, r) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); if (s) o.scale.set(...s); if (r) o.rotation.set(...r); o.castShadow = true; body.add(o); return o; };
  const eye = (m, p, r) => { const e = new THREE.Mesh(new THREE.SphereGeometry(r || .025, 6, 4), m); e.position.set(...p); body.add(e); };
  return { g, pose, body, B, eye };
}
function tail(K, mat, pts, r0, r1, tipM){
  for (let k = 0; k < pts.length; k++) { const t = k / (pts.length - 1); K.B(SPH(r0 + (r1 - r0) * t), k === pts.length - 1 && tipM ? tipM : mat, pts[k]); }
  for (let k = 0; k < pts.length - 1; k++) {
    const a = P.V3(...pts[k]), b = P.V3(...pts[k + 1]), m = a.clone().add(b).multiplyScalar(.5), t = (k + .5) / (pts.length - 1), r = r0 + (r1 - r0) * t;
    const c = K.B(new THREE.CylinderGeometry(r * .92, r * .98, a.distanceTo(b), 12), mat, [m.x, m.y, m.z]);
    c.quaternion.setFromUnitVectors(P.V3(0, 1, 0), b.clone().sub(a).normalize());
  }
}
P.kangaroo = (o = {}) => {
  const R = P.rng(o.seed || 1), K = kit(), base = P.lin(o.fur || '#8c7766').offsetHSL(0, (R() - .5) * .05, (R() - .5) * .06);
  const fur = sm(base), lt = sm(o.belly || '#dccdb9'), dk = sm('#4a3d33'), pink = sm('#c99a8e'), nose = sm('#2a2422', { roughness: .4 }), eyeM = sm('#1b120b', { roughness: .3 });
  K.B(SPH(.32), fur, [0, .5, -.12], [1, .95, 1.15]); [-1, 1].forEach(s => K.B(SPH(.2), fur, [s * .17, .42, -.04], [.75, 1.15, 1.3]));
  K.B(SPH(.27), fur, [0, .86, .05], [.86, 1.38, .86], [.38, 0, 0]); K.B(SPH(.2), lt, [0, .84, .17], [.72, 1.25, .55], [.38, 0, 0]);
  const head = new THREE.Group(); head.position.set(0, 1.17, .17); K.body.add(head);
  const H = (geo, m, p, s, r) => { const x = K.B(geo, m, [p[0], p[1] - 1.17, p[2] - .17], s, r); K.body.remove(x); head.add(x); return x; };
  H(SPH(.12), fur, [0, 1.17, .17], [.82, 1.25, .85], [.25, 0, 0]); H(SPH(.13), fur, [0, 1.32, .24], [.86, .9, 1.12]); H(SPH(.085), lt, [0, 1.28, .38], [.82, .72, 1.35]);
  H(SPH(.034), nose, [0, 1.3, .49], [1.2, .8, .7]); H(SPH(.03), lt, [0, 1.22, .36], [1.3, .6, 1]);
  [-1, 1].forEach(s => {
    H(SPH(.075), fur, [s * .075, 1.5, .2], [.55, 1.65, .25], [0, 0, s * -.22]); H(SPH(.06), pink, [s * .074, 1.49, .218], [.42, 1.35, .12], [0, 0, s * -.22]);
    H(new THREE.SphereGeometry(.024, 6, 4), eyeM, [s * .072, 1.36, .335]);
    K.B(new THREE.CylinderGeometry(.032, .026, .26, 8), fur, [s * .1, .93, .28], null, [.65, 0, 0]); K.B(SPH(.035), dk, [s * .1, .83, .36], [1, .8, 1.2]);
    K.B(new THREE.CylinderGeometry(.075, .05, .32, 10), fur, [s * .17, .2, -.02], null, [-.65, 0, 0]);
    K.B(SPH(.07), dk, [s * .15, .045, .13], [.8, .45, 3.4]);
  });
  tail(K, fur, [[0, .42, -.38], [0, .32, -.6], [0, .2, -.82], [0, .1, -1.02], [0, .05, -1.18]], .13, .035, dk);
  const g = K.g, U = g.userData;
  U.head = head; U.body = K.body; U.pose = K.pose; U.state = 'idle'; U.t = R() * 10; U.seed = R();
  U.setPose = name => {
    U.poseName = name; const p = K.pose;
    p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); head.rotation.set(0, 0, 0);
    if (name === 'graze') { p.rotation.x = .62; p.position.set(0, -.05, .1); head.rotation.x = .5; }
    if (name === 'lie') { p.rotation.z = 1.38; p.position.set(.5, .2, 0); head.rotation.set(-.25, .2, -1.25); }
    if (name === 'alert') { p.rotation.x = -.12; head.rotation.x = -.1; }
  };
  U.hop = (to, ground) => { U.from = g.position.clone(); U.to = to.clone(); U.state = 'hop'; U.hopT = 0; U.ground = ground; U.setPose('stand'); };
  U.setPose(o.pose || 'stand');
  return g;
};
/* hop: 2.4 m bounds, ~0.45 s each, body squashes on landing; idle: ears/head twitch */
P.kangarooTick = (g, dt) => {
  const U = g.userData; U.t += dt;
  if (U.state === 'hop') {
    const d = U.to.clone().sub(U.from); const dist = d.length(); if (dist < .1) { U.state = 'idle'; return; }
    const sp = 6.5; U.hopT += dt * sp; const k = Math.min(1, U.hopT / dist);
    const p = U.from.clone().lerp(U.to, k); const gy = U.ground ? U.ground(p.x, p.z) : U.from.y;
    const ph = (U.hopT / 2.4) % 1; p.y = gy + Math.sin(ph * Math.PI) * .55;
    g.position.copy(p); g.rotation.y = Math.atan2(d.x, d.z);
    U.pose.rotation.x = .35 * Math.sin(ph * Math.PI) - .1; U.body.scale.y = 1 - .12 * Math.max(0, Math.cos(ph * Math.PI * 2));
    if (k >= 1) { U.state = 'idle'; U.body.scale.y = 1; U.setPose(U.restPose || 'alert'); }
    return;
  }
  if (U.poseName === 'graze') U.head.rotation.x = .5 + .12 * Math.sin(U.t * 2.1 + U.seed * 9);
  else if (U.poseName !== 'lie') U.head.rotation.y = .35 * Math.sin(U.t * .7 + U.seed * 5) * (Math.sin(U.t * .23) > .3 ? 1 : 0);
  else U.body.scale.y = 1 + .015 * Math.sin(U.t * 1.6); // breathing
};
P.reg('kangaroo', { group: 'models/fauna', from: 'Roo Road Rescue' });
})();
