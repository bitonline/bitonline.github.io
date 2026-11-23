// GENERATO da tools/build_engine.py — non modificare a mano
import * as THREE from 'three';

THREE.ColorManagement.enabled = false;
const __stub = { jitter: { value: '1.5' }, ledMouth: { checked: true }, bgColor: { value: '#05080e' }, bg: { value: 'farm' }, autoHands: { checked: true }, camLive: { checked: false } };
const $ = id => (id === 'stage' ? document.getElementById(id) : null) || __stub[id] || { value: '', checked: false };

// ---------- Renderer / output ----------
const OUT_W = 1080, OUT_H = 1920;
const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(OUT_W, OUT_H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

let LW = 240, LH = 426;
const rt = new THREE.WebGLRenderTarget(LW, LH, {
  minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true
});

// ---------- PS1 vertex snapping ----------
const psxU = { uSnap: { value: new THREE.Vector2(80, 142) }, uJitter: { value: 1 } };
function psx(mat) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uSnap = psxU.uSnap; sh.uniforms.uJitter = psxU.uJitter;
    sh.vertexShader = 'uniform vec2 uSnap; uniform float uJitter;\n' +
      sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      if (uJitter > 0.5) { vec4 sp = gl_Position; sp.xyz /= sp.w;
        sp.xy = floor(sp.xy * uSnap + 0.5) / uSnap; sp.xyz *= sp.w; gl_Position = sp; }`);
  };
  return mat;
}
const M = (color, o = {}) => psx(new THREE.MeshLambertMaterial({ color, flatShading: true, ...o }));

// ---------- Post (pixel + dither + 15-bit) ----------
const postMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(LW, LH) },
              uDither: { value: 1 }, uLevels: { value: 31 }, uGain: { value: 1.0 }, uGlitch: { value: 0 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uDither; uniform float uLevels; uniform float uGain; uniform float uGlitch; uniform float uTime; varying vec2 vUv;
    float bayer(vec2 p){ int x = int(mod(p.x,4.)); int y = int(mod(p.y,4.));
      float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
      return m[x + y*4] / 16. - 0.5; }
    void main(){ vec2 px = floor(vUv * uRes); vec2 uv = (px + 0.5) / uRes; float g = uGlitch;
      if (g > 0.001) { float row = floor(uv.y * 28.); float r = fract(sin(row * 91.3 + floor(uTime * 24.) * 7.1) * 43758.5);
        uv.x += (r - 0.5) * 0.18 * g * step(0.45, r); }
      vec3 c = vec3(texture2D(tDiffuse, uv + vec2(0.012 * g, 0.)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - vec2(0.012 * g, 0.)).b) * uGain;
      c = mix(c, c * vec3(0.6, 1.2, 1.3), g * 0.5);
      c += bayer(px) * uDither / uLevels; c = floor(c * uLevels + 0.5) / uLevels;
      gl_FragColor = vec4(clamp(c, 0., 1.), 1.); }`,
  depthTest: false, depthWrite: false
});
const postScene = new THREE.Scene();
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function setRes(w) {
  LW = w; LH = Math.round(w * 16 / 9);
  rt.setSize(LW, LH); postMat.uniforms.uRes.value.set(LW, LH); setJitter();
}
function setJitter() {
  const j = parseFloat($('jitter').value);
  psxU.uJitter.value = j > 0 ? 1 : 0;
  const f = j > 0 ? 1 / j : 1;
  psxU.uSnap.value.set(LW / 2 * f, LH / 2 * f);
}

// ---------- Scene ----------
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(30, 9 / 16, 0.05, 50);
const ambient = new THREE.AmbientLight(0xffffff, 0.75); scene.add(ambient);
const fill = new THREE.DirectionalLight(0xdfe9ff, 0); fill.position.set(-0.5, 1.8, 4); scene.add(fill);
const key = new THREE.DirectionalLight(0xfff1dd, 1.0); key.position.set(1.5, 3, 2.5); scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 0.45); rim.position.set(-2, 2, -2); scene.add(rim);

// ---------- Materials ----------
const mats = {
  suit: M('#111114'), lapel: M('#26262b', { side: THREE.DoubleSide }), shirt: M('#f4f4f2', { side: THREE.DoubleSide }),
  tie: M('#0a0a0c', { side: THREE.DoubleSide }), skin: M('#e0a27c'), hair: M('#2b1d14'), shoe: M('#151515'),
  dark: M('#101010'), mouth: M('#4a1414'), eyeW: M('#f4f1ea'), frame: M('#141414'), button: M('#2a2a2e')
};
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
const limb = (r1, r2, len, seg, m) => { const g = new THREE.CylinderGeometry(r1, r2, len, seg); g.translate(0, -len / 2, 0); return new THREE.Mesh(g, m); };
const shape = (pts, m) => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => s.lineTo(p[0], p[1])); return new THREE.Mesh(new THREE.ShapeGeometry(s), m); };

// ---------- Avatar ----------
const avatar = new THREE.Group(); scene.add(avatar);
const hips = new THREE.Group(); hips.position.y = 1.0; avatar.add(hips);
const legs = [];

for (const s of [-1, 1]) {
  const leg = new THREE.Group(); leg.position.x = 0.1 * s; hips.add(leg); legs.push(leg);
  leg.add(limb(0.1, 0.085, 0.92, 6, mats.suit));
  leg.add(mesh(new THREE.BoxGeometry(0.13, 0.08, 0.27), mats.shoe, 0, -0.96, 0.05));
}

const torso = new THREE.Group(); hips.add(torso);
const jg = new THREE.CylinderGeometry(0.27, 0.23, 0.74, 8, 1, false, Math.PI / 8); jg.scale(1, 1, 0.62);
torso.add(mesh(jg, mats.suit, 0, 0.25, 0));
// shirt V + tie + lapels
const front = new THREE.Group(); front.position.set(0, 0.63, 0.158); torso.add(front);
front.add(shape([[-0.1, 0], [0.1, 0], [0, -0.34]], mats.shirt));
const tie = new THREE.Group(); tie.position.z = 0.004; front.add(tie);
tie.add(shape([[-0.028, -0.005], [0.028, -0.005], [0.018, -0.045], [-0.018, -0.045]], mats.tie));
tie.add(shape([[-0.016, -0.045], [0.016, -0.045], [0.032, -0.22], [0, -0.26], [-0.032, -0.22]], mats.tie));
for (const s of [-1, 1]) {
  const lp = shape([[s * 0.1, 0.005], [s * 0.16, 0.005], [s * 0.035, -0.32], [0, -0.345]], mats.lapel);
  lp.position.z = 0.002; front.add(lp);
}
for (const y of [0.2, 0.08]) torso.add(mesh(new THREE.BoxGeometry(0.025, 0.025, 0.015), mats.button, 0, y, 0.145));
// pocket square
torso.add(mesh(new THREE.BoxGeometry(0.06, 0.02, 0.01), mats.shirt, 0.15, 0.47, 0.152));
// collar + neck
torso.add(mesh(new THREE.CylinderGeometry(0.078, 0.085, 0.07, 6), mats.shirt, 0, 0.64, 0));
const neck = mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.14, 6), mats.skin, 0, 0.68, 0); torso.add(neck);

