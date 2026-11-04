#!/usr/bin/env python3
"""Podcast Reel factory for the show in podcast/episodes.json.

  python3 tools/reel.py tts    ep04              text to paste into Google AI Studio (TTS)
  python3 tools/reel.py voice  ep04 voice.wav    tighten pauses -> episodes/ep04/voice.mp3 (+ length check)
  python3 tools/reel.py extend ep04 kling.mp4    make a Kling clip at least as long as the voice (forward + reverse)
  python3 tools/reel.py build  ep04 lipsync.mp4  subtitles + hook + badges + music -> episodes/ep04/reel.mp4
  python3 tools/reel.py qa     ep04              contact sheets: frames + mouth close-ups -> episodes/ep04/qa-*.png

Run from the podcast/ folder. Needs ffmpeg, Pillow, numpy and Playwright (node).
"""
import json, os, re, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, 'tools')
DATA = json.load(open(os.path.join(ROOT, 'episodes.json'), encoding='utf-8'))
MAX_LEN = 15.0          # Reel length we aim for (Kling clips: 5, 10 or 15 s)
GAP = 0.35              # longest pause kept between phrases


def ep(eid):
    for e in DATA['episodes']:
        if e['id'] == eid:
            return e
    sys.exit(f'no episode {eid} in episodes.json')


def out(eid, name=''):
    d = os.path.join(ROOT, 'episodes', eid)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, name)


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def duration(path):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path])
    return float(r.stdout.strip())


