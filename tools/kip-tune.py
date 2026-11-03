# Builds kip-barista/__t.html from index.html with test-only fixes and optional knob edits (JSON list of [old,new]).
import sys,json
s=open('kip-barista/index.html').read()
# test only: patience must drain by real elapsed time even when headless frames are slow
s=s.replace('const dt=Math.min(.1,(now-last)/1000)','const dt=Math.min(2,(now-last)/1000)',1)
for a,b in json.loads(sys.argv[1] if len(sys.argv)>1 else '[]'):
    assert s.count(a)==1,(a,s.count(a)); s=s.replace(a,b)
open('kip-barista/__t.html','w').write(s)