// head
const head = new THREE.Group(); head.position.y = 0.72; torso.add(head);
const skull = mesh(new THREE.IcosahedronGeometry(0.16, 1), mats.skin, 0, 0.15, 0); skull.scale.set(0.95, 1.12, 1); head.add(skull);
const hairTop = mesh(new THREE.SphereGeometry(0.168, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mats.hair, 0, 0.205, -0.008);
hairTop.scale.set(0.98, 0.95, 1.04); head.add(hairTop);
head.add(mesh(new THREE.BoxGeometry(0.27, 0.17, 0.11), mats.hair, 0, 0.17, -0.1));
for (const s of [-1, 1]) {
  head.add(mesh(new THREE.BoxGeometry(0.025, 0.07, 0.05), mats.hair, s * 0.148, 0.17, -0.02)); // sideburns
  head.add(mesh(new THREE.BoxGeometry(0.03, 0.06, 0.04), mats.skin, s * 0.155, 0.125, -0.01)); // ears
}
head.add(mesh(new THREE.BoxGeometry(0.2, 0.03, 0.05), mats.hair, 0.02, 0.225, 0.13)); // fringe
const eyes = [];
for (const s of [-1, 1]) {
  const e = new THREE.Group(); e.position.set(s * 0.055, 0.14, 0.157); head.add(e);
  e.add(mesh(new THREE.BoxGeometry(0.048, 0.03, 0.008), mats.eyeW));
  e.add(mesh(new THREE.BoxGeometry(0.02, 0.026, 0.008), mats.dark, 0, 0, 0.004));
  eyes.push(e);
  const brow = mesh(new THREE.BoxGeometry(0.058, 0.013, 0.014), mats.hair, s * 0.055, 0.183, 0.155);
  brow.rotation.z = -s * 0.08; head.add(brow); brow.userData.s = s; eyes.push(brow);
}
const brows = eyes.filter((_, i) => i % 2 === 1); const eyeGroups = eyes.filter((_, i) => i % 2 === 0);
const nose = mesh(new THREE.ConeGeometry(0.022, 0.06, 4), mats.skin, 0, 0.095, 0.168); nose.rotation.x = Math.PI / 2; head.add(nose);
const mouth = new THREE.Group(); mouth.position.set(0, 0.045, 0.148); head.add(mouth);
mouth.add(mesh(new THREE.BoxGeometry(0.07, 0.014, 0.016), mats.mouth));
// glasses
const glasses = new THREE.Group(); glasses.position.set(0, 0.14, 0.168); head.add(glasses);
for (const s of [-1, 1]) {
  const fx = s * 0.057;
  glasses.add(mesh(new THREE.BoxGeometry(0.075, 0.008, 0.006), mats.frame, fx, 0.026, 0));
  glasses.add(mesh(new THREE.BoxGeometry(0.075, 0.008, 0.006), mats.frame, fx, -0.026, 0));
  glasses.add(mesh(new THREE.BoxGeometry(0.008, 0.06, 0.006), mats.frame, fx - 0.036, 0, 0));
  glasses.add(mesh(new THREE.BoxGeometry(0.008, 0.06, 0.006), mats.frame, fx + 0.036, 0, 0));
  glasses.add(mesh(new THREE.BoxGeometry(0.006, 0.008, 0.14), mats.frame, s * 0.15, 0.02, -0.075));
}
// beard
const beard = new THREE.Group(); head.add(beard); beard.visible = false;
beard.add(mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), mats.hair, 0, 0.0, 0.11));
beard.add(mesh(new THREE.BoxGeometry(0.09, 0.016, 0.02), mats.hair, 0, 0.068, 0.152));

// ---------- LED mask ----------
const faceParts = head.children.slice(); // skin, hair, eyes, glasses, beard...
const mask = new THREE.Group(); head.add(mask);
// black balaclava hood: covers hair, ears and skin of the head
const hoodMat = M('#141416');
const hood = mesh(new THREE.IcosahedronGeometry(0.178, 1), hoodMat, 0, 0.17, -0.012);
hood.scale.set(0.98, 1.12, 1.06); mask.add(hood);
const hoodNeck = mesh(new THREE.CylinderGeometry(0.072, 0.08, 0.16, 8), hoodMat, 0, 0.67, 0);
torso.add(hoodNeck);
const maskMat = psx(new THREE.MeshPhongMaterial({ color: '#0b0b0d', specular: '#55555e', shininess: 40, flatShading: true, side: THREE.DoubleSide }));
const shell = mesh(new THREE.SphereGeometry(0.17, 12, 9, Math.PI / 2 - 1.25, 2.5, 0.32, 2.3), maskMat, 0, 0.14, 0.012);
shell.scale.set(0.99, 1.2, 1.06); mask.add(shell);
const strap = mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.045, 12, 1, true), M('#1a1a1c', { side: THREE.DoubleSide }), 0, 0.16, -0.005);
strap.scale.set(0.99, 1, 1.07); mask.add(strap);
const LED_W = 40, LED_H = 24, LED_PX = 4;
const ledLogic = document.createElement('canvas'); ledLogic.width = LED_W; ledLogic.height = LED_H;
const ledCanvas = document.createElement('canvas'); ledCanvas.width = LED_W * LED_PX; ledCanvas.height = LED_H * LED_PX;
const ledTex = new THREE.CanvasTexture(ledCanvas); ledTex.magFilter = THREE.NearestFilter; ledTex.minFilter = THREE.LinearFilter;
const panelR = 0.3, panelHalf = 0.42;
const ledPanel = mesh(new THREE.CylinderGeometry(panelR, panelR, 0.16, 8, 1, true, -panelHalf, panelHalf * 2),
  psx(new THREE.MeshBasicMaterial({ map: ledTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })),
  0, 0.14, 0.192 - panelR);