def speech_segments(path, noise='-40dB', min_sil=0.25):
    """[(start, end)] of speech, from ffmpeg silencedetect on the file's audio."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', f'silencedetect=noise={noise}:d={min_sil}', '-f', 'null', '-'],
                       capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    total = duration(path)
    sil = list(zip(starts, ends + [total] * (len(starts) - len(ends))))
    segs, t = [], 0.0
    for s, e in sil:
        if s - t > 0.05:
            segs.append((t, s))
        t = e
    if total - t > 0.05:
        segs.append((t, total))
    return [(a, b) for a, b in segs if b - a >= 0.2]   # drop clicks and breath noise


def plain(line):
    return line.replace('**', '')


def tts_text(e):
    script = ' '.join(plain(l) for l in e['lines'])
    script = re.sub(r'(\S+?) ?ๆ ?', lambda m: m.group(1) * 2, script)   # TTS voices misread "ๆ"
    return script


# ---------------------------------------------------------------- tts
def cmd_tts(eid):
    e = ep(eid)
    v = DATA['voice']
    txt = f"{v['style']}\n{tts_text(e)}\n"
    open(out(eid, 'tts.txt'), 'w', encoding='utf-8').write(txt)
    print(f"{v['tool']} · {v['model']} · speaker {v['speaker']} · temperature {v['temperature']}\n")
    print(txt)


# ---------------------------------------------------------------- voice
def cmd_voice(eid, src):
    segs = speech_segments(src, min_sil=0.2)
    parts, flt = [], []
    for i, (s, e_) in enumerate(segs):
        a = max(0, s - 0.04); b = e_ + (0.06 if i < len(segs) - 1 else 0.25)
        flt.append(f'[0]atrim={a:.3f}:{b:.3f},asetpts=N/SR/TB[p{i}]')
        parts.append(f'[p{i}]')
        if i < len(segs) - 1:
            gap = min(GAP, segs[i + 1][0] - e_)
            flt.append(f'anullsrc=r=24000:cl=mono,atrim=0:{max(0.05, gap - 0.1):.3f}[g{i}]')
            parts.append(f'[g{i}]')
    flt.append(''.join(parts) + f'concat=n={len(parts)}:v=0:a=1,aresample=44100[o]')
    wav = out(eid, 'voice.wav'); mp3 = out(eid, 'voice.mp3')
    run(['ffmpeg', '-y', '-i', src, '-filter_complex', ';'.join(flt), '-map', '[o]', wav])
    run(['ffmpeg', '-y', '-i', wav, '-b:a', '192k', mp3])
    d = duration(mp3)
    print(f'voice: {duration(src):.2f}s -> {d:.2f}s ({len(segs)} phrases) -> {mp3}')
    if d > MAX_LEN:
        print(f'TOO LONG for a {MAX_LEN:.0f}s Reel: shorten the script or set the TTS a little faster, then run again.')
    else:
        need = 5 if d <= 5 else 10 if d <= 10 else 15
        print(f'Kling video: {need}s (or 10s and run "extend").')


# ---------------------------------------------------------------- extend
def cmd_extend(eid, src):
    voice = out(eid, 'voice.mp3')
    target = min(MAX_LEN, (duration(voice) + 0.3) if os.path.exists(voice) else MAX_LEN)
    d = duration(src)
    dst = out(eid, 'video-long.mp4')
    if d >= target:
        print(f'{src} is already {d:.2f}s (needs {target:.2f}s)'); return
    back = target - d + 0.1
    run(['ffmpeg', '-y', '-i', src, '-filter_complex',
         f'[0:v]split[a][b];[b]trim=start={max(0, d - back):.3f},setpts=PTS-STARTPTS,reverse[r];[a][r]concat=n=2:v=1:a=0,trim=duration={target:.3f},setpts=PTS-STARTPTS[v]',
         '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', dst + '.tmp.mp4'])
    os.replace(dst + '.tmp.mp4', dst)
    print(f'{d:.2f}s -> {target:.2f}s -> {dst}  (use this in Kling Lip Sync)')


# ---------------------------------------------------------------- build
def align(lines, segs):
    """Give each subtitle line a (start, end) on the speech segments."""
    n = len(lines)
    if len(segs) == n:
        return [(s, e) for s, e in segs]
    t0, t1 = segs[0][0], segs[-1][1]
    w = np.cumsum([len(plain(l)) for l in lines]); w = w / w[-1]
    bounds = [t0]
    gaps = [(segs[i][1] + segs[i + 1][0]) / 2 for i in range(len(segs) - 1)]
    for k in range(n - 1):
        ideal = t0 + w[k] * (t1 - t0)
        cand = [g for g in gaps if g > bounds[-1] + 0.6]
        b = min(cand, key=lambda g: abs(g - ideal)) if cand and min(abs(g - ideal) for g in cand) < 0.8 else ideal
        bounds.append(b)
    bounds.append(t1)
    return [(bounds[i], bounds[i + 1]) for i in range(n)]


def html_overlays(e, show, path):
    fonts = os.path.join(TOOLS, 'fonts')
    def face(w):
        return (f"@font-face{{font-family:K;font-weight:{w};src:url({fonts}/kanit-thai-{w}-normal.woff2),"
                f"url({fonts}/kanit-latin-{w}-normal.woff2)}}")
    def hl(s):
        return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    subs = ''.join(f'<div class="f" id="s{i}"><div class="sub">{hl(l)}{" 🤍" if i == len(e["lines"]) - 1 else ""}</div></div>'
                   for i, l in enumerate(e['lines']))
    doc = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{face(500)}{face(600)}{face(700)}
html,body{{margin:0;background:transparent}}
.f{{width:1080px;height:1920px;position:relative;font-family:K,sans-serif}}
.badge{{position:absolute;left:56px;top:150px;background:rgba(251,245,234,.92);color:#3b2a1e;font-weight:600;font-size:36px;padding:10px 26px;border-radius:40px;box-shadow:0 4px 18px rgba(0,0,0,.18)}}
.badge i{{font-style:normal;color:#b5652e}}
.ai{{position:absolute;right:56px;top:156px;background:rgba(20,14,10,.55);color:#fff;font-weight:500;font-size:28px;padding:8px 20px;border-radius:30px}}
.hook{{position:absolute;left:40px;right:40px;top:300px;text-align:center}}
.hook span{{display:inline-block;background:rgba(251,245,234,.95);color:#3b2a1e;font-weight:700;font-size:80px;line-height:1.25;padding:22px 46px 28px;border-radius:36px;box-shadow:0 10px 40px rgba(0,0,0,.25)}}
.sub{{position:absolute;left:60px;right:60px;top:1250px;text-align:center;color:#fff;font-weight:700;font-size:68px;line-height:1.3;
 text-shadow:0 0 6px rgba(0,0,0,.9),0 3px 0 rgba(0,0,0,.6),3px 0 0 rgba(0,0,0,.6),-3px 0 0 rgba(0,0,0,.6),0 -3px 0 rgba(0,0,0,.6),0 6px 22px rgba(0,0,0,.6)}}
.sub b{{color:#ffd27a;font-weight:700}}
</style></head><body>
<div class="f" id="base"><div class="badge">{show['show']} <i>·</i> กับ{show['host']}</div><div class="ai">สร้างด้วย AI</div></div>
<div class="f" id="hook"><div class="hook"><span>{e['hook']}</span></div></div>
{subs}
</body></html>"""
    open(path, 'w', encoding='utf-8').write(doc)


