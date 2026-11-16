#!/usr/bin/env python3
"""Podcast Reel factory for the show in podcast/episodes.json.

  python3 tools/reel.py tts    ep04              text to paste into Google AI Studio (TTS)
  python3 tools/reel.py voice  ep04 voice.wav    tighten pauses -> episodes/ep04/voice.mp3 (+ length check)
  python3 tools/reel.py extend ep04 kling.mp4    make a Kling clip at least as long as the voice (forward + reverse)
  python3 tools/reel.py build  ep04 lipsync.mp4  subtitles + hook + badges + music -> episodes/ep04/reel.mp4
  python3 tools/reel.py interview ep11 question.wav flow1.mp4 [flow2.mp4]
                                                  Q&A Reel: off-screen question (voice-matched) + Nara's answer
  python3 tools/reel.py qa     ep04              contact sheets: frames + mouth close-ups -> episodes/ep04/qa-*.png

Every Reel gets: word-by-word highlighted subtitles, a punch-in zoom on the **key** word,
and loudness normalised to -14 LUFS (Reels level).
Run from the podcast/ folder. Needs ffmpeg, Pillow, numpy, pythainlp and Playwright (node).
"""
import json, os, re, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, 'tools')
DATA = json.load(open(os.path.join(ROOT, 'episodes.json'), encoding='utf-8'))
CARD_END = 1.4         # big opening hook card (Tiger Shorts style) shows 0..CARD_END, then fades
CARD_FADE = 0.3
CLOSE = 1.4            # 'close-up' angle made by cropping (hard cut in and out)
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
    if e.get('format') == 'interview':
        qv = DATA.get('question_voice', {'speaker': 'Charon', 'temperature': 0.7,
                                         'style': 'Say casually and curiously, like a podcast host chatting with a guest across the table:'})
        txt = (f"QUESTION (Google AI Studio · speaker {qv['speaker']} · temperature {qv['temperature']}):\n"
               f"{qv['style']}\n{e['question']}\n\n"
               f"NARA'S ANSWER (goes into the Flow prompt as her dialogue):\n{tts_text(e)}\n")
        open(out(eid, 'tts.txt'), 'w', encoding='utf-8').write(txt)
        print(txt); return
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


THAI_MARKS = set(chr(c) for c in list(range(0x0E31, 0x0E32)) + list(range(0x0E34, 0x0E3B)) + list(range(0x0E47, 0x0E4F)))
MIN_CHUNK = 5           # letters per highlighted chunk (a single Thai word flashes by too fast)


def weight(s):
    return max(1, sum(1 for ch in s if not ch.isspace() and ch not in THAI_MARKS))


def chunks(line):
    """Split a subtitle line into highlight chunks: [(text, is_key)]. `**word**` stays its own chunk."""
    from pythainlp.tokenize import word_tokenize
    out_ = []
    for k, part in enumerate(re.split(r'\*\*', line)):
        if not part:
            continue
        key = k % 2 == 1
        toks = [part] if key else word_tokenize(part, engine='newmm', keep_whitespace=True)
        cur = ''
        for t in toks:
            cur += t
            if weight(cur) >= MIN_CHUNK and not t.isspace():
                out_.append([cur, key]); cur = ''
        if cur:
            if out_ and not key and not out_[-1][1] and (weight(cur) < 3 or cur.isspace()):
                out_[-1][0] += cur
            else:
                out_.append([cur, key])
    return [(t, k) for t, k in out_]


def chunk_times(line, start, end):
    cs = chunks(line)
    w = np.array([weight(t) for t, _ in cs], float)
    edges = start + np.concatenate([[0], np.cumsum(w)]) / w.sum() * (end - start)
    return [(t, k, edges[i], edges[i + 1]) for i, (t, k) in enumerate(cs)]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def card_html(t):
    """hook_card text: '\\n' = new line, **word** = gold."""
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', esc(t)).replace('\n', '<br>')