mask.add(ledPanel);
let ledColor = '#33d6ff', ledKey = '';
function drawLED(expr, talkLv, look, blink) {
  const key = [expr, Math.round(talkLv * 6), Math.round(look * 4), blink, ledColor, $('ledMouth').checked].join('|');
  if (key === ledKey) return; ledKey = key;
  const c = ledLogic.getContext('2d'); c.clearRect(0, 0, LED_W, LED_H);
  c.strokeStyle = c.fillStyle = '#fff'; c.lineWidth = 2; c.lineCap = 'round';
  const cy = 9, ex = [11, 29].map(x => x + look * 3);
  for (const x of ex) {
    c.beginPath();
    if (blink) { c.moveTo(x - 5, cy); c.lineTo(x + 5, cy); }
    else if (expr === 'happy') { c.arc(x, cy + 3, 5, Math.PI * 1.1, Math.PI * 1.9); }
    else if (expr === 'x') { c.moveTo(x - 4, cy - 4); c.lineTo(x + 4, cy + 4); c.moveTo(x + 4, cy - 4); c.lineTo(x - 4, cy + 4); }
    else if (expr === 'squint') { c.moveTo(x - 5, cy - 3 * (x < 20 ? 1 : -1)); c.lineTo(x + 5, cy); c.lineTo(x - 5, cy + 3 * (x < 20 ? 1 : -1)); }
    else if (expr === 'think') { c.arc(x, cy + 1, 4, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(x - 6, cy - 7); c.lineTo(x + 6, cy - (x < 20 ? 5 : 8)); }
    else { c.arc(x, cy, 5.5, 0, Math.PI * 2); }
    c.stroke();
  }
  if ($('ledMouth').checked && talkLv > 0.06) {
    const h = 1 + talkLv * 5, w = 7 + talkLv * 3;
    c.beginPath(); c.ellipse(20, 19, w, h, 0, 0, Math.PI * 2); c.stroke();
  } else if (expr === 'happy') { c.beginPath(); c.arc(20, 16, 5, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
  const px = c.getImageData(0, 0, LED_W, LED_H).data;
  const o = ledCanvas.getContext('2d'); o.fillStyle = '#000'; o.fillRect(0, 0, ledCanvas.width, ledCanvas.height);
  const col = new THREE.Color(ledColor); const dim = `rgb(${col.r * 255 * 0.07 | 0},${col.g * 255 * 0.07 | 0},${col.b * 255 * 0.07 | 0})`;
  for (let y = 0; y < LED_H; y++) for (let x = 0; x < LED_W; x++) {
    const on = px[(y * LED_W + x) * 4 + 3] > 90;
    o.fillStyle = on ? ledColor : dim;
    o.fillRect(x * LED_PX, y * LED_PX, LED_PX - 1, LED_PX - 1);
  }
  ledTex.needsUpdate = true;
}
const GEST_EXPR = { saluta: 'happy', si: 'happy', no: 'x', boh: 'squint', pensa: 'think' };

// arms
function makeArm(s) {
  const sh = new THREE.Group(); sh.position.set(0.31 * s, 0.56, 0); torso.add(sh);
  sh.add(mesh(new THREE.IcosahedronGeometry(0.088, 0), mats.suit));
  sh.add(limb(0.075, 0.065, 0.34, 6, mats.suit));
  const el = new THREE.Group(); el.position.y = -0.34; sh.add(el);
  el.add(limb(0.066, 0.056, 0.28, 6, mats.suit));
  const cuff = limb(0.05, 0.05, 0.03, 6, mats.shirt); cuff.position.y = -0.27; el.add(cuff);
  const hand = new THREE.Group(); hand.position.y = -0.3; el.add(hand);
  hand.add(mesh(new THREE.BoxGeometry(0.035, 0.1, 0.075), mats.skin, 0, -0.04, 0));
  hand.add(mesh(new THREE.BoxGeometry(0.025, 0.05, 0.025), mats.skin, -s * 0.012, -0.02, 0.045));
  return { sh, el, hand, s, baseY: 0.56 };
}
const arms = { L: makeArm(-1), R: makeArm(1) };

// ---------- Studio set ----------
const studio = new THREE.Group(); scene.add(studio);
const ck = document.createElement('canvas'); ck.width = ck.height = 32;
{ const c = ck.getContext('2d'); c.fillStyle = '#3b3530'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#4c443c'; c.fillRect(0, 0, 16, 16); c.fillRect(16, 16, 16, 16); }
const ckT = new THREE.CanvasTexture(ck); ckT.magFilter = ckT.minFilter = THREE.NearestFilter; ckT.generateMipmaps = false;
ckT.wrapS = ckT.wrapT = THREE.RepeatWrapping; ckT.repeat.set(8, 8);
const floor = mesh(new THREE.PlaneGeometry(12, 12, 12, 12), psx(new THREE.MeshLambertMaterial({ map: ckT })));
floor.rotation.x = -Math.PI / 2; studio.add(floor);
const wall = mesh(new THREE.PlaneGeometry(12, 6, 12, 6), M('#2d4250'), 0, 3, -1.8); studio.add(wall);
const skirt = mesh(new THREE.BoxGeometry(12, 0.15, 0.05), M('#1d2a33'), 0, 0.075, -1.77); studio.add(skirt);
const bc = document.createElement('canvas'); bc.width = 256; bc.height = 128;
const bT = new THREE.CanvasTexture(bc); bT.magFilter = bT.minFilter = THREE.NearestFilter; bT.generateMipmaps = false;
const board = new THREE.Group(); board.position.set(0, 1.9, -1.74); studio.add(board);
board.add(mesh(new THREE.BoxGeometry(2.3, 1.25, 0.06), M('#6b4423')));
board.add(mesh(new THREE.PlaneGeometry(2.15, 1.1, 4, 2), psx(new THREE.MeshLambertMaterial({ map: bT })), 0, 0, 0.032));
board.add(mesh(new THREE.BoxGeometry(2.0, 0.04, 0.1), M('#6b4423'), 0, -0.64, 0.06));
function drawBoard(text) {
  const c = bc.getContext('2d');
  c.fillStyle = '#1f3d2e'; c.fillRect(0, 0, 256, 128);
  c.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 14; i++) c.fillRect((i * 53) % 240, (i * 37) % 120, 22, 4);
  c.fillStyle = '#e9efe4'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const words = text.toUpperCase().split(/\s+/); const lines = []; let cur = '';
  c.font = 'bold 26px monospace';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > 230 && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  const L = lines.slice(0, 3); const fs = L.length > 2 ? 22 : 26; c.font = `bold ${fs}px monospace`;
  L.forEach((l, i) => c.fillText(l, 128, 64 + (i - (L.length - 1) / 2) * (fs + 6)));
  c.strokeStyle = '#e9efe4'; c.lineWidth = 2; c.beginPath(); c.moveTo(30, 112); c.lineTo(226, 112); c.stroke();
  bT.needsUpdate = true;
}
drawBoard($('boardText').value);
// lamp + plant for atmosphere
const plant = new THREE.Group(); plant.position.set(-1.25, 0, -1.2); studio.add(plant);
plant.add(mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.32, 6), M('#8a4b2a'), 0, 0.16, 0));
for (let i = 0; i < 6; i++) {
  const lf = mesh(new THREE.ConeGeometry(0.07, 0.55, 3), M(i % 2 ? '#2f6b3a' : '#3d8a4a'), 0, 0.55, 0);
  lf.rotation.set(Math.cos(i) * 0.5, i, Math.sin(i * 1.7) * 0.5); plant.add(lf);
}
const desk = new THREE.Group(); desk.position.set(1.3, 0, -1.1); studio.add(desk);
desk.add(mesh(new THREE.BoxGeometry(0.7, 0.75, 0.5), M('#5a3a22'), 0, 0.375, 0));
desk.add(mesh(new THREE.BoxGeometry(0.22, 0.28, 0.2), M('#c9c3b3'), -0.1, 0.89, 0)); // pile of books
desk.add(mesh(new THREE.BoxGeometry(0.24, 0.05, 0.21), M('#a83232'), -0.1, 1.055, 0));
desk.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 6), M('#ddd'), 0.15, 0.8, 0.05));

