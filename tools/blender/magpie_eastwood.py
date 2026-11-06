import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from kit import *
from PIL import Image, ImageDraw, ImageFont
OUT = os.path.join(os.path.dirname(__file__), "out"); os.makedirs(OUT, exist_ok=True)
reset()
CJK = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"

def shop_sign(top, bottom, bg, fg, w=320, h=80):
    im = Image.new("RGB", (w, h), bg); d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(CJK, 34, index=0); f2 = ImageFont.truetype(CJK, 18, index=0)
    tw = d.textlength(top, font=f1); d.text(((w - tw) / 2, 2), top, font=f1, fill=fg)
    tw = d.textlength(bottom, font=f2); d.text(((w - tw) / 2, 50), bottom, font=f2, fill=fg)
    return np.array(im)

# palette: bright low-poly suburb
asphalt = mat_tex("asphalt", tex_asphalt(64, 64, (78, 80, 86)), 0.9)
foot = mat_tex("footpath", tex_paving(64, 64, (196, 192, 182)))
brick = mat_tex("brick", tex_bricks(64, 64, (178, 92, 66)))
brick2 = mat_tex("brick2", tex_bricks(64, 64, (204, 160, 110)))
white = mat_color("white", (244, 244, 238))
kerb = mat_color("kerb", (170, 168, 160))
glass = mat_color("shopglass", (150, 196, 214), 0.1)
red = mat_color("red", (200, 44, 40)); gold = mat_color("gold", (230, 180, 60), 0.4, 0.3)
teal = mat_color("teal", (40, 150, 150)); navy = mat_color("navy", (40, 60, 110))
pole = mat_color("pole", (70, 80, 70), 0.5, 0.5)
leaf = mat_color("leaf", (90, 160, 80)); bark = mat_color("bark", (110, 80, 56))
black = mat_color("black", (24, 24, 26), 0.5); bw = mat_color("magwhite", (240, 240, 240), 0.5)
grass = mat_tex("grass", tex_grass())

# roads: main street along x, side street along y, corner block in the +x/+y quarter
box("roadX", (40, 8, 0.1), (0, -6, 0), asphalt)
box("roadY", (8, 40, 0.1), (-6, 0, -0.012), asphalt)
box("foot", (26, 4, 0.18), (15, -0.0, 0.05), foot)
box("foot2", (4, 26, 0.18), (0, 15, 0.05), foot)
box("cornerpad", (4, 4, 0.18), (0, 0, 0.05), foot)
box("kerbX", (34, 0.25, 0.22), (15, -2.1, 0.06), kerb)
box("kerbY", (0.25, 34, 0.22), (-2.1, 15, 0.06), kerb)
box("lawn", (30, 30, 0.1), (17, 17, -0.03), grass)
box("farX", (40, 10, 0.18), (0, -15, 0.05), foot)
box("farY", (10, 40, 0.18), (-15, 0, 0.038), foot)
# zebra crossing across the side street
for i in range(7):
    box(f"zebra{i}", (0.5, 3.6, 0.11), (-9.2 + i * 1.05, -6, 0.06), white)
# lane line
for i in range(8):
    box(f"lane{i}", (2.4, 0.15, 0.11), (2 + i * 4.5, -6, 0.06), white)

def shop(name, x0, depth, width, h, wallmat, sign, awnmat):
    box(f"{name}_wall", (width, depth, h), (x0 + width / 2, 2.0 + depth / 2, h / 2 + 0.14), wallmat)
    box(f"{name}_roof", (width - 0.05, depth - 0.05, 0.06), (x0 + width / 2, 2.0 + depth / 2, h + 0.15), mat_color('roofgrey', (120, 122, 126), 0.8))
    box(f"{name}_parapet", (width + 0.1, 0.4, 0.5), (x0 + width / 2, 2.2, h + 0.39), wallmat)
    box(f"{name}_glass", (width - 1.0, 0.05, 2.0), (x0 + width / 2, 1.98, 1.3), glass)
    box(f"{name}_door", (1.0, 0.06, 2.2), (x0 + width - 1.0, 1.97, 1.25), navy)
    box(f"{name}_awning", (width, 1.5, 0.12), (x0 + width / 2, 1.25, 2.85), awnmat, rot=(-10, 0, 0))
    plane_text(f"{name}_sign", sign, width - 0.6, (width - 0.6) / 4, (x0 + width / 2, 1.9, 3.8), rot=(90, 0, 0))

