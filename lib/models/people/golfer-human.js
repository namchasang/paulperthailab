/* ==== PPL golfer (realistic): a PPL.human with a procedural golf swing (no swing clip exists in CC0 libraries) ====
   const kit = await PPL.human.load('m');
   const g = PPL.golferHuman(kit, {shirt, pants, shoes, cap, hair});   // same API as PPL.golfer:
   g.userData.swing(t)      0 address .. .56 impact .. 1 finish   (posed with IK every call)
   g.userData.setClub(k)    'driver' | 'iron' | 'wedge' | 'putter'
   g.userData.clubHead      mesh at the club face (games line it up with the ball at t = 0)
   g.userData.celebrate() / .sad() / .idle()   play clips;  g.userData.update(dt) every frame
   Faces +z, target is the golfer's left (+x). How it works: the arms and club are one lever turning about a pivot
   in the upper chest, in the plane that holds the target line and the ball; the wrists hinge on the way back,
   the chest twists with the lever, and two-bone IK puts both hands on the grip and both feet on the ground. */
(function(){
const P = window.PPL, V = (x, y, z) => new THREE.Vector3(x, y, z);
const CLUB = { driver: { L: 1.12, gy: .80, A: 2.45, F: 2.5, Hg: 1.6, tw: .95, bend: .42 },
  iron: { L: .95, gy: .78, A: 2.25, F: 2.4, Hg: 1.55, tw: .85, bend: .5 },
  wedge: { L: .90, gy: .77, A: 1.9, F: 2.1, Hg: 1.45, tw: .7, bend: .55 },
  putter: { L: .86, gy: .86, A: .32, F: .34, Hg: 0, tw: .06, bend: .62 } };
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
P.golferHuman = (kit, o = {}) => {
  const g = kit.make({ shirt: o.shirt || '#f3f1ea', pants: o.pants || '#2b3a55', shoes: o.shoes || '#f4f4f0', hair: o.hair, skin: o.skin, height: o.height || 1.78 });
  const U = g.userData, B = U.bones, HU = P.human;
  /* cap on the head bone */
  const capM = P.mat(o.cap || '#1f6f8b', { roughness: .7 }), cap = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.SphereGeometry(.112, 18, 10, 0, 6.3, 0, 1.45), capM); crown.scale.set(1, .8, 1.08);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.1, .11, .012, 18, 1, false, -1.1, 2.2), capM); brim.position.set(0, -.005, .07); brim.scale.set(1, 1, 1.25);
  cap.add(crown, brim); cap.traverse(m => m.castShadow = true); g.add(cap);
  /* club: grip + shaft + head, rebuilt per club */
  const club = new THREE.Group(); g.add(club);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.006, .009, 1, 8), P.mat('#c9ced6', { roughness: .3, metalness: .6 })); shaft.castShadow = true;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.012, .011, .26, 10), P.mat('#1c1c20', { roughness: .8 })); grip.castShadow = true;
  const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), P.mat('#2b2e33', { roughness: .35, metalness: .7 })); head.castShadow = true;
  club.add(shaft, grip, head);
  let C = CLUB.driver, k = 'driver';
  const tmp = V(0, 0, 0);
  const local = v => g.localToWorld(v.clone());
  U.clubHead = head;
  /* lever geometry in golfer space */
  let pivot, G0, u0, n, sgn;
  const setup = () => {
    pivot = V(0, 1.30, .10);
    G0 = V(.04, C.gy, .30);
    const drop = C.gy - .03, horiz = Math.sqrt(Math.max(.01, C.L * C.L - drop * drop));
    const head0 = V(.02, .03, .30 + horiz);
    u0 = head0.clone().sub(G0).normalize();
    n = V(1, 0, 0).cross(head0.clone().sub(pivot)).normalize();
    const test = G0.clone().sub(pivot).applyAxisAngle(n, .1).add(pivot); sgn = test.x < G0.x ? 1 : -1;
  };
  U.setClub = kk => { k = kk; C = CLUB[kk] || CLUB.driver; setup();
    const big = kk === 'driver', put = kk === 'putter';
    head.scale.set(put ? .1 : big ? .12 : .075, put ? .03 : big ? .055 : .04, put ? .03 : big ? .1 : .05);
    U.swing(0); };
  let mode = 'swing', lastT = 0, lastTw = 0;
  const placeCap = () => { const hp = V(0, 0, 0), np = V(0, 0, 0); B.Head.getWorldPosition(hp); B.neck_01.getWorldPosition(np);
    const up = hp.clone().sub(np).normalize(), gq = new THREE.Quaternion(); g.getWorldQuaternion(gq);
    const fw = V(0, 0, 1).applyQuaternion(gq); const lp = g.worldToLocal(hp.clone().addScaledVector(up, .115).addScaledVector(fw, .01));
    cap.position.copy(lp); const upL = up.clone().applyQuaternion(gq.clone().invert());
    cap.quaternion.setFromUnitVectors(V(0, 1, 0), upL); cap.rotateY(Math.atan2(upL.x, 1) * 0 + (mode === 'swing' ? -lastTw * .2 : 0)); };

  U.swing = t => {
    mode = 'swing'; lastT = t; cap.visible = true; club.visible = true;
    U.hold('Idle_Loop', .2); U.mixer.update(0);
    const root = U.root, gq = new THREE.Quaternion(); g.getWorldQuaternion(gq);
    const X = V(1, 0, 0).applyQuaternion(gq), Y = V(0, 1, 0).applyQuaternion(gq);
    /* swing angle a (lever), wrist hinge h, chest twist */
    let a, h;
    if (t <= .45) { const e = ease(t / .45); a = C.A * e; h = C.Hg * ease((t - .05) / .4); }
    else if (t <= .56) { const e = (t - .45) / .11; a = C.A * (1 - Math.pow(e, 1.6)); h = C.Hg * (1 - Math.pow(e, 3)); }
    else { const e = ease((t - .56) / .44); a = -C.F * e; h = -C.Hg * .45 * e; }
    const tw = a >= 0 ? -C.tw * a / C.A : C.tw * 1.1 * (-a / C.F);
    root.position.set(0, -.025, 0); root.updateMatrixWorld(true);
    /* posture: hip hinge, chest bend, twist */
    HU.turn(B.pelvis, Y, tw * .35);
    HU.turn(B.spine_01, X, C.bend * .55); HU.turn(B.spine_02, X, C.bend * .3); HU.turn(B.spine_03, X, C.bend * .15);
    HU.turn(B.spine_02, Y, tw * .45); HU.turn(B.spine_03, Y, tw * .35);
    HU.turn(B.neck_01, X, -C.bend * .35); HU.turn(B.Head, Y, -tw * .8);
    /* feet planted, knees flexed toward the ball */
    const knee = V(0, .5, .45);
    [['l', .2], ['r', -.2]].forEach(([s, x]) => {
      const lift = s === 'r' && a < 0 ? .06 * (-a / C.F) : 0;
      HU.ik(B['thigh_' + s], B['calf_' + s], B['foot_' + s], local(V(x * (k === 'putter' ? .7 : 1), .045 + lift, .02 + lift * .3)), local(knee.clone().setX(x * .9)));
    });
    /* lever: hands and club */
    const Gp = G0.clone().sub(pivot).applyAxisAngle(n, sgn * a).add(pivot);
    const u = u0.clone().applyAxisAngle(n, sgn * (a + h));
    const Gw = local(Gp), Rw = local(Gp.clone().addScaledVector(u, .09));
    HU.ik(B.upperarm_l, B.lowerarm_l, B.hand_l, Gw, local(V(.5, .7, -.05)));
    HU.ik(B.upperarm_r, B.lowerarm_r, B.hand_r, Rw, local(V(-.45, .55, -.15)));
    /* club follows the lever */
    club.position.copy(Gp);
    club.quaternion.setFromUnitVectors(V(0, -1, 0), u);
    shaft.scale.set(1, C.L, 1); shaft.position.set(0, -C.L / 2, 0);
    grip.position.set(0, -.09, 0); head.position.set(k === 'putter' ? .0 : .03, -C.L, k === 'putter' ? 0 : .02);
    lastTw = tw; placeCap();
    g.updateMatrixWorld(true);
  };
  U.celebrate = () => { mode = 'clip'; club.visible = false; U.root.position.set(0, 0, 0); U.play('Yes', { once: true, fade: .25 }); };
  U.sad = () => { mode = 'clip'; club.visible = false; U.root.position.set(0, 0, 0); U.play('Idle_No_Loop', { once: true, fade: .25 }); };
  U.idle = () => { mode = 'clip'; club.visible = false; U.root.position.set(0, 0, 0); U.play('Idle_Loop', { fade: .3 }); };
  const upd = U.update;
  U.update = dt => { if (mode === 'clip') { upd(dt); placeCap(); } };
  U.setClub(o.club || 'driver');
  return g;
};
P.reg('golferHuman', { group: 'models/people', from: 'new (golf) on PPL.human' });
})();
