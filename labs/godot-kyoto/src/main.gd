extends Node2D
# Kyoto canal prototype: the town is one pixel-art image exported from Pixel Lab, plus a depth
# image. Kip and the townsfolk are tiny sprites; a shader hides any sprite pixel that is behind
# the town at that spot, so they walk behind houses, trees and lamps correctly.

const DEPTH_SHADER := """
shader_type canvas_item;
uniform sampler2D depth_tex : filter_nearest;
uniform vec2 top_left;
uniform vec2 spr_size;
uniform float base_depth;
void fragment() {
	vec4 c = texture(TEXTURE, UV);
	ivec2 ts = textureSize(depth_tex, 0);
	ivec2 p = clamp(ivec2(floor(top_left + UV * spr_size)), ivec2(0), ts - ivec2(1));
	vec4 d = texelFetch(depth_tex, p, 0);
	float q = floor(d.r * 255.0 + 0.5) * 256.0 + floor(d.g * 255.0 + 0.5);
	float row = (1.0 - UV.y) * spr_size.y;
	if (q > 0.5 && q / 64.0 - 200.0 > base_depth + row + 0.8) { c.a = 0.0; }
	COLOR = c;
}
"""

const KIP := [
	"..o....o..",
	".oBo..oBo.",
	".oBBooBBo.",
	"oBBBBBBBBo",
	"oBeBBBBeBo",
	"oBBLLLLBBo",
	".oBLnnLBo.",
	"..oBBBBo..",
	".oBBLLBBo.",
	"oBBLLLLBBo",
	"oBBLLLLBBo",
	".oBBBBBBo.",
]
const FEET := ["..of..fo..", ".of....fo.", "..of..fo.."]
const KC := {"o": Color("3b2414"), "B": Color("a8774a"), "L": Color("dcb487"), "e": Color("1c1a26"), "n": Color("3b2414"), "f": Color("6b4426")}

var L: Dictionary
var depth_tex: ImageTexture
var shader: Shader
var kip := {}
var npcs: Array = []
var t := 0.0
var touch_start = null
var touch_vec := Vector2.ZERO
var cam: Camera2D
var night := false
var modulate_node: CanvasModulate
var hud: Label

func load_tex(path: String) -> ImageTexture:
	var img := Image.new()
	img.load_png_from_buffer(FileAccess.get_file_as_bytes(path))
	return ImageTexture.create_from_image(img)

func _ready() -> void:
	L = JSON.parse_string(FileAccess.get_file_as_string("res://assets/level.json"))
	var bg := Sprite2D.new()
	bg.texture = load_tex("res://assets/kyoto.dat")
	bg.centered = false
	add_child(bg)
	depth_tex = load_tex("res://assets/kyoto_depth.dat")
	shader = Shader.new()
	shader.code = DEPTH_SHADER
	# Kip
	kip = make_actor(kip_frames(), Vector2(30, 60))
	kip.speed = 18.0
	# townsfolk from the Pixel Lab movers
	var colors := [Color("e2608a"), Color("4a98d8"), Color("5cb050"), Color("2c4683"), Color("b52b39"), Color("d4a02a"), Color("e2e4e7"), Color("4a3020"), Color("1f949e")]
	for m in L.movers:
		if m.k != "walk" and m.k != "bike":
			continue
		var a := make_actor(person_frames(colors[int(m.c) % colors.size()], m.k == "bike"), Vector2(m.p[0][0], m.p[0][1]))
		a.path = m.p
		a.sp = float(m.sp)
		a.off = float(m.off)
		a.pp = bool(m.pp)
		npcs.append(a)
	modulate_node = CanvasModulate.new()
	add_child(modulate_node)
	cam = Camera2D.new()
	add_child(cam)
	var layer := CanvasLayer.new()
	add_child(layer)
	hud = Label.new()
	hud.text = "Kyoto canal - Godot 4 prototype\nWASD / arrows / drag to walk - N: night"
	hud.add_theme_font_size_override("font_size", 8)
	hud.add_theme_color_override("font_color", Color("fff6da"))
	hud.add_theme_color_override("font_outline_color", Color("1c1a26"))
	hud.add_theme_constant_override("outline_size", 2)
	hud.position = Vector2(4, 2)
	layer.add_child(hud)

func kip_frames() -> Array:
	var out := []
	for f in FEET:
		var rows: Array = KIP.duplicate()
		rows.append(f)
		out.append(tex_from_rows(rows, KC))
	return out

func person_frames(cloth: Color, bike: bool) -> Array:
	var out := []
	for k in 2:
		var rows := ["oooo", "ohho", "osso", "occo", "occo", "occo", "occo", "oddo" if k == 0 else "odod", "dood" if k == 0 else "oddo"]
		if bike:
			rows = ["..oooo..", "..ohho..", "..osso..", "..occo..", "..occo..", ".ommmmo.", "ommmmmmo", ".k....k.", "kk....kk"]
		out.append(tex_from_rows(rows, {"o": Color("1c1a26"), "h": Color("33221a"), "s": Color("e8b08a"), "c": cloth, "d": Color("2c4683"), "m": Color("a6acb8"), "k": Color("1c1a26")}))
	return out

