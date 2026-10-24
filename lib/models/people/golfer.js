/* ==== PPL golfer (simple adult rig with club; reusable for any standing person) ====
   const g = PPL.golfer({shirt:'#2f6f9f', pants:'#e8e2d0', skin:'#c99a78', cap:'#f2f2ee'});
   g.userData.swing(t)  t: 0 address, 0..0.45 backswing, 0.45..0.6 downswing (impact ~0.56), ..1 follow-through
   g.userData.setClub('driver'|'iron'|'wedge'|'putter')
   Faces +z, ball sits at about (0.05, 0, 0.62) in its local space. Height ~1.78 m. */
(function(){
const P = window.PPL;
P.golfer = (o = {}) => {
  const g = new THREE.Group(), m = c => P.mat(c, { roughness: .8 });
  const skin = m(o.skin || '#c99a78'), shirt = m(o.shirt || '#2f6f9f'), pants = m(o.pants || '#e6e0cc'), shoe = m('#f4f4f0'), capM = m(o.cap || '#f2f2ee'), hair = m('#2a211b');
  const mesh = (geo, mt, parent, x = 0, y = 0, z = 0) => { const k = new THREE.Mesh(geo, mt); k.position.set(x, y, z); k.castShadow = true; parent.add(k); return k; };
  const hips = new THREE.Group(); hips.position.y = .95; g.add(hips);
  mesh(new THREE.CylinderGeometry(.17, .16, .2, 12), pants, hips, 0, 0, 0);
  const legs = [-1, 1].map(s => { const L = new THREE.Group(); L.position.set(s * .11, -.05, 0); hips.add(L);
    mesh(new THREE.CylinderGeometry(.085, .06, .9, 10), pants, L, 0, -.45, 0); mesh(new THREE.BoxGeometry(.11, .07, .27), shoe, L, 0, -.9, .05); L.rotation.z = s * .15; return L; });
  const spine = new THREE.Group(); spine.position.y = .08; hips.add(spine);
  mesh(new THREE.CylinderGeometry(.19, .17, .55, 12), shirt, spine, 0, .3, 0);
  const head = new THREE.Group(); head.position.set(0, .7, 0); spine.add(head);
  mesh(new THREE.CylinderGeometry(.05, .06, .1, 8), skin, head, 0, -.06, 0);
  mesh(new THREE.SphereGeometry(.105, 14, 11), skin, head, 0, .08, .01);
  mesh(new THREE.SphereGeometry(.108, 14, 8, 0, 6.3, 0, 1.4), hair, head, 0, .09, -.005);
  mesh(new THREE.CylinderGeometry(.112, .112, .05, 14), capM, head, 0, .16, 0); mesh(new THREE.BoxGeometry(.18, .015, .12), capM, head, 0, .145, .12);
  /* arms hang from a shoulder pivot; both hands meet on the grip */
  const shoulders = new THREE.Group(); shoulders.position.y = .52; spine.add(shoulders);
  /* each arm = upper (sleeve) + forearm (skin), re-aimed every pose from shoulder to the grip */
  const limb = (mt, r0, r1) => { const c = new THREE.CylinderGeometry(r1, r0, 1, 8); c.translate(0, .5, 0); const k = new THREE.Mesh(c, mt); k.castShadow = true; spine.add(k); return k; };
  const arms = [-1, 1].map(s => ({ s, up: limb(shirt, .055, .048), lo: limb(skin, .045, .038) }));
  const hands = new THREE.Group(); hands.position.set(0, -.68, .2); shoulders.add(hands);
  mesh(new THREE.SphereGeometry(.05, 8, 6), m('#f4f4f0'), hands, 0, 0, 0);
  const club = new THREE.Group(); hands.add(club);
  const shaft = mesh(new THREE.CylinderGeometry(.008, .006, 1, 6), m('#c8ccd2'), club, 0, -.5, 0);
  const headM = m('#30343a'); const clubHead = mesh(new THREE.BoxGeometry(.1, .05, .06), headM, club, .03, -1, 0);
  const U = g.userData; U.clubHead = clubHead;
  U.setClub = (k) => { const len = { driver: 1.12, iron: .96, wedge: .9, putter: .86 }[k] || 1; shaft.scale.y = len; shaft.position.y = -len / 2; clubHead.position.y = -len;
    clubHead.scale.set(k === 'driver' ? 1.3 : 1, k === 'driver' ? 1.6 : 1, k === 'driver' ? 1.7 : 1); U.club = k; U.swing(0); };
  /* aim the arms at the hands each frame */
  const Y = P.V3(0, 1, 0);
  const seg = (k, a, b) => { const d = b.clone().sub(a); k.position.copy(a); k.scale.set(1, d.length(), 1); k.quaternion.setFromUnitVectors(Y, d.normalize()); };
  const aimArms = () => { spine.updateMatrixWorld(true); const hw = new THREE.Vector3(); hands.getWorldPosition(hw); spine.worldToLocal(hw);
    arms.forEach(({ s, up, lo }) => { const sh = P.V3(s * .2, .55, 0), grip = hw.clone().add(P.V3(s * .03, .02, 0));
      const mid = sh.clone().lerp(grip, .5).add(P.V3(s * .06, -.02, .04)); seg(up, sh, mid); seg(lo, mid, grip); }); };
  U.swing = (t) => {
    const put = U.club === 'putter';
    const bend = put ? .55 : .42; spine.rotation.x = bend; head.rotation.x = -bend * .7; legs.forEach(L => L.rotation.x = -.12);
    hips.position.y = put ? .9 : .93;
    let a; // club angle around the swing plane: 0 = address (down), + = back
    if (t < .45) a = (t / .45) * (put ? .55 : 2.6); else if (t < .6) a = P.lerp(put ? .55 : 2.6, -1.2, (t - .45) / .15); else a = P.lerp(-1.2, put ? -.45 : -2.7, P.smooth(.6, 1, t));
    /* target is the golfer's left (+x local); backswing goes to -x */
    const twist = put ? 0 : -P.clamp(a, -2.7, 2.6) * .35;
    spine.rotation.y = twist; hips.rotation.y = twist * .4;
    shoulders.rotation.set(0, 0, 0);
    const r = .5; hands.position.set(-Math.sin(a) * r * .9, -.68 + (1 - Math.cos(a)) * r * .55, .22 - (1 - Math.cos(a)) * .06);
    club.rotation.set(-.25, 0, -a * (put ? 1 : 1.25));
    if (!put && Math.abs(a) > 1.4) club.rotation.z -= Math.sign(a) * (Math.abs(a) - 1.4) * .9;
    g.updateMatrixWorld(true); aimArms();
  };
  U.setClub('driver');
  return g;
};
P.reg('golfer', { group: 'models/people', from: 'new (golf)' });
})();