shop("dumpling", 2.0, 8, 6.0, 4.4, brick, shop_sign("好味點心", "GOOD TASTE DUMPLINGS", (190, 30, 34), (250, 214, 90)), red)
shop("bakery", 8.2, 8, 5.2, 4.0, brick2, shop_sign("서울 빵집", "SEOUL BAKERY", (36, 120, 120), (250, 250, 240)), teal)
shop("tea", 13.6, 8, 5.6, 4.6, brick, shop_sign("茶 TEA HOUSE", "BUBBLE TEA · 珍珠奶茶", (250, 240, 220), (120, 60, 40)), mat_color("cream", (240, 226, 196)))
# red lanterns under the dumpling awning
for i, x in enumerate((3.2, 4.8, 6.4)):
    cyl(f"lantern{i}", 0.28, 0.45, (x, 0.75, 2.35), mat_color("lantern", (220, 40, 36), 0.5, emit=0.6), verts=10)
    cyl(f"tassel{i}", 0.04, 0.3, (x, 0.75, 1.98), gold, verts=6)

# street furniture
cyl("lamp", 0.08, 5.2, (1.2, 1.0, 2.7), pole, verts=10)
box("lamparm", (1.4, 0.12, 0.12), (1.8, 1.0, 5.25), pole)
box("lamphead", (0.6, 0.35, 0.2), (2.4, 1.0, 5.15), pole)
for i, x in enumerate((9, 10.2)):
    box(f"rack{i}", (0.08, 0.7, 0.8), (x, 0.4, 0.55), pole)
box("rackbar", (1.3, 0.08, 0.08), (9.6, 0.4, 0.95), pole)
box("bin", (0.55, 0.55, 0.95), (12.2, 0.4, 0.62), mat_color("bingreen", (40, 110, 60)), bevel=0.04)
box("binlid", (0.6, 0.6, 0.08), (12.2, 0.4, 1.12), mat_color("binred", (190, 40, 40)))
# a street tree (low poly)
cyl("trunk", 0.18, 2.6, (20.5, 0.8, 1.4), bark, verts=8)
for i, (dz, r) in enumerate([(3.0, 1.5), (3.9, 1.2), (4.6, 0.8)]):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r, location=(20.5, 0.8, dz))
    o = bpy.context.active_object; o.data.materials.append(leaf)

# an Australian magpie sitting on the lamp head (low poly)
def magpie(x, y, z):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.22, location=(x, y, z))
    b = bpy.context.active_object; b.scale = (1.5, 0.8, 0.85); b.data.materials.append(black)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.13, location=(x + 0.3, y, z + 0.12))
    bpy.context.active_object.data.materials.append(black)
    cyl("beak", 0.045, 0.2, (x + 0.48, y, z + 0.1), mat_color("beak", (200, 200, 196)), verts=6, rot=(0, 90, 0), r2=0.005)
    box("wingpatch", (0.32, 0.36, 0.1), (x - 0.02, y, z + 0.12), bw, rot=(0, -8, 0))
    box("nape", (0.12, 0.2, 0.08), (x + 0.2, y, z + 0.22), bw)
    box("tail", (0.35, 0.16, 0.05), (x - 0.42, y, z - 0.02), black, rot=(0, 18, 0))
    for dy in (-0.07, 0.07):
        cyl("leg", 0.018, 0.16, (x + 0.02, y + dy, z - 0.24), black, verts=5)
magpie(2.4, 1.0, 5.52)

world((150, 200, 240), 0.9)
sun((48, 0, 140), 4.3)
camera((-8, -13, 8.5), (8, 3, 2.2), lens=32)
render(os.path.join(OUT, "magpie-eastwood.png"))
export_glb(os.path.join(OUT, "magpie-eastwood.glb"))
print("done")
