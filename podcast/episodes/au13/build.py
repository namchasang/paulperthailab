import sys, os, numpy as np, wave, subprocess
sys.path.insert(0, '/home/claude/paulperthailab/podcast/tools')
os.chdir('/home/claude/paulperthailab/podcast')
import reel
W='/tmp/au13/'; run=reel.run
NARA=sys.argv[1] if len(sys.argv)>1 else 'nara_leda.wav'
GRADE="eq=brightness=0.025:gamma=1.05:saturation=1.04,colorbalance=rs=0.025:gs=0.0:bs=-0.01:rm=0.015:bm=-0.01"
# host question: trim lead/tail, a bit faster
run(['ffmpeg','-y','-i',W+'q_raw.wav','-af','atrim=0.26:4.28,asetpts=N/SR/TB,atempo=1.1,afade=t=in:d=0.03','-ar','48000','-ac','2',W+'q.wav'])
qd=reel.duration(W+'q.wav'); QS=0.1; N=QS+qd+0.35
nd=reel.duration(W+NARA)
# phrase times inside the Nara file (Leda); Aoede differs
PH={'nara_leda.wav':[(0.12,2.4),(2.5,4.33),(4.65,7.75),(8.12,9.9),(10.2,13.15)],
    'nara_new.wav':[(0.18,2.18),(2.33,4.4),(4.5,6.93),(7.18,8.72),(9.1,13.05)],
    'nara_aoede.wav':[(0.33,2.98),(3.08,4.6),(4.88,7.08),(7.48,9.08),(9.38,12.33)]}[NARA]
lines=[(N+a,N+b) for a,b in PH]
T=N+nd+0.8
# background: ping-pong, slowed, graded, 30fps
run(['ffmpeg','-y','-i',W+'src.mp4','-filter_complex',
     f"[0:v]setpts=PTS/0.8,fps=30,{GRADE},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,trim=0:{T:.2f},setpts=PTS-STARTPTS[v]",
     '-map','[v]','-an','-c:v','libx264','-crf','14','-preset','fast',W+'bg.mp4'])
# overlays: burst during line 2, post during lines 3-4
a2,b2=lines[1]; step=(b2-a2)/4
ov=[]; t=a2
for k in range(1,5):
    end=b2+0.05 if k==4 else t+step
    ov.append((f'b{k}',t,end)); ov.append(('flash',t,t+0.08)); t+=step
pa,pb=lines[2][0]-0.05,lines[3][1]+0.1
inputs=['-i',W+'bg.mp4']; f=[]; last='0:v'
names=[o[0] for o in ov]+['post']
for i,nm in enumerate(names): inputs+=['-loop','1','-i',W+f'ovp/{nm}.png']
for i,(nm,s,e) in enumerate(ov):
    f.append(f"[{last}][{i+1}:v]overlay=enable='between(t,{s:.2f},{e:.2f})':shortest=1[o{i}]"); last=f'o{i}'
k=len(ov)+1
f.append(f"[{k}:v]format=rgba,fade=t=in:st={pa:.2f}:d=0.15:alpha=1[pp];[{last}][pp]overlay=enable='between(t,{pa:.2f},{pb:.2f})':shortest=1[vv]")
# audio: host + nara + shutter clicks
sr=48000; n=int(T*sr); mix=np.zeros(n)
def put(path,start,gain=1.0):
    w=wave.open(path); a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(float)
    ch=w.getnchannels(); a=a.reshape(-1,ch).mean(1); r=w.getframerate()
    if r!=sr: a=np.interp(np.arange(0,len(a),r/sr),np.arange(len(a)),a)
    i=int(start*sr); a=a[:n-i]; mix[i:i+len(a)]+=a*gain
put(W+'q.wav',QS); put(W+NARA,N)
rng=np.random.default_rng(1)
for nm,s,e in ov:
    if nm=='flash':
        for dt in (0,0.045):
            i=int((s+dt)*sr); L=int(0.03*sr); env=np.exp(-np.linspace(0,8,L))
            mix[i:i+L]+=rng.normal(0,1,L)*env*2500
mix=np.clip(mix,-32767,32767).astype(np.int16)
w=wave.open(W+'mix.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(mix.tobytes()); w.close()
inputs+=['-i',W+'mix.wav']
run(['ffmpeg','-y']+inputs+['-filter_complex',';'.join(f),'-map','[vv]','-map',f'{k+1}:a','-t',f'{T:.2f}',
     '-c:v','libx264','-crf','14','-preset','fast','-c:a','pcm_s16le',W+'assembled.mov'])
e=reel.ep('au13')
e['close_cuts']=[[lines[0][0]-0.05,lines[0][1]+0.05],[lines[4][0]-0.05,T]]
reel.align=lambda L,sg: lines
print('question', QS, QS+qd, 'nara', N, 'total', T)
reel.compose('au13', e, W+'assembled.mov', [(N,N+nd)], QS+qd+0.1, e['question'], hook_label='คำถาม', sub_from=N,
             zoom_center=(0.5,0.3), hook_top=1180)
