#!/usr/bin/env python3
"""Build the Map Editor page: python3 tools/makeeditor.py editor/index.html"""
import sys
engines=['terrain/terrain.js','water-sea/water-sea.js','water-sea/waterlife.js','sky/sky.js','foliage/foliage.js','props/props.js','road/road.js','building/building.js','life/life.js']
eng=''.join('<script>'+open(p).read()+'</script>\n' for p in engines)
html='''<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><title>Map Editor (8 engines)</title>
<style>body{margin:0;overflow:hidden;background:#9fd3ea;font-family:system-ui,sans-serif;color:#fff}#view canvas{display:block;touch-action:none}
#ui{position:fixed;left:10px;top:10px;bottom:10px;width:290px;background:rgba(20,28,40,.88);border-radius:12px;padding:10px 12px;font-size:13px;overflow:auto;box-sizing:border-box}
#ui h1{font-size:15px;margin:0 0 6px;display:flex;justify-content:space-between;align-items:center}#tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
button{padding:6px 9px;border:0;border-radius:8px;background:#34495e;color:#fff;font:inherit;font-weight:600;cursor:pointer}button.on{background:#3e9a6c}#tabs button{font-size:12px}
label{display:block;margin:6px 0}input[type=range]{width:140px;vertical-align:middle}select,input:not([type]),textarea,input[type=number]{background:#1d2633;color:#fff;border:1px solid #47566a;border-radius:6px;padding:4px;font:inherit}
input[type=number]{width:48px}textarea{width:100%;height:70px;box-sizing:border-box;margin-top:6px;font-size:11px}.row{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 8px}.grid label{margin:3px 0;font-size:12px}
.hint{opacity:.7;font-size:12px;margin:6px 0}#st{position:fixed;right:10px;bottom:10px;background:rgba(20,28,40,.8);padding:6px 10px;border-radius:8px;font-size:12px;max-width:60vw}
#foot{margin-top:10px;display:flex;gap:6px}body.mini #ui{bottom:auto;height:auto}body.mini #ui>*:not(h1){display:none}
@media(max-width:700px){#ui{width:auto;right:10px;bottom:auto;max-height:46vh}}</style></head><body>
<div id="view"></div><div id="ui"><h1><span>Map Editor</span><span><button id="undo" title="Ctrl+Z">ย้อน</button> <button id="hide">ซ่อน</button></span></h1>
<div id="tabs"></div><div id="opts"></div><p class="hint">คลิกซ้าย = ใช้เครื่องมือ, คลิกขวาลาก = หมุนกล้อง, ล้อเมาส์ = ซูม, ปุ่มกลาง = เลื่อน. มือถือ: นิ้วเดียว = เครื่องมือ, สองนิ้ว = กล้อง. ทุกอย่างบันทึกเองในเครื่องนี้</p></div><div id="st">กำลังสร้างเกาะ...</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
%s<script>%s</script></body></html>'''
open(sys.argv[1],'w').write(html.replace('%s',eng,1).replace('<script>%s</script>','<script>'+open('editor/editor.js').read()+'</script>'))
