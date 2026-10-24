// Smoke test for a single-file web game: serves the repo, opens the game headless,
// waits, then reports page errors and saves a screenshot.
//   node tools/smoke.mjs [path=index.html] [seconds=6] [shot=smoke.png]
// Needs: npm i -D playwright (Claude's container has Chromium at /opt/pw-browsers).
// WebGL runs on SwiftShader (software), so it is slow but fine for "does it start without errors".
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [file = 'index.html', secs = '25', shot = 'smoke.png'] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => {
  let p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  r.end(fs.readFileSync(p));
}).listen(0);
const port = srv.address().port;
const exe = ['/opt/pw-browsers/chromium', process.env.CHROME].find(x => x && fs.existsSync(x));
const b = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|api\/config/.test(m.text())) errs.push('console: ' + m.text()); });
await pg.route(u => !u.hostname.endsWith("localhost") && u.hostname !== "127.0.0.1", r => r.abort());
await pg.goto(`http://127.0.0.1:${port}/${file}`, { waitUntil: "commit", timeout: 120000 });
await pg.waitForTimeout(+secs * 1000);
await pg.screenshot({ path: shot });
await b.close(); srv.close();
console.log(errs.length ? errs.slice(0, 20).join('\n') : 'OK: no page errors');
console.log('screenshot:', shot);
process.exit(errs.length ? 1 : 0);
