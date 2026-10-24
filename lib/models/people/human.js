/* ==== PPL human: realistic CC0 rigged people (Quaternius base characters + outfits + animation library) ====
   Files live in lib/assets/characters/ (ppl-human-m.glb, ppl-human-f.glb, ppl-anims.glb), hosted on
   GitHub Pages with open CORS, so any game on any domain can load them.

   const kit = await PPL.human.load('m');                       // 'm' or 'f'; loads loaders + files once
   const h = kit.make({shirt:'#f3f1ea', pants:'#2b3a55', shoes:'#f4f4f0', hair:'#3b2a20', beard:false, skin:1, height:1.78});
   scene.add(h);  h.userData.play('Idle_Loop');  // each frame: h.userData.update(dt)
   Clips: Idle_Loop Walk_Loop Jog_Fwd_Loop Idle_Talking_Loop Dance_Loop Sitting_Idle_Loop Driving_Loop Interact
          Idle_FoldArms_Loop Idle_No_Loop Idle_TalkingPhone_Loop Yes
   Posing on top of a clip (procedural): h.userData.bone('spine_02'), PPL.human.turn(bone, worldAxis, angle),
   PPL.human.ik(upper, lower, hand, targetWorld, poleWorld)  — two-bone arm/leg IK, axis-free (works on any rig). */
(function(){
const P = window.PPL;
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
const script = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('could not load ' + src)); document.head.appendChild(s); });
const H = P.human = {
  base: 'https://namchasang.github.io/paulperthailab/lib/assets/characters/',
  cache: {},
  async deps(){
    if (!THREE.GLTFLoader) await script(CDN + 'loaders/GLTFLoader.js');
    if (!THREE.SkeletonUtils) await script(CDN + 'utils/SkeletonUtils.js');
  },
  load(sex = 'm'){
    return H.cache[sex] || (H.cache[sex] = (async () => {
      await H.deps();
      const L = new THREE.GLTFLoader(), get = f => new Promise((ok, no) => L.load(H.base + f, ok, null, no));
      const [model, anims] = await Promise.all([get(`ppl-human-${sex}.glb`), H.anims || (H.anims = get('ppl-anims.glb'))]);
      const src = model.scene, clips = {};
      anims.animations.forEach(c => { c.tracks = c.tracks.filter(t => !/\.scale$/.test(t.name)); clips[c.name] = c; });
      src.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; } });
      const box = new THREE.Box3().setFromObject(src), rawH = box.max.y - box.min.y;
      return { clips, make: o => make(src, clips, rawH, o || {}) };
    })());
  },
  /* rotate a bone by `angle` around a WORLD axis, whatever its local axes are */
  turn(bone, axis, angle){
    const pq = new THREE.Quaternion(); bone.parent.getWorldQuaternion(pq);
    const wq = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    const lq = pq.clone().invert().multiply(wq).multiply(pq);
    bone.quaternion.premultiply(lq); bone.updateMatrixWorld(true);
  },
  /* point a bone so that its child sits along `dir` (world) */
  aim(bone, child, dir){
    const a = new THREE.Vector3(), b = new THREE.Vector3(); bone.getWorldPosition(a); child.getWorldPosition(b);
    const cur = b.sub(a).normalize(), q = new THREE.Quaternion().setFromUnitVectors(cur, dir.clone().normalize());
    const pq = new THREE.Quaternion(); bone.parent.getWorldQuaternion(pq);
    bone.quaternion.premultiply(pq.clone().invert().multiply(q).multiply(pq)); bone.updateMatrixWorld(true);
  },
  /* two-bone IK: upper -> lower -> end reaches target, elbow/knee bends toward pole */
  ik(upper, lower, end, target, pole){
    const S = new THREE.Vector3(), E = new THREE.Vector3(), W = new THREE.Vector3();
    upper.getWorldPosition(S); lower.getWorldPosition(E); end.getWorldPosition(W);
    const a = S.distanceTo(E), b = E.distanceTo(W), toT = target.clone().sub(S), d = P.clamp(toT.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3);
    const dir = toT.normalize(), cosA = P.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const pv = pole.clone().sub(S); pv.addScaledVector(dir, -pv.dot(dir)); if (pv.lengthSq() < 1e-8) pv.set(0, -1, 0); pv.normalize();
    const elbow = S.clone().addScaledVector(dir, a * cosA).addScaledVector(pv, a * sinA);
    H.aim(upper, lower, elbow.clone().sub(S));
    lower.getWorldPosition(E); H.aim(lower, end, target.clone().sub(E));
  }
};
function make(src, clips, rawH, o){
  const root = THREE.SkeletonUtils.clone(src), g = new THREE.Group(), U = g.userData;
  const k = (o.height || 1.78) / rawH; root.scale.multiplyScalar(k); g.add(root);
  const bones = {}; root.traverse(n => { if (n.isBone) bones[n.name] = n; });
  const tint = { Shirt: o.shirt || '#f3f1ea', Pants: o.pants || '#2b3a55', Shoes: o.shoes || '#f4f4f0' };
  root.traverse(m => { if (!m.isMesh) return; const mats = Array.isArray(m.material) ? m.material : [m.material];
    const nm = mats.map(x => { const c = x.clone(); if (tint[c.name]) c.color = P.lin(tint[c.name]);
      if ((c.name === 'Face' || c.name === 'Skin') && o.skin && o.skin !== 1) c.color.multiplyScalar(o.skin);
      if (c.name === 'Hair') c.color = P.lin(o.hair || '#3b2a20'); return c; });
    m.material = Array.isArray(m.material) ? nm : nm[0]; });
  root.traverse(m => { if (m.isMesh && /Hair_Beard/.test(m.name + (m.parent ? m.parent.name : ''))) m.visible = !!o.beard; });
  const mixer = new THREE.AnimationMixer(root); let cur = null;
  U.bones = bones; U.bone = n => bones[n]; U.mixer = mixer; U.root = root;
  U.play = (name, opt = {}) => { const c = clips[name]; if (!c) return null; const a = mixer.clipAction(c);
    a.reset(); a.setLoop(opt.once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = !!opt.once; a.timeScale = opt.speed ?? 1;
    if (cur && cur !== a) { a.crossFadeFrom(cur, opt.fade ?? .3, false); } a.play(); cur = a; return a; };
  U.hold = (name, t = 0) => { const a = U.play(name, { fade: 0 }); if (a) { a.time = t; a.timeScale = 0; } return a; };
  U.update = dt => { mixer.update(dt); root.updateMatrixWorld(true); };
  return g;
}
P.reg('human', { group: 'models/people', from: 'Quaternius CC0 (Universal Base Characters, Modular Outfits, Universal Animation Library)' });
})();
