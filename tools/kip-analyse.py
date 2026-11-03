# Kip Day-1 analyser. Wrong orders rung up at the till are random player mistakes (same rate in every config),
# so they are pooled across all configs; only the timing outcome comes from each config. Then 20k Day-1 runs are bootstrapped.
import json,random,sys
random.seed(1)
def custs(path):
    out={}
    for prof,rs in json.load(open(path)).items():
        for r in rs:
            for c in r.get('log',[]):
                out.setdefault(prof,[]).append(c)
    return out
def till_err(c): return c['tk']!=c['ord']
def analyse(paths,ge=False,n=20000):
    all_=[custs(p) for p in paths]
    res=[]
    for k,C in enumerate(all_):
        row={}
        for prof,L in C.items():
            pooled=[c for A in all_ for c in A.get(prof,[])]
            perr=sum(till_err(c) for c in pooled)/len(pooled)
            pos={}
            for c in L:
                if not till_err(c): pos.setdefault(c['i'],[]).append(c['got'])
            d=[0,0,0,0]
            for _ in range(n):
                st=sum(0 if random.random()<perr else random.choice(pos[i]) for i in range(1,6)); r=st/15
                ds=(3 if r>=.8 else 2 if r>=.5 else 1 if r>.2 else 0) if ge else (3 if r>.8 else 2 if r>.5 else 1 if r>.2 else 0)
                d[ds]+=1
            ok=[x for i in pos for x in pos[i]]
            row[prof]={'3star':round(d[3]/n,2),'2plus':round((d[2]+d[3])/n,2),'starsWhenRight':round(sum(ok)/len(ok),2),'timeouts':round(ok.count(0)/len(ok),3),'tillErr':round(perr,2)}
        res.append((paths[k].split('/')[-1],row))
    return res
if __name__=='__main__':
    ge='--ge' in sys.argv
    for name,row in analyse([a for a in sys.argv[1:] if not a.startswith('--')],ge): print(name,json.dumps(row))