// ---------- Server farm set ----------
const farm = new THREE.Group(); scene.add(farm); farm.visible = false;
function nearestTex(cv) { const tx = new THREE.CanvasTexture(cv); tx.magFilter = tx.minFilter = THREE.NearestFilter; tx.generateMipmaps = false; return tx; }
{
  // perforated raised-floor tiles
  const fc = document.createElement('canvas'); fc.width = fc.height = 32;
  const c = fc.getContext('2d'); c.fillStyle = '#2b323d'; c.fillRect(0, 0, 32, 32);
  c.fillStyle = '#1d222a'; for (let y = 5; y < 28; y += 4) for (let x = 5; x < 28; x += 4) c.fillRect(x, y, 2, 2);
  c.fillStyle = '#56607280'; c.fillRect(0, 0, 32, 1); c.fillRect(0, 0, 1, 32);
  const ft = nearestTex(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(5, 32);
  const fl = mesh(new THREE.PlaneGeometry(5, 32, 10, 32), psx(new THREE.MeshLambertMaterial({ map: ft })), 0, 0, -6);
  fl.rotation.x = -Math.PI / 2; farm.add(fl);
  const ceil = mesh(new THREE.PlaneGeometry(5, 24, 5, 24), M('#161c25'), 0, 3.3, -9); ceil.rotation.x = Math.PI / 2; farm.add(ceil);
}
// rack front: static panel texture + animated additive LED layer
function rackFront(seed) {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128;
  const c = cv.getContext('2d'); c.fillStyle = '#20252e'; c.fillRect(0, 0, 32, 128);
  for (let y = 2; y < 124; y += 6) {
    c.fillStyle = (y + seed) % 18 === 2 ? '#3a4352' : '#2b323e'; c.fillRect(2, y, 28, 5);
    c.fillStyle = '#1c2028'; for (let x = 5; x < 22; x += 3) c.fillRect(x, y + 2, 2, 1);
    c.fillStyle = '#6a7486'; c.fillRect(26, y + 1, 2, 3);
  }
  c.fillStyle = '#4c5668'; c.fillRect(0, 0, 32, 2); c.fillRect(0, 126, 32, 2); c.fillRect(0, 0, 2, 128); c.fillRect(30, 0, 2, 128);
  return nearestTex(cv);
}
const ledLayers = [0, 1, 2].map(() => { const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128; return { cv, tex: nearestTex(cv) }; });
const LED_COLS = ['#33ff88', '#33ff88', '#33ff88', '#3fb6ff', '#ffb020', '#ff3344'];
function updateRackLEDs() {
  for (const L of ledLayers) {
    const c = L.cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 32, 128);
    for (let y = 2; y < 124; y += 6) for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.55) { c.fillStyle = LED_COLS[(Math.random() * LED_COLS.length) | 0]; c.fillRect(22 - i * 3 - 14, y + 2, 2, 2); }
    }
    L.tex.needsUpdate = true;
  }
}
updateRackLEDs();
const rackFronts = [0, 1, 2].map(rackFront);
const rackBody = M('#1b2028');
for (const side of [-1, 1]) {
  for (let i = 0; i < 20; i++) {
    const z = 1.2 - i * 0.66, v = (i + (side > 0 ? 1 : 0)) % 3;
    const rack = new THREE.Group(); rack.position.set(side * 1.5, 0, z); farm.add(rack);
    rack.add(mesh(new THREE.BoxGeometry(0.9, 2.2, 0.62), rackBody, 0, 1.1, 0));
    const face = mesh(new THREE.PlaneGeometry(0.6, 2.1, 1, 4), psx(new THREE.MeshLambertMaterial({ map: rackFronts[v] })), -side * 0.452, 1.1, 0);
    face.rotation.y = -side * Math.PI / 2; rack.add(face);
    const led = mesh(new THREE.PlaneGeometry(0.6, 2.1, 1, 4),
      psx(new THREE.MeshBasicMaterial({ map: ledLayers[(i + v) % 3].tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })),
      -side * 0.456, 1.1, 0);
    led.rotation.y = -side * Math.PI / 2; rack.add(led);
  }
  // cable tray + overhead tray light glow
  farm.add(mesh(new THREE.BoxGeometry(0.35, 0.08, 14), M('#c9a227'), side * 1.15, 2.55, -5.3));
  farm.add(mesh(new THREE.BoxGeometry(0.06, 0.06, 14), M('#2a6cff'), side * 1.0, 2.35, -5.3));
}
// ceiling light strips
const stripMat = psx(new THREE.MeshBasicMaterial({ color: '#cfe6ff' }));
for (let z = 1; z > -13; z -= 2.2) farm.add(mesh(new THREE.BoxGeometry(0.5, 0.04, 1.2), stripMat, 0, 3.27, z));
// end wall with glowing sign
farm.add(mesh(new THREE.PlaneGeometry(5, 3.3, 5, 3), M('#1c2430'), 0, 1.65, -13));
farm.add(mesh(new THREE.BoxGeometry(0.9, 0.22, 0.02), psx(new THREE.MeshBasicMaterial({ color: '#1fff8a' })), 0, 2.7, -12.98));
const farmLight = new THREE.PointLight('#5f9cff', 1.8, 8, 1.3); farmLight.position.set(0, 2.8, 1.6); farm.add(farmLight);
for (const z of [-2.5, -6.5, -10.5]) { const pl = new THREE.PointLight('#bfe0ff', 1.1, 6, 1.4); pl.position.set(0, 3.0, z); farm.add(pl); }

