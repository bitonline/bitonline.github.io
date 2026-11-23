// BIT · sito: collega lo scroll ai movimenti del personaggio 3D
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- boot screen ----------
const bootLines = ['> AVVIO BIT.EXE', '> CARICO POLIGONI........ OK', '> CALIBRO CRAVATTA....... OK', '> ACCENDO LA MASCHERA LED. OK', '> SISTEMA ONLINE'];
const bootEl = $('#bootText'), bootFill = $('#bootFill');
let bootStep = 0;
const bootTimer = setInterval(() => {
  if (bootStep < bootLines.length) { bootEl.textContent += (bootStep ? '\n' : '') + bootLines[bootStep]; bootFill.style.width = ((bootStep + 1) / bootLines.length * 100) + '%'; bootStep++; }
}, reduced ? 60 : 220);
const bootMin = new Promise(r => setTimeout(r, reduced ? 300 : 1300));

$('#year').textContent = new Date().getFullYear();

// ---------- reveal on scroll ----------
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18 });
$$('.reveal').forEach(el => io.observe(el));

// ---------- hero typewriter ----------
const typed = $('#typed');
const heroText = '> SISTEMA ONLINE. IO SONO BIT.';
let typing = 0;
function typeHero() {
  typing = 0; typed.textContent = '';
  const tick = () => { typed.textContent = heroText.slice(0, ++typing); if (typing < heroText.length) setTimeout(tick, 55); };
  tick();
}

// ---------- videos carousel ----------
const track = $('#track'), dots = $('#dots');
const modal = $('#modal'), player = $('#player'), modalLinks = $('#modalLinks'), modalTitle = $('#modalTitle');
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

async function loadVideos() {
  let list = [];
  try { list = await (await fetch('videos.json', { cache: 'no-store' })).json(); } catch (e) { list = []; }
  list.sort((a, b) => b.n - a.n);
  $('#statVideo').textContent = list.length;
  track.innerHTML = '';
  dots.innerHTML = '';
  list.forEach((v, i) => {
    const card = document.createElement('button');
    card.className = 'card'; card.type = 'button';
    card.setAttribute('aria-label', `Guarda: ${v.title}`);
    card.innerHTML = `<div class="thumb" style="background-image:url('${v.cover}')"></div>
      <span class="num">#${String(v.n).padStart(2, '0')}</span>${i === 0 ? '<span class="new">NUOVO</span>' : ''}
      <div class="meta"><b>${v.title}</b><small>${fmtDate(v.date)} · ${v.duration}</small></div>`;
    card.addEventListener('click', () => openVideo(v));
    track.appendChild(card);
    const d = document.createElement('button'); d.setAttribute('aria-label', `Vai al video ${i + 1}`);
    d.addEventListener('click', () => card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }));
    dots.appendChild(d);
  });
  track.scrollLeft = 0;
  updateDots();
}
function updateDots() {
  const cards = $$('.card', track); if (!cards.length) return;
  const c = track.scrollLeft + track.clientWidth / 2;
  let best = 0, bd = 1e9;
  cards.forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } });
  $$('button', dots).forEach((d, i) => d.classList.toggle('on', i === best));
}
track.addEventListener('scroll', () => requestAnimationFrame(updateDots), { passive: true });
$('.car-btn.prev').addEventListener('click', () => track.scrollBy({ left: -280, behavior: 'smooth' }));
$('.car-btn.next').addEventListener('click', () => track.scrollBy({ left: 280, behavior: 'smooth' }));

// Consent for third-party embeds (TikTok / Instagram): nothing is loaded before an explicit click.
const CONSENT_KEY = 'bit-embed-consent';
const hasConsent = () => { try { return localStorage.getItem(CONSENT_KEY) === 'yes'; } catch (e) { return false; } };
let pendingVideo = null;
function embedSrc(v) {
  if (v.tiktok) return `https://www.tiktok.com/player/v1/${v.tiktok}?autoplay=1&loop=1&rel=0`;
  if (v.instagram) return `https://www.instagram.com/reel/${v.instagram}/embed/`;
  return '';
}
function loadEmbed(v) {
  const src = embedSrc(v);
  $('#consent').hidden = true;
  player.style.backgroundImage = '';
  player.innerHTML = src ? `<iframe src="${src}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="${v.title}"></iframe>` : '';
}
function openVideo(v) {
  modalTitle.textContent = `BIT.EXE · #${String(v.n).padStart(2, '0')}`;
  modalLinks.innerHTML = [
    v.tiktok ? `<a href="https://www.tiktok.com/@bit.online/video/${v.tiktok}" target="_blank" rel="noopener">Apri su TikTok</a>` : '',
    v.instagram ? `<a href="https://www.instagram.com/reel/${v.instagram}/" target="_blank" rel="noopener">Apri su Instagram</a>` : ''
  ].join('');
  pendingVideo = v;
  if (hasConsent()) loadEmbed(v);
  else {
    player.innerHTML = '';
    player.style.backgroundImage = `url('${v.cover}')`;
    $('#consentPlat').textContent = v.tiktok ? 'TikTok' : 'Instagram (Meta)';
    $('#consentRemember').checked = false;
    $('#consent').hidden = false;
  }
  modal.hidden = false; $('#modalClose').focus();
  bitReact('happy');
}
$('#consentOk').addEventListener('click', () => {
  if ($('#consentRemember').checked) { try { localStorage.setItem(CONSENT_KEY, 'yes'); } catch (e) {} }
  if (pendingVideo) loadEmbed(pendingVideo);
});
function closeVideo() { modal.hidden = true; player.innerHTML = ''; player.style.backgroundImage = ''; $('#consent').hidden = true; }
$('#modalClose').addEventListener('click', closeVideo);
modal.addEventListener('click', e => { if (e.target === modal) closeVideo(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeVideo(); });
loadVideos();

// ---------- 3D BIT driven by scroll ----------
let E = null;
const sections = $$('[data-scene]');
const CAM = { near: { d: 2.8, y: 1.62 }, mid: { d: 3.5, y: 1.5 }, far: { d: 4.4, y: 1.4 } };
const state = { active: -1, scene: null, ang: 0, d: 3.5, y: 1.5, mx: 0, my: 0, talkT: 0, exprT: 0, expr: null, idleT: 6 };
let mobile = innerWidth <= 820;
function bitReact(expr) { state.expr = expr; state.exprT = 1.6; }

function activeIndex() {
  const mid = innerHeight * 0.5;
  let idx = 0;
  sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= mid) idx = i; });
  return idx;
}
function sectionProgress(i) {
  const r = sections[i].getBoundingClientRect();
  return Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / Math.max(1, r.height)));
}
function sideX(side, d) {
  if (mobile) return 0;
  const hw = d * Math.tan(15 * Math.PI / 180) * (innerWidth / innerHeight);
  return Math.max(-0.85, Math.min(0.85, side * hw * 0.5));
}
function enterSection(i, first) {
  const s = sections[i].dataset;
  if (s.scene !== state.scene) { E.setScene(s.scene); if (!first) E.glitch(0.45); state.scene = s.scene; }
  const cam = CAM[s.cam] || CAM.mid;
  const x = sideX(+s.side || 0, cam.d);
  if (first) E.placeAt(x, 0); else E.walkTo(x, 0);
  if (s.gesture) setTimeout(() => E.gesturePlay(s.gesture), first ? 900 : 450);
  if (s.expr) bitReact(s.expr);
  if (i === 0) { typeHero(); state.talkT = 2.2; }
}

