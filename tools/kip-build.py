#!/usr/bin/env python3
"""Build Kip the Barista from its one source file.

Source:  kip-barista/src/game.html   (the full game; edit only this file)
Output:  kip-barista/index.html      DEMO   (chapters 1-2, DEMO tag)  -> /kip-barista/
         kip-barista/preview.html    FULL   (all chapters, PREVIEW tag) -> /kip-barista/preview.html

The source is the same file Claude publishes as the private Claude link, so it
has no <!doctype>/<head>; this script wraps it for GitHub Pages.

If someone edited index.html or preview.html by hand since the last build, the
script stops so the edit is not lost. Move the edit into src/game.html, then
run again with --force.
"""
import hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'kip-barista')
SRC = os.path.join(DIR, 'src', 'game.html')
STAMP = os.path.join(DIR, 'src', '.build.json')

HEAD = '''<!doctype html>
<html>
<head>
<meta charset=utf8>
<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>
</head>
<body>
'''
TAG = '''<title>Kip the Barista {label}</title>
<meta name="description" content="{desc}">
<style>#demoTag{{position:fixed;z-index:9999;top:calc(env(safe-area-inset-top,0px) + 6px);left:50%;transform:translateX(-50%);font:700 11px/1 'Kanit',sans-serif;letter-spacing:.08em;background:#E8B24A;color:#1B2722;padding:5px 9px;border-radius:999px;text-decoration:none;box-shadow:0 1px 4px rgba(0,0,0,.25)}}</style>
<a id="demoTag" href="../#projects" title="Paul Perth AI Lab">{tag}</a>
<script>setInterval(function(){{var t=document.getElementById('demoTag'),o=document.getElementById('ovSplash');if(t&&o)t.style.display=o.hidden?'none':''}},300)</script>
<script>window.KIP_DEMO={demo};</script>
'''
OUT = {
  'index.html':   dict(label='Demo', tag='DEMO', demo='true',
                       desc="Kip the Barista demo: take orders and make coffee at Kip's café on Rottnest Island."),
  'preview.html': dict(label='Preview', tag='PREVIEW', demo='false',
                       desc="Kip the Barista preview: the full game for testing before release."),
}

def sha(t): return hashlib.sha256(t.encode()).hexdigest()[:16]

def main():
    force = '--force' in sys.argv
    src = open(SRC, encoding='utf8').read()
    body = src.split('<title>', 1)
    body = src[src.index('</title>') + len('</title>'):] if len(body) > 1 else src
    old = json.load(open(STAMP)) if os.path.exists(STAMP) else {}
    stamp = {}
    for name, o in OUT.items():
        path = os.path.join(DIR, name)
        if os.path.exists(path) and old.get(name) and not force:
            cur = sha(open(path, encoding='utf8').read())
            if cur != old[name]:
                sys.exit(f'STOP: {name} was edited by hand since the last build. '
                         f'Move that change into kip-barista/src/game.html, then run with --force.')
        html = HEAD + TAG.format(**o) + body.lstrip('\n') + '\n</body></html>\n'
        open(path, 'w', encoding='utf8').write(html)
        stamp[name] = sha(html)
        print(f'built {name}  ({o["tag"]}, {len(html)//1024} KB)')
    stamp['src'] = sha(src)
    json.dump(stamp, open(STAMP, 'w'), indent=1)

if __name__ == '__main__':
    main()
