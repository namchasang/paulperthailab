#!/usr/bin/env python3
"""Render Facebook post cards (1080x1350) for Paul Perth AI Lab.

  python3 tools/fb-cards.py posts.json out-dir/

posts.json = [{"key":"d01-am", "bg":"path/to/picture.jpg", "kicker":"DEV LOG",
               "title":"หัวข้อโพสต์", "sub":"บรรทัดรอง", "brand":"QUOKKA CAFE AND FRIENDS",
               "foot":"เล่นฟรี ลิงก์ในคอมเมนต์"}, ...]
Writes out-dir/<key>-1.jpg. Images under fb/ are served by GitHub Pages at
https://namchasang.github.io/paulperthailab/fb/... so Metricool can take them as media URLs
(wait for the Pages deploy to finish before creating posts, or Metricool says "Failed to normalize media").

Fonts: Kanit (Thai) + Pixelify Sans. Google Fonts is blocked in the build container, so the
script uses npm @fontsource packages:  npm pack @fontsource/kanit @fontsource/pixelify-sans
and untar them into FONTS (env var, default ./fonts).
Needs: pip install pillow playwright (Chromium is preinstalled in Claude's container).
"""
import base64, io, json, os, sys
from PIL import Image
from playwright.sync_api import sync_playwright

F = os.environ.get("FONTS", "fonts")
posts, out = json.load(open(sys.argv[1], encoding="utf-8")), sys.argv[2]
os.makedirs(out, exist_ok=True)


def durl(path):
    im = Image.open(path).convert("RGB")
    b = io.BytesIO(); im.save(b, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def ff(fam, w, pkg, file):
    return f"@font-face{{font-family:{fam};font-weight:{w};src:url(file://{os.path.abspath(F)}/{pkg}/files/{file})}}"


CSS = "".join([
    ff("Pix", 700, "fontsource-pixelify-sans-5.3.0", "pixelify-sans-latin-700-normal.woff2"),
    ff("Kan", 400, "fontsource-kanit-5.3.0", "kanit-latin-400-normal.woff2"),
    ff("Kan", 400, "fontsource-kanit-5.3.0", "kanit-thai-400-normal.woff2"),
    ff("Kan", 600, "fontsource-kanit-5.3.0", "kanit-latin-600-normal.woff2"),
    ff("Kan", 600, "fontsource-kanit-5.3.0", "kanit-thai-600-normal.woff2"),
]) + """
*{box-sizing:border-box;margin:0}body{background:#000}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;background:#1c120b;font-family:Kan;color:#fbf3e2}
.img{position:absolute;left:0;right:0;top:0;height:860px;background-size:cover;background-position:center}
.img::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,0) 22%,rgba(0,0,0,0) 70%,rgba(28,18,11,.95))}
.tag{position:absolute;left:48px;top:44px;z-index:2;display:flex;align-items:center;gap:14px;font:700 26px/1 Pix;letter-spacing:.06em}
.aw{width:80px;height:20px;border-radius:4px;background:repeating-linear-gradient(90deg,#d9483e 0 13px,#f6efe2 13px 26px)}
.panel{position:absolute;left:0;right:0;bottom:0;height:520px;padding:0 64px 56px;display:flex;flex-direction:column;justify-content:flex-end}
.k{font:700 28px/1 Pix;letter-spacing:.12em;color:#f6c86a}
.t{font-weight:600;font-size:82px;line-height:1.12;margin-top:18px}
.s{font-size:36px;line-height:1.35;margin-top:16px;color:rgba(251,243,226,.88)}
.f{display:flex;justify-content:space-between;margin-top:40px;padding-top:22px;border-top:3px solid #c9a35a;font-size:26px;color:rgba(251,243,226,.8)}
"""
cards = ""
for i, p in enumerate(posts):
    cards += f"""<div class="c" id="c{i}"><div class="img" style="background-image:url({durl(p['bg'])});background-position:{p.get('pos','center')}"></div>
<div class="tag"><div class="aw"></div>{p.get('brand','PAUL PERTH AI LAB')}</div>
<div class="panel"><div class="k">{p.get('kicker','')}</div><div class="t">{p['title']}</div><div class="s">{p.get('sub','')}</div>
<div class="f"><span>Paul Perth AI Lab</span><span>{p.get('foot','')}</span></div></div></div>"""
html = os.path.join(out, "_cards.html")
open(html, "w", encoding="utf-8").write(f'<html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{cards}</body></html>')
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1350})
    pg.goto("file://" + os.path.abspath(html)); pg.wait_for_timeout(1500)
    for i, p in enumerate(posts):
        pg.locator(f"#c{i}").screenshot(path=os.path.join(out, f"{p['key']}-1.jpg"), type="jpeg", quality=88)
    b.close()
os.remove(html)
print("rendered", len(posts), "cards into", out)
