/* Shared helpers + card rendering engine (used by builder preview and public view page) */
const h = (t, p = {}, ...c) => { const e = document.createElement(t); for (const k in p) k === 'class' ? e.className = p[k] : k.startsWith('on') ? e[k] = p[k] : e.setAttribute(k, p[k]); c.flat().forEach(x => x != null && e.append(x)); return e; };
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = async (url, method = 'GET', body) => {
  const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'خطا'); return j;
};
const fmt = t => t ? new Date(t).toLocaleString('fa-IR') : '—';

/* ---- default presets: add your own here and they show up in the builder automatically ---- */
const PRESETS = {
  themes: { night: 'شب طلایی', rose: 'گل رز', ocean: 'اقیانوس', emerald: 'زمرد' },
  fonts: { vazir: 'وزیرمتن', ruqaa: 'عارف رقعه (خوشنویسی)', harmattan: 'هارماتان', lemonada: 'لمونادا' },
  images: { none: 'بدون عکس', nurse: 'پرستاری 💗', aurora: 'شفق قطبی', sunset: 'غروب', ocean: 'ساحل و موج', midnight: 'شب پرستاره', petals: 'گلبرگ صورتی', bokeh: 'بوکه رز', gold: 'طلایی' },
  music: { none: 'بدون موسیقی', calm: 'آرام', joy: 'شاد', tender: 'احساسی' },
  openings: { envelope: 'پاکت نامه', gate: 'قلب تپنده' },
  effects: { hearts: 'قلب‌های شناور', confetti: 'کنفتی رنگی', petals: 'گلبرگ‌های ریزان', balloons: 'بادکنک‌ها', fireworks: 'آتش‌بازی', stars: 'ستاره‌های درخشان', sparkles: 'ذرات طلایی', none: 'بدون افکت' },
  titleFx: { shimmer: 'درخشان', rainbow: 'رنگین‌کمانی', solid: 'ساده' },
  entrances: { rise: 'بالا آمدن', zoom: 'زوم چرخان', flip: 'ورق خوردن', bounce: 'پرش' },
  ratios: { '16/9': 'عریض (۱۶:۹)', '4/3': 'استاندارد (۴:۳)', '1/1': 'مربع', '3/1': 'بنر باریک' },
  poss: { center: 'وسط', top: 'بالا', bottom: 'پایین' },
};
const DEF = { title: '', message: '', poem: '', inviteTitle: '', footer: '', details: [], font: 'vazir', theme: 'night', opening: 'envelope', effect: 'hearts', typing: false, image: 'none', music: 'none', titleColor: '', textColor: '', poemColor: '', titleFx: 'shimmer', entrance: 'rise', imgRatio: '16/9', imgPos: 'center' };

