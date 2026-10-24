#!/usr/bin/env python3
"""Cut a square of REAL elevation for a game map and pack it for PPL.heightfield.

  python3 lib/tools/terrain-pack.py LAT LON SIZE_M N out.js [--name VAR] [--zoom 14] [--floor -40]

Source: Terrain Tiles on AWS (terrarium PNG, s3.amazonaws.com/elevation-tiles-prod), reachable from
Claude's container. Credit in game: "Terrain: Terrain Tiles on AWS (SRTM and others)".
Output: a JS line  const VAR={n,size,lat,lon,b64}  -> PPL.heightfield(VAR)
Centre of the square = world (0,0); +x = east, +z = south (north is -z), metres.
Ocean depths are clamped at --floor (only used for water colour).
"""
import argparse, base64, io, math, struct, urllib.request
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('lat', type=float); ap.add_argument('lon', type=float)
ap.add_argument('size', type=float); ap.add_argument('n', type=int); ap.add_argument('out')
ap.add_argument('--name', default='TERRAIN'); ap.add_argument('--zoom', type=int, default=14)
ap.add_argument('--floor', type=float, default=-40)
a = ap.parse_args()

z = a.zoom; N = 2 ** z
def px(lat, lon):
    x = (lon + 180) / 360 * N * 256
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * N * 256
    return x, y
mpp = 40075016.686 * math.cos(math.radians(a.lat)) / (N * 256)   # metres per pixel
cx, cy = px(a.lat, a.lon); halfpx = a.size / 2 / mpp
x0, y0, x1, y1 = cx - halfpx, cy - halfpx, cx + halfpx, cy + halfpx
tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int(x1 // 256), int(y1 // 256)
W, H = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
big = Image.new('RGB', (W, H))
for tx in range(tx0, tx1 + 1):
    for ty in range(ty0, ty1 + 1):
        u = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{tx}/{ty}.png'
        big.paste(Image.open(io.BytesIO(urllib.request.urlopen(u, timeout=60).read())).convert('RGB'), ((tx - tx0) * 256, (ty - ty0) * 256))
arr = np.asarray(big).astype(np.float64)
elev = arr[..., 0] * 256 + arr[..., 1] + arr[..., 2] / 256 - 32768
# bilinear resample onto n x n grid
xs = np.linspace(x0, x1, a.n) - tx0 * 256; ys = np.linspace(y0, y1, a.n) - ty0 * 256
X, Y = np.meshgrid(xs, ys); i0 = np.floor(X).astype(int); j0 = np.floor(Y).astype(int); fx = X - i0; fy = Y - j0
e = lambda j, i: elev[np.clip(j, 0, H - 1), np.clip(i, 0, W - 1)]
g = (e(j0, i0) * (1 - fx) + e(j0, i0 + 1) * fx) * (1 - fy) + (e(j0 + 1, i0) * (1 - fx) + e(j0 + 1, i0 + 1) * fx) * fy
g = np.maximum(g, a.floor)
raw = b''.join(struct.pack('<h', int(round(v * 10))) for v in g.flatten())
open(a.out, 'w').write(f"const {a.name}={{n:{a.n},size:{a.size},lat:{a.lat},lon:{a.lon},b64:'{base64.b64encode(raw).decode()}'}};\n")
print(f'{a.out}: {a.n}x{a.n}, {a.size} m, {mpp:.2f} m/px source, elev {g.min():.1f}..{g.max():.1f} m')