function resize() {
  mobile = innerWidth <= 820;
  const w = innerWidth, h = Math.max(innerHeight, document.documentElement.clientHeight);
  // sharper than the videos' 360p, still PS1-looking: internal height follows the screen
  const pxH = mobile ? Math.min(600, Math.max(400, h / 1.5)) : Math.min(760, Math.max(480, h / 1.25));
  E.setView(w, h, pxH);
  if (state.active >= 0) { const s = sections[state.active].dataset, cam = CAM[s.cam] || CAM.mid; E.walkTo(sideX(+s.side || 0, cam.d), 0); }
}

addEventListener('pointermove', e => { state.mx = e.clientX / innerWidth * 2 - 1; state.my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
$$('.btn, .social, .card').forEach(el => el.addEventListener('pointerenter', () => bitReact('happy')));

let last = performance.now(), running = true;
document.addEventListener('visibilitychange', () => { running = !document.hidden; last = performance.now(); if (running) requestAnimationFrame(frame); });

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const i = activeIndex();
  if (i !== state.active) { const first = state.active < 0; state.active = i; enterSection(i, first); }
  const s = sections[i].dataset, cam = CAM[s.cam] || CAM.mid, p = sectionProgress(i);

  // camera: slow orbit tied to scroll, framing per section (mobile keeps BIT in the top half)
  const side = mobile ? 0 : (+s.side || 0);
  const targAng = -side * 0.18 + (reduced ? 0 : (p - 0.5) * 0.5);
  const targD = mobile ? cam.d + 0.75 : cam.d;
  const targY = mobile ? cam.y - 0.1 : cam.y;
  const k = Math.min(1, dt * 3);
  state.ang += (targAng - state.ang) * k; state.d += (targD - state.d) * k; state.y += (targY - state.y) * k;
  const b = E.getBody();
  const camX = Math.sin(state.ang) * state.d, camZ = Math.cos(state.ang) * state.d;
  E.cam.position.set(camX, state.y + 0.15, camZ);
  E.cam.lookAt(0, state.y, 0);
  E.faceYaw(Math.atan2(camX - b.x, camZ - b.z));

  // talking + expressions + idle gestures
  state.talkT = Math.max(0, state.talkT - dt);
  const talking = state.talkT > 0;
  const tv = talking ? Math.max(0, Math.sin(now / 1000 * 13 + Math.sin(now / 1000 * 2.3) * 2.5)) * 0.9 : 0;
  state.exprT = Math.max(0, state.exprT - dt); if (state.exprT === 0 && !s.expr) state.expr = null;
  state.idleT -= dt;
  if (state.idleT <= 0 && !reduced) { state.idleT = 7 + Math.random() * 5; E.gesturePlay(['si', 'pensa', 'boh', 'spiega'][Math.floor(Math.random() * 4)]); }

  const bx = mobile ? 0 : b.x / 2;
  E.update(dt, { talk: tv, speaking: talking, lookX: Math.max(-1, Math.min(1, state.mx - bx)), lookY: state.my * 0.6, expr: state.expr || s.expr || null, reduced });
  E.render();
  requestAnimationFrame(frame);
}

import('./engine.js').then(async mod => {
  E = mod;
  resize();
  addEventListener('resize', () => requestAnimationFrame(resize));
  requestAnimationFrame(t => { last = t; frame(t); });
  await bootMin; clearInterval(bootTimer);
  bootEl.textContent = bootLines.join('\n'); bootFill.style.width = '100%';
  setTimeout(() => $('#boot').classList.add('done'), reduced ? 0 : 250);
}).catch(err => {
  console.error(err);
  bootEl.textContent += '\n> ERRORE 3D: continuo senza BIT';
  setTimeout(() => $('#boot').classList.add('done'), 800);
});