/* ---- default cover images: generated SVG scenes, always 1200x675 (16:9) ---- */
const rng = s => () => (s = s * 16807 % 2147483647) / 2147483647;
const SVG = (defs, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`)}")`;
const GR = (...c) => `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">${c.map((x, i) => `<stop offset="${(i / (c.length - 1)).toFixed(2)}" stop-color="${x}"/>`).join('')}</linearGradient>`;
const BL = '<filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter><filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>';
const BG = '<rect width="1200" height="675" fill="url(#s)"/>';
const dots = (n, seed, fn) => { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) o += fn(r, i); return o; };
const star = (x, y, s) => `M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s}Z`;
const IMG = {
  aurora: () => SVG(GR('#06202e', '#0d3a38', '#3b1d5a') + BL, BG + dots(70, 3, r => `<circle cx="${r() * 1200 | 0}" cy="${r() * 420 | 0}" r="${(r() * 1.6 + .5).toFixed(1)}" fill="#fff" opacity="${(r() * .7 + .2).toFixed(2)}"/>`) +
    '<g filter="url(#bl)"><path d="M-50 330 C250 120 480 470 760 240 S1100 140 1260 250 V420 C960 520 640 300 340 470 S0 430 -50 430Z" fill="#2dd4bf" opacity=".5"/><path d="M-50 400 C300 260 520 560 820 360 S1120 300 1260 380 V520 C900 600 600 440 300 560 S0 540 -50 540Z" fill="#ec4899" opacity=".4"/><path d="M200 200 C420 60 700 300 980 120 V250 C720 400 440 180 200 330Z" fill="#a78bfa" opacity=".45"/></g>'),
  sunset: () => SVG(GR('#ffb36b', '#ff5d7f', '#5b2a86') + BL, BG + '<circle cx="600" cy="380" r="160" fill="#fff1b8" opacity=".55" filter="url(#bl)"/><circle cx="600" cy="380" r="105" fill="#ffe9a0"/><path d="M0 470 C200 400 330 450 520 430 S900 380 1200 450 V675 H0Z" fill="#7a2a6e"/><path d="M0 530 C260 470 420 540 640 500 S1000 470 1200 520 V675 H0Z" fill="#4a1d66"/><path d="M0 600 C300 560 520 620 760 590 S1050 570 1200 600 V675 H0Z" fill="#2b1148"/>'),
  ocean: () => SVG(GR('#c9ecff', '#58b4e8', '#1e6fb8') + BL, BG + '<circle cx="880" cy="170" r="100" fill="#fff6c9" opacity=".9" filter="url(#b2)"/>' + ['#7cc6f2', '#4fa6e0', '#2f84cc', '#1d63ad', '#134a8f'].map((c, i) => { const y = 360 + i * 62; return `<path d="M0 ${y} C150 ${y - 40} 300 ${y + 40} 450 ${y} S750 ${y - 40} 900 ${y} S1100 ${y + 30} 1200 ${y} V675 H0Z" fill="${c}" opacity="${(.78 + i * .05).toFixed(2)}"/>`; }).join('')),
  midnight: () => SVG(GR('#050b1f', '#16275c', '#34307a') + BL, BG + dots(130, 5, r => `<circle cx="${r() * 1200 | 0}" cy="${r() * 430 | 0}" r="${(r() * 1.8 + .4).toFixed(1)}" fill="#fff" opacity="${(r() * .8 + .2).toFixed(2)}"/>`) +
    '<circle cx="930" cy="170" r="130" fill="#ffe9a8" opacity=".22" filter="url(#bl)"/><circle cx="930" cy="170" r="62" fill="#fff3c4"/><circle cx="956" cy="156" r="56" fill="#13235a"/><path d="M0 520 C150 440 300 500 470 450 S800 420 1000 480 S1150 470 1200 490 V675 H0Z" fill="#0a1233"/><path d="M0 590 C200 540 380 600 600 560 S960 540 1200 580 V675 H0Z" fill="#060c24"/>'),
  petals: () => SVG(GR('#fff3f6', '#ffc2d1', '#ff93ae') + BL, BG + dots(14, 9, r => `<circle cx="${r() * 1200 | 0}" cy="${r() * 675 | 0}" r="${50 + r() * 70 | 0}" fill="#fff" opacity=".28" filter="url(#bl)"/>`) +
    dots(48, 11, (r, i) => { const x = r() * 1200 | 0, y = r() * 675 | 0; return `<ellipse cx="${x}" cy="${y}" rx="${20 + r() * 22 | 0}" ry="${10 + r() * 10 | 0}" fill="${['#ff7aa2', '#ffa3bd', '#ff5d8a', '#ffd0dc'][i % 4]}" opacity="${(.55 + r() * .4).toFixed(2)}" transform="rotate(${r() * 180 | 0} ${x} ${y})"/>`; })),
  bokeh: () => SVG(GR('#3a0f2b', '#7a1d3f', '#b3365a') + BL, BG + dots(36, 21, (r, i) => `<circle cx="${r() * 1200 | 0}" cy="${r() * 675 | 0}" r="${30 + r() * 90 | 0}" fill="${['#ff8fa3', '#ffd1a1', '#ff5d7f', '#ffe6a8'][i % 4]}" opacity="${(.2 + r() * .4).toFixed(2)}" filter="url(#${i % 3 ? 'b2' : 'bl'})"/>`)),
  gold: () => SVG(GR('#160f04', '#2e2108', '#4d3910') + BL, BG + dots(30, 41, (r, i) => `<circle cx="${r() * 1200 | 0}" cy="${r() * 675 | 0}" r="${25 + r() * 80 | 0}" fill="${['#e6c36e', '#f7e2a1', '#c9972f'][i % 3]}" opacity="${(.15 + r() * .35).toFixed(2)}" filter="url(#${i % 3 ? 'b2' : 'bl'})"/>`) +
    dots(26, 43, r => `<path d="${star(r() * 1200 | 0, r() * 675 | 0, 8 + r() * 16 | 0)}" fill="#fff0b8" opacity="${(.5 + r() * .5).toFixed(2)}"/>`)),
  nurse: () => SVG(GR('#0d3a38', '#0f766e', '#115e59') + BL, BG + dots(12, 31, r => { const x = r() * 1200 | 0, y = r() * 675 | 0, u = 6 + r() * 8 | 0; return `<path d="M${x - u},${y - 3 * u} L${x + u},${y - 3 * u} L${x + u},${y - u} L${x + 3 * u},${y - u} L${x + 3 * u},${y + u} L${x + u},${y + u} L${x + u},${y + 3 * u} L${x - u},${y + 3 * u} L${x - u},${y + u} L${x - 3 * u},${y + u} L${x - 3 * u},${y - u} L${x - u},${y - u}Z" fill="#fff" opacity=".1"/>`; }) +
    '<path d="M0 400 H380 L420 400 L460 290 L510 510 L560 340 L600 400 H1200" fill="none" stroke="#ffb3c1" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#b2)"/><path d="M0 400 H380 L420 400 L460 290 L510 510 L560 340 L600 400 H1200" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M600 150 C535 90 455 150 515 225 L600 305 L685 225 C745 150 665 90 600 150Z" fill="#ff5d7f"/><path d="M570 150 C555 138 535 150 548 170" fill="none" stroke="#ffd0da" stroke-width="6" stroke-linecap="round"/>'),
};
const IMGC = {};
const imgCss = id => IMG[id] ? (IMGC[id] || (IMGC[id] = IMG[id]())) : `url("${id}")`;

