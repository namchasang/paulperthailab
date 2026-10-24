/* ==== PPL ocean: depth-tinted sea with moving ripples, sun glitter and shore foam ====
   const sea = PPL.ocean({size:6000, seg:220, depth:(x,z)=>metres below sea level (>0 = water)});
   scene.add(sea); each frame: sea.userData.tick(dt)   ·  add env: W (skyWeather) to reflect the sky
   Colours: turquoise over sand shallows, deep Indian-Ocean blue offshore, white foam band at the shore. */
(function(){
const P = window.PPL;
P.ocean = (o = {}) => {
  const size = o.size || 6000, seg = o.seg || 200, depth = o.depth || (() => 20);
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  const foam = P.lin('#f4f7f6'), shal = P.lin(o.shallow || '#3fc0bd'), mid = P.lin(o.mid || '#1a7fa6'), deep = P.lin(o.deep || '#0b3d6e');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (o.cx || 0), z = p.getZ(i) + (o.cz || 0), d = depth(x, z), c = new THREE.Color();
    if (d < .4) c.copy(foam); else if (d < 1.6) c.copy(foam).lerp(shal, (d - .4) / 1.2); else if (d < 8) c.copy(shal).lerp(mid, (d - 1.6) / 6.4); else c.copy(mid).lerp(deep, P.clamp((d - 8) / 30, 0, 1));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  /* ripple normal map drawn from layered noise */
  const nTex = P.ctex(256, 256, (x, w, h) => {
    const d = x.createImageData(w, h), H = (i, j) => P.fbm(i / 22, j / 22, 4) + .35 * P.noise2(i / 6, j / 6);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const dx = H(i + 1, j) - H(i - 1, j), dy = H(i, j + 1) - H(i, j - 1), k = (j * w + i) * 4;
      d.data[k] = 128 + dx * 160; d.data[k + 1] = 128 + dy * 160; d.data[k + 2] = 255; d.data[k + 3] = 255;
    }
    x.putImageData(d, 0, 0);
  }, size / 40);
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .24, metalness: 0, normalMap: nTex, normalScale: new THREE.Vector2(.4, .4) });
  if (o.env) { const use = t => { m.envMap = t; m.envMapIntensity = 1; m.needsUpdate = true; }; if (o.env.env) use(o.env.env); o.env.onEnv.push(use); } // pass the skyWeather object
  const sea = new THREE.Mesh(g, m); sea.receiveShadow = true; sea.position.set(o.cx || 0, o.y || 0, o.cz || 0);
  let t = 0; sea.userData.tick = dt => { t += dt; nTex.offset.set(t * .012, t * .007); sea.position.y = (o.y || 0) + Math.sin(t * .5) * .08; };
  return sea;
};
P.reg('ocean', { group: 'env', from: 'new (golf)' });
})();
