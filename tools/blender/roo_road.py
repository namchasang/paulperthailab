import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from kit import *
from PIL import Image, ImageDraw
OUT = os.path.join(os.path.dirname(__file__), "out"); os.makedirs(OUT, exist_ok=True)
reset()

# --- flat low-poly outback palette (Roo Road look) ---
dirt = mat_color("reddirt", (184, 78, 36), 0.95)
dirt2 = mat_color("reddirt2", (160, 64, 30), 0.95)
road = mat_tex("asphalt", tex_asphalt(64, 64, (68, 70, 74)), rough=0.9)
white = mat_color("line", (242, 242, 236), 0.6)
yellow = mat_color("signyellow", (244, 190, 30), 0.5)
black = mat_color("black", (25, 25, 25), 0.6)
grey = mat_color("pole", (150, 150, 150), 0.4, 0.6)
mesa = mat_color("mesa", (186, 96, 58), 0.95)
mesa2 = mat_color("mesa2", (150, 70, 46), 0.95)
spin = mat_color("spinifex", (176, 168, 74), 0.95)
rock = mat_color("rock", (130, 70, 50), 0.9)
red = mat_color("uteRed", (206, 40, 34), 0.35)
glass = mat_color("glass", (40, 60, 70), 0.1)
tyre = mat_color("tyre", (30, 30, 30), 0.8)
chrome = mat_color("chrome", (200, 200, 200), 0.2, 1.0)

# ground and one continuous road that bends gently to the right
box("ground", (90, 140, 0.2), (0, 30, -0.1), dirt)
ROAD = [(0.0011 * (y + 25) ** 2, y) for y in [-25 + i * 2.5 for i in range(46)]]
strip("shoulderL", ROAD, 2.0, 0.015, dirt2, offset=-4.6)
strip("shoulderR", ROAD, 2.0, 0.015, dirt2, offset=4.6)
strip("road", ROAD, 7.4, 0.03, road)
strip("edgeL", ROAD, 0.15, 0.04, white, offset=-3.35)
strip("edgeR", ROAD, 0.15, 0.04, white, offset=3.35)
dashes("centre", ROAD, 0.04, white)
def road_x(y):
    import numpy as _np
    P = _np.array(ROAD); return float(_np.interp(y, P[:, 1], P[:, 0]))

# kangaroo warning sign (yellow diamond, black roo), drawn as a pixel sign
def roo_sign(n=96):
    im = Image.new("RGB", (n, n), (244, 190, 30)); d = ImageDraw.Draw(im)
    d.rectangle([3, 3, n - 4, n - 4], outline=(20, 20, 20), width=4)
    # simple leaping kangaroo silhouette
    d.ellipse([30, 34, 62, 58], fill=(20, 20, 20))           # body
    d.ellipse([56, 24, 68, 36], fill=(20, 20, 20))           # head
    d.polygon([(60, 26), (62, 16), (65, 26)], fill=(20, 20, 20))  # ear
    d.polygon([(32, 50), (10, 70), (14, 72), (38, 56)], fill=(20, 20, 20))  # tail
    d.polygon([(46, 54), (40, 74), (56, 76), (58, 72), (48, 70), (54, 56)], fill=(20, 20, 20))  # leg
    d.line([(58, 40), (66, 48)], fill=(20, 20, 20), width=3)  # arm
    return np.array(im.rotate(45, fillcolor=(196, 92, 46)))

SX = road_x(6.0) - 6.2
pole = cyl("signpole", 0.06, 2.6, (SX, 6.0, 1.3), grey, verts=8)
s = plane_text("roosign", roo_sign(), 1.3, 1.3, (SX, 5.94, 2.4), rot=(90, 0, 0))
box("signback", (0.95, 0.03, 0.95), (SX, 5.99, 2.4), yellow, rot=(0, 45, 0))

# a generic red ute (no real model or badge), driving away from the camera in the left lane
def ute(x, y, rot):
    c, sn = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    p = lambda dx, dy, dz: (x + dx * c - dy * sn, y + dx * sn + dy * c, dz)
    R = (0, 0, rot)
    box("ute_chassis", (1.9, 4.9, 0.55), p(0, 0, 0.72), red, rot=R, bevel=0.12)
    box("ute_bonnet", (1.85, 1.5, 0.22), p(0, 1.65, 1.08), red, rot=(-4, 0, rot), bevel=0.1)
    box("ute_cab", (1.75, 1.5, 0.72), p(0, 0.35, 1.38), red, rot=R, bevel=0.14)
    box("ute_wind", (1.55, 0.05, 0.58), p(0, 1.12, 1.42), glass, rot=(-28, 0, rot))
    box("ute_rear", (1.55, 0.05, 0.45), p(0, -0.42, 1.45), glass, rot=R)
    for side in (-1, 1):
        box("ute_sidewin", (0.05, 1.1, 0.42), p(side * 0.88, 0.35, 1.45), glass, rot=R)
        box("ute_trayside", (0.1, 2.0, 0.42), p(side * 0.9, -1.4, 1.2), red, rot=R, bevel=0.03)
    box("ute_trayfloor", (1.7, 2.0, 0.06), p(0, -1.4, 1.0), black, rot=R)
    box("ute_tailgate", (1.9, 0.1, 0.42), p(0, -2.42, 1.2), red, rot=R, bevel=0.03)
    box("ute_bumper", (2.0, 0.22, 0.25), p(0, -2.5, 0.58), chrome, rot=R)
    box("ute_bullbar", (1.95, 0.22, 0.45), p(0, 2.5, 0.75), chrome, rot=R)
    for dx in (-0.62, 0.62):
        box("ute_tail", (0.35, 0.05, 0.2), p(dx, -2.48, 1.15), mat_color("tail", (230, 40, 30), 0.3, emit=3.0), rot=R)
    for dx in (-0.97, 0.97):
        for dy in (-1.55, 1.55):
            cyl("tyre", 0.44, 0.34, p(dx, dy, 0.44), tyre, verts=16, rot=(0, 90, rot))
            cyl("hub", 0.2, 0.36, p(dx, dy, 0.44), chrome, verts=10, rot=(0, 90, rot))
uy = -9.0; ute(road_x(uy) - 1.8, uy, -2)

# mesas on the horizon
for i, (x, y, w, h) in enumerate([(-30, 70, 26, 9), (12, 85, 34, 12), (40, 64, 18, 7)]):
    cyl(f"mesa{i}", w / 2, h, (x, y, h / 2), mesa if i % 2 else mesa2, verts=9, r2=w / 2.6)
# spinifex clumps and rocks
for i in range(40):
    x = rng.uniform(-30, 30); y = rng.uniform(-15, 50)
    if abs(x - road_x(y)) < 7: continue
    cyl(f"spin{i}", rng.uniform(0.4, 0.9), rng.uniform(0.3, 0.6), (x, y, 0.2), spin, verts=7, r2=0.15)
for i in range(18):
    x = rng.uniform(-28, 28); y = rng.uniform(-12, 45)
    if abs(x - road_x(y)) < 7: continue
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=rng.uniform(0.3, 0.9), location=(x, y, 0.2))
    o = bpy.context.active_object; o.scale = (1, 1, 0.6); o.data.materials.append(rock)

sky_world((84, 130, 196), (250, 184, 128), 1.0)  # late-afternoon sky
sun((72, 0, -140), 4.5, (255, 210, 160))
camera((-1.6, -19.5, 3.0), (0.5, 10, 1.0), lens=32)
render(os.path.join(OUT, "roo-road.png"), 900, 1200)
export_glb(os.path.join(OUT, "roo-road.glb"))
print("done")