// ---------- Extra sets (chat / room / city / ocean) ----------
const SETS = {};
function makeSet(name, cfg) { const g = new THREE.Group(); g.visible = false; scene.add(g); return (SETS[name] = { group: g, upd: [], ...cfg }); }
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const tx = nearestTex(cv); if (repeat) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(repeat[0], repeat[1]); } return tx;
}
const BASIC = (o) => psx(new THREE.MeshBasicMaterial(o));
const TEXM = (map) => psx(new THREE.MeshLambertMaterial({ map }));
function rr2d(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// CHAT: BIT stands inside a giant messaging app
{
  const S = makeSet('chat', { bg: '#06140f', fog: [7, 22], amb: 0.85, fill: 0.5 }), g = S.group;
  const fl = mesh(new THREE.PlaneGeometry(30, 30, 15, 15), TEXM(canvasTex(32, 32, (c) => {
    c.fillStyle = '#0b211c'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#17503f'; c.fillRect(0, 0, 32, 1); c.fillRect(0, 0, 1, 32);
  }, [15, 15])));
  fl.rotation.x = -Math.PI / 2; g.add(fl);
  const screenTex = canvasTex(256, 464, (c, W, H) => {
    c.fillStyle = '#0b141a'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.03)'; for (let i = 0; i < 60; i++) c.fillRect((i * 67) % W, (i * 131) % H, 6, 6);
    c.fillStyle = '#1f2c34'; c.fillRect(0, 0, W, 58);
    c.fillStyle = '#6b7c85'; c.beginPath(); c.arc(32, 29, 17, 0, 7); c.fill();
    c.fillStyle = '#e9edef'; c.font = 'bold 20px sans-serif'; c.fillText('Marco', 60, 26);
    c.fillStyle = '#25d366'; c.font = '14px sans-serif'; c.fillText('online', 60, 46);
    const bub = (txt, right, y, ticks) => {
      c.font = '17px sans-serif'; const w = c.measureText(txt).width + (ticks ? 46 : 26);
      const x = right ? W - w - 12 : 12;
      c.fillStyle = right ? '#005c4b' : '#202c33'; rr2d(c, x, y, w, 34, 9); c.fill();
      c.fillStyle = '#e9edef'; c.fillText(txt, x + 12, y + 23);
      if (ticks) { c.strokeStyle = '#53bdeb'; c.lineWidth = 2; for (const o of [0, 6]) { c.beginPath(); c.moveTo(x + w - 26 + o, y + 21); c.lineTo(x + w - 22 + o, y + 25); c.lineTo(x + w - 15 + o, y + 16); c.stroke(); } }
    };
    bub('ehi', false, 80); bub('ci sei?', true, 124, true); bub('si dimmi', false, 168);
    bub('hai visto BIT?', true, 212, true); bub('ahahah si', false, 256); bub('il cloud non esiste!!', true, 300, true);
    c.fillStyle = '#202c33'; rr2d(c, 12, 346, 64, 34, 9); c.fill();
    c.fillStyle = '#8696a0'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(30 + i * 14, 363, 4, 0, 7); c.fill(); }
    c.fillStyle = '#1f2c34'; c.fillRect(0, H - 56, W, 56);
    c.fillStyle = '#2a3942'; rr2d(c, 10, H - 46, W - 70, 36, 18); c.fill();
    c.fillStyle = '#8696a0'; c.font = '16px sans-serif'; c.fillText('Messaggio', 28, H - 22);
    c.fillStyle = '#00a884'; c.beginPath(); c.arc(W - 30, H - 28, 20, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(W - 38, H - 36); c.lineTo(W - 20, H - 28); c.lineTo(W - 38, H - 20); c.fill();
  });
  const ph = new THREE.Group(); ph.position.set(0, 0, -4.6); g.add(ph);
  ph.add(mesh(new THREE.BoxGeometry(4.6, 8.5, 0.35), M('#0c0e12'), 0, 4.25, 0));
  ph.add(mesh(new THREE.PlaneGeometry(4.2, 7.9, 2, 4), BASIC({ map: screenTex }), 0, 4.3, 0.18));
  ph.add(mesh(new THREE.BoxGeometry(1.0, 0.12, 0.05), M('#000'), 0, 8.25, 0.18));
  const bubbles = [];
  const BCOL = ['#1f8a6e', '#2a3942', '#1f8a6e', '#2a3942', '#25d366', '#2a3942', '#1f8a6e', '#3a4a55'];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1, w = 0.8 + (i * 0.37) % 0.9;
    const b = new THREE.Group(); b.position.set(side * (2.3 + (i * 0.7) % 1.8), 1.2 + (i * 0.83) % 2.8, -3 + (i * 1.3) % 3.5); g.add(b);
    b.add(mesh(new THREE.BoxGeometry(w, 0.42, 0.12), M(BCOL[i])));
    b.add(mesh(new THREE.BoxGeometry(0.14, 0.14, 0.12), M(BCOL[i]), side * (w / 2 - 0.05), -0.22, 0));
    for (let k = 0; k < 3; k++) b.add(mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), BASIC({ color: '#e9edef' }), -0.15 + k * 0.15, 0, 0.07));
    b.rotation.y = -side * 0.35; bubbles.push(b);
  }
  S.upd.push((t) => bubbles.forEach((b, i) => { b.position.y += Math.sin(t * 1.3 + i) * 0.003; b.rotation.z = Math.sin(t * 0.8 + i) * 0.05; }));
  for (let i = 0; i < 14; i++) {
    const k = mesh(new THREE.BoxGeometry(0.34, 0.16, 0.34), M(i % 4 ? '#1d2b33' : '#00a884'), ((i * 2.37) % 9) - 4.5, 0.08, -((i * 1.71) % 5) + 0.5);
    if (Math.abs(k.position.x) < 1.6) k.position.x += Math.sign(k.position.x || 1) * 1.8;
    k.rotation.y = i; g.add(k);
  }
  const pl = new THREE.PointLight('#3dffb0', 1.4, 9, 1.3); pl.position.set(0, 3, -2); g.add(pl);
}

