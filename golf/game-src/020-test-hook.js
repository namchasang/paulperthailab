/* test hook */
window.__g = { prof(){ const gl = renderer.getContext(), o = {}; const t0 = performance.now(); renderer.render(scene, camera); gl.finish(); o.full = performance.now() - t0;
    const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; scene.traverse(m => { if (m.material) m.material.needsUpdate = true; }); renderer.render(scene, camera); gl.finish(); const t1 = performance.now(); renderer.render(scene, camera); gl.finish(); o.noShadow = performance.now() - t1; renderer.shadowMap.enabled = sm; scene.traverse(m => { if (m.material) m.material.needsUpdate = true; });
    veg.visible = false; const t2 = performance.now(); renderer.render(scene, camera); gl.finish(); o.noVeg = performance.now() - t2; veg.visible = true; o.calls = renderer.info.render.calls; o.tris = renderer.info.render.triangles; return o; }, S, H, surface, PIN, TEE, GRN, LEN, roos, MG, CLUBS, shoot(pw, club){ if (club != null) { S.club = club; showClub(); } S.power = pw; S.mode = 'swing'; S.swingT = 0; },
  step(n, dt = 1 / 30, render = false){ for (let i = 0; i < n; i++) tick(dt, !(render && i === n - 1)); }, setWx(i){ wxi = i; applyWx(); }, readyShot, resetHole };
})();
</script>
</body>
</html>
