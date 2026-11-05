(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) document.documentElement.classList.add('reduce');
const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
let who = (new URLSearchParams(location.search).get('to') || store.get('dv-name', '')).trim().slice(0, 30);
let started = false;
const rnd = (a, b) => a + Math.random() * (b - a);
const css = v => getComputedStyle(document.body).getPropertyValue(v).trim();

/* ---------- Sound (Web Audio, never autoplays) ---------- */
let ac, master, soundOn = false;
function audioInit() {
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
  [110, 164.81, 220, 277.18].forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.05 / (i + 1);
    l.frequency.value = 0.1 + i * 0.05; lg.gain.value = 0.02 / (i + 1);
    l.connect(lg).connect(g.gain); o.connect(g).connect(master); o.start(); l.start();
  });
}
function setSound(v) {
  soundOn = v;
  try { if (v && !ac) audioInit(); if (ac) { ac.resume(); master.gain.setTargetAtTime(v ? 1 : 0, ac.currentTime, 0.3); } }
  catch { soundOn = false; }
  const b = $('#snd'); b.setAttribute('aria-pressed', soundOn); b.textContent = soundOn ? '🔊 Sound on' : '🔇 Sound off';
}
function tone(f) {
  if (!soundOn || !ac) return;
  const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(0.08, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
  o.connect(g).connect(master); o.start(); o.stop(ac.currentTime + 1.3);
}

/* ---------- Fireworks ---------- */
const fx = $('#fx'), c = fx.getContext('2d'); let W, H, K = 1, P = [];
function size() { K = Math.min(devicePixelRatio || 1, 2); W = fx.width = innerWidth * K; H = fx.height = innerHeight * K; }
addEventListener('resize', size); size();
const cols = ['#ffd36b', '#ff6b4a', '#ff4d8d', '#6be3ff', '#9b7bff', '#7dff9b', '#ffffff'];
const mk = (x, y, vx, vy, col) => ({ x: x * K, y: y * K, vx: vx * K, vy: vy * K, l: 1, c: col });
function boom(x, y, kind) {
  const n = innerWidth < 600 ? 45 : 80, c1 = cols[rnd(0, 7) | 0], c2 = cols[rnd(0, 7) | 0];
  kind = kind || ['burst', 'ring', 'heart', 'double'][rnd(0, 4) | 0];
  if (P.length > 1500) return;
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283;
    if (kind === 'burst') { const t = rnd(0, 6.283), s = rnd(1, 6); P.push(mk(x, y, Math.cos(t) * s, Math.sin(t) * s, c1)); }
    else if (kind === 'ring') P.push(mk(x, y, Math.cos(a) * 4.5, Math.sin(a) * 4.5, c1));
    else if (kind === 'heart') P.push(mk(x, y, 16 * Math.sin(a) ** 3 * 0.32, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 0.32, '#ff4d8d'));
    else { const s = i % 2 ? 2.5 : 5; P.push(mk(x, y, Math.cos(a) * s, Math.sin(a) * s, i % 2 ? c2 : c1)); }
  }
  tone(rnd(480, 800));
}
function fxLoop() {
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  P = P.filter(p => p.l > 0);
  for (const p of P) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.06 * K; p.vx *= 0.985; p.vy *= 0.985; p.l -= 0.012;
    c.globalAlpha = Math.max(p.l, 0); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, 1.8 * K, 0, 6.283); c.fill();
  }
  c.globalAlpha = 1; requestAnimationFrame(fxLoop);
}
fxLoop();
addEventListener('pointerdown', e => { if (started && !e.target.closest('button,input,select,textarea,a,header')) boom(e.clientX, e.clientY); });
setInterval(() => { if (started && !document.hidden) boom(rnd(innerWidth * .1, innerWidth * .9), rnd(innerHeight * .1, innerHeight * .55)); }, reduce ? 5000 : 1800);
function grand() {
  boom(innerWidth / 2, innerHeight * .4, 'heart');
  for (let k = 1; k < 14; k++) setTimeout(() => boom(rnd(innerWidth * .1, innerWidth * .9), rnd(innerHeight * .1, innerHeight * .5), k % 4 === 0 ? 'heart' : null), k * 280);
}