// ROOM: bedroom with the home router
{
  const S = makeSet('room', { bg: '#0e1119', fog: [10, 26], amb: 0.7, fill: 0.5 }), g = S.group;
  const fl = mesh(new THREE.PlaneGeometry(9, 9, 9, 9), TEXM(canvasTex(32, 32, (c) => {
    c.fillStyle = '#6b4a2f'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#563b25';
    for (let y = 0; y < 32; y += 8) { c.fillRect(0, y, 32, 1); c.fillRect((y * 3) % 32, y, 1, 8); }
  }, [6, 6])), 0, 0, -0.5);
  fl.rotation.x = -Math.PI / 2; g.add(fl);
  const wallM = M('#3d4a66');
  g.add(mesh(new THREE.PlaneGeometry(9, 4.2, 9, 4), wallM, 0, 2.1, -3));
  const lw = mesh(new THREE.PlaneGeometry(8, 4.2, 8, 4), M('#34405a'), -4.5, 2.1, 0.5); lw.rotation.y = Math.PI / 2; g.add(lw);
  const rw = mesh(new THREE.PlaneGeometry(8, 4.2, 8, 4), M('#34405a'), 4.5, 2.1, 0.5); rw.rotation.y = -Math.PI / 2; g.add(rw);
  g.add(mesh(new THREE.BoxGeometry(9, 0.12, 0.04), M('#e6e0d4'), 0, 0.06, -2.97));
  const winTex = canvasTex(64, 48, (c) => {
    c.fillStyle = '#0a1230'; c.fillRect(0, 0, 64, 48); c.fillStyle = '#fff';
    for (let i = 0; i < 16; i++) c.fillRect((i * 23) % 64, (i * 11) % 22, 1, 1);
    c.fillStyle = '#f2f0dc'; c.beginPath(); c.arc(50, 10, 5, 0, 7); c.fill();
    for (let i = 0; i < 8; i++) { const h = 10 + (i * 7) % 16; c.fillStyle = '#141a2e'; c.fillRect(i * 8, 48 - h, 7, h);
      c.fillStyle = '#ffd66b'; for (let y = 48 - h + 2; y < 46; y += 4) if ((i + y) % 3) c.fillRect(i * 8 + 2, y, 1, 1); }
  });
  g.add(mesh(new THREE.PlaneGeometry(1.9, 1.4), BASIC({ map: winTex }), -1.4, 2.2, -2.97));
  for (const [w, h, x, y] of [[2.05, 0.08, -1.4, 2.93], [2.05, 0.08, -1.4, 1.47], [0.08, 1.5, -2.42, 2.2], [0.08, 1.5, -0.38, 2.2], [0.06, 1.4, -1.4, 2.2]])
    g.add(mesh(new THREE.BoxGeometry(w, h, 0.06), M('#d8d2c4'), x, y, -2.95));
  g.add(mesh(new THREE.PlaneGeometry(0.8, 1.1), BASIC({ map: canvasTex(32, 44, (c) => {
    c.fillStyle = '#ff2d55'; c.fillRect(0, 0, 32, 44); c.fillStyle = '#ffd23f'; c.font = 'bold 13px monospace'; c.textAlign = 'center'; c.fillText('404', 16, 22);
    c.fillStyle = '#111'; c.font = '7px monospace'; c.fillText('WIFI', 16, 34); }) }), 0.9, 2.3, -2.97));
  // desk + router + monitor
  const desk = new THREE.Group(); desk.position.set(1.7, 0, -2.35); g.add(desk);
  desk.add(mesh(new THREE.BoxGeometry(1.7, 0.07, 0.75), M('#7a5634'), 0, 0.78, 0));
  for (const [x, z] of [[-0.78, -0.3], [0.78, -0.3], [-0.78, 0.3], [0.78, 0.3]]) desk.add(mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), M('#5a3d24'), x, 0.39, z));
  desk.add(mesh(new THREE.BoxGeometry(0.75, 0.48, 0.05), M('#15181f'), 0.35, 1.12, -0.22));
  desk.add(mesh(new THREE.PlaneGeometry(0.68, 0.4), BASIC({ color: '#2f6dff' }), 0.35, 1.12, -0.19));
  const router = new THREE.Group(); router.position.set(-0.4, 0.86, 0.05); desk.add(router);
  router.add(mesh(new THREE.BoxGeometry(0.55, 0.09, 0.34), M('#e9ecf2')));
  const leds = [];
  for (let i = 0; i < 5; i++) { const l = mesh(new THREE.BoxGeometry(0.04, 0.03, 0.01), BASIC({ color: '#3dff8f' }), -0.16 + i * 0.08, 0.01, 0.171); router.add(l); leds.push(l); }
  for (let i = 0; i < 3; i++) { const a = mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.38, 4), M('#20242c'), -0.2 + i * 0.2, 0.22, -0.13); a.rotation.z = (i - 1) * 0.25; router.add(a); }
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = mesh(new THREE.TorusGeometry(0.35, 0.015, 4, 20), BASIC({ color: '#33d6ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 1.3, 1.0, -2.3);
    g.add(r); rings.push(r);
  }
  S.upd.push((t) => {
    leds.forEach((l, i) => l.visible = Math.sin(t * 11 + i * 2.3) > -0.2);
    rings.forEach((r, i) => { const f = (t * 0.45 + i / 3) % 1; r.scale.setScalar(0.4 + f * 9); r.material.opacity = (1 - f) * 0.8; });
  });
  // bed
  const bed = new THREE.Group(); bed.position.set(-2.9, 0, -1.6); g.add(bed);
  bed.add(mesh(new THREE.BoxGeometry(1.5, 0.38, 2.3), M('#5a3d28'), 0, 0.19, 0));
  bed.add(mesh(new THREE.BoxGeometry(1.42, 0.16, 2.2), M('#e3e8f0'), 0, 0.46, 0));
  bed.add(mesh(new THREE.BoxGeometry(1.46, 0.2, 1.45), M('#3a5fa8'), 0, 0.5, 0.38));
  bed.add(mesh(new THREE.BoxGeometry(0.9, 0.16, 0.42), M('#f4f4f2'), 0, 0.62, -0.82));
  bed.add(mesh(new THREE.BoxGeometry(1.5, 0.9, 0.08), M('#4a3220'), 0, 0.6, -1.15));
  // TV + console on a low stand, microwave on a cabinet (props for the Wi-Fi episode)
  const tvStand = new THREE.Group(); tvStand.position.set(-1.4, 0, -2.6); g.add(tvStand);
  tvStand.add(mesh(new THREE.BoxGeometry(1.4, 0.45, 0.45), M('#2b2f38'), 0, 0.225, 0));
  tvStand.add(mesh(new THREE.BoxGeometry(1.15, 0.68, 0.06), M('#101114'), 0, 0.85, -0.05));
  const tvScreen = mesh(new THREE.PlaneGeometry(1.05, 0.58), BASIC({ color: '#3a8bff' }), 0, 0.85, -0.015); tvStand.add(tvScreen);
  tvStand.add(mesh(new THREE.BoxGeometry(0.34, 0.07, 0.26), M('#f2f2f2'), 0.4, 0.485, 0.05));
  tvStand.add(mesh(new THREE.BoxGeometry(0.04, 0.02, 0.01), BASIC({ color: '#3dff8f' }), 0.5, 0.49, 0.181));
  const mw = new THREE.Group(); mw.position.set(0.35, 0, -2.62); g.add(mw);
  mw.add(mesh(new THREE.BoxGeometry(0.65, 0.8, 0.45), M('#cfc8bb'), 0, 0.4, 0));
  mw.add(mesh(new THREE.BoxGeometry(0.56, 0.32, 0.38), M('#e9ecf2'), 0, 0.96, 0));
  const mwWin = mesh(new THREE.PlaneGeometry(0.32, 0.2), BASIC({ color: '#2a2016' }), -0.07, 0.96, 0.192); mw.add(mwWin);
  mw.add(mesh(new THREE.BoxGeometry(0.1, 0.22, 0.01), M('#30343c'), 0.19, 0.96, 0.192));
  S.upd.push((t) => {
    tvScreen.material.color.setHSL(0.6 + Math.sin(t * 0.7) * 0.05, 0.7, 0.5 + Math.sin(t * 3.1) * 0.06);
    mwWin.material.color.set(Math.sin(t * 9) > -0.3 ? '#ffb347' : '#c97a20');
  });
  const lamp = new THREE.PointLight('#ffcf8a', 1.6, 8, 1.3); lamp.position.set(-1.2, 2.8, -1.0); g.add(lamp);
  g.add(mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.18, 8), BASIC({ color: '#ffe2b0' }), -1.2, 3.6, -1.0));
}

