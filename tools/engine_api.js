// ===================== API per il sito (aggiunta da build_engine.py) =====================
const lerpE = (a, b, k) => a + (b - a) * k;
const angD = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
let glitchLeft = 0, ledTimerE = 0;
const body = { x: 0, z: 0, tx: 0, tz: 0, yaw: 0, yawTarget: 0, walk: 0, phase: 0, speed: 1.4 };

// BIT always wears the LED mask + black hood on the site (same as the videos)
mask.visible = hoodNeck.visible = true;
faceParts.forEach(p => p.visible = false);
neck.visible = false; glasses.visible = false; beard.visible = false;

/** Adatta renderer, render target PS1 e camera alla finestra. pxH = risoluzione verticale interna. */
export function setView(w, h, pxH) {
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  LH = Math.max(120, Math.round(pxH)); LW = Math.max(80, Math.round(pxH * w / h));
  rt.setSize(LW, LH); postMat.uniforms.uRes.value.set(LW, LH);
  psxU.uSnap.value.set(LW / 2, LH / 2); // light vertex wobble
  cam.aspect = w / h; cam.updateProjectionMatrix();
}
export function glitch(s = 0.45) { glitchLeft = s; }
export function setScene(name) { setBg(name); }
/** Dove BIT deve camminare (coordinate mondo) e dove guardare quando è fermo. */
export function walkTo(x, z) { body.tx = x; body.tz = z; }
export function placeAt(x, z) { body.x = body.tx = x; body.z = body.tz = z; avatar.position.set(x, 0, z); }
export function faceYaw(y) { body.yawTarget = y; }
export function gesturePlay(name) { playGesture(name); }
export function getBody() { return body; }

/**
 * Anima BIT per un frame.
 * o.talk 0..1 (bocca), o.speaking bool (mani che gesticolano), o.lookX/lookY -1..1 (sguardo verso il cursore),
 * o.expr: forza un'espressione LED ('happy','think','x','squint','normal'), o.reduced: meno movimento
 */
export function update(dt, o = {}) {
  t += dt;
  if (farm.visible && (ledTimerE -= dt) <= 0) { ledTimerE = 0.18; updateRackLEDs(); }

  // camminata
  const dx = body.tx - body.x, dz = body.tz - body.z, dist = Math.hypot(dx, dz), moving = dist > 0.03;
  if (moving) { const sp = Math.min(dist, body.speed * dt); body.x += dx / dist * sp; body.z += dz / dist * sp; }
  body.walk = lerpE(body.walk, moving ? 1 : 0, Math.min(1, dt * 6));
  body.phase += dt * 7.5 * body.walk;
  const target = moving ? Math.atan2(dx, dz) * 0.75 + body.yawTarget * 0.25 : body.yawTarget;
  body.yaw += angD(body.yaw, target) * Math.min(1, dt * 5);
  avatar.position.set(body.x, 0, body.z); avatar.rotation.y = body.yaw;

  // voce / gesticolare
  talk = lerpE(talk, o.talk || 0, Math.min(1, dt * 22));
  speakEnv = lerpE(speakEnv, o.speaking ? 1 : 0, Math.min(1, dt * (o.speaking ? 4 : 1.2)));
  if (gesture) { gestureT += dt; if (gestureT > gesture.dur) gesture = null; }

  const k = Math.min(1, dt * 7);
  for (const side of ['L', 'R']) {
    let tg = { ...REST[side] };
    if (speakEnv > 0.02) {
      for (const p in tg) tg[p] = lerpE(tg[p], TALK[side][p], speakEnv);
      const ph = side === 'L' ? 0 : 1.9;
      tg.ex += Math.sin(t * 2.6 + ph) * 0.22 * speakEnv + talk * -0.15;
    }
    if (body.walk > 0.01) tg.sx += -Math.sin(body.phase + (side === 'L' ? 0 : Math.PI)) * 0.38 * body.walk;
    if (gesture && gesture[side]) tg = { ...tg, ez: 0, ...gesture[side] };
    for (const p in tg) cur[side][p] = lerpE(cur[side][p], tg[p], k);
    const a = arms[side], c = cur[side];
    let ez = c.ez;
    if (gesture && gesture.wave && side === 'R') ez += Math.sin(gestureT * 10) * 0.4 * Math.min(1, gestureT * 3);
    a.sh.rotation.set(c.sx, c.sy, c.sz); a.el.rotation.set(c.ex, 0, ez);
  }
  shrugCur = lerpE(shrugCur, gesture && gesture.shrug ? 1 : 0, k);
  arms.L.sh.position.y = arms.R.sh.position.y = 0.56 + shrugCur * 0.04;

  // testa: idle + sguardo verso il cursore
  const ht = { x: Math.sin(t * 0.7) * 0.03 - (o.lookY || 0) * 0.25, y: Math.sin(t * 0.43) * 0.06 + (o.lookX || 0) * 0.45, z: Math.sin(t * 0.51) * 0.03 };
  ht.x += speakEnv * (Math.sin(t * 4.1) * 0.04 + talk * 0.05);
  if (gesture && gesture.head) for (const p in gesture.head) ht[p] += gesture.head[p];
  for (const p in ht) headCur[p] = lerpE(headCur[p], ht[p], Math.min(1, dt * 5));
  let hx = headCur.x, hy = headCur.y;
  if (gesture && gesture.nod) hx += Math.sin(gestureT * 11) * 0.18 * (1 - gestureT / gesture.dur);
  if (gesture && gesture.shake) hy += Math.sin(gestureT * 11) * 0.3 * (1 - gestureT / gesture.dur);
  head.rotation.set(hx, hy, headCur.z);

  // faccia LED
  blinkT -= dt;
  if (blinkT <= 0) { blinkPhase = 0.14; blinkT = 2 + Math.random() * 3.5; }
  if (blinkPhase > 0) blinkPhase -= dt;
  const g = gesture ? gesture.name : '';
  const expr = o.expr || GEST_EXPR[g] || 'normal';
  const look = g === 'indica' ? 1 : (o.lookX || 0) * 0.8 + Math.sin(t * 0.43) * 0.15;
  drawLED(expr, talk, look, blinkPhase > 0 && expr === 'normal');

  // corpo
  hips.position.y = 1.0 + Math.sin(t * 1.6) * 0.004 + Math.abs(Math.sin(body.phase)) * 0.035 * body.walk;
  legs.forEach((lg, i) => lg.rotation.x = Math.sin(body.phase + i * Math.PI) * 0.5 * body.walk);
  hips.rotation.z = Math.sin(t * 0.55) * 0.012;
  torso.rotation.x = Math.sin(t * 1.6) * 0.008 + speakEnv * 0.02;

  // set animati + glitch
  for (const n in SETS) if (SETS[n].group.visible) SETS[n].upd.forEach(f => f(t, dt));
  glitchLeft = Math.max(0, glitchLeft - dt);
  postMat.uniforms.uGlitch.value = o.reduced ? 0 : Math.min(1, glitchLeft / 0.35);
  postMat.uniforms.uTime.value = t;
}

export function render() {
  renderer.setRenderTarget(rt); renderer.render(scene, cam);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}

export { THREE, scene, cam, avatar, renderer, ambient, fill, SETS };
