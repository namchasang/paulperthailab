/* ==== PPL picket fence on a limestone retaining wall (3d, instanced) ====
   Approved by Paul for Quokka Cafe's town edges (Oct 2026), from a Perth front-yard photo: sandy limestone block base,
   white pickets, three rails, square posts with caps every ~1.9.
   PPL.picketFence([[x1,z1],[x2,z2],...], {low:false}) -> Group along the polyline. Low = shorter, for edges nearest the camera. */
(function(){
const P = window.PPL;
const blockTex = () => { const c = document.createElement('canvas'); c.width = 32; c.height = 16; const x = c.getContext('2d'); x.fillStyle = '#d8c290'; x.fillRect(0, 0, 32, 16);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const ox = i * 16 + (j ? 8 : 0); x.fillStyle = ['#e0cc9c', '#d2b986', '#dcc596', '#cdb37e'][(i + j * 2) % 4]; x.fillRect(ox % 32, j * 8, 15, 7); if (ox + 15 > 32) x.fillRect(0, j * 8, ox + 15 - 32, 7); }
  x.fillStyle = '#b8a070'; x.fillRect(0, 7, 32, 1); x.fillRect(0, 15, 32, 1); x.fillRect(15, 0, 1, 7); x.fillRect(7, 8, 1, 7); x.fillRect(23, 8, 1, 7);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.encoding = THREE.sRGBEncoding; return t; };
P.picketFence = (pts, o = {}) => {
  const g = new THREE.Group(), low = !!o.low, bh = low ? .32 : .5, fh = low ? .62 : .95, white = P.mat('#f6f6f2', { roughness: .6 }), pick = [], posts = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const [x1, z1] = pts[k], [x2, z2] = pts[k + 1], L = Math.hypot(x2 - x1, z2 - z1); if (L < .3) continue; const a = Math.atan2(z2 - z1, x2 - x1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const seg = new THREE.Group(); seg.position.set(cx, 0, cz); seg.rotation.y = -a; g.add(seg);
    const tex = blockTex(); tex.repeat.set(L / 1.6, 1);
    const base = new THREE.Mesh(new THREE.BoxGeometry(L, bh, .55), new THREE.MeshStandardMaterial({ map: tex, roughness: .9 })); base.position.y = bh / 2; base.castShadow = base.receiveShadow = true; seg.add(base);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(L + .02, .05, .6), P.mat('#cdb784')); cap.position.y = bh + .025; seg.add(cap);
    [fh * .12, fh * .62, fh * .94].forEach((y, i) => { const r = new THREE.Mesh(new THREE.BoxGeometry(L, i === 2 ? .07 : .05, .05), white); r.position.y = bh + y; r.castShadow = true; seg.add(r); });
    const n = Math.max(1, Math.round(L / 1.9)); for (let i = 0; i <= n; i++) { const t = i / n; posts.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t]); }
    for (let s = .07; s < L; s += .16) { const t = s / L; pick.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t]); } }
  const o3 = new THREE.Object3D();
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(.045, fh * .68, .045), white, pick.length); pick.forEach(([x, z], i) => { o3.position.set(x, bh + fh * .1 + fh * .34, z); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); }); im.castShadow = true; g.add(im);
  const ip = new THREE.InstancedMesh(new THREE.BoxGeometry(.13, fh + .08, .13), white, posts.length), ic = new THREE.InstancedMesh(new THREE.BoxGeometry(.17, .06, .17), white, posts.length);
  posts.forEach(([x, z], i) => { o3.position.set(x, bh + (fh + .08) / 2, z); o3.updateMatrix(); ip.setMatrixAt(i, o3.matrix); o3.position.set(x, bh + fh + .1, z); o3.updateMatrix(); ic.setMatrixAt(i, o3.matrix); }); ip.castShadow = true; g.add(ip, ic);
  return g;
};
P.reg('picket-fence', { group: 'models/props', from: 'quokka-cafe: fenceRun' });
})();
