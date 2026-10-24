/* ---------- game state ---------- */
const CLUBS = [
  { k: 'driver', th: 'ไดรเวอร์', v: 67, el: 11, carry: 190 },
  { k: 'iron', th: 'เหล็ก 7', v: 52, el: 18, carry: 142 },
  { k: 'wedge', th: 'เวดจ์', v: 34, el: 34, carry: 88 },
  { k: 'putter', th: 'พัตเตอร์', v: 9.5, el: 0, carry: 16 }
];
const S = { mode: 'title', strokes: 0, pos: V(), vel: V(), last: V(), club: 0, yaw: 0, power: 0, charging: false, swingT: -1, flightT: 0, rest: 0, cam: V(), look: V(), wind: V(), events: 0, noEvent: false, holed: false, hitRoo: false };
const PAR = 4;
function setWind(){ const a = 4.2 + (R() - .5) * 1.4, s = 1.5 + R() * 4; S.wind.set(Math.cos(a) * s, 0, Math.sin(a) * s); }
function distToPin(){ return Math.hypot(S.pos.x - PIN.x, S.pos.z - PIN.z); }
function autoClub(){ const sf = surface(S.pos.x, S.pos.z), d = distToPin();
  S.club = sf === 'green' || sf === 'fringe' && d < 25 ? 3 : d > 175 ? 0 : d > 100 ? 1 : 2; if (S.club === 0 && sf !== 'tee' && sf !== 'fairway') S.club = 1; showClub(); }
function showClub(){ const c = CLUBS[S.club]; $('club').innerHTML = c.th + '<small>แตะเพื่อเปลี่ยนไม้</small>'; golfer.userData.setClub(c.k); placeGolfer(); }
function resetHole(){
  S.strokes = 0; S.holed = false; S.events = 0; MG.done = false; MG.on = false; mag.visible = false;
  S.pos.set(TEE.x + DIR.x * .5, HT + .03, TEE.z + DIR.z * .5); S.vel.set(0, 0, 0); trail.userData.clear();
  roos.forEach((r, i) => { r.userData.state = 'idle'; });
  setWind(); readyShot(true); $('end').classList.add('hide');
}
function readyShot(first){
  S.mode = 'aim'; S.power = 0; S.charging = false; S.swingT = -1; S.hitRoo = false; S.noEvent = false;
  S.yaw = Math.atan2(PIN.x - S.pos.x, PIN.z - S.pos.z); autoClub();
  ball.position.copy(S.pos); placeGolfer(); hud(); camAim(true);
  $('shoot').classList.remove('dis');
}
function placeGolfer(){
  const g = golfer; g.rotation.set(0, 0, 0); g.position.set(0, 0, 0); g.userData.swing(0); g.updateMatrixWorld(true);
  const hl = new THREE.Vector3(); g.userData.clubHead.getWorldPosition(hl);
  /* golfer faces +z, target is his +x: rotate so +x points along yaw */
  const ry = S.yaw - Math.PI / 2; g.rotation.y = ry;
  const off = V(hl.x + .05, 0, hl.z).applyAxisAngle(V(0, 1, 0), ry);
  const gx = S.pos.x - off.x, gz = S.pos.z - off.z; g.position.set(gx, H(gx, gz), gz);
  g.userData.swing(S.swingT < 0 ? 0 : S.swingT);
}
function hud(){
  const d = distToPin(), sf = surface(S.pos.x, S.pos.z);
  $('hTitle').textContent = `หลุม 1 · พาร์ ${PAR} · ${Math.round(LEN)} ม.`;
  $('hLine').textContent = `ตีแล้ว ${S.strokes} · เหลือ ${d < 30 ? d.toFixed(1) : Math.round(d)} ม. · ${TH[sf]}`;
  const ws = S.wind.length(), wa = Math.atan2(S.wind.x, S.wind.z);
  const camYaw = Math.atan2(S.look.x - S.cam.x, S.look.z - S.cam.z);
  $('wind').querySelector('svg').style.transform = `rotate(${(camYaw - wa) * 180 / Math.PI}deg)`;
  $('windT').textContent = `ลม ${ws.toFixed(1)} ม./วิ`;
}
let toastT = 0; function toast(a, b){ const t = $('toast'); t.innerHTML = a + (b ? `<small>${b}</small>` : ''); t.classList.add('on'); toastT = 2.6; }

