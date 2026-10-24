/* ==== PPL golf props: flag & cup, tee markers, ball with trail ====
   PPL.flagPin({color})  -> Group (cup ring at y=0, 2.3 m pin, waving flag: userData.tick(t, wind))
   PPL.teeMarkers(color) -> Group of two markers 6 m apart on x
   PPL.golfBall()        -> Mesh (radius 0.0214 m real; scale up for readability)
   PPL.trail(n)          -> Line; userData.push(v3), userData.clear() */
(function(){
const P = window.PPL;
P.flagPin = (o = {}) => {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.RingGeometry(.054, .07, 20), P.mat('#e8e8e8')); cup.rotation.x = -Math.PI / 2; cup.position.y = .012; g.add(cup);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.054, 20), new THREE.MeshBasicMaterial({ color: '#0d0f0c' })); hole.rotation.x = -Math.PI / 2; hole.position.y = .011; g.add(hole);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 2.3, 6), P.mat('#f2f2ea', { roughness: .4 })); pin.position.y = 1.15; pin.castShadow = true; g.add(pin);
  const fg = new THREE.PlaneGeometry(.6, .4, 8, 4); fg.translate(.3, 0, 0);
  const flag = new THREE.Mesh(fg, P.mat(o.color || '#e0322b', { side: THREE.DoubleSide, roughness: .7 })); flag.position.y = 2.08; flag.castShadow = true; g.add(flag);
  const base = fg.attributes.position.array.slice();
  g.userData.tick = (t, wind = 1, dir = 0) => {
    flag.rotation.y = dir; const p = fg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.setZ(i, Math.sin(x * 9 - t * 7 * (.6 + wind * .4)) * .06 * x * (.4 + wind)); }
    p.needsUpdate = true; fg.computeVertexNormals();
  };
  return g;
};
P.teeMarkers = (color = '#2a6fd6') => {
  const g = new THREE.Group();
  [-3, 3].forEach(x => { const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 14, 10), P.mat(color, { roughness: .35 })); b.position.set(x, .08, 0); b.castShadow = true; g.add(b); });
  return g;
};
P.golfBall = () => { const b = new THREE.Mesh(new THREE.SphereGeometry(.0214, 16, 12), P.mat('#fbfbf6', { roughness: .35 })); b.castShadow = true; return b; };
P.trail = (n = 120) => {
  const pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setDrawRange(0, 0);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55 })); l.frustumCulled = false; let k = 0;
  l.userData.push = v => { if (k >= n) { pos.copyWithin(0, 3); k = n - 1; } pos.set([v.x, v.y, v.z], k * 3); k++; g.setDrawRange(0, k); g.attributes.position.needsUpdate = true; };
  l.userData.clear = () => { k = 0; g.setDrawRange(0, 0); };
  return l;
};
['flagPin', 'teeMarkers', 'golfBall', 'trail'].forEach(id => P.reg(id, { group: 'models/props', from: 'new (golf)' }));
})();
/* ==== PPL sky, sun, light, fog, clouds, rain — one call sets up a whole outdoor atmosphere ====
   const W = PPL.skyWeather(scene, renderer, {radius:4000});
   W.set({hour:17.4, weather:'clear'|'hazy'|'overcast'|'rain', sunAzimuth: deg (0=north,270=west at sunset)})
   W.update(dt, camera, focus)   // every frame: moves sky/rain with camera, shadow box with focus point
   W.sun (DirectionalLight), W.hemi, W.preset (current colours)  */
(function(){
const P = window.PPL;
const C = (h) => P.lin(h);
