/* ==== PPL retro hatch: a small two-tone retro hatchback (3d, low-poly) ====
   Approved by Paul for Quokka Cafe (Oct 2026): cream body, black roof, round chrome lamps, bonnet scoop. No brand.
   PPL.retroHatch({body, roof}) -> Group, nose along +x, ~1.18 long (Quokka game units). userData.len / wid for traffic. */
(function(){
const P = window.PPL;
const ROOF = { '#efe6cc': '#1c1c1e', '#c8202a': '#f6f6f0', '#1e4a32': '#f6f6f0', '#8ec8e0': '#f6f6f0', '#1c1c1e': '#f6f6f0', '#f2c428': '#1c1c1e', '#d8dce0': '#1c1c1e' };
P.RETRO_COLOURS = Object.keys(ROOF);
P.retroHatch = (o = {}) => {
  const body = o.body || '#efe6cc', g = new THREE.Group(), len = 1.18, wid = .66;
  const B = P.mat(body), blk = P.mat('#1c1c1e'), roof = P.mat(o.roof || ROOF[body] || '#f6f6f0'), chrome = P.mat('#d8dce0', { roughness: .3, metalness: .6 }), glass = P.mat('#9cb6c6', { roughness: .2 });
  const head = P.mat('#dcd8c4', { emissive: P.lin('#fff6c8'), emissiveIntensity: .25 }), tail = P.mat('#8a1c1c', { emissive: P.lin('#ff3a2a'), emissiveIntensity: .25 }), tyre = P.mat('#1c1c1e');
  const put = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.rotation.set(rx, ry, rz); k.castShadow = true; g.add(k); return k; };
  const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d), cy = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s);
  put(bx(len, .3, wid), B, 0, .31, 0); put(bx(len + .03, .09, wid + .03), blk, 0, .18, 0); put(bx(.36, .06, wid - .04), B, .38, .48, 0, 0, 0, -.1);
  put(bx(.66, .25, wid - .07), glass, -.12, .585, 0); [.2, -.44].forEach(x => put(bx(.05, .25, wid - .05), blk, x, .585, 0)); put(bx(.76, .06, wid - .01), roof, -.12, .735, 0);
  put(bx(.16, .04, .2), blk, .36, .52, 0); put(bx(.03, .09, .3), blk, len / 2 + .004, .3, 0); put(bx(.03, .03, wid - .06), chrome, len / 2 + .006, .4, 0);
  [-1, 1].forEach(s => { put(cy(.085, .085, .035, 12), head, len / 2 + .006, .4, s * .2, 0, 0, Math.PI / 2); put(cy(.098, .098, .02, 12), chrome, len / 2, .4, s * .2, 0, 0, Math.PI / 2);
    put(cy(.045, .045, .03, 8), head, len / 2 + .01, .24, s * .12, 0, 0, Math.PI / 2); put(bx(.03, .1, .07), tail, -len / 2 - .005, .38, s * .26); put(bx(.12, .04, .04), blk, .36, .5, s * (wid / 2 + .01));
    [-1, 1].forEach(e => put(cy(.15, .15, wid + .04, 10), tyre, e * len * .32, .15, 0, Math.PI / 2)); });
  g.userData.len = len; g.userData.wid = wid; return g;
};
P.reg('retro-hatch', { group: 'models/vehicles', from: 'quokka-cafe: makeCar retro' });
})();