func tex_from_rows(rows: Array, pal: Dictionary) -> ImageTexture:
	var w: int = rows[0].length()
	var img := Image.create(w, rows.size(), false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	for y in rows.size():
		for x in w:
			var ch: String = rows[y][x]
			if pal.has(ch):
				img.set_pixel(x, y, pal[ch])
	return ImageTexture.create_from_image(img)

func make_actor(frames: Array, at: Vector2) -> Dictionary:
	var s := Sprite2D.new()
	s.centered = false
	s.texture = frames[0]
	var mat := ShaderMaterial.new()
	mat.shader = shader
	mat.set_shader_parameter("depth_tex", depth_tex)
	s.material = mat
	add_child(s)
	return {"node": s, "frames": frames, "x": at.x, "y": at.y, "step": 0.0}

func cell(x: float, y: float) -> int:
	var i := int(floor(x - L.gx0))
	var j := int(floor(y - L.gy0))
	if i < 0 or j < 0 or i >= int(L.gw) or j >= int(L.gh):
		return -1
	return j * int(L.gw) + i

func walkable(x: float, y: float) -> bool:
	var c := cell(x, y)
	return c >= 0 and int(L.grid[c]) == 1

func ground_z(x: float, y: float) -> float:
	var c := cell(x, y)
	return float(L.gz[c]) if c >= 0 else 0.0

func place(a: Dictionary) -> void:
	var s: Sprite2D = a.node
	var z := ground_z(a.x, a.y)
	var sx := roundf(a.x - a.y + float(L.ox))
	var sy := roundf((a.x + a.y) / 2.0 - z + float(L.oy))
	var size: Vector2 = s.texture.get_size()
	var tl := Vector2(sx - floor(size.x / 2.0), sy - size.y + 1.0)
	s.position = tl
	s.z_index = int(a.x + a.y)
	var mat: ShaderMaterial = s.material
	mat.set_shader_parameter("top_left", tl)
	mat.set_shader_parameter("spr_size", size)
	mat.set_shader_parameter("base_depth", a.x + a.y + z)

func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventScreenTouch:
		touch_start = e.position if e.pressed else null
		if not e.pressed:
			touch_vec = Vector2.ZERO
	elif e is InputEventScreenDrag and touch_start != null:
		touch_vec = (e.position - touch_start)
	elif e is InputEventKey and e.pressed and e.keycode == KEY_N:
		night = !night
		modulate_node.color = Color(0.45, 0.5, 0.8) if night else Color(1, 1, 1)

func _process(dt: float) -> void:
	t += dt
	var d := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	for k in [[KEY_A, Vector2.LEFT], [KEY_D, Vector2.RIGHT], [KEY_W, Vector2.UP], [KEY_S, Vector2.DOWN]]:
		if Input.is_physical_key_pressed(k[0]):
			d += k[1]
	if touch_vec.length() > 8.0:
		d = touch_vec.normalized()
	if d.length() > 0.01:
		d = d.normalized()
		# screen direction -> world (iso 2:1): x = sy + sx/2, y = sy - sx/2
		var v: Vector2 = Vector2(d.y + d.x / 2.0, d.y - d.x / 2.0) * float(kip.speed) * dt
		if walkable(kip.x + v.x, kip.y):
			kip.x += v.x
		if walkable(kip.x, kip.y + v.y):
			kip.y += v.y
		kip.step += dt * 8.0
		kip.node.texture = kip.frames[1 + int(kip.step) % 2]
		kip.node.flip_h = d.x < 0
	else:
		kip.node.texture = kip.frames[0]
	place(kip)
	for a in npcs:
		var pos := along(a, t)
		a.x = pos.x
		a.y = pos.y
		a.node.texture = a.frames[int(t * 6.0 + a.off) % 2]
		place(a)
	var view: Vector2 = get_viewport_rect().size
	var want: Vector2 = kip.node.position
	var cp := Vector2.ZERO
	cp.x = float(L.w) / 2.0 if float(L.w) <= view.x else clampf(want.x, view.x / 2.0, float(L.w) - view.x / 2.0)
	cp.y = float(L.h) / 2.0 if float(L.h) <= view.y else clampf(want.y, view.y / 2.0, float(L.h) - view.y / 2.0)
	cam.position = cp.round()

func along(a: Dictionary, time: float) -> Vector2:
	var p: Array = a.path
	var total := 0.0
	for i in p.size() - 1:
		total += Vector2(p[i + 1][0], p[i + 1][1]).distance_to(Vector2(p[i][0], p[i][1]))
	var dist := fmod(a.off + a.sp * time, (2.0 * total) if a.pp else total)
	if dist > total:
		dist = 2.0 * total - dist
	for i in p.size() - 1:
		var A := Vector2(p[i][0], p[i][1])
		var Bv := Vector2(p[i + 1][0], p[i + 1][1])
		var l := A.distance_to(Bv)
		if dist <= l:
			a.node.flip_h = (Bv - A).x < 0
			return A.lerp(Bv, dist / max(l, 0.001)).round()
		dist -= l
	return Vector2(p[0][0], p[0][1])
