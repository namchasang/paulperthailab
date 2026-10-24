#!/usr/bin/env python3
"""gamekit: keep a single-file web game editable as small source parts.

The browser still loads ONE file (e.g. index.html). Its text lives in
game-src/ as numbered parts; `build` joins them back byte for byte.

  python3 tools/gamekit.py build      # join game-src/ -> game file (also syncs, see below)
  python3 tools/gamekit.py split      # re-cut the game file into game-src/ (overwrites parts)
  python3 tools/gamekit.py map        # rewrite game-src/MAP.md (which part holds what)
  python3 tools/gamekit.py status     # say whether parts and game file agree

Safety: game-src/.state remembers the hashes of the last build/split.
 * game file edited directly, parts untouched  -> build re-splits (sync), nothing lost
 * parts edited, game file untouched           -> build joins parts into the game file
 * BOTH edited                                 -> build stops; nothing is overwritten
Config (tools/gamekit.json): {"file": "index.html", "src": "game-src", "sw": "sw.js"}
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = {"file": "index.html", "src": "game-src", "sw": None}
try:
    CFG.update(json.load(open(os.path.join(ROOT, "tools", "gamekit.json"))))
except FileNotFoundError:
    pass
GAME = os.path.join(ROOT, CFG["file"])
SRC = os.path.join(ROOT, CFG["src"])
STATE = os.path.join(SRC, ".state")
ORDER = os.path.join(SRC, "ORDER.txt")

SECTION = re.compile(r"^(// ?[-=]{3,}|/\* |<style|<script>|<script |</script>|<body|<!-- ?[-=A-Za-z])")
BIG = 20000          # a line longer than this (embedded data) becomes its own part
MAX_LINES = 350      # parts longer than this are cut again at a top-level line
MIN_LINES = 40       # tiny parts are merged into the next one


def h(b):
    return hashlib.sha256(b).hexdigest()


def read_parts():
    names = [l.strip() for l in open(ORDER, encoding="utf-8") if l.strip()]
    return names, b"".join(open(os.path.join(SRC, n), "rb").read() for n in names)


def slug(line, n):
    t = re.sub(r"<[^>]*>|[-=*/]+|\bthe\b", " ", line.decode("utf-8", "ignore")).strip().lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:38].strip("-")
    return f"{n:03d}-{t or 'part'}"


def ctx_ext(lines_before):
    """Guess css/js/html for a part from the last tag seen before it."""
    tail = lines_before
    last = None
    for m in re.finditer(rb"<(/?)(style|script)\b", tail):
        last = m
    if last and not last.group(1):
        return ".css" if last.group(2) == b"style" else ".js"
    return ".html"


def split():
    data = open(GAME, "rb").read()
    lines = data.splitlines(keepends=True)
    cuts = [0]
    for i, l in enumerate(lines):
        if i and (SECTION.match(l.decode("utf-8", "ignore")) or len(l) > BIG or len(lines[i - 1]) > BIG):
            cuts.append(i)
    cuts = sorted(set(cuts)) + [len(lines)]
    parts = []
    for a, b in zip(cuts, cuts[1:]):
        parts.append([a, b])
    merged = []
    for p in parts:  # merge tiny parts forward (never merge a giant data line)
        if merged and merged[-1][1] - merged[-1][0] < MIN_LINES and max(len(x) for x in lines[merged[-1][0]:merged[-1][1]]) <= BIG and max(len(x) for x in lines[p[0]:p[1]]) <= BIG:
            merged[-1][1] = p[1]
        else:
            merged.append(p)
    final = []
    for a, b in merged:  # cut long parts at a top-level line
        while b - a > MAX_LINES:
            c = a + MAX_LINES - 50
            while c < b - 1 and not re.match(rb"^(function |const |let |var |\}|[A-Za-z_$])", lines[c]):
                c += 1
            if c >= b - 1:
                break
            final.append([a, c])
            a = c
        final.append([a, b])
    os.makedirs(SRC, exist_ok=True)
    for f in os.listdir(SRC):
        if re.match(r"^\d{3}-", f):
            os.remove(os.path.join(SRC, f))
    names, offs, o = [], [0], 0
    for l in lines:
        o += len(l); offs.append(o)
    for n, (a, b) in enumerate(final):
        name = slug(lines[a][:200], n) + ctx_ext(data[:offs[a]])
        open(os.path.join(SRC, name), "wb").write(b"".join(lines[a:b]))
        names.append(name)
    open(ORDER, "w", encoding="utf-8").write("\n".join(names) + "\n")
    _, joined = read_parts()
    assert joined == data, "split is not byte-identical"
    save_state(data)
    write_map()
    print(f"split {CFG['file']} into {len(names)} parts in {CFG['src']}/")


def save_state(data):
    _, joined = read_parts()
    json.dump({"game": h(data), "src": h(joined)}, open(STATE, "w"))


def status():
    st = json.load(open(STATE))
    names, joined = read_parts()
    game = open(GAME, "rb").read()
    return st, h(game) != st["game"], h(joined) != st["src"], joined


def bump_sw():
    if not CFG.get("sw"):
        return
    p = os.path.join(ROOT, CFG["sw"])
    s = open(p, encoding="utf-8").read()
    m = re.search(r"(CACHE\s*=\s*['\"][^'\"]*?v)(\d+)", s)
    if m:
        s = s[:m.start(2)] + str(int(m.group(2)) + 1) + s[m.end(2):]
        open(p, "w", encoding="utf-8").write(s)
        print("sw.js cache ->", "v" + str(int(m.group(2)) + 1))


def build():
    if not os.path.exists(STATE):
        return split()
    st, game_changed, src_changed, joined = status()
    if game_changed and src_changed:
        sys.exit("STOP: both the game file and game-src/ changed since the last build.\n"
                 "Commit or save your game-src edits, then: git diff the game file, re-apply by hand, "
                 "and run `gamekit.py split` to resync.")
    if game_changed:
        print("game file was edited directly -> re-splitting (sync)")
        return split()
    if not src_changed:
        print("nothing to build")
        return
    open(GAME, "wb").write(joined)
    save_state(joined)
    write_map()
    bump_sw()
    print(f"built {CFG['file']} ({len(joined)//1024} KB)")


def write_map():
    names, _ = read_parts()
    rows, line = [], 1
    for n in names:
        b = open(os.path.join(SRC, n), "rb").read()
        cnt = b.count(b"\n")
        ids = re.findall(rb"^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=)", b, re.M)
        ids = [(a or c).decode() for a, c in ids][:10]
        note = "embedded data, do not open" if max((len(x) for x in b.splitlines() or [b""]), default=0) > BIG else ", ".join(ids)
        rows.append(f"| {n} | {line}-{line + cnt - 1} | {len(b)//1024} | {note} |")
        line += cnt
    open(os.path.join(SRC, "MAP.md"), "w", encoding="utf-8").write(
        f"# Map of {CFG['file']}\n\nEdit the part, then run `python3 tools/gamekit.py build`.\n"
        "Find code: `grep -n 'name' " + CFG["src"] + "/*`.\n\n| part | lines in game file | KB | top-level names |\n|---|---|---|---|\n"
        + "\n".join(rows) + "\n")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "split":
        split()
    elif cmd == "build":
        build()
    elif cmd == "map":
        write_map(); print("MAP.md written")
    elif cmd == "status":
        st, g, s, _ = status()
        print("game file edited directly:", g, "| game-src edited:", s)
    else:
        sys.exit(__doc__)