def html_overlays(e, show, path, timed, hook_text, hook_label='', hook_top=300):
    """timed: per line, list of (text, is_key, start, end). Writes one page with a block per overlay id."""
    fonts = os.path.join(TOOLS, 'fonts')
    def face(w):
        return (f"@font-face{{font-family:K;font-weight:{w};src:url({fonts}/kanit-thai-{w}-normal.woff2),"
                f"url({fonts}/kanit-latin-{w}-normal.woff2)}}")
    def line_html(i, cs, now=None):
        spans = ''.join(f'<span class="c{" k" if k else ""}{" now" if j == now else ""}">{esc(t)}</span>'
                        for j, (t, k, *_r) in enumerate(cs))
        heart = '<span class="c"> 🤍</span>' if i == len(timed) - 1 else ''
        return f'<div class="sub{" hl" if now is not None else ""}">{spans}{heart}</div>'
    blocks = []
    for i, cs in enumerate(timed):
        blocks.append(f'<div class="f" id="s{i}">{line_html(i, cs)}</div>')
        for j in range(len(cs)):
            blocks.append(f'<div class="f" id="s{i}_{j}">{line_html(i, cs, j)}</div>')
    label = f'<em>{esc(hook_label)}</em>' if hook_label else ''
    doc = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{face(500)}{face(600)}{face(700)}