const TUNES = { // chord progressions (Hz), step length (s), waveform
  calm: { ch: [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]], dt: .5, w: 'triangle' },
  joy: { ch: [[261.63, 329.63, 392], [196, 246.94, 293.66], [220, 261.63, 329.63], [174.61, 220, 261.63]], dt: .27, w: 'triangle' },
  tender: { ch: [[146.83, 174.61, 220], [233.08, 293.66, 349.23], [174.61, 220, 261.63], [261.63, 329.63, 392]], dt: .7, w: 'sine' },
};

const Music = {
  on: false, ac: null, audio: null, timer: null,
  start(id) {
    this.stop(); if (!id || id === 'none') return; this.on = true;
    if (id.startsWith('/uploads/')) { this.audio = new Audio(id); this.audio.loop = true; this.audio.play().catch(() => {}); return; }
    const T = TUNES[id]; if (!T) return;
    const ac = this.ac = new (window.AudioContext || window.webkitAudioContext)(), m = this.m = ac.createGain();
    m.gain.value = .5; const d = ac.createDelay(), fb = ac.createGain(), wet = ac.createGain();
    d.delayTime.value = .45; fb.gain.value = .45; wet.gain.value = .55; d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(ac.destination); m.connect(d); m.connect(ac.destination);
    const tone = (f, t, dur, v, type) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .04); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(m); o.start(t); o.stop(t + dur + .1); };
    const arp = [0, 1, 2, 1, 2, 1, 0, 2]; let t = ac.currentTime + .1, s = 0;
    this.timer = setInterval(() => { while (t < ac.currentTime + 1.2) { const c = T.ch[Math.floor(s / 8) % 4], i = s % 8; if (i == 0) c.forEach(f => tone(f / 2, t, T.dt * 8, .05, 'sine')); tone(c[arp[i]] * (i % 4 == 3 ? 2 : 1), t, T.dt * 3, .07, T.w); t += T.dt; s++; } }, 250);
  },
  stop() { clearInterval(this.timer); this.ac && this.ac.close().catch(() => {}); this.ac = null; this.audio && this.audio.pause(); this.audio = null; this.on = false; },
  toggle() { if (this.audio) { this.on = !this.on; this.on ? this.audio.play() : this.audio.pause(); } else if (this.ac) { this.on = !this.on; this.m.gain.setTargetAtTime(this.on ? .5 : 0, this.ac.currentTime, .1); } return this.on; },
};