// CITY: night street with glowing fiber under the road
{
  const S = makeSet('city', { bg: '#120f24', fog: [9, 34], amb: 0.6, fill: 0.55 }), g = S.group;
  const road = mesh(new THREE.PlaneGeometry(6, 70, 6, 35), TEXM(canvasTex(32, 64, (c) => {
    c.fillStyle = '#25282f'; c.fillRect(0, 0, 32, 64); c.fillStyle = '#2c3038'; for (let i = 0; i < 30; i++) c.fillRect((i * 13) % 32, (i * 29) % 64, 1, 1);
    c.fillStyle = '#d8c25a'; c.fillRect(15, 0, 2, 28);
  }, [1, 30])), 0, 0, -20);
  road.rotation.x = -Math.PI / 2; g.add(road);
  for (const sd of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(1.6, 0.14, 70), M('#4a4e57'), sd * 3.8, 0.07, -20));
  const pulseTex = canvasTex(8, 64, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, 8, 64); c.fillStyle = '#33d6ff'; c.fillRect(2, 0, 4, 6); c.fillStyle = '#ffffff'; c.fillRect(3, 2, 2, 2); c.fillStyle = '#1a6f8a'; c.fillRect(3, 6, 2, 10); }, [1, 40]);
  g.add(mesh(new THREE.BoxGeometry(0.34, 0.02, 70), M('#0b0d12'), -1.6, 0.01, -20));
  const fib = mesh(new THREE.PlaneGeometry(0.16, 70, 1, 35), BASIC({ map: pulseTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), -1.6, 0.025, -20);
  fib.rotation.x = -Math.PI / 2; g.add(fib);
  S.upd.push((t) => { pulseTex.offset.y = t * 1.6; });
  const winTexes = [0, 1, 2].map(v => canvasTex(32, 64, (c) => {
    c.fillStyle = ['#1c1f2e', '#22202c', '#1a2230'][v]; c.fillRect(0, 0, 32, 64);
    for (let y = 2; y < 62; y += 6) for (let x = 2; x < 30; x += 6) { const r = Math.sin(x * 7.1 + y * 3.7 + v * 11) * 0.5 + 0.5;
      c.fillStyle = r > 0.62 ? (r > 0.85 ? '#9fd4ff' : '#ffd66b') : '#11131c'; c.fillRect(x, y, 3, 4); }
  }));
  for (const sd of [-1, 1]) for (let i = 0; i < 12; i++) {
    const h = 6 + ((i * 7 + (sd > 0 ? 3 : 0)) % 9), z = 8 - i * 5.2;
    g.add(mesh(new THREE.BoxGeometry(4, h, 4.6), TEXM(winTexes[(i + (sd > 0 ? 1 : 0)) % 3]), sd * 6.8, h / 2, z));
  }
  const lamps = BASIC({ color: '#ffe3a0' }), poleM = M('#3a3f4a');
  for (let z = 6; z > -40; z -= 8) for (const sd of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.2, 5), poleM, sd * 3.3, 2.1, z));
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.06, 0.08), poleM, sd * 2.95, 4.15, z));
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.1, 0.2), lamps, sd * 2.6, 4.08, z));
  }
  for (const z of [3, -5, -13]) { const pl = new THREE.PointLight('#ffcf8a', 1.5, 9, 1.4); pl.position.set(z % 2 ? -2.4 : 2.4, 3.8, z); g.add(pl); }
  const tower = mesh(new THREE.CylinderGeometry(0.15, 0.9, 14, 4, 6, true), psx(new THREE.MeshLambertMaterial({ color: '#8a93a6', wireframe: true })), 5.5, 7, -26);
  g.add(tower);
  const beacon = mesh(new THREE.SphereGeometry(0.22, 6, 4), BASIC({ color: '#ff3344' }), 5.5, 14.1, -26); g.add(beacon);
  S.upd.push((t) => { beacon.visible = Math.sin(t * 4) > 0; });
  g.add(mesh(new THREE.SphereGeometry(2.2, 10, 6), BASIC({ color: '#f2f0dc', fog: false }), -14, 19, -48));
}

