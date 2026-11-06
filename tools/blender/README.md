# Blender sample assets (scripted)

Built with Blender 5.2 as a Python module (`pip install bpy`), no UI. Each script builds a scene, renders it with Cycles and exports a `.glb` into `out/`.

    python3 quokka_cafe.py      # Kip's café, pixel skins 32 px per metre (no plants: plants are sprites in the game)
    python3 roo_road.py         # outback road strip, generic red ute, kangaroo warning sign, mesas
    python3 magpie_eastwood.py  # Eastwood corner, three fictional shops (Chinese/Korean signs), a magpie on the lamp post

`kit.py` holds the helpers: boxes with per-metre UVs, pixel textures with nearest filtering, road ribbons from a list of points, lights, camera, render and glTF export.
Preview page for Paul: https://claude.ai/artifact/6FuqvH4iobSb5k6Zw3iEiT