/* ---- background effects ---- */
const pk = a => a[Math.random() * a.length | 0];
const HC = ['#ff6b8b', '#e0566f', '#ffb3c1', '#f4c6d0', '#e6c36e'], CC = ['#ff5d7f', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ffffff'];
const EFX = {
  hearts: { n: 40, mk: (W, H, i) => ({ x: rnd(0, W), y: i ? rnd(0, H) : H + 30, s: rnd(10, 30), v: rnd(.3, .9), a: rnd(0, 6), c: pk(HC), o: rnd(.25, .6) }), up: p => { p.y -= p.v; p.a += .02; p.x += Math.sin(p.a) * .5; return p.y < -40; }, dr: (x, p) => { x.globalAlpha = p.o; x.fillStyle = p.c; x.font = p.s + 'px serif'; x.fillText('♥', p.x, p.y); } },
  sparkles: { n: 55, mk: (W, H, i) => ({ x: rnd(0, W), y: i ? rnd(0, H) : H + 10, s: rnd(.8, 2.6), v: rnd(.2, .6), a: rnd(0, 6) }), up: p => { p.y -= p.v; p.a += .05; return p.y < -10; }, dr: (x, p) => { x.globalAlpha = .3 + .5 * Math.abs(Math.sin(p.a)); x.fillStyle = '#ffd978'; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); } },
  confetti: { n: 70, mk: (W, H, i) => ({ x: rnd(0, W), y: i ? rnd(-H, H) : -20, w: rnd(6, 12), h: rnd(10, 18), v: rnd(1, 2.6), a: rnd(0, 6), r: rnd(0, 6), vr: rnd(-.1, .1), c: pk(CC) }), up: (p, W, H) => { p.y += p.v; p.a += .03; p.r += p.vr; p.x += Math.sin(p.a) * 1.1; return p.y > H + 30; }, dr: (x, p) => { x.globalAlpha = .9; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.a * 2)) + 2); x.restore(); } },
  petals: { n: 32, mk: (W, H, i) => ({ x: rnd(0, W), y: i ? rnd(-H, H) : -20, s: rnd(7, 15), v: rnd(.6, 1.4), a: rnd(0, 6), r: rnd(0, 6), c: pk(['#ff9db8', '#ffc2d1', '#ff7aa2', '#ffd9e2']) }), up: (p, W, H) => { p.y += p.v; p.a += .025; p.r += .02; p.x += Math.sin(p.a) * 1.3; return p.y > H + 30; }, dr: (x, p) => { x.globalAlpha = .8; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.beginPath(); x.ellipse(0, 0, p.s, p.s * .5, 0, 0, 7); x.fill(); x.restore(); } },
  balloons: { n: 14, mk: (W, H, i) => ({ x: rnd(0, W), y: i ? rnd(0, H) : H + 60, s: rnd(16, 28), v: rnd(.5, 1.2), a: rnd(0, 6), c: pk(['#ff5d7f', '#ffb3c1', '#ffd166', '#7dd3fc', '#c4b5fd']) }), up: p => { p.y -= p.v; p.a += .02; p.x += Math.sin(p.a) * .5; return p.y < -100; }, dr: (x, p) => { x.globalAlpha = .85; x.strokeStyle = '#ffffff88'; x.lineWidth = 1; x.beginPath(); x.moveTo(p.x, p.y + p.s * 1.2); x.quadraticCurveTo(p.x + 8, p.y + p.s * 2, p.x, p.y + p.s * 3); x.stroke(); x.fillStyle = p.c; x.beginPath(); x.ellipse(p.x, p.y, p.s * .8, p.s, 0, 0, 7); x.fill(); x.fillStyle = '#ffffff66'; x.beginPath(); x.ellipse(p.x - p.s * .3, p.y - p.s * .35, p.s * .15, p.s * .28, .5, 0, 7); x.fill(); } },
  stars: { n: 70, mk: (W, H) => ({ x: rnd(0, W), y: rnd(0, H), s: rnd(1, 4), a: rnd(0, 6), v: rnd(.02, .07) }), up: p => { p.a += p.v; }, dr: (x, p) => { x.globalAlpha = .25 + .75 * Math.abs(Math.sin(p.a)); x.fillStyle = '#fff6c9'; const s = p.s; x.beginPath(); x.moveTo(p.x, p.y - s * 2); x.quadraticCurveTo(p.x, p.y, p.x + s * 2, p.y); x.quadraticCurveTo(p.x, p.y, p.x, p.y + s * 2); x.quadraticCurveTo(p.x, p.y, p.x - s * 2, p.y); x.quadraticCurveTo(p.x, p.y, p.x, p.y - s * 2); x.fill(); } },
  fireworks: { n: 0 },
};
const boom = (S, x, y, n, heart) => { const col = pk(CC); for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), sp = rnd(1.5, 6); S.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (heart ? 2 : 0), life: 1, c: heart ? pk(HC) : col, s: heart ? rnd(12, 26) : rnd(1.6, 3), g: heart ? .12 : .05, d: heart ? .014 : .012, t: heart }); } };

