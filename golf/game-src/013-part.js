</script>
<script>
/* ==== Roo Point Links: one-hole prototype ==== */
(function(){
const P = PPL, V = (x, y, z) => new THREE.Vector3(x, y, z), $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);

/* ---------- renderer, scene, camera ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, .1, 9000);
function resize(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 68 : 55; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const W = P.skyWeather(scene, renderer, { radius: 5000, sunAzimuth: 282, shadowSize: 55 });

/* ---------- real terrain + hole layout ---------- */
const T0 = P.seaFloor(P.heightfield(TERRAIN)), TB = P.blurField(T0, 2, 3);
const TEE = { x: -60, z: -12 }, GRN = { x: -392, z: 22 };
const DX = GRN.x - TEE.x, DZ = GRN.z - TEE.z, LEN = Math.hypot(DX, DZ), DIR = { x: DX / LEN, z: DZ / LEN }, PERP = { x: -DIR.z, z: DIR.x };
const toAP = (x, z, o = TEE) => { const rx = x - o.x, rz = z - o.z; return [rx * DIR.x + rz * DIR.z, rx * PERP.x + rz * PERP.z]; };
const fromAP = (a, p, o = TEE) => ({ x: o.x + DIR.x * a + PERP.x * p, z: o.z + DIR.z * a + PERP.z * p });
const PIN = fromAP(3, -2.5, GRN);
const BUNK = [[228, 17, 9, 5], [252, -18, 10, 5.5], [LEN - 19, -11, 6, 4], [LEN + 13, 9, 7, 3.5]].map(([a, p, ra, rp]) => ({ a, p, ra, rp }));
const fwHalf = a => 16 + 4 * Math.sin(a * .021) + (a > LEN - 60 ? -3 : 0);
const greenD = (x, z) => { const [a, p] = toAP(x, z, GRN); return Math.hypot(a / 17, p / 13.5); };
const bunkD = (a, p) => { let m = 9; for (const b of BUNK) m = Math.min(m, Math.hypot((a - b.a) / b.ra, (p - b.p) / b.rp)); return m; };
const HG = TB.h(GRN.x, GRN.z) + .35, HT = TB.h(TEE.x, TEE.z) + .5;
const coastDune = (x, z, h0) => { if (h0 < .4 || h0 > 9) return 0; const k = P.smooth(-575, -500, x) * (1 - P.smooth(-455, -420, x)); return k * Math.max(0, P.fbm(x / 26 + 3, z / 26, 3) + .15) * 4.5; };
/* final playable height: real ground, softened inside the course, shaped green / tee / bunkers */
function H(x, z){
  const h0 = T0.h(x, z), [a, p] = toAP(x, z);
  const along = P.smooth(-60, -20, a) * (1 - P.smooth(LEN + 45, LEN + 80, a)), m = along * (1 - P.smooth(52, 80, Math.abs(p)));
  let h = P.lerp(h0, TB.h(x, z), m * .9) + coastDune(x, z, h0) * (1 - m);
  h += m * .45 * P.fbm(x / 22, z / 22, 3);
  const gd = greenD(x, z);
  if (gd < 1.7) { const [ga, gp] = toAP(x, z, GRN); const plane = HG + ga * .017 + gp * .008 + .14 * Math.exp(-((ga - 5) ** 2 + (gp + 4) ** 2) / 60) - .09 * Math.exp(-((ga + 6) ** 2 + (gp - 5) ** 2) / 50);
    h = P.lerp(h, plane, P.smooth(1.7, 1.08, gd)); }
  const td = Math.max(Math.abs(a) / 6, Math.abs(p) / 8); if (td < 1.8) h = P.lerp(h, HT, P.smooth(1.8, 1.05, td));
  const bd = bunkD(a, p); if (bd < 1.3) h += bd < 1 ? -.75 * (1 - bd * bd) : .18 * Math.sin((bd - 1) / .3 * Math.PI);
  return h;
}
const SURF = { tee: [.3, .25, .11], fairway: [.32, .25, .11], fringe: [.26, .3, .09], green: [.24, .2, .05], rough: [.2, .55, .3], bunker: [.04, .92, 1.3], native: [.16, .6, .45], beach: [.06, .85, 1], water: [0, 1, 9] };
const TH = { tee: 'บนแท่นที', fairway: 'บนแฟร์เวย์', fringe: 'ขอบกรีน', green: 'บนกรีน', rough: 'ในรัฟ', bunker: 'ในบังเกอร์', native: 'ในพุ่มไม้ชายฝั่ง', beach: 'บนหาดทราย', water: 'ในน้ำ' };
function surface(x, z, y){
  y = y ?? H(x, z); if (y < .12) return 'water';
  const [a, p] = toAP(x, z), gd = greenD(x, z);
  if (gd < 1) return 'green'; if (gd < 1.15) return 'fringe';
  if (Math.abs(a) < 6 && Math.abs(p) < 8) return 'tee';
  if (bunkD(a, p) < 1) return 'bunker';
  if (a > 62 && a < LEN - 10 && Math.abs(p) < fwHalf(a)) return 'fairway';
  if (a > -20 && a < LEN + 35 && Math.abs(p) < 46) return 'rough';
  if (y < 3 && x < -440) return 'beach';
  return 'native';
}
