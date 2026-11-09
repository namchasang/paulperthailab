# Kip the Barista

One source file, two builds. Never edit `index.html` or `preview.html` by hand.

- Edit `kip-barista/src/game.html` (the full game; same file as Paul's private Claude link).
- Run `python3 tools/kip-build.py` from the repo root. It writes:
  - `index.html` = DEMO (chapters 1-2 only, endless locked, DEMO tag) at `/kip-barista/`
  - `preview.html` = FULL game with a PREVIEW tag at `/kip-barista/preview.html` (for Paul to test before go-live)
- Demo-only behaviour is behind `window.KIP_DEMO` (set by the build): `DEMO_OPEN`, `inDemo()`, the DEMO eyebrow. Do not fork the code.
- The build stops if an output was edited by hand since the last build; move the change into `src/game.html`, then `--force`.
- Assets sit next to the outputs: `kip-*.mp4` (Kip clips, 720p, no watermark), `cut-<chapter>.mp4` cutscenes, `cust-<id>.jpg` customer portraits (360x360), `kip-bg.jpg`.
- After publishing the source to the Claude link, also run the build and push so the site matches.
- Test: Playwright on `file://.../kip-barista/index.html` and `preview.html`; `window.__kip` exposes `S, act, charge, serve, DR, recipe`.
- Story: Kip just graduated, left his little home in Victoria Park, runs a café by the Rottnest jetty; 7 chapters at the same café; ending = Mum and Dad visit. No third-party trade names, no real businesses, no Aboriginal place names.
