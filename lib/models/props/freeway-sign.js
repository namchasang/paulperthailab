/* ==== PPL freeway sign: green Australian-style direction sign on two posts (3d panel + canvas face) ====
   Approved by Paul (Oct 2026) from his roadside photo: route shield, road name strip, towns with km, optional yellow strip.
   PPL.freewaySign({route:'30', road:'ALBANY HWY', to:[['Perth Airport',10],['Armadale',26]], strip:'WORLD MAP →'}) -> Group, face +z, ~2.6 wide. */
(function(){
const P = window.PPL;
P.freewaySign = (o = {}) => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 84; const g = c.getContext('2d'), rows = o.to || [];
  g.fillStyle = '#16673a'; g.fillRect(0, 0, 128, 84); g.strokeStyle = '#f6f6f0'; g.lineWidth = 2; g.strokeRect(2, 2, 124, 80);
  g.fillStyle = '#f6f6f0'; g.beginPath(); g.moveTo(9, 8); g.lineTo(25, 8); g.lineTo(25, 17); g.quadraticCurveTo(17, 24, 9, 17); g.closePath(); g.fill();
  g.fillStyle = '#1d4e9a'; g.beginPath(); g.moveTo(10, 9); g.lineTo(24, 9); g.lineTo(24, 16.5); g.quadraticCurveTo(17, 22.5, 10, 16.5); g.closePath(); g.fill();
  g.fillStyle = '#f6f6f0'; g.font = 'bold 8px monospace'; g.textAlign = 'center'; g.fillText(o.route || '1', 17, 17); g.fillRect(30, 9, 90, 11); g.fillStyle = '#16673a'; g.fillText(o.road || '', 75, 17.5);
  g.textAlign = 'left'; g.fillStyle = '#f6f6f0'; g.font = 'bold 9px monospace'; rows.slice(0, 3).forEach(([n, km], i) => { g.fillText(n, 10, 34 + i * 11); g.textAlign = 'right'; g.fillText(String(km), 119, 34 + i * 11); g.textAlign = 'left'; });
  if (o.strip) { g.fillStyle = '#ffd34d'; g.fillRect(8, 68, 112, 11); g.fillStyle = '#141a2e'; g.font = 'bold 8px monospace'; g.textAlign = 'center'; g.fillText(o.strip, 64, 76.5); }
  const tx = new THREE.CanvasTexture(c); tx.magFilter = THREE.NearestFilter; tx.encoding = THREE.sRGBEncoding;
  const grp = new THREE.Group(), edge = P.mat('#d8dcd8'), back = P.mat('#16673a'), postM = P.mat('#9aa0a6', { metalness: .4, roughness: .5 });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, .08), [edge, edge, edge, edge, new THREE.MeshBasicMaterial({ map: tx }), back]); panel.position.y = 2.15; panel.castShadow = true; grp.add(panel);
  [-.85, .85].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.1, 2.2, .1), postM); p.position.set(x, 1.1, -.08); p.castShadow = true; grp.add(p); });
  return grp;
};
P.reg('freeway-sign', { group: 'models/props', from: 'quokka-cafe: roadSign' });
})();
