/* elevation tiles often report the sea as 0 m: carve a believable sea floor that deepens with
   distance from the shore (chamfer distance over the grid). Call before building meshes. */
P.seaFloor = (T, land = .3, grade = .035, max = 30) => {
  const { n, cell, data: H } = T, D = new Float32Array(n * n).fill(1e9);
  for (let k = 0; k < n * n; k++) if (H[k] > land) D[k] = 0;
  const s2 = Math.SQRT2;
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i; let d = D[k];
      if (i > 0) d = Math.min(d, D[k - 1] + 1); if (j > 0) d = Math.min(d, D[k - n] + 1); if (i > 0 && j > 0) d = Math.min(d, D[k - n - 1] + s2); if (i < n - 1 && j > 0) d = Math.min(d, D[k - n + 1] + s2); D[k] = d; }
    for (let j = n - 1; j >= 0; j--) for (let i = n - 1; i >= 0; i--) { const k = j * n + i; let d = D[k];
      if (i < n - 1) d = Math.min(d, D[k + 1] + 1); if (j < n - 1) d = Math.min(d, D[k + n] + 1); if (i < n - 1 && j < n - 1) d = Math.min(d, D[k + n + 1] + s2); if (i > 0 && j < n - 1) d = Math.min(d, D[k + n - 1] + s2); D[k] = d; }
  }
  for (let k = 0; k < n * n; k++) if (D[k] > 0) H[k] = Math.min(H[k], -Math.min(max, .6 + D[k] * cell * grade));
  return T;
};
/* smoothed copy (box blur) — use to soften fairways, roads, building pads while keeping the real shape */
P.blurField = (T, r = 2, passes = 2) => {
  const { n } = T; let A = Float32Array.from(T.data), B = new Float32Array(n * n);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const ii = i + k; if (ii >= 0 && ii < n) { s += A[j * n + ii]; c++; } } B[j * n + i] = s / c; }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const jj = j + k; if (jj >= 0 && jj < n) { s += B[jj * n + i]; c++; } } A[j * n + i] = s / c; }
  }
  return P.heightfield({ n, size: T.size, data: A });
};
P.terrainMesh = (o) => {
  const nx = Math.round(o.w / o.step), nz = Math.round(o.d / o.step), pos = [], col = [], uv = [], idx = [], c = new THREE.Color();
  const H = o.height, e = o.step * .5;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = o.x0 + i * o.step, z = o.z0 + j * o.step, y = H(x, z);
    const s = 1 - P.V3(H(x - e, z) - H(x + e, z), 2 * e, H(x, z - e) - H(x, z + e)).normalize().y;
    pos.push(x, y, z); uv.push(x / 3, z / 3); o.color(x, z, y, s, c); col.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, f = d + 1; idx.push(a, d, b, b, d, f); }
  if (o.skirt) { // vertical curtain round the edge hides cracks against a coarser outer terrain
    const ring = []; for (let i = 0; i <= nx; i++) ring.push(i); for (let j = 1; j <= nz; j++) ring.push(j * (nx + 1) + nx);
    for (let i = nx - 1; i >= 0; i--) ring.push(nz * (nx + 1) + i); for (let j = nz - 1; j >= 1; j--) ring.push(j * (nx + 1)); ring.push(0);
    const base = pos.length / 3;
    ring.forEach(k => { pos.push(pos[k * 3], pos[k * 3 + 1] - o.skirt, pos[k * 3 + 2]); uv.push(uv[k * 2], uv[k * 2 + 1]); col.push(col[k * 3] * .7, col[k * 3 + 1] * .7, col[k * 3 + 2] * .7); });
    for (let r = 0; r < ring.length - 1; r++) { const a = ring[r], b = ring[r + 1], a2 = base + r, b2 = base + r + 1; idx.push(a, b, a2, b, b2, a2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, o.material || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, map: P.detailTex() }));
  m.receiveShadow = true; return m;
};
P.reg('heightfield', { group: 'terrain', from: 'new (golf), slope rule from Roo Road lesson l04' });
})();