/* ---------- 3D Diya (Three.js) ---------- */
function diya() {
  const cv = $('#diya3d'); let lit = false;
  try {
    if (!window.THREE) throw new Error('Three.js not loaded');
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.shadowMap.enabled = true;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, .1, 50);
    cam.position.set(0, 2.6, 5.4); cam.lookAt(0, .4, 0);
    scene.add(new THREE.AmbientLight(0x334466, .5));
    const rim = new THREE.DirectionalLight(0x6688cc, .4); rim.position.set(-3, 3, -3); scene.add(rim);
    const light = new THREE.PointLight(0xffa040, 0, 12); light.position.set(0, 1.1, 0); light.castShadow = true; scene.add(light);
    const grp = new THREE.Group(); scene.add(grp);
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: .92, roughness: .28, side: THREE.DoubleSide });
    const pts = [[0, 0], [.35, .02], [.8, .16], [1.1, .48], [1.22, .64], [1.06, .62], [.9, .46], [.5, .3], [0, .28]].map(p => new THREE.Vector2(p[0], p[1]));
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), gold); bowl.castShadow = true; grp.add(bowl);
    const lip = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 16), gold); lip.position.set(1.2, .62, 0); grp.add(lip);
    const oil = new THREE.Mesh(new THREE.CircleGeometry(.9, 32), new THREE.MeshStandardMaterial({ color: 0x6b3a08, roughness: .2, metalness: .3 }));
    oil.rotation.x = -Math.PI / 2; oil.position.y = .4; grp.add(oil);
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .3, 8), new THREE.MeshStandardMaterial({ color: 0x1a1008 })); wick.position.set(0, .52, 0); grp.add(wick);
    const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gx = gc.getContext('2d');
    const gr = gx.createRadialGradient(32, 40, 2, 32, 36, 30); gr.addColorStop(0, '#fff'); gr.addColorStop(.3, '#ffd27a'); gr.addColorStop(.65, 'rgba(255,120,20,.6)'); gr.addColorStop(1, 'rgba(255,80,0,0)');
    gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    flame.position.set(0, 1.05, 0); grp.add(flame);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: .6, metalness: .4 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.02; ground.receiveShadow = true; scene.add(ground);
    function resize() { const w = cv.clientWidth, h = cv.clientHeight; if (w && h) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } }
    addEventListener('resize', resize); resize();
    let drag = null, rot = 0;
    const ray = new THREE.Raycaster();
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, m: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 2) drag.m = true; rot += dx * .01; drag.x = e.clientX; });
    cv.addEventListener('pointerup', e => {
      if (drag && !drag.m) {
        const b = cv.getBoundingClientRect();
        ray.setFromCamera({ x: (e.clientX - b.left) / b.width * 2 - 1, y: -((e.clientY - b.top) / b.height) * 2 + 1 }, cam);
        if (ray.intersectObject(grp, true).length) api.toggle();
      }
      drag = null;
    });
    cv.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); api.toggle(); } if (e.key === 'ArrowLeft') rot -= .2; if (e.key === 'ArrowRight') rot += .2; });
    let t = 0;
    (function frame() {
      t += .05; if (!drag && !reduce) rot += .004; grp.rotation.y = rot;
      const target = lit ? 2.4 + Math.sin(t * 7) * .25 + Math.random() * .15 : 0;
      light.intensity += (target - light.intensity) * .1;
      const f = light.intensity / 2.4;
      flame.material.opacity = Math.min(f, 1); flame.scale.set(.55 + Math.sin(t * 9) * .04, .95 + Math.sin(t * 6) * .1, 1);
      r.render(scene, cam); requestAnimationFrame(frame);
    })();
    var api = { toggle() { lit = !lit; tone(lit ? 660 : 330); }, light() { lit = true; } };
    return api;
  } catch (err) {
    console.warn('3D diya unavailable:', err.message);
    $('#intro small').textContent = '3D is unavailable on this device — you can still enter the celebration.';
    return { toggle() {}, light() {} };
  }
}
const diyaApi = diya();

