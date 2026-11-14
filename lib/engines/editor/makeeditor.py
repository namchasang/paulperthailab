#!/usr/bin/env python3
"""Build the Map Editor page: python3 tools/makeeditor.py editor/index.html
   Player version (no ground/life/sky, no nature sliders, roads on X/Z only, starts on the real Rottnest): python3 tools/makeeditor.py editor/player.html --player --start editor/rottnest-start.json"""
import sys
engines=['terrain/terrain.js','water-sea/water-sea.js','water-sea/waterlife.js','sky/sky.js','foliage/foliage.js','props/props.js','road/road.js','building/building.js','life/life.js','vehicle/vehicle.js']
eng=''.join('<script>'+open(p).read()+'</script>\n' for p in engines)
html='''<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>Island Builder · Map Editor</title>
<style>
:root{--ink:#1e2a3a;--card:#fffaf0;--edge:#e6d9bf;--go:#3ccf6a;--acc:#ffb83a}
*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#9fd3ea;font-family:system-ui,"Noto Sans Thai",sans-serif;color:var(--ink);-webkit-user-select:none;user-select:none}
#view canvas{display:block;touch-action:none}
button{font:inherit;cursor:pointer;border:0}
#top{position:fixed;left:10px;right:10px;top:10px;display:flex;gap:8px;align-items:center;pointer-events:none}
#hud{display:flex;gap:6px;flex-wrap:wrap;pointer-events:auto}#hud span{background:rgba(255,250,240,.94);border-radius:999px;padding:7px 12px;font-weight:700;font-size:14px;box-shadow:0 3px 0 rgba(0,0,0,.15)}#hud .nm{background:var(--ink);color:#fff}
#top .sp{flex:1}.rb{pointer-events:auto;width:46px;height:46px;border-radius:50%;background:var(--card);font-size:22px;box-shadow:0 4px 0 rgba(0,0,0,.18);display:grid;place-items:center}.rb:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.18)}
#bar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:6px;background:rgba(30,42,58,.9);padding:7px;border-radius:22px;box-shadow:0 6px 18px rgba(0,0,0,.25);max-width:calc(100vw - 16px);overflow-x:auto}
.cat{display:flex;flex-direction:column;align-items:center;gap:2px;width:68px;padding:6px 0;border-radius:16px;background:transparent;color:#fff}.cat .ic{font-size:26px;line-height:1}.cat .nm{font-size:11px;font-weight:700;opacity:.9}
.cat.on{background:var(--acc);color:var(--ink)}.cat[data-k=bulldoze].on{background:#ff6a5a;color:#fff}
#tray{position:fixed;left:50%;bottom:94px;transform:translate(-50%,20px);width:min(980px,calc(100vw - 16px));max-height:min(250px,40vh);overflow:auto;background:rgba(255,250,240,.97);border-radius:20px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:.18s}
#tray.open{opacity:1;pointer-events:auto;transform:translate(-50%,0)}#tray.open.peek{opacity:0;pointer-events:none;transform:translate(-50%,40px)}
.grp>b{display:block;font-size:12px;margin:2px 4px 4px;opacity:.7}.cards{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px}
.card{flex:0 0 auto;width:92px;border-radius:14px;background:#fff;border:2px solid var(--edge);padding:4px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--ink);box-shadow:0 3px 0 var(--edge)}
.card img{width:80px;height:80px;object-fit:contain;background:linear-gradient(#e8f4fb,#f8f2e2);border-radius:10px}.card i{font-style:normal;font-size:40px;line-height:80px;height:80px}.card span{font-size:12px;font-weight:700;text-align:center;line-height:1.15}
.card.on{border-color:var(--go);box-shadow:0 3px 0 var(--go);background:#eefcf2}.card.stepper i{font-size:30px;line-height:44px;height:44px}.card.stepper div{display:flex;gap:6px;align-items:center}
.opts{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-top:4px;font-size:13px;font-weight:600}.opts input[type=range]{width:110px;vertical-align:middle}.opts input:not([type]){width:130px;border:2px solid var(--edge);border-radius:8px;padding:4px 6px;font:inherit}
.chips{display:flex;gap:6px;margin-bottom:6px}.chip{padding:5px 12px;border-radius:999px;background:#eef3f7;font-weight:700;font-size:13px}.chip.on{background:var(--ink);color:#fff}.cash{background:#ffd84a!important;color:#3a2a00}.card .price{font-style:normal;font-weight:800;font-size:12px;color:#1e2a3a}.card .inc{font-style:normal;font-size:11px;font-weight:700;color:#23964a}
.card .lot{font-style:normal;font-size:10px;font-weight:700;color:#7a6a58;display:block}.chips .cash{margin-left:auto;border-radius:999px;padding:5px 12px;font-weight:800;font-size:13px}
.coin{position:fixed;transform:translate(-50%,-50%);font-weight:900;font-size:20px;text-shadow:0 2px 0 rgba(0,0,0,.35),0 0 6px rgba(0,0,0,.25);pointer-events:none;animation:coin 1.6s ease-out forwards;z-index:6}@keyframes coin{0%{opacity:0;transform:translate(-50%,-30%) scale(.7)}15%{opacity:1;transform:translate(-50%,-60%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-260%) scale(1)}}
#bubble .up{width:auto;padding:0 8px;background:#3ccf6a;color:#fff;font-weight:800}#bubble .up small{font-size:11px;margin-left:3px}#bubble b small{font-weight:700;color:#23964a}
.mini{background:var(--ink);color:#fff;border-radius:10px;padding:4px 10px;font-weight:800}
#bubble{position:fixed;transform:translate(-50%,-110%);background:var(--card);border-radius:16px;padding:6px;display:none;gap:4px;align-items:center;box-shadow:0 6px 16px rgba(0,0,0,.25);white-space:nowrap}
#bubble.on{display:flex}#bubble b{padding:0 6px;font-size:13px}#bubble button{width:38px;height:38px;border-radius:12px;background:#eef3f7;font-size:18px}#bubble button[data-a=del]{background:#ffe2de}
#confirm{position:fixed;transform:translate(-50%,-115%);background:var(--card);border-radius:18px;padding:6px 6px 6px 12px;display:none;gap:6px;align-items:center;box-shadow:0 8px 20px rgba(0,0,0,.3);white-space:nowrap;z-index:5}#confirm.on{display:flex}#confirm span{font-weight:800;font-size:14px;margin-right:4px}
#confirm button{width:48px;height:48px;border-radius:14px;font-size:24px;font-weight:900;background:#eef3f7}#confirm .ok{background:var(--go);color:#fff;box-shadow:0 3px 0 #23964a}#confirm .no{background:#ff6a5a;color:#fff;box-shadow:0 3px 0 #c8443a}
.sep{width:2px;background:rgba(255,255,255,.25);margin:6px 2px;border-radius:2px}.cat.ur{background:rgba(255,255,255,.12)}.cat.ur.off{opacity:.35}
#toast{position:fixed;left:50%;top:70px;transform:translate(-50%,-10px);background:var(--ink);color:#fff;padding:8px 16px;border-radius:999px;font-weight:700;font-size:14px;opacity:0;transition:.2s;pointer-events:none}#toast.on{opacity:1;transform:translate(-50%,0)}
#menu{position:fixed;inset:0;background:rgba(10,16,24,.45);display:none;align-items:center;justify-content:center}#menu.on{display:flex}
#menu .box{width:min(560px,calc(100vw - 20px));max-height:80vh;overflow:auto;background:var(--card);border-radius:20px;padding:14px}#menu .tabs{display:flex;gap:6px;margin-bottom:10px}#menu .tabs button{padding:8px 14px;border-radius:12px;background:#eef3f7;font-weight:700}#menu .tabs button.on{background:var(--acc)}
#menu .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px 8px;font-size:13px;margin-bottom:8px}#menu textarea{width:100%;height:80px;font-size:11px;border-radius:10px;border:2px solid var(--edge)}#menu .row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}#menu .row button{padding:9px 12px;border-radius:12px;background:var(--ink);color:#fff;font-weight:700}
#menu input:not([type]){border:2px solid var(--edge);border-radius:8px;padding:5px;font:inherit}.hint{font-size:12px;opacity:.7}
@media(max-width:640px){.cat{width:54px}.cat .ic{font-size:22px}.card{width:78px}.card img{width:66px;height:66px}.card i{font-size:32px;line-height:66px;height:66px}#tray{bottom:84px}#hud span{padding:5px 9px;font-size:12px}}
</style></head><body>
<div id="view"></div>
<div id="top"><div id="hud"></div><div class="sp"></div><button class="rb" id="daynight" title="กลางวัน/กลางคืน">☀️</button><button class="rb" id="menuBtn" title="เมนู">⚙️</button></div>
<div id="tray"></div><div id="bar"></div><div id="bubble"></div><div id="confirm"></div><div id="toast"></div>
<div id="menu"><div class="box"><div class="tabs"><button data-t="file">ไฟล์</button><button data-t="layers">Layers</button><button data-t="help">วิธีใช้</button><span style="flex:1"></span><button id="menuX">✕</button></div><div id="menuBody"></div></div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
@@ENG@@<script>@@ED@@</script></body></html>'''
player='--player' in sys.argv
demo=None
if '--demo' in sys.argv:
    demo=sys.argv[sys.argv.index('--demo')+1];player=True
if demo:html=html.replace('<title>Island Builder · Map Editor','<title>Island Builder · Rottnest (demo island)',1).replace('@@ENG@@','<script>window.IB_DEMO='+open(demo).read().strip()+';</script>\n@@ENG@@',1)
start=sys.argv[sys.argv.index('--start')+1] if '--start' in sys.argv else None
if start:html=html.replace('@@ENG@@','<script>window.IB_START='+open(start).read().strip()+';</script>\n@@ENG@@',1)
if player:html=html.replace('<title>Island Builder · Map Editor','<title>Island Builder · Rottnest (player)',1).replace('@@ENG@@','<script>window.IB_PLAYER=true;</script>\n@@ENG@@',1)
open([a for i,a in enumerate(sys.argv[1:],1) if not a.startswith('--') and sys.argv[i-1] not in('--demo','--start')][0],'w').write(html.replace('@@ENG@@',eng,1).replace('@@ED@@',open('editor/editor.js').read()))
