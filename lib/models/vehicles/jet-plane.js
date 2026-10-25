/* ==== PPL jet plane: a narrow-body airliner in proportion (3d, low-poly) ====
   Approved by Paul for Quokka Cafe's airport (Oct 2026): slim fuselage, low swept wings with slight dihedral, engines on pylons,
   swept fin and tailplane, nose and main gear, nav lights. Fictional airline name only.
   PPL.jetPlane({tail:'#2a9a8a', name:'QUOKKA AIR'}) -> Group, nose along +x, ~8.6 long (Quokka game units). */
(function(){
const P = window.PPL;
P.jetPlane = (o = {}) => {
  const g = new THREE.Group(), W = P.mat('#f4f4f2', { roughness: .5 }), T = P.mat(o.tail || '#2a9a8a'), D = P.mat('#3a4048'), GREY = P.mat('#b8bcc2', { roughness: .4, metalness: .3 });
  const put = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, s) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.rotation.set(rx, ry, rz); if (s) k.scale.set(...s); k.castShadow = true; g.add(k); return k; };
  const C = (a, b, h, s = 16) => new THREE.CylinderGeometry(a, b, h, s), Bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const L = 8.6, R = .42, Y = 1.05;
  put(C(R, R, L - 2.6), W, .1, Y, 0, 0, 0, Math.PI / 2);
  put(new THREE.SphereGeometry(R, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), W, L / 2 - 1.2, Y, 0, 0, 0, -Math.PI / 2, [1, 2.6, 1]);
  put(C(.08, R, 1.9), W, -L / 2 + .25, Y + .14, 0, 0, 0, -Math.PI / 2 + .08);
  [1, -1].forEach(s => put(Bx(L - 2.4, .14, .02), T, .2, Y - .18, s * (R + .002)));
  const wingGeo = (root, tip, span, sweep, th) => { const sh = new THREE.Shape(); sh.moveTo(root / 2, 0); sh.lineTo(-root / 2, 0); sh.lineTo(-sweep - tip / 2, span); sh.lineTo(-sweep + tip / 2, span); sh.closePath(); const ge = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); ge.rotateX(Math.PI / 2); return ge; };
  [1, -1].forEach(s => { put(wingGeo(1.7, .45, 3.9, 1.5, .07), W, .35, Y - .25, 0, s * .06, 0, 0, [1, 1, s]);
    const ez = s * 1.35, ex = .75; put(C(.24, .22, 1.1, 14), GREY, ex, Y - .6, ez, 0, 0, Math.PI / 2); put(Bx(.5, .25, .06), W, ex - .15, Y - .38, ez);
    put(wingGeo(.9, .3, 1.55, .75, .05), W, -L / 2 + .85, Y + .18, 0, 0, 0, 0, [1, 1, s]); });
  { const sh = new THREE.Shape(); sh.moveTo(-L / 2 + 1.9, 0); sh.lineTo(-L / 2 + .5, 0); sh.lineTo(-L / 2 - .1, 1.75); sh.lineTo(-L / 2 + .45, 1.75); sh.closePath(); const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .07, bevelEnabled: false }), T); fin.position.set(0, Y + .3, -.035); fin.castShadow = true; g.add(fin); }
  [[L / 2 - 1.3, 0, 1], [0, .48, 2], [0, -.48, 2]].forEach(([x, z, n]) => { put(C(.035, .035, Y - .35, 6), D, x, (Y - .35) / 2 + .18, z); for (let k = 0; k < n; k++) put(C(.16, .16, .1, 12), P.mat('#1c1c1e'), x + (n > 1 ? (k - .5) * .34 : 0), .16, z, Math.PI / 2); });
  [[4, '#ff3020'], [-4, '#30ff60']].forEach(([z, c]) => put(new THREE.SphereGeometry(.05, 5, 4), P.mat(c, { emissive: P.lin(c), emissiveIntensity: .8 }), -1.25, Y - .25, z));
  g.userData.len = L; return g;
};
P.reg('jet-plane', { group: 'models/vehicles', from: 'quokka-cafe: AIR.makePlane' });
})();
