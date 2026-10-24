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
/* ==== PPL Australian magpie (from Magpie Madness buildMagpie) ====
   const m = PPL.magpie();  m.userData.flap(t, amount 0..1)   // call per frame while flying
   ~0.4 m long at scale 1; scale x2-3 for gameplay readability. */
(function(){
const P = window.PPL;
P.magpie = (o = {}) => {
  const g = new THREE.Group(), blk = P.mat('#14141a', { roughness: .5 }), wht = P.mat('#f4f4f8', { roughness: .6 }), grey = P.mat('#9a9aa6', { roughness: .5 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const mesh = (geo, m) => { const x = new THREE.Mesh(geo, m); x.castShadow = true; return x; };
  const body = mesh(new THREE.SphereGeometry(.2, 14, 10), blk); body.scale.set(.8, .75, 1.5); g.add(body);
  const back = mesh(new THREE.SphereGeometry(.2, 12, 10), wht); back.scale.set(.72, .5, .9); back.position.set(0, .1, -.06); g.add(back);
  const nape = mesh(new THREE.SphereGeometry(.1, 10, 8), wht); nape.scale.set(1, .7, .9); nape.position.set(0, .12, .2); g.add(nape);
  const head = mesh(new THREE.SphereGeometry(.13, 12, 9), blk); head.position.set(0, .07, .3); g.add(head);
  const beak = mesh(new THREE.ConeGeometry(.045, .22, 6), grey); beak.rotation.x = Math.PI / 2; beak.position.set(0, .04, .47); g.add(beak);
  const eyeM = P.mat(o.eye || '#b8321f', { roughness: .3 });
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), eyeM); e.position.set(s * .08, .1, .37); g.add(e); });
  const tail = mesh(box, blk); tail.scale.set(.16, .03, .42); tail.position.set(0, -.01, -.42); g.add(tail);
  const tailW = mesh(box, wht); tailW.scale.set(.17, .031, .14); tailW.position.set(0, -.01, -.28); g.add(tailW);
  const legM = P.mat('#2a2a2e');
  [-1, 1].forEach(s => { const l = mesh(new THREE.CylinderGeometry(.012, .012, .2, 5), legM); l.position.set(s * .06, -.2, .02); g.add(l); });
  const wings = [];
  [-1, 1].forEach(s => {
    const w = new THREE.Group(); w.position.set(s * .13, .06, .02);
    const a = mesh(box, blk); a.scale.set(.75, .025, .32); a.position.x = s * .38;
    const b = mesh(box, wht); b.scale.set(.3, .027, .2); b.position.set(s * .28, .002, -.03);
    w.add(a, b); g.add(w); wings.push({ w, s });
  });
  g.userData.wings = wings;
  g.userData.flap = (t, amt = 1) => wings.forEach(({ w, s }) => { w.rotation.z = s * (Math.sin(t * 16) * .85 * amt + (1 - amt) * -1.25); });
  g.userData.fold = () => g.userData.flap(0, 0);
  return g;
};
P.reg('magpie', { group: 'models/fauna', from: 'Magpie Madness' });
})();
