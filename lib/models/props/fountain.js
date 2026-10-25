/* ==== PPL fountain: a two-tier stone fountain with animated spray (3d) ====
   Approved by Paul for Quokka Cafe's Perth CBD square and Kings Park (Oct 2026).
   PPL.fountain({r:1.05}) -> Group; call group.userData.tick(t) each frame to animate the jets. */
(function(){
const P = window.PPL;
P.fountain = (o = {}) => {
  const R = o.r || 1.05, g = new THREE.Group(), stone = P.mat('#d8d0bc'), water = P.mat('#5cb8d8', { transparent: true, opacity: .85, roughness: .1 }), spray = new THREE.MeshBasicMaterial({ color: 0xd8f4ff, transparent: true, opacity: .75 });
  const put = (geo, m, y) => { const k = new THREE.Mesh(geo, m); k.position.y = y; k.castShadow = true; g.add(k); return k; }, C = (a, b, h, s = 24) => new THREE.CylinderGeometry(a, b, h, s);
  put(C(R, R + .08, .4), stone, .2); put(C(R - .12, R - .12, .05), water, .38); put(C(.18, .24, 1.1, 10), stone, .9); put(C(.6, .4, .16, 16), stone, 1.45); put(C(.5, .5, .04, 16), water, 1.53); put(C(.08, .12, .5, 8), stone, 1.75); put(C(.28, .18, .1, 12), stone, 2);
  const jets = []; [[10, .55, 2.05], [14, R - .25, 1.5]].forEach(([n, r1, y0]) => { for (let k = 0; k < n; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.05, 5, 4), spray); g.add(d); jets.push({ d, a: k / n * Math.PI * 2, ph: k / n, r1, y0 }); } });
  g.userData.tick = t => jets.forEach(j => { const p = (t * .9 + j.ph) % 1, rr = j.r1 * p; j.d.position.set(Math.cos(j.a) * rr, j.y0 + Math.sin(p * Math.PI) * .45 - p * p * .35, Math.sin(j.a) * rr); });
  return g;
};
P.reg('fountain', { group: 'models/props', from: 'quokka-cafe: city2 fountain' });
})();
