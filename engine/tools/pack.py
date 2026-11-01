#!/usr/bin/env python3
"""Paul Engine packer: builds the single-file editor and the sample game pages.
   python3 engine/tools/pack.py            -> engine/editor/index.html (+ engine/play/<sample>/index.html)
Scripts are inlined as <script data-pe="..."> so the editor can copy them into exported games."""
import os, re, json
HERE = os.path.dirname(os.path.abspath(__file__)); ENG = os.path.dirname(HERE); ROOT = os.path.dirname(ENG)
PPL = ['core/kit.js', 'models/fauna/kangaroo.js', 'models/fauna/magpie.js', 'models/vehicles/retro-hatch.js', 'models/vehicles/rrr-cars.js',
       'models/buildings/verandah-shop.js', 'models/props/fountain.js', 'models/props/freeway-sign.js', 'models/vehicles/jet-plane.js',
       'models/flora/aussie-flora.js', 'models/flora/lowpoly-garden.js', 'models/buildings/pxkit.js']
OWN = ['paul-engine.js', 'pe-assets.js', 'pe-hd.js', 'pe-shop.js', 'pe-samples.js']
def scripts():
    out = []
    for f in PPL: out.append(('lib/' + f, open(os.path.join(ROOT, 'lib', f), encoding='utf-8').read()))
    for f in OWN: out.append(('engine/' + f, open(os.path.join(ENG, f), encoding='utf-8').read()))
    return out
def inline(lst): return '\n'.join('<script data-pe="%s">\n%s\n</script>' % (n, c.replace('</script', '<\\/script')) for n, c in lst)
src = open(os.path.join(ENG, 'editor.src.html'), encoding='utf-8').read()
html = src.replace('<!--PE-SCRIPTS-->', inline(scripts()))
os.makedirs(os.path.join(ENG, 'editor'), exist_ok=True)
page = '<!doctype html>\n<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + html.split('<div id="app">')[0] + '</head><body>\n<div id="app">' + html.split('<div id="app">', 1)[1] + '\n</body></html>\n'
open(os.path.join(ENG, 'editor', 'index.html'), 'w', encoding='utf-8').write(page)
open(os.path.join(ENG, 'editor', 'artifact.html'), 'w', encoding='utf-8').write(html)
# sample games: tiny pages that load the shared scripts by path
rel = lambda n: '../../' + ('../' if False else '') + n
tags = '\n'.join('<script src="../../../%s"></script>' % n for n, _ in scripts())
for key, title in [('cafe', 'Quokka Jetty Cafe'), ('gas', 'KAZE Station'), ('thai', 'แซ่บอีหลี · Zap-ily')]:
    d = os.path.join(ENG, 'play', key); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(f'''<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{title} · Paul Engine</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mitr:wght@400;500&display=swap"><style>html,body{{margin:0;height:100%;background:#14121c}}#game{{position:fixed;inset:0}}</style></head><body><div id="game"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
{tags}
<script>PE.boot(PE.SAMPLES['{key}'].build(), document.getElementById('game'));</script></body></html>
''')
print('editor', len(page) // 1024, 'KB; artifact', len(html) // 1024, 'KB')