// OCEAN: sea floor with the submarine cable (and a shark)
{
  const S = makeSet('ocean', { bg: '#05324d', fog: [2.5, 16], amb: 0.8, fill: 0.35 }), g = S.group;
  const sg = new THREE.PlaneGeometry(30, 30, 30, 30), pos = sg.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i);
    const amp = 0.04 + 0.45 * Math.min(1, Math.abs(x) / 7); pos.setZ(i, (Math.sin(x * 0.9) + Math.cos(y * 0.7 + x * 0.3)) * amp); }
  sg.computeVertexNormals();
  const sea = mesh(sg, M('#a08c5c'), 0, 0, -4); sea.rotation.x = -Math.PI / 2; g.add(sea);
  for (let i = 0; i < 14; i++) {
    const r = 0.25 + (i * 0.37) % 0.6, x = (i % 2 ? 1 : -1) * (1.8 + (i * 1.3) % 5), z = 3 - (i * 1.9) % 14;
    g.add(mesh(new THREE.DodecahedronGeometry(r, 0), M('#4b5560'), x, r * 0.5, z));
  }
  const weeds = [];
  for (let i = 0; i < 22; i++) {
    const w = new THREE.Group(); w.position.set((i % 2 ? 1 : -1) * (1.5 + (i * 0.9) % 5.5), 0, 2.5 - (i * 1.37) % 13); g.add(w);
    for (let k = 0; k < 3; k++) w.add(mesh(new THREE.ConeGeometry(0.12 - k * 0.03, 0.7, 4), M(k % 2 ? '#2f8a4a' : '#3da35a'), 0, 0.35 + k * 0.55, 0));
    weeds.push(w);
  }
  const cable = mesh(new THREE.CylinderGeometry(0.08, 0.08, 40, 6), M('#c9a227'), 1.0, 0.08, -10); cable.rotation.x = Math.PI / 2; g.add(cable);
  const pulses = [];
  for (let i = 0; i < 8; i++) { const p = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.3), BASIC({ color: '#7ff3ff' }), 1.0, 0.1, 0); g.add(p); pulses.push(p); }
  const bubblesO = [];
  for (let i = 0; i < 26; i++) { const b = mesh(new THREE.SphereGeometry(0.04 + (i % 3) * 0.02, 5, 3), BASIC({ color: '#bfe8ff', transparent: true, opacity: 0.6 }), ((i * 1.7) % 8) - 4, 0, 2 - (i * 0.9) % 10); g.add(b); bubblesO.push(b); }
  const fish = [];
  for (let i = 0; i < 12; i++) { const f = mesh(new THREE.ConeGeometry(0.08, 0.3, 4), M(i % 3 ? '#ffb347' : '#5ec8ff'), 0, 0, 0); f.rotation.z = Math.PI / 2; const fg = new THREE.Group(); fg.add(f); g.add(fg); fish.push(fg); }
  const shark = new THREE.Group(); g.add(shark);
  const sb = mesh(new THREE.IcosahedronGeometry(0.5, 0), M('#6f8091')); sb.scale.set(0.7, 0.6, 2.4); shark.add(sb);
  shark.add(mesh(new THREE.ConeGeometry(0.22, 0.6, 3), M('#5e6e7e'), 0, 0.45, -0.1));
  const tail = mesh(new THREE.ConeGeometry(0.3, 0.6, 3), M('#5e6e7e'), 0, 0, -1.35); tail.rotation.x = -Math.PI / 2; tail.scale.set(0.3, 1, 1.4); shark.add(tail);
  for (const sd of [-1, 1]) { const fin = mesh(new THREE.ConeGeometry(0.15, 0.5, 3), M('#5e6e7e'), sd * 0.35, -0.15, 0.2); fin.rotation.z = sd * 1.9; shark.add(fin);
    shark.add(mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), M('#000'), sd * 0.24, 0.08, 0.9)); }
  const rays = [];
  for (let i = 0; i < 5; i++) { const r = mesh(new THREE.PlaneGeometry(0.9, 12), BASIC({ color: '#7fd8ff', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), -4 + i * 2.1, 6, -3 - i); r.rotation.z = 0.35; g.add(r); rays.push(r); }
  S.upd.push((t) => {
    weeds.forEach((w, i) => w.rotation.z = Math.sin(t * 1.1 + i) * 0.18);
    pulses.forEach((p, i) => p.position.z = 6 - ((t * 4 + i * 5) % 40));
    bubblesO.forEach((b, i) => b.position.y = ((t * 0.5 + i * 0.37) % 6));
    fish.forEach((f, i) => { const a = t * 0.5 + (i % 4) * 0.25 + Math.floor(i / 4) * 2.1, R2 = 3 + Math.floor(i / 4);
      f.position.set(Math.cos(a) * R2, 1.4 + Math.floor(i / 4) * 0.5 + (i % 4) * 0.12, -3 + Math.sin(a) * R2); f.rotation.y = -a; });
    const a = t * 0.32; shark.position.set(Math.cos(a) * 5.5, 2.4 + Math.sin(t * 0.7) * 0.3, -4 + Math.sin(a) * 4);
    shark.rotation.y = -a + Math.PI; tail.rotation.y = Math.sin(t * 6) * 0.4;
    rays.forEach((r, i) => r.material.opacity = 0.05 + Math.sin(t * 0.8 + i) * 0.03);
  });
}

// backgrounds
const gc = document.createElement('canvas'); gc.width = 4; gc.height = 64;
{ const c = gc.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#05040a'); g.addColorStop(1, '#2a1f4a'); c.fillStyle = g; c.fillRect(0, 0, 4, 64); }
const gradT = new THREE.CanvasTexture(gc);
function setBg(v) {
  studio.visible = v === 'studio'; farm.visible = v === 'farm'; scene.fog = null;
  ambient.intensity = v === 'farm' ? 0.85 : 0.75; fill.intensity = v === 'farm' ? 0.45 : 0;
  for (const k in SETS) SETS[k].group.visible = v === k;
  const XS = SETS[v];
  if (XS) { scene.background = new THREE.Color(XS.bg); scene.fog = new THREE.Fog(XS.bg, XS.fog[0], XS.fog[1]); ambient.intensity = XS.amb; fill.intensity = XS.fill; }
  else if (v === 'farm') { scene.background = new THREE.Color('#0b111a'); scene.fog = new THREE.Fog('#0b111a', 5, 16); }
  else if (v === 'studio') { scene.background = new THREE.Color('#1a2229'); scene.fog = new THREE.Fog('#1a2229', 4.5, 11); }
  else if (v === 'green') scene.background = new THREE.Color('#00ff00');
  else if (v === 'blue') scene.background = new THREE.Color('#0047bb');
  else if (v === 'void') scene.background = gradT;
  else scene.background = new THREE.Color($('bgColor').value);
}
setBg($('bg').value);

// ---------- Camera shots ----------
const SHOTS = { primo: { ty: 1.72, d: 2.3 }, mezzo: { ty: 1.6, d: 3.2 }, intero: { ty: 1.25, d: 4.6 } };
SHOTS.corridoio = { ty: 1.45, d: 6.2 };
let shot = 'mezzo'; const camCur = { ty: 1.5, d: 3.2, ang: 0 };

// ---------- Animation state ----------
const REST = { L: { sx: 0, sy: 0, sz: -0.08, ex: -0.15, ez: 0 }, R: { sx: 0, sy: 0, sz: 0.08, ex: -0.15, ez: 0 } };
const TALK = { L: { sx: -0.2, sy: 0, sz: -0.12, ex: -1.0, ez: 0 }, R: { sx: -0.2, sy: 0, sz: 0.12, ex: -1.0, ez: 0 } };
const G = {
  saluta: { dur: 2.4, R: { sx: -0.35, sz: 0.3, ex: 0, ez: 2.8 }, wave: true, head: { z: 0.1, x: 0 } },
  spiega: { dur: 2.4, L: { sx: -0.55, sz: -0.12, ex: -1.35 }, R: { sx: -0.55, sz: 0.12, ex: -1.35 }, head: { x: 0.05 } },
  indica: { dur: 2.4, R: { sx: -1.05, sz: 0.55, ex: -0.2 }, head: { y: 0.4 } },
  pensa:  { dur: 2.8, L: { sx: -0.75, sz: 0.5, ex: -2.25 }, R: { sx: -0.35, sz: -0.25, ex: -1.4 }, head: { x: -0.15, z: -0.08, y: -0.15 } },
  boh:    { dur: 1.8, L: { sx: -0.15, sz: -0.55, ex: -1.4 }, R: { sx: -0.15, sz: 0.55, ex: -1.4 }, head: { z: 0.15 }, shrug: true },
  si:     { dur: 1.3, nod: true },
  no:     { dur: 1.3, shake: true }
};
const cur = { L: { ...REST.L }, R: { ...REST.R } };
const headCur = { x: 0, y: 0, z: 0 }; let shrugCur = 0;
let gesture = null, gestureT = 0;
let manualTalk = false, spaceHeld = false;
let talk = 0, speakEnv = 0, blinkT = 2.5, blinkPhase = 0;
let t = 0;

function playGesture(name) {
  gesture = G[name]; gestureT = 0; gesture.name = name;
  document.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === name));
}


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
