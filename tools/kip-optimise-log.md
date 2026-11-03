# Kip the Barista: Day 1 difficulty loop (Rottnest Jetty)

Date: 2026-11-03. Bot: `tools/kip-bot.cjs` plays the real build headless (videos off, time x10) with 3 player profiles:
careful (reads 3 s, taps 1.0 s, 2% till slips), casual first-timer (5 s, 1.6 s, 6% per choice, +8 s learning on customer 1),
sloppy (7 s, 2.3 s, 12% per choice, +12 s learning). 40 runs per profile per round. `tools/kip-analyse.py` pools the random
till slips (same rate for every config) and bootstraps 20k days, so rounds compare on timing, not luck.
Test copy only: frame dt cap raised so patience drains in real time when headless frames are slow (`tools/kip-tune.py`).

Goal: casual first-timer gets 3 stars on Day 1 in 65-80% of days; sloppy gets 2+ stars in about 70%; careful ~always 3.

| Round | Change | Casual 3★ | Sloppy 2★+ | Sloppy walkouts | Kept |
|---|---|---|---|---|---|
| 0 | baseline: patience 52 s, 5 customers | 41% | 37% | 12% | - |
| 1 | Day 1 patience 60 (20 runs, raw) | too noisy to read | | | redone in 3 |
| 2 | first 2 customers of Day 1 get 1.5x patience (`learn`) | 51% | 62-67% | 1-3% | yes |
| 3 | + Day 1 patience 58 (`patience1`) | 56% | 70% | 4% | yes |
| 4 | + day stars at >= 80% / >= 50% instead of > (all days) | 80% | 70% (3★ 13%) | 4% | yes |

Why 4: one wrong drink out of five (12/15 = 80%) used to cut 3 stars to 2 however fast you were; casual players ring up
about 1 wrong order in 10. Now 80% earns 3 stars. This rule applies to every day and branch.
Preview: kip-barista/preview.html. Live demo unchanged until Paul approves.