/* ---------- Names, themes ---------- */
function names() { $$('.nm').forEach(e => e.textContent = who || 'my beloved'); $('#cname').value = who; drawCard(); }
function theme(t) { if (!['gold', 'rose', 'blue'].includes(t)) t = 'gold'; document.body.dataset.theme = t; store.set('dv-theme', t); drawRangoli(); }
$$('.th').forEach(b => b.addEventListener('click', () => { theme(b.dataset.t); $('#ctheme').value = b.dataset.t; drawCard(); }));

/* ---------- Rangoli ---------- */
const pal = { Marigold: ['#ff9f1c', '#ffd166', '#e63946', '#fff3b0'], Lotus: ['#ff4d8d', '#ffb3d1', '#fff0f6', '#ffd166'], Peacock: ['#2f7bff', '#22d3c5', '#9b7bff', '#ffd166'], Festive: ['#e63946', '#ffd166', '#2dd4bf', '#f4f1de'] };
function drawRangoli() {
  const cv = $('#rg'), x = cv.getContext('2d'), S = cv.width, N = +$('#rp').value, L = +$('#rl').value, p = pal[$('#rc').value];
  x.clearRect(0, 0, S, S); x.fillStyle = '#0b0f26'; x.fillRect(0, 0, S, S); x.save(); x.translate(S / 2, S / 2);
  const maxR = S * .46, step = maxR / (L + .6);
  for (let l = L - 1; l >= 0; l--) {
    const a = l * step * .8 + 14, b = a + step * 1.4, w = Math.min(Math.PI * b / N * 1.1, step * 1.2);
    for (let i = 0; i < N; i++) {
      x.save(); x.rotate(i * 6.283 / N + (l % 2) * Math.PI / N);
      x.fillStyle = p[l % 4]; x.globalAlpha = .92; x.strokeStyle = '#fff8'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(0, -a); x.quadraticCurveTo(w, -(a + b) / 2, 0, -b); x.quadraticCurveTo(-w, -(a + b) / 2, 0, -a); x.fill(); x.stroke();
      x.globalAlpha = 1; x.fillStyle = p[(l + 2) % 4]; x.beginPath(); x.arc(0, -b - 8, 4, 0, 6.283); x.fill(); x.restore();
    }
  }
  x.fillStyle = p[1]; x.beginPath(); x.arc(0, 0, 14, 0, 6.283); x.fill(); x.fillStyle = p[2]; x.beginPath(); x.arc(0, 0, 6, 0, 6.283); x.fill(); x.restore();
}
['#rp', '#rl', '#rc'].forEach(s => $(s).addEventListener('input', drawRangoli));
$('#rr').addEventListener('click', () => { $('#rp').value = rnd(5, 24) | 0; $('#rl').value = rnd(2, 8) | 0; const o = $('#rc').options; $('#rc').selectedIndex = rnd(0, o.length) | 0; drawRangoli(); });
function download(cv, name) { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = name; a.click(); }
$('#rd').addEventListener('click', () => download($('#rg'), 'my-rangoli.png'));

