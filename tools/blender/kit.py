# Small Blender helper kit: boxes with per-metre UVs, pixel textures, lights, camera, render, glTF export.
import bpy, bmesh, math, addon_utils
import numpy as np
from mathutils import Vector

addon_utils.enable("cycles", default_set=True)
addon_utils.enable("io_scene_gltf2", default_set=True)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable("cycles", default_set=True)
    addon_utils.enable("io_scene_gltf2", default_set=True)

_mats = {}

def img_from_array(name, arr):
    """arr: HxWx3 uint8 (top row first). Returns a packed bpy image."""
    h, w = arr.shape[:2]
    im = bpy.data.images.new(name, w, h, alpha=False)
    a = np.ones((h, w, 4), np.float32)
    a[..., :3] = arr[::-1].astype(np.float32) / 255.0
    im.pixels.foreach_set(a.ravel())
    im.pack()
    return im

def mat_color(name, rgb, rough=0.8, metal=0.0, emit=0.0):
    if name in _mats: return _mats[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    c = [x / 255 for x in rgb] + [1]
    b.inputs["Base Color"].default_value = c
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = c
        b.inputs["Emission Strength"].default_value = emit
    _mats[name] = m; return m

def mat_tex(name, arr, rough=0.85, px_per_m=32):
    """Pixel texture, nearest-neighbour, tiles every (W/px_per_m) metres via the UVs below."""
    if name in _mats: return _mats[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img_from_array(name, arr); t.interpolation = "Closest"
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    m["tile_m"] = arr.shape[1] / px_per_m
    _mats[name] = m; return m

def box_uv(obj, tile_m=1.0):
    """Cube-project UVs in world metres: 1 UV unit = tile_m metres."""
    me = obj.data; bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv.verify()
    mw = obj.matrix_world
    for f in bm.faces:
        n = (mw.to_3x3() @ f.normal); ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            p = mw @ l.vert.co
            if ax == 0: u, v = p.y * (1 if n[0] > 0 else -1), p.z
            elif ax == 1: u, v = p.x * (-1 if n[1] > 0 else 1), p.z
            else: u, v = p.x, p.y
            l[uv].uv = (u / tile_m, v / tile_m)
    bm.to_mesh(me); bm.free()

def box(name, size, loc, mat, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=[math.radians(r) for r in rot])
    o = bpy.context.active_object; o.name = name
    o.scale = size; bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel:
        md = o.modifiers.new("bev", "BEVEL"); md.width = bevel; md.segments = 1
        bpy.ops.object.modifier_apply(modifier="bev")
    o.data.materials.append(mat)
    box_uv(o, mat.get("tile_m", 1.0))
    return o

def cyl(name, r, h, loc, mat, verts=12, rot=(0, 0, 0), r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=[math.radians(x) for x in rot])
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=[math.radians(x) for x in rot])
    o = bpy.context.active_object; o.name = name; o.data.materials.append(mat)
    box_uv(o, mat.get("tile_m", 1.0)); return o

def prism_roof(name, w, d, h, loc, mat, overhang=0.25):
    """Gable roof along X: width w (x), depth d (y), ridge height h."""
    W, D = w / 2 + overhang, d / 2 + overhang
    verts = [(-W, -D, 0), (W, -D, 0), (W, D, 0), (-W, D, 0), (-W, 0, h), (W, 0, h)]
    faces = [(0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.location = loc; bpy.context.view_layer.update()
    o.data.materials.append(mat); box_uv(o, mat.get("tile_m", 1.0))
    return o

def plane_text(name, arr, w, h, loc, rot=(90, 0, 0)):
    """A sign: image on a thin board, w x h metres."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img_from_array(name, arr); t.interpolation = "Closest"
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.7
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=[math.radians(x) for x in rot])
    o = bpy.context.active_object; o.name = name; o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(m); return o

def world(sky=(170, 205, 235), strength=1.0):
    w = bpy.data.worlds.new("World"); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = [x / 255 for x in sky] + [1]; bg.inputs[1].default_value = strength

def sun(rot=(50, 0, 35), energy=4.0, color=(255, 244, 225), angle=2.0):
    d = bpy.data.lights.new("Sun", "SUN"); d.energy = energy; d.color = [c / 255 for c in color]
    d.angle = math.radians(angle)
    o = bpy.data.objects.new("Sun", d); bpy.context.collection.objects.link(o)
    o.rotation_euler = [math.radians(r) for r in rot]; return o

def camera(loc, target, lens=35, ortho=None):
    c = bpy.data.cameras.new("Cam"); c.lens = lens
    if ortho: c.type = "ORTHO"; c.ortho_scale = ortho
    o = bpy.data.objects.new("Cam", c); bpy.context.collection.objects.link(o)
    o.location = loc
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = o; return o

def render(path, w=1200, h=900, samples=64):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = samples
    try: sc.cycles.use_denoising = True
    except Exception: pass
    sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

def export_glb(path):
    for o in bpy.context.scene.objects: o.select_set(o.type == "MESH")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True)

# ---------- pixel texture painters (32 px per metre) ----------
rng = np.random.default_rng(7)

def jitter(base, n, amt=10):
    a = np.array(base, np.int16)[None, None, :] + rng.integers(-amt, amt + 1, (n[0], n[1], 1))
    return np.clip(a, 0, 255).astype(np.uint8)

def tex_planks(w=64, h=64, base=(150, 96, 58), plank=8, horiz=True):
    a = jitter(base, (h, w), 8)
    for i in range(0, h if horiz else w, plank):
        shade = rng.integers(-18, 18)
        sl = (slice(i, i + plank), slice(None)) if horiz else (slice(None), slice(i, i + plank))
        a[sl] = np.clip(a[sl].astype(np.int16) + shade, 0, 255)
        if horiz: a[i, :] = (np.array(base) * 0.55).astype(np.uint8)
        else: a[:, i] = (np.array(base) * 0.55).astype(np.uint8)
    return a

def tex_tin(w=64, h=64, base=(198, 204, 208)):
    a = jitter(base, (h, w), 5)
    for x in range(0, w, 4): a[:, x] = (np.array(base) * 0.8).astype(np.uint8)
    return a

def tex_stripes(w=64, h=32, c1=(236, 236, 228), c2=(46, 140, 150), sw=8):
    a = np.zeros((h, w, 3), np.uint8)
    for x in range(w): a[:, x] = c1 if (x // sw) % 2 == 0 else c2
    return a

def tex_bricks(w=64, h=64, base=(170, 82, 60), mortar=(214, 200, 182)):
    a = np.zeros((h, w, 3), np.uint8); a[:] = mortar
    bh, bw = 4, 8
    for r in range(0, h, bh):
        off = (r // bh % 2) * (bw // 2)
        for c in range(-bw, w, bw):
            x0, x1 = max(0, c + off), min(w, c + off + bw - 1)
            if x1 > x0:
                a[r:r + bh - 1, x0:x1] = jitter(base, (bh - 1, x1 - x0), 14)
    return a

def tex_grass(w=64, h=64, base=(92, 168, 66)):
    a = jitter(base, (h, w), 14)
    for _ in range(90):
        x, y = rng.integers(0, w), rng.integers(0, h); a[y, x] = (120, 196, 84)
    return a

def tex_sand(w=64, h=64, base=(222, 198, 150)):
    return jitter(base, (h, w), 10)

def tex_paving(w=64, h=64, base=(186, 182, 172)):
    a = jitter(base, (h, w), 6)
    for i in range(0, w, 16): a[:, i] = (150, 146, 138); a[i, :] = (150, 146, 138)
    return a

def tex_asphalt(w=64, h=64, base=(70, 72, 76)):
    return jitter(base, (h, w), 7)

def strip(name, pts, width, z, mat, offset=0.0, tile_m=None):
    """A flat ribbon along a polyline of (x, y) points, width in metres, shifted sideways by offset."""
    import numpy as _np
    P = _np.array(pts, float); n = len(P)
    T = _np.gradient(P, axis=0); T /= _np.linalg.norm(T, axis=1)[:, None]
    N = _np.stack([-T[:, 1], T[:, 0]], 1)
    L = P + N * (offset - width / 2); R = P + N * (offset + width / 2)
    verts = [(x, y, z) for x, y in L] + [(x, y, z) for x, y in R]
    faces = [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    tm = tile_m or mat.get("tile_m", 1.0)
    uv = me.uv_layers.new(); d = _np.concatenate([[0], _np.cumsum(_np.linalg.norm(_np.diff(P, axis=0), axis=1))])
    for f in me.polygons:
        for li in f.loop_indices:
            vi = me.loops[li].vertex_index; i = vi % n; side = vi // n
            uv.data[li].uv = (side * width / tm, d[i] / tm)
    return o

def dashes(name, pts, z, mat, dash=3.0, gap=6.0, width=0.18, offset=0.0):
    import numpy as _np
    P = _np.array(pts, float); seg = _np.linalg.norm(_np.diff(P, axis=0), axis=1)
    d = _np.concatenate([[0], _np.cumsum(seg)]); out = []; s = 0.0
    while s + dash < d[-1]:
        a = [ _np.interp(t, d, P[:, 0]) for t in _np.linspace(s, s + dash, 4)]
        b = [ _np.interp(t, d, P[:, 1]) for t in _np.linspace(s, s + dash, 4)]
        out.append(strip(f"{name}{len(out)}", list(zip(a, b)), width, z, mat, offset)); s += dash + gap
    return out

def sky_world(top=(70, 120, 200), horizon=(250, 190, 140), strength=1.0):
    w = bpy.data.worlds.new("World"); bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes["Background"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0]); nt.links.new(sep.outputs["Z"], ramp.inputs[0])
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = [c / 255 for c in horizon] + [1]
    ramp.color_ramp.elements[1].position = 0.45; ramp.color_ramp.elements[1].color = [c / 255 for c in top] + [1]
    nt.links.new(ramp.outputs["Color"], bg.inputs[0]); bg.inputs[1].default_value = strength
