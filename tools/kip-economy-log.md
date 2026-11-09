# Kip economy loop

Goal: a casual player makes the first shop buy in Ch2-3, owns 4-6 upgrade levels by the end of the story, and maxes all 12 levels after about 30-45 Endless days.
Knobs: day rewards, chapter reward, task money, upgrade effects. Off limits: shop prices (Paul set $500-1,000).
Tool: `python3 tools/kip-economy.py [config.json]` (40 seeds, median per profile).

| round | change | casual first buy / story levels / endless days to max | kept |
|---|---|---|---|
| base | none | ch4d3 / 2 / >60 | - |
| r0 | daily tasks counted (~$40 a day) | ch3d1 / 3 / 57 | yes |
| r1 | + day bonus by stars $0/20/50/90 (story: first time only, Endless: every day) | ch2d1 / 5 / 35 | **yes, in game** |
| r2 | + $150 per finished chapter | ch1d3 / 6 / 30 | no (first buy too early) |
| r3 | r1 + stronger upgrade effects | ch1d3 / 6 / 27 | no (too fast) |

r1 for all profiles: careful ch1d3 / 5 / 27, casual ch2d1 / 5 / 35, sloppy ch2d2 / 4 / 46.
In game: `DAYR=[0,20,50,90]` in endDay (pays only the stars gained above the best so far) and endlessEnd.
Status: in preview.html, waiting for Paul's OK before the demo (index.html) gets it.