/* ---------- Greeting card ---------- */
const CT = { gold: ['#0a1030', '#1d2a66', '#f5c34a'], rose: ['#2a0b1f', '#5a1740', '#ff8fb8'], blue: ['#04121f', '#0b4566', '#4fd8e8'] };
function wrap(x, text, cx, y, maxW, lh) {
  let line = '', n = 0;
  for (const w of text.split(/\s+/)) {
    const t = line ? line + ' ' + w : w;
    if (x.measureText(t).width > maxW && line) { x.fillText(line, cx, y); y += lh; line = w; if (++n > 7) return; } else line = t;
  }
  x.fillText(line, cx, y);
}
function drawCard() {
  const cv = $('#card'), x = cv.getContext('2d'), CW = 1080, CH = 1350, t = CT[$('#ctheme').value] || CT.gold;
  const nm = $('#cname').value.trim(), msg = $('#cmsg').value.trim() || 'Happy Diwali!';
  const g = x.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, t[0]); g.addColorStop(1, t[1]); x.fillStyle = g; x.fillRect(0, 0, CW, CH);
  x.fillStyle = '#ffffffb0'; for (let i = 0; i < 70; i++) { x.beginPath(); x.arc((i * 397) % CW, (i * 613) % (CH * .55), i % 3 + 1, 0, 6.283); x.fill(); }
  x.strokeStyle = t[2]; x.lineWidth = 6; x.strokeRect(40, 40, CW - 80, CH - 80); x.lineWidth = 2; x.strokeRect(64, 64, CW - 128, CH - 128);
  const rg = x.createRadialGradient(CW / 2, 350, 10, CW / 2, 350, 300); rg.addColorStop(0, t[2] + '88'); rg.addColorStop(1, t[2] + '00'); x.fillStyle = rg; x.fillRect(0, 50, CW, 600);
  const bg = x.createLinearGradient(0, 400, 0, 530); bg.addColorStop(0, '#f5c34a'); bg.addColorStop(1, '#a8701a'); x.fillStyle = bg;
  x.beginPath(); x.moveTo(CW / 2 - 150, 400); x.quadraticCurveTo(CW / 2 - 120, 520, CW / 2, 530); x.quadraticCurveTo(CW / 2 + 120, 520, CW / 2 + 150, 400); x.quadraticCurveTo(CW / 2, 440, CW / 2 - 150, 400); x.fill();
  const fg = x.createRadialGradient(CW / 2, 370, 5, CW / 2, 350, 90); fg.addColorStop(0, '#fff'); fg.addColorStop(.4, '#ffd27a'); fg.addColorStop(1, '#ff7a1a');
  x.fillStyle = fg; x.beginPath(); x.moveTo(CW / 2, 250); x.bezierCurveTo(CW / 2 + 70, 330, CW / 2 + 45, 400, CW / 2, 412); x.bezierCurveTo(CW / 2 - 45, 400, CW / 2 - 70, 330, CW / 2, 250); x.fill();
  x.textAlign = 'center'; x.fillStyle = t[2]; x.font = 'bold 110px Georgia,serif'; x.fillText('Happy Diwali', CW / 2, 700);
  x.fillStyle = '#fff'; if (nm) { x.font = 'italic 58px Georgia,serif'; x.fillText('For ' + nm, CW / 2, 790); }
  x.font = '42px Georgia,serif'; wrap(x, msg, CW / 2, 900, 820, 62);
  x.fillStyle = t[2]; x.font = 'italic 46px Georgia,serif'; x.fillText('With all my love 🪔', CW / 2, CH - 130);
}
['#cname', '#cmsg', '#ctheme'].forEach(s => $(s).addEventListener('input', drawCard));
$('#cname').addEventListener('input', e => { who = e.target.value.trim(); store.set('dv-name', who); $$('.nm').forEach(n => n.textContent = who || 'my beloved'); });
$('#cd').addEventListener('click', () => download($('#card'), 'diwali-card.png'));

/* ---------- Lanterns ---------- */
$('#rel').addEventListener('click', () => {
  const l = document.createElement('div'), s = document.createElement('span');
  l.className = 'lantern'; l.style.left = rnd(8, 88) + '%'; l.style.setProperty('--dx', rnd(-60, 60) + 'px');
  s.textContent = $('#wish').value.trim() || 'Happy Diwali'; l.appendChild(s); document.body.appendChild(l); tone(rnd(300, 420));
  const rm = () => l.remove(); l.addEventListener('animationend', rm); if (reduce) setTimeout(rm, 7000);
  $('#wish').value = '';
});

