#!/usr/bin/env python3
"""Kip the Barista money loop: simulates coins earned and upgrades bought across the
7 story chapters (21 days) and then Endless Café, for three player profiles.

Mirrors the money rules in kip-barista/src/game.html: drink price (+size, +alt milk,
+extra shot, x specials board), tips by stars x tip jar x rule tipX, regular bonus,
cookie jar, ferry wave bonus, day/chapter rewards. The player buys the cheapest
upgrade level as soon as they can afford it (greedy), keeping a reserve of 0.

usage: python3 tools/kip-economy.py [config.json]   (prints one summary table)
"""
import json, random, sys

CFG = dict(
  cost={'grinder':[500,600,720],'tipjar':[600,720,864],'board':[800,960,1152],'cookies':[1000,1200,1440]},
  upv={'grinder':[0,.12,.24,.36],'tipjar':[1,1.3,1.6,2],'board':[0,.05,.1,.15],'cookies':[0,.15,.25,.35]},
  tip=[0,.2,.6,1.2], reg_bonus=1.5, cookie=3.5,
  day_reward=[0,20,50,90],    # paid at day end by day stars (first clear only in story)
  chapter_reward=0,          # paid once when a chapter's day 3 is cleared
  endless_day=[0,20,50,90],   # paid every endless day by day stars
  task_per_day=40,           # average daily-task money per game day
)
CH = [('rott',5,0),('frem',5,0),('cott',6,0),('sperth',7,0),('cbd',8,.2),('nbridge',8,.25),('vicpark',9,.3)]
TIPX = {'frem':(3,2.0),'cott':(2,1.5)}   # (customers affected, tip multiplier)
PRICE = {'flatwhite':5.2,'latte':5.2,'cappuccino':5.2,'longblack':4.8,'mocha':5.8,'espresso':4.0}
PROFILES = {  # chance of a correct serve, star split of correct serves, walk-out chance
  'careful':dict(ok=.97,s3=.85,s2=.13,walk=.01),
  'casual': dict(ok=.90,s3=.60,s2=.30,walk=.03),
  'sloppy': dict(ok=.80,s3=.35,s2=.40,walk=.08)}

def run(cfg, prof, endless_days=60, seed=1):
  R = random.Random(seed); P = PROFILES[prof]
  up = {k:0 for k in cfg['cost']}; coins = 0.0; buys = []; day_no = 0
  def buy(tag):
    nonlocal coins
    while True:
      opts = [(cfg['cost'][k][up[k]],k) for k in up if up[k] < 3]
      if not opts: return
      c,k = min(opts)
      if coins < c: return
      coins -= c; up[k] += 1; buys.append((tag,k,up[k]))
  def day(n, extra, tipx=None, regs=.25, endless_x=1.0):
    nonlocal coins
    got = 0.0; star_sum = 0
    for i in range(n):
      if R.random() < P['walk']: continue
      d = R.choice(list(PRICE)); pr = PRICE[d] + R.choice([0,.5,.5,1]) + (.7 if R.random()<.3 else 0) + (.6 if R.random()<extra else 0)
      pr = round(pr*(1+cfg['upv']['board'][up['board']]),1)
      if R.random() > P['ok']: got += pr; continue          # wrong drink: paid, no tip, 0 stars
      x = R.random(); st = 3 if x < P['s3'] else 2 if x < P['s3']+P['s2'] else 1
      star_sum += st
      tx = 1.0
      if tipx and i >= n//2-1 and i < n//2-1+tipx[0]: tx = tipx[1]
      tip = cfg['tip'][st]*cfg['upv']['tipjar'][up['tipjar']]*tx*endless_x
      if R.random() < regs: tip += cfg['reg_bonus']
      if R.random() < cfg['upv']['cookies'][up['cookies']]: tip += cfg['cookie']
      got += pr + tip
    r = star_sum/(3*n); ds = 3 if r>=.8 else 2 if r>=.5 else 1 if r>.2 else 0
    return got, ds
  # story
  for ci,(cid,base,extra) in enumerate(CH):
    for k in range(3):
      day_no += 1
      g, ds = day(base+k, extra, TIPX.get(cid))
      coins += g + cfg['day_reward'][ds] + cfg['task_per_day']
      if k == 2: coins += cfg['chapter_reward']
      buy(f'ch{ci+1}d{k+1}')
  story_levels = sum(up.values()); first = buys[0][0] if buys else '-'
  # endless
  done_day = None
  for d in range(1, endless_days+1):
    n = min(12, 8+d//3); tipx = min(2, 1+d*.05)
    g, ds = day(n, min(.4,.2+d*.01), endless_x=tipx, regs=.4)
    coins += g + cfg['endless_day'][ds] + cfg['task_per_day']
    buy(f'e{d}')
    if done_day is None and sum(up.values()) == 12: done_day = d
  return dict(first=first, story_levels=story_levels, endless_max=done_day or f'>{endless_days}')

def summary(cfg, seeds=40):
  out = {}
  for prof in PROFILES:
    rs = [run(cfg, prof, seed=s) for s in range(seeds)]
    firsts = sorted(r['first'] for r in rs)
    lv = sorted(r['story_levels'] for r in rs)
    em = [r['endless_max'] for r in rs]
    emn = sorted(x for x in em if isinstance(x,int))
    out[prof] = dict(first_buy=firsts[len(firsts)//2], story_levels_median=lv[len(lv)//2],
                     endless_days_to_max=(emn[len(emn)//2] if len(emn) > seeds//2 else '>60'))
  return out

if __name__ == '__main__':
  cfg = dict(CFG)
  if len(sys.argv) > 1: cfg.update(json.load(open(sys.argv[1])))
  for k,v in summary(cfg).items(): print(f'{k:8s}', v)