function renderCard(root, card0, { instant = false } = {}) {
  const c = { ...DEF, ...card0 };
  const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const quick = instant || still;
  Music.stop(); root.replaceChildren(); root.className = `cardroot t-${c.theme} f-${c.font}`;
  const run = (root._run = (root._run || 0) + 1);
  const fx = h('canvas', { class: 'fx' }); root.append(fx);

  const card = h('main', { class: `card en-${c.entrance}` + (c.image === 'none' ? ' nocover' : '') });
  if (c.titleColor) card.style.setProperty('--tc', c.titleColor);
  if (c.textColor) card.style.setProperty('--mc', c.textColor);
  if (c.poemColor) card.style.setProperty('--pc', c.poemColor);
  if (c.image !== 'none') {
    const cv = h('div', { class: 'cover' }, h('i')); cv.style.setProperty('--ar', c.imgRatio);
    cv.firstChild.style.backgroundImage = imgCss(c.image); cv.firstChild.style.backgroundPosition = `center ${c.imgPos}`; card.append(cv);
  }
  const ecg = h('span'); ecg.innerHTML = '<svg class="ecg" viewBox="0 0 300 56" aria-hidden="true"><path d="M0 30 H90 L104 30 L114 8 L128 50 L140 18 L150 30 H210 C216 22 226 22 232 30 C238 22 248 22 254 30 L232 48 L210 30 M254 30 H300"/></svg>';
  const title = h('h1', { class: 'fx-' + c.titleFx }), msg = h('p', { class: 'msg' });
  const lines = String(c.poem || '').split('\n').map(t => h('span', { class: 'ln' }, t));
  const poem = lines.length && String(c.poem).trim() ? h('div', { class: 'poem' }, lines) : null;
  const inv = c.details.length ? h('section', { class: 'inv' }, h('h2', {}, c.inviteTitle), c.details.map((d, i) => { const r = h('div', {}, h('span', {}, d.l), h('b', {}, d.v)); r.style.setProperty('--i', i); return r; })) : null;
  const ft = h('p', { class: 'ft' }, c.footer);
  card.append(h('i', { class: 'sheen' }), ecg, title, msg, poem, inv, ft); root.append(card);

  const type = async (el, text, sp) => { if (quick) return el.textContent = text; for (const ch of Array.from(text)) { if (root._run !== run) return; el.textContent += ch; await sleep(sp); } };
  const play = async () => {
    card.classList.add('show');
    if (!c.typing) { title.textContent = c.title; msg.textContent = c.message; } else { await sleep(quick ? 0 : 1200); await type(title, c.title, 65); await type(msg, c.message, 26); }
    if (!c.typing && !quick) await sleep(1300);
    for (const l of lines) { if (root._run !== run) return; l.classList.add('on'); await sleep(quick ? 0 : 800); }
    inv && inv.classList.add('on'); await sleep(quick ? 0 : 1200); ft.classList.add('on');
  };

  if (c.music !== 'none') {
    const b = h('button', { class: 'snd', 'aria-label': 'قطع و وصل موسیقی', onclick: () => { b.textContent = Music.toggle() ? '🔊' : '🔇'; } }, '🔊'); root.append(b); root._snd = b;
  }
  const start = () => { if (c.music !== 'none') { Music.start(c.music); root._snd.style.display = 'block'; } play(); };

  // background effect + heart bursts
  root._boom = null; root.onpointerdown = null;
  if (c.effect !== 'none') {
    const E = EFX[c.effect] || EFX.hearts, x = fx.getContext('2d'), P = [], S = []; let W, H, f = 0;
    const size = () => { const d = devicePixelRatio || 1; W = root.clientWidth; H = root.clientHeight; fx.width = W * d; fx.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); };
    size(); removeEventListener('resize', root._rs); root._rs = size; addEventListener('resize', size);
    for (let i = 0; i < E.n; i++) P.push(E.mk(W, H, 1));
    root._boom = (px, py, n, heart) => boom(S, px, py, n, heart);
    root.onpointerdown = e => { if (still) return; const b = root.getBoundingClientRect(); boom(S, e.clientX - b.left, e.clientY - b.top, 7, true); };
    (function loop() {
      if (root._run !== run || !root.isConnected) return; x.clearRect(0, 0, W, H);
      for (const p of P) { if (!still && E.up(p, W, H)) Object.assign(p, E.mk(W, H, 0)); E.dr(x, p); }
      if (c.effect === 'fireworks' && !still && ++f % 75 === 1) boom(S, rnd(W * .15, W * .85), rnd(H * .08, H * .4), 42, false);
      for (let i = S.length - 1; i >= 0; i--) {
        const p = S[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .985; p.life -= p.d; if (p.life <= 0) { S.splice(i, 1); continue; }
        x.globalAlpha = p.life; x.fillStyle = p.c; if (p.t) { x.font = p.s + 'px serif'; x.fillText('♥', p.x, p.y); } else { x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); }
      }
      still || requestAnimationFrame(loop);
    })();
  }
  if (instant) { play(); return; }

  const gate = h('div', { class: 'gate', role: 'button', tabindex: '0', 'aria-label': 'باز کردن کارت' });
  if (c.opening === 'envelope') { const env = h('div', { class: 'env' }, h('div', { class: 'bd' }), h('div', { class: 'flap' }), h('div', { class: 'seal' }, '♥')); gate.append(env); gate._env = env; }
  else gate.append(h('div', { class: 'heart' }, '♥'));
  gate.append(h('div', { class: 'hint' }, 'برای باز کردن کارت، لمس کنید')); root.append(gate);
  let opened = false;
  const open = async () => { if (opened) return; opened = true; gate._env && gate._env.classList.add('opened'); start(); root._boom && !still && root._boom(root.clientWidth / 2, Math.min(root.clientHeight, innerHeight) / 2, 55, true); await sleep(still ? 0 : 900); gate.classList.add('gone'); };
  gate.onclick = e => { e.stopPropagation(); open(); }; gate.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && open();
}