/* ---------- Quiz ---------- */
const Q = [
  ['Diwali is widely known as the festival of…', ['Lights', 'Kites', 'Boats', 'Harvest moons'], 0],
  ['Which goddess is worshipped on Diwali night in many homes?', ['Saraswati', 'Lakshmi', 'Parvati', 'Ganga'], 1],
  ['What is a small traditional clay lamp called?', ['Thali', 'Kalash', 'Diya', 'Toran'], 2],
  ['Diwali remembers Rama’s return to Ayodhya, from which epic?', ['Ramayana', 'Mahabharata', 'Panchatantra', 'Vedas'], 0],
  ['Colourful floor art made at entrances is called…', ['Mehndi', 'Rangoli', 'Kolam-cloth', 'Warli-wall'], 1],
  ['Which Hindu month does Diwali traditionally fall in?', ['Chaitra', 'Shravana', 'Kartika', 'Magha'], 2]
];
function quiz() {
  const box = $('#qbox'); let i = 0, s = 0, log = [];
  const el = (t, txt, cls) => { const e = document.createElement(t); if (txt) e.textContent = txt; if (cls) e.className = cls; return e; };
  function show() {
    if (i >= Q.length) return end();
    const [q, o, a] = Q[i]; box.replaceChildren(el('small', `Question ${i + 1} of ${Q.length}`), el('h3', q));
    o.forEach((t, k) => {
      const b = el('button', t, 'opt'); b.addEventListener('click', () => {
        $$('.opt').forEach((x, j) => { x.disabled = true; if (j === a) x.classList.add('ok'); });
        if (k === a) s++; else b.classList.add('no');
        log.push([q, k === a, o[a]]); const n = el('button', i + 1 < Q.length ? 'Next →' : 'See result', 'btn s'); n.addEventListener('click', () => { i++; show(); }); box.appendChild(n); n.focus();
      }); box.appendChild(b);
    });
  }
  function end() {
    box.replaceChildren(el('h3', `You scored ${s} / ${Q.length} ${s === Q.length ? '🎆' : s >= 4 ? '✨' : '🪔'}`));
    log.forEach(([q, ok, a]) => box.appendChild(el('p', `${ok ? '✓' : '✗'} ${q} — ${a}`)));
    const r = el('button', '↻ Play again', 'btn s'); r.addEventListener('click', () => { i = 0; s = 0; log = []; show(); }); box.appendChild(r);
    if (s === Q.length) grand();
  }
  show();
}

/* ---------- World dots ---------- */
const pts = [[70, 70], [215, 85], [330, 110], [300, 60], [280, 150], [200, 130], [120, 100]];
$('#dots').innerHTML = pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="14" fill="url(#g)"/><circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="#fff"/>`).join('');

/* ---------- Wire up ---------- */
$('#who').value = who;
$('#enter').addEventListener('click', () => {
  who = $('#who').value.trim() || who; store.set('dv-name', who); names();
  diyaApi.light(); setTimeout(() => {
    $('#intro').classList.add('gone'); $('#top').hidden = false; $('#site').hidden = false; started = true;
    setTimeout(() => { $('#intro').style.display = 'none'; }, 1500); grand();
  }, 900);
});
$('#snd').addEventListener('click', () => setSound(!soundOn));
$('#boom').addEventListener('click', grand);
$('#replay').addEventListener('click', () => { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); grand(); });
$('#link').addEventListener('click', async () => {
  const m = $('#linkmsg'); if (!who) { m.textContent = 'Add their name first (greeting studio).'; return; }
  const u = location.origin + location.pathname + '?to=' + encodeURIComponent(who);
  try { await navigator.clipboard.writeText(u); m.textContent = 'Link copied — send it to them 💛'; } catch { m.textContent = u; }
});
theme(store.get('dv-theme', 'gold')); $('#ctheme').value = document.body.dataset.theme; names(); quiz();
$('#enter').focus();
})();