html,body{{margin:0;background:transparent}}
.f{{width:1080px;height:1920px;position:relative;font-family:K,sans-serif}}
.badge{{position:absolute;left:56px;top:150px;background:rgba(251,245,234,.92);color:#3b2a1e;font-weight:600;font-size:36px;padding:10px 26px;border-radius:40px;box-shadow:0 4px 18px rgba(0,0,0,.18)}}
.badge i{{font-style:normal;color:#b5652e}}
.ai{{position:absolute;right:56px;top:156px;background:rgba(20,14,10,.55);color:#fff;font-weight:500;font-size:28px;padding:8px 20px;border-radius:30px}}
.hook{{position:absolute;left:40px;right:40px;top:{hook_top}px;text-align:center}}
.hook span{{display:inline-block;background:rgba(251,245,234,.95);color:#3b2a1e;font-weight:700;font-size:72px;line-height:1.25;padding:22px 46px 28px;border-radius:36px;box-shadow:0 10px 40px rgba(0,0,0,.25)}}
.hook em{{display:block;font-style:normal;font-weight:600;font-size:34px;color:#b5652e;margin-bottom:4px}}
.sub{{position:absolute;left:60px;right:60px;top:{e.get('sub_top', 1250)}px;text-align:center;color:#fff;font-weight:700;font-size:68px;line-height:1.3;
 text-shadow:0 0 6px rgba(0,0,0,.9),0 3px 0 rgba(0,0,0,.6),3px 0 0 rgba(0,0,0,.6),-3px 0 0 rgba(0,0,0,.6),0 -3px 0 rgba(0,0,0,.6),0 6px 22px rgba(0,0,0,.6)}}
.c{{padding:0 .05em;margin:0 -.05em;border-radius:.22em;-webkit-box-decoration-break:clone;box-decoration-break:clone}}
.c.k{{color:#ffd27a}}
.card{{position:absolute;inset:0;background:rgba(0,0,0,.42)}}
.card div{{position:absolute;left:60px;right:60px;top:760px;text-align:center;color:#fff;font-weight:700;font-size:104px;line-height:1.28;text-shadow:0 4px 18px rgba(0,0,0,.55)}}
.card b{{color:#ffd27a}}
.hl .c{{visibility:hidden}}
.hl .c.now{{visibility:visible;background:#ffd27a;color:#3b2a1e;text-shadow:none;box-shadow:0 4px 14px rgba(0,0,0,.35)}}
</style></head><body>
<div class="f" id="base"><div class="badge">{e.get('series', show['show'])} <i>·</i> กับ{show['host']}</div><div class="ai">สร้างด้วย AI</div></div>
<div class="f" id="card"><div class="card"><div>{card_html(e.get('hook_card', ''))}</div></div></div>
<div class="f" id="hook"><div class="hook"><span>{label}{esc(hook_text)}</span></div></div>
{''.join(blocks)}
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


# ---------------------------------------------------------------- audio helpers
TARGET_LUFS = -14.0     # Reels / Shorts loudness
ZOOM = 1.08             # punch-in on the **key** word
ZOOM_IN, ZOOM_OUT = 0.22, 0.35


def loudness(path, af=''):
    """Integrated loudness (LUFS) of a file's audio, optionally after a filter."""
    chain = (af + ',' if af else '') + 'ebur128=framelog=quiet'
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', chain, '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return float(m[-1]) if m else -70.0


def loudnorm(src, dst, target=TARGET_LUFS):
    """Two-pass EBU R128 loudness normalisation to the Reels level, true peak -1 dBTP."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={target}:TP=-1.0:LRA=11:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    af = (f"loudnorm=I={target}:TP=-1.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(['ffmpeg', '-y', '-i', src, '-af', af + ',aresample=48000', '-ac', '2', dst])
    return loudness(dst)


BANDS = [100, 200, 400, 800, 1600, 3200, 6400, 10000]


def band_levels(path, start=0.0, end=None):
    """Average level (dB) per octave band of a file's audio between start and end."""
    sr = 24000
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{start:.3f}'] + (['-to', f'{end:.3f}'] if end else []) + \
          ['-i', path, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.int16).astype(float)
    n = 2048
    if len(x) < 2 * n:
        return None
    win = np.hanning(n)
    spec = np.mean([np.abs(np.fft.rfft(x[i:i + n] * win)) ** 2 for i in range(0, len(x) - n, n // 2)], 0)
    freqs = np.fft.rfftfreq(n, 1 / sr)
    return np.array([10 * np.log10(spec[(freqs >= b / 1.414) & (freqs < min(b * 1.414, sr / 2))].mean() + 1e-9) for b in BANDS])


def match_voice(src, ref, ref_speech, dst):
    """Make a clean TTS voice (src) sound recorded in the same room as the voice in ref:
    match EQ (max +-6 dB per octave band), add a touch of room, match loudness to ref's speech."""
    a = band_levels(src)
    b = np.mean([bl for bl in (band_levels(ref, s, e) for s, e in ref_speech) if bl is not None], 0)
    g = (b - b.mean()) - (a - a.mean())
    g = np.clip(np.convolve(g, [.25, .5, .25], 'same'), -6, 6)
    eq = 'firequalizer=gain_entry=\'' + ';'.join(f'entry({f},{v:.1f})' for f, v in zip(BANDS, g)) + '\''
    room = 'aecho=0.9:0.9:19|31|47:0.10|0.07|0.04'
    chain = f'highpass=f=80,{eq},{room},acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120'
    tmp = dst + '.tmp.wav'
    run(['ffmpeg', '-y', '-i', src, '-af', chain + ',aresample=48000', '-ac', '1', tmp])
    s0, s1 = ref_speech[0][0], ref_speech[-1][1]
    gain = loudness(ref, f'atrim={s0:.2f}:{s1:.2f}') - loudness(tmp)
    run(['ffmpeg', '-y', '-i', tmp, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.95', dst])
    os.remove(tmp)
    print('voice match: EQ ' + ' '.join(f'{f}:{v:+.1f}' for f, v in zip(BANDS, g)) + f' dB, level {gain:+.1f} dB')


# ---------------------------------------------------------------- build
def zoom_expr(windows):
    """Scale factor over time: smooth punch-in during each (start, end) window."""
    if not windows:
        return '1'
    parts = [f'min(1,max(0,(t-{a:.2f})/{ZOOM_IN}))*min(1,max(0,({b:.2f}+{ZOOM_OUT}-t)/{ZOOM_OUT}))' for a, b in windows]
    return f'(1+{ZOOM - 1:.3f}*min(1,' + '+'.join(parts) + '))'


def compose(eid, e, src, segs, hook_end, hook_text, hook_label='', sub_from=None, zoom_center=(0.5, 0.35), hook_top=300):
    """Overlays (badge, AI label, hook, word-highlight subtitles) + punch-in + music + -14 LUFS -> reel.mp4"""
    d = duration(src)
    times = align(e['lines'], segs)
    timed = [chunk_times(l, s, en) for l, (s, en) in zip(e['lines'], times)]
    html = out(eid, 'overlays.html'); ovdir = out(eid, 'overlays')
    os.makedirs(ovdir, exist_ok=True)
    for p in os.listdir(ovdir):
        os.remove(os.path.join(ovdir, p))
    html_overlays(e, DATA, html, timed, hook_text, hook_label, hook_top)
    card = bool(e.get('hook_card'))
    ids = ['base', 'hook'] + (['card'] if card else [])
    for i, cs in enumerate(timed):
        ids += [f's{i}'] + [f's{i}_{j}' for j in range(len(cs))]
    subprocess.run(['node', os.path.join(TOOLS, 'overlays.cjs'), html, ovdir] + ids, check=True,
                   env={**os.environ, 'NODE_PATH': run(['npm', 'root', '-g']).stdout.strip()})

    # audio: voice + soft music -> -14 LUFS
    mus = out(eid, 'music.wav'); music(mus, d)
    mix = out(eid, '_mix.wav'); final = out(eid, '_final.wav')
    run(['ffmpeg', '-y', '-i', src, '-i', mus, '-filter_complex',
         '[1:a]volume=0.16[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[a]', '-map', '[a]', mix])
    lufs = loudnorm(mix, final)

    # video: punch-in on **key** words, then overlays
    windows = [(a, times[i][1]) for i, cs in enumerate(timed) for (_, k, a, _b) in cs if k]
    z = zoom_expr(windows)
    cx, cy = zoom_center
    cuts = e.get('close_cuts', [])
    if cuts:
        inside = '+'.join(f'between(t,{a:.2f},{b:.2f})' for a, b in cuts)
        z = f"if({inside},{e.get('close_zoom', CLOSE)},{z})"
        ccx, ccy = e.get('close_center', zoom_center)
        cx, cy = f'if({inside},{ccx},{zoom_center[0]})', f'if({inside},{ccy},{zoom_center[1]})'
    # zoompan works per input frame (scale+crop can't move the crop when the size changes)
    zp, zx, zy = (str(v).replace('(t-', '(it-').replace('-t)', '-it)').replace('between(t,', 'between(it,') for v in (z, cx, cy))
    inputs = ['-i', src, '-i', final]
    for i in ids:
        inputs += ['-loop', '1', '-i', os.path.join(ovdir, i + '.png')]
    f = [f"[0:v]scale=1080:1920:flags=lanczos,setsar=1,fps=30,"
         f"zoompan=z='{zp}':x='(iw-iw/zoom)*{zx}':y='(ih-ih/zoom)*{zy}':d=1:s=1080x1920:fps=30[v0]",
         '[v0][2:v]overlay=shortest=1[v1]',
         f"[v1][3:v]overlay=enable='between(t,{CARD_END if card else 0:.2f},{hook_end:.2f})':shortest=1[v2]"]
    last, n = 'v2', 4
    if card:
        f.append(f"[4:v]format=rgba,fade=t=out:st={CARD_END - CARD_FADE:.2f}:d={CARD_FADE}:alpha=1[cd];"
                 f"[v2][cd]overlay=enable='lte(t,{CARD_END + 0.05:.2f})':shortest=1[v3]")
        last, n = 'v3', 5
    for i, cs in enumerate(timed):
        a = (0 if sub_from is None else sub_from) if i == 0 else max(0, times[i][0] - 0.08)
        b = d if i == len(timed) - 1 else times[i + 1][0] - 0.08
        f.append(f"[{last}][{n}:v]overlay=enable='between(t,{a:.2f},{b:.2f})':shortest=1[l{i}]"); last = f'l{i}'; n += 1
        for j, (_, _k, ca, cb) in enumerate(cs):
            cb = b if j == len(cs) - 1 else cb
            f.append(f"[{last}][{n}:v]overlay=enable='between(t,{ca:.2f},{cb:.2f})':shortest=1[h{i}_{j}]")
            last = f'h{i}_{j}'; n += 1
    f.append(f'[{last}]format=yuv420p[v]')
    dst = out(eid, 'reel.mp4')
    run(['ffmpeg', '-y'] + inputs + ['-filter_complex', ';'.join(f), '-map', '[v]', '-map', '1:a', '-t', f'{d:.3f}',
         '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
         '-movflags', '+faststart', dst + '.tmp.mp4'])
    os.replace(dst + '.tmp.mp4', dst)
    for p in (mix, final):
        os.remove(p)
    json.dump({'source': os.path.basename(src), 'duration': round(d, 2), 'hook_end': round(hook_end, 2),
               'hook_card': [0, CARD_END] if card else None, 'close_cuts': cuts,
               'loudness_lufs': round(lufs, 1), 'punch_in': [[round(a, 2), round(b, 2)] for a, b in windows],
               'subtitles': [[round(s, 2), round(en, 2), plain(l), [[c[0], round(c[2], 2)] for c in cs]]
                             for (s, en), l, cs in zip(times, e['lines'], timed)]},
              open(out(eid, 'timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{dst}  {d:.2f}s, {len(segs)} speech parts for {len(e["lines"])} lines, '
          f'{sum(len(c) for c in timed)} highlight chunks, {len(windows)} punch-ins, {lufs:.1f} LUFS')
    if d > MAX_LEN + 0.5:
        print(f'NOTE: {d:.1f}s is longer than {MAX_LEN:.0f}s.')
    cmd_qa(eid)


def cmd_build(eid, src):
    """Single-host Reel (Kling Lip Sync clip with the voice already in it)."""
    e = ep(eid)
    segs = speech_segments(src)
    times = align(e['lines'], segs)
    hook_end = min(3.2, times[0][1] if len(times) > 1 else 3.0)
    compose(eid, e, src, segs, hook_end, e['hook'],
            zoom_center=tuple(e.get('zoom_center', DATA.get('zoom_center', (0.5, 0.35)))))


# ---------------------------------------------------------------- interview (off-screen question, Nara answers)
def cmd_interview(eid, question, *clips):
    """Q&A Reel: a man's off-screen question (TTS file) over Nara listening, then her answer.
    clips: one or more Flow/Veo clips that open with Nara listening silently, then her spoken answer."""
    e = ep(eid)
    if not clips:
        sys.exit('usage: reel.py interview epNN question.wav clip1.mp4 [clip2.mp4]')
    work = out(eid, '_work'); os.makedirs(work, exist_ok=True)
    enc = ['-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le']
    norm = []
    for k, c in enumerate(clips):       # same size / fps / audio so they join cleanly
        p = os.path.join(work, f'c{k}.mov')
        run(['ffmpeg', '-y', '-i', c, '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30',
             '-af', 'aresample=48000', '-ac', '2'] + enc + [p])
        norm.append(p)
    joined = os.path.join(work, 'joined.mov')
    lst = os.path.join(work, 'list.txt')
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in norm))
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', joined])
    nara = speech_segments(joined, noise='-35dB')
    if not nara:
        sys.exit('no speech found in the clips')
    first, last = nara[0][0], nara[-1][1]

    q = os.path.join(work, 'question.wav')
    match_voice(question, joined, nara, q)
    qd = duration(q)
    lead, gap = 0.30, 0.45                       # silence before the question, pause before she answers
    pad = max(0.0, lead + qd + gap - first)      # extra listening time needed before her first word
    src = joined
    if pad > 0.05:
        # play the silent listening part back and forth before the clip, ending on its first frame
        listen = max(0.5, first - 0.15)
        reps = int(np.ceil(pad / listen))
        f = [f'[0:v]trim=0:{listen:.3f},setpts=PTS-STARTPTS,split={reps}' + ''.join(f'[v{i}]' for i in range(reps)),
             f'[0:a]atrim=0:{listen:.3f},asetpts=PTS-STARTPTS,asplit={reps}' + ''.join(f'[a{i}]' for i in range(reps))]
        seq = ''
        for i in range(reps):
            back = (reps - 1 - i) % 2 == 0
            f.append(f'[v{i}]{"reverse" if back else "null"}[pv{i}]')
            f.append(f'[a{i}]{"areverse" if back else "anull"}[pa{i}]')
            seq += f'[pv{i}][pa{i}]'
        cut = reps * listen - pad
        f.append(seq + f'concat=n={reps}:v=1:a=1[cv][ca]')
        f.append(f'[cv]trim=start={cut:.3f},setpts=PTS-STARTPTS[ov];[ca]atrim=start={cut:.3f},asetpts=PTS-STARTPTS[oa]')
        pre = os.path.join(work, 'pre.mov')
        run(['ffmpeg', '-y', '-i', joined, '-filter_complex', ';'.join(f), '-map', '[ov]', '-map', '[oa]'] + enc + [pre])
        open(lst, 'w').write(f"file '{pre}'\nfile '{joined}'\n")
        src = os.path.join(work, 'padded.mov')
        run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', src])
        if reps > 1:
            print(f'NOTE: the question ({qd:.1f}s) is long for {first:.1f}s of listening; the listening part repeats.')
    else:
        pad = 0.0
    q_at = pad + first - gap - qd
    end = min(duration(src), pad + last + 0.9)
    assembled = os.path.join(work, 'assembled.mov')
    run(['ffmpeg', '-y', '-i', src, '-i', q, '-filter_complex',
         f'[1:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(q_at * 1000)}:all=1,apad[qq];'
         f'[0:a][qq]amix=inputs=2:duration=first:normalize=0[a]',
         '-map', '0:v', '-map', '[a]', '-t', f'{end:.3f}', '-c:v', 'copy', '-c:a', 'pcm_s16le', assembled])
    segs = [(s + pad, e_ + pad) for s, e_ in nara if s + pad < end]
    hook_end = pad + first - 0.1
    zc = tuple(e.get('zoom_center', DATA.get('interview_zoom_center', (0.5, 0.3))))
    compose(eid, e, assembled, segs, hook_end, e.get('question') or e['hook'], hook_label='คำถาม',
            sub_from=hook_end, zoom_center=zc, hook_top=1180)  # question sits where the subtitles go, off her face
    print(f'question {qd:.1f}s at {q_at:.2f}s, Nara answers {pad + first:.2f}-{pad + last:.2f}s, reel {end:.2f}s')


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
    # mouth close-ups: box (x0, y0, x1, y1) as fractions of the frame; master framing default, override per episode
    e = ep(eid)
    box = e.get('mouth_box') or ((.30, .28, .62, .42) if e.get('format') == 'interview' else (.40, .405, .66, .50))
    crops = [im.crop((int(1080 * box[0]), int(1920 * box[1]), int(1080 * box[2]), int(1920 * box[3]))) for im in frames]
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
    {'tts': cmd_tts, 'voice': cmd_voice, 'extend': cmd_extend, 'build': cmd_build, 'interview': cmd_interview, 'qa': cmd_qa}[c](eid, *rest)


# ---------------------------------------------------------------- stray sounds at clip joins
def stray_tails(path, joins, look=0.45, max_len=0.32, frame=0.025):
    """Veo often starts an extra word or 'โอ๊ะ' right before a clip ends. For each join time, find the last
    short burst of sound (< max_len s) that sits after a pause and runs into the cut. Returns [(start, end)] to mute.
    No Thai speech-to-text here, so this only catches short bursts; longer extra words still need a human listen."""
    sr = 16000
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'],
                         capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(float)
    n = int(frame * sr)
    db = np.array([20 * np.log10(np.sqrt(np.mean(a[i:i + n] ** 2)) + 1) for i in range(0, len(a) - n, n)])
    out = []
    for j in joins:
        hi = int(j / frame); lo = max(0, int((j - look) / frame))
        if hi <= lo or db[hi - 2:hi].max() < 45:      # nothing sounding into the cut
            continue
        floor = db[lo:hi].max() - 12
        k = hi - 1
        while k > lo and db[k] >= floor:
            k -= 1
        if k > lo and (hi - k) * frame <= max_len:
            out.append((round(k * frame, 3), round(j + 0.02, 3)))
    return out