def music(path, length, sr=44100):
    """Soft original piano + pad, I-V-vi-IV in F at 80 bpm."""
    n = int(sr * (length + 0.5)); L = np.zeros(n); R = np.zeros(n)
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)
    def note(m, t0, dur, vol, pan=0.0, bright=1.0):
        i0 = int(t0 * sr)
        if i0 >= n: return
        t = np.arange(int(dur * sr)) / sr; f = midi(m)
        env = np.exp(-t * 2.6 / dur) * (1 - np.exp(-t * 300))
        s = sum((bright ** h) * np.sin(2 * np.pi * f * (h + 1) * t) / (h + 1) ** 1.6 for h in range(5)) * env * vol
        e = min(n, i0 + len(s)); s = s[:e - i0]
        L[i0:e] += s * (1 - pan); R[i0:e] += s * (1 + pan)
    beat = 0.75
    chords = [[53, 57, 60, 65], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62]]
    bass = [41, 36, 38, 34]
    b = 0
    while b * 4 * beat < length:
        ch = chords[b % 4]; t0 = b * 4 * beat
        note(bass[b % 4], t0, 3.2, 0.16, 0, 0.5)
        for j, step in enumerate([0, 1, 2, 3, 2, 1, 3, 2]):
            note(ch[step] + 12, t0 + j * beat / 2, 1.6, 0.07, (-0.3 if j % 2 else 0.3), 0.55)
        i0 = int(t0 * sr); t = np.arange(int(3.2 * sr)) / sr
        pad = sum(np.sin(2 * np.pi * midi(m) * t) + 0.3 * np.sin(2 * np.pi * midi(m) * 1.003 * t) for m in ch) * 0.018
        pad *= np.minimum(1, t / 0.8) * np.minimum(1, (3.2 - t) / 0.8)
        e = min(n, i0 + len(pad)); L[i0:e] += pad[:e - i0]; R[i0:e] += pad[:e - i0]
        b += 1
    for d, g in [(0.11, 0.3), (0.23, 0.2), (0.37, 0.12)]:
        k = int(d * sr); L[k:] += g * R[:-k]; R[k:] += g * L[:-k]
    m = max(abs(L).max(), abs(R).max()); L /= m; R /= m
    fade = np.ones(n); fi = int(0.6 * sr); fo = int(1.5 * sr); end = int(length * sr)
    fade[:fi] = np.linspace(0, 1, fi); fade[end - fo:end] = np.linspace(1, 0, fo); fade[end:] = 0
    data = (np.stack([L * fade, R * fade], 1) * 0.8 * 32767).astype(np.int16)
    w = wave.open(path, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(data.tobytes()); w.close()


def cmd_build(eid, src):
    e = ep(eid)
    d = duration(src)
    segs = speech_segments(src)
    times = align(e['lines'], segs)
    hook_end = min(3.2, times[0][1] if len(times) > 1 else 3.0)
    html = out(eid, 'overlays.html'); ovdir = out(eid, 'overlays')
    os.makedirs(ovdir, exist_ok=True)
    html_overlays(e, DATA, html)
    ids = ['base', 'hook'] + [f's{i}' for i in range(len(e['lines']))]
    subprocess.run(['node', os.path.join(TOOLS, 'overlays.cjs'), html, ovdir] + ids, check=True,
                   env={**os.environ, 'NODE_PATH': run(['npm', 'root', '-g']).stdout.strip()})
    mus = out(eid, 'music.wav'); music(mus, d)
    inputs = ['-i', src]
    for i in ids:
        inputs += ['-loop', '1', '-i', os.path.join(ovdir, i + '.png')]
    inputs += ['-i', mus]
    f = ['[0:v]scale=1080:1920:flags=lanczos,setsar=1,fps=30[v0]', '[v0][1:v]overlay=shortest=1[v1]',
         f"[v1][2:v]overlay=enable='between(t,0,{hook_end:.2f})':shortest=1[v2]"]
    last = 'v2'
    for i, (s, en) in enumerate(times):
        a = 0 if i == 0 else max(0, s - 0.08)
        b = d if i == len(times) - 1 else times[i + 1][0] - 0.08
        f.append(f"[{last}][{3 + i}:v]overlay=enable='between(t,{a:.2f},{b:.2f})':shortest=1[w{i}]"); last = f'w{i}'
    f.append(f'[{last}]format=yuv420p[v]')
    mi = 1 + len(ids)
    f.append(f'[{mi}:a]volume=0.16[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]')
    dst = out(eid, 'reel.mp4')
    run(['ffmpeg', '-y'] + inputs + ['-filter_complex', ';'.join(f), '-map', '[v]', '-map', '[a]', '-t', f'{d:.3f}',
         '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
         '-movflags', '+faststart', dst + '.tmp.mp4'])
    os.replace(dst + '.tmp.mp4', dst)
    json.dump({'source': os.path.basename(src), 'duration': round(d, 2), 'hook_end': round(hook_end, 2),
               'subtitles': [[round(s, 2), round(en, 2), plain(l)] for (s, en), l in zip(times, e['lines'])]},
              open(out(eid, 'timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{dst}  {d:.2f}s, {len(segs)} speech parts for {len(e["lines"])} subtitle lines')
    cmd_qa(eid)


# ---------------------------------------------------------------- qa
def cmd_qa(eid):
    from PIL import Image
    reel = out(eid, 'reel.mp4')
    d = duration(reel)
    ts = [round(d * k / 6, 2) for k in range(1, 6)]
    frames = []
    for t in ts:
        p = out(eid, f'_f{t}.png')
        run(['ffmpeg', '-y', '-ss', str(t), '-i', reel, '-frames:v', '1', p]); frames.append(Image.open(p).convert('RGB'))
    w = 270; sheet = Image.new('RGB', (w * len(frames), 480))
    for i, im in enumerate(frames):
        sheet.paste(im.resize((w, 480)), (i * w, 0))
    sheet.save(out(eid, 'qa-frames.png'))
    # mouth close-ups: the host's mouth sits near (52.8%, 45%) of the frame in the master framing
    crops = [im.crop((int(1080 * .40), int(1920 * .405), int(1080 * .66), int(1920 * .50))) for im in frames]
    cw, ch = crops[0].size
    m = Image.new('RGB', (cw * len(crops), ch))
    for i, c in enumerate(crops):
        m.paste(c, (i * cw, 0))
    m.save(out(eid, 'qa-mouth.png'))
    for t in ts:
        os.remove(out(eid, f'_f{t}.png'))
    print(f"QA: {out(eid, 'qa-frames.png')}  {out(eid, 'qa-mouth.png')}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    c, eid, *rest = sys.argv[1:]
    {'tts': cmd_tts, 'voice': cmd_voice, 'extend': cmd_extend, 'build': cmd_build, 'qa': cmd_qa}[c](eid, *rest)
