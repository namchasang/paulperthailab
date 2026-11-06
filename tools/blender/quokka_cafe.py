import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from kit import *
from PIL import Image, ImageDraw, ImageFont
OUT = os.path.join(os.path.dirname(__file__), "out"); os.makedirs(OUT, exist_ok=True)
reset()

def sign_img(text, w=192, h=48, bg=(46, 120, 126), fg=(250, 236, 200)):
    im = Image.new("RGB", (w, h), bg); d = ImageDraw.Draw(im)
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
    tw = d.textlength(text, font=f); d.text(((w - tw) / 2, 9), text, font=f, fill=fg)
    d.rectangle([2, 2, w - 3, h - 3], outline=fg, width=2)
    return np.array(im.resize((w // 2, h // 2), Image.NEAREST).resize((w, h), Image.NEAREST))

# materials (pixel skins, 32 px per metre)
deck = mat_tex("deck", tex_planks(64, 64, (156, 98, 56), 6, horiz=False))
wall = mat_tex("weatherboard", tex_planks(64, 64, (238, 230, 210), 5))
trim = mat_color("trim", (46, 120, 126))
tin = mat_tex("tin", tex_tin(64, 64, (204, 210, 214)), rough=0.45)
awn = mat_tex("awning", tex_stripes(64, 32, (246, 242, 230), (232, 112, 84), 8))
grass = mat_tex("grass", tex_grass())
sand = mat_tex("sand", tex_sand())
path = mat_tex("path", tex_sand(64, 64, (214, 196, 160)))
wood = mat_color("wood", (120, 78, 46))
umb = mat_tex("umbrella", tex_stripes(64, 32, (250, 246, 236), (46, 140, 150), 8))
glass = mat_color("glass", (120, 170, 190), rough=0.15)
cream = mat_color("cream", (246, 238, 220))
cup = mat_color("cupred", (214, 80, 60))
chalk = mat_color("chalk", (40, 46, 44))
pot = mat_color("pot", (190, 110, 70))

# ground
box("grass", (30, 22, 0.2), (0, 0, -0.1), grass)
box("sandpath", (3, 22, 0.05), (6.5, 0, 0.02), path)
box("beach", (30, 4, 0.2), (0, 10.5, -0.05), sand)
box("sea", (40, 20, 0.1), (0, 22.5, -0.2), mat_color("sea", (60, 170, 190), 0.2))
box("jetty", (2.2, 14, 0.25), (-8, 18, 0.1), deck)

# deck
box("deck", (10, 7, 0.3), (0, 0, 0.15), deck, bevel=0.03)
for x in (-4.8, 4.8):
    for y in (-3.3, 3.3):
        box("post", (0.2, 0.2, 0.6), (x, y, -0.05), wood)
box("step", (2, 0.8, 0.15), (0, -3.9, 0.07), deck)

# café building at the back of the deck
bw, bd, bh = 7, 3, 2.8
box("cafe", (bw, bd, bh), (0, 1.8, 0.3 + bh / 2), wall)
box("base_trim", (bw + 0.05, bd + 0.05, 0.12), (0, 1.8, 0.36), trim)
prism_roof("roof", bw, bd, 1.3, (0, 1.8, 0.3 + bh), tin, overhang=0.35)
# service window + counter
box("window", (3.2, 0.06, 1.1), (-0.8, 0.28, 2.0), glass)
box("winframe", (3.4, 0.08, 0.12), (-0.8, 0.27, 2.6), trim)
box("counter", (3.6, 0.7, 1.05), (-0.8, -0.05, 0.82), wood, bevel=0.03)
box("countertop", (3.8, 0.85, 0.08), (-0.8, -0.05, 1.38), cream)
# door
box("door", (1.0, 0.06, 2.1), (2.4, 0.28, 1.35), trim)
# awning over window
box("awning", (4.0, 1.3, 0.06), (-0.8, -0.35, 2.85), awn, rot=(-18, 0, 0))
# sign board on the roof
s = plane_text("sign", sign_img("KIP'S CAFE"), 3.6, 0.9, (-0.8, 0.25, 3.6), rot=(90, 0, 0))
box("signback", (3.8, 0.08, 1.05), (-0.8, 0.31, 3.6), trim)
# coffee machine + cups on the counter
box("machine", (0.7, 0.45, 0.5), (-1.8, 0.0, 1.67), mat_color("steel", (180, 186, 190), 0.3, 0.8))
for i, x in enumerate((-0.2, 0.05, 0.3)):
    cyl(f"cup{i}", 0.07, 0.14, (x, -0.2, 1.49), cup, verts=10)
# chalk menu board
box("menu", (0.9, 0.05, 1.2), (3.6, -2.2, 0.95), chalk, rot=(0, 0, 20))
box("menuframe", (1.0, 0.07, 0.08), (3.6, -2.2, 1.6), wood, rot=(0, 0, 20))

# tables with umbrellas
for i, (x, y) in enumerate([(-3.0, -1.6), (0.6, -2.1), (3.0, -0.4)]):
    cyl(f"tbl{i}", 0.55, 0.06, (x, y, 1.08), cream, verts=16)
    cyl(f"tleg{i}", 0.05, 0.75, (x, y, 0.68), wood, verts=8)
    cyl(f"pole{i}", 0.03, 1.6, (x, y, 1.9), wood, verts=6)
    cyl(f"umb{i}", 1.0, 0.45, (x, y, 2.75), umb, verts=8, r2=0.05)
    for a in range(3):
        ang = math.radians(a * 120 + 30)
        box(f"stool{i}{a}", (0.38, 0.38, 0.45), (x + math.cos(ang) * 0.85, y + math.sin(ang) * 0.85, 0.53), wood, bevel=0.02)

# railing on the front edge
for x in [i * 1.0 - 4.5 for i in range(10)]:
    if abs(x) < 1.2: continue
    box("rail_post", (0.1, 0.1, 0.8), (x, -3.4, 0.7), wood)
box("rail_l", (3.4, 0.1, 0.08), (-3.0, -3.4, 1.08), wood)
box("rail_r", (3.4, 0.1, 0.08), (3.0, -3.4, 1.08), wood)
# planter boxes (no plant models: plants in the game are sprites)
for x in (-4.3, 4.3):
    box("planter", (0.9, 0.5, 0.45), (x, -3.0, 0.53), pot)

world((150, 200, 240), 0.8)
sun((52, 0, 30), 4.2)
camera((14, -16, 10), (0, 1.5, 1.2), lens=38)
render(os.path.join(OUT, "quokka-cafe.png"))
export_glb(os.path.join(OUT, "quokka-cafe.glb"))
print("done")
