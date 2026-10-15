/* Shared helpers + card rendering engine (used by builder preview and public view page) */
const h = (t, p = {}, ...c) => { const e = document.createElement(t); for (const k in p) k === 'class' ? e.className = p[k] : k.startsWith('on') ? e[k] = p[k] : e.setAttribute(k, p[k]); c.flat().forEach(x => x != null && e.append(x)); return e; };
const $ = s => document.querySelector(s);
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
  images: { none: 'بدون عکس', aurora: 'شفق', sunset: 'غروب', petals: 'گلبرگ', midnight: 'نیمه‌شب' },
  music: { none: 'بدون موسیقی', calm: 'آرام', joy: 'شاد', tender: 'احساسی' },
  openings: { envelope: 'پاکت نامه', gate: 'قلب تپنده' },
  effects: { hearts: 'قلب‌های شناور', sparkles: 'ذرات طلایی', none: 'بدون افکت' },
};
const IMG = {
  aurora: 'linear-gradient(135deg,#0f766e,#6366f1 55%,#ec4899)',
  sunset: 'linear-gradient(160deg,#f97316,#e11d48 60%,#4c1d95)',
  petals: 'radial-gradient(circle at 30% 30%,#fbcfe8,transparent 50%),radial-gradient(circle at 75% 60%,#fda4af,transparent 55%),#fff1f2',
  midnight: 'radial-gradient(circle at 75% 25%,#fde68a 0 5%,transparent 6%),linear-gradient(#0b1b3a,#1e3a8a)',
};
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

function renderCard(root, c, { instant = false } = {}) {
  const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const quick = instant || still;
  Music.stop(); root.replaceChildren(); root.className = `cardroot t-${c.theme} f-${c.font}`;
  const run = (root._run = (root._run || 0) + 1);
  const fx = h('canvas', { class: 'fx' }); root.append(fx);

  const card = h('main', { class: 'card' + (c.image === 'none' ? ' nocover' : '') });
  if (c.image !== 'none') { const cv = h('div', { class: 'cover' }); cv.style.backgroundImage = IMG[c.image] || `url("${c.image}")`; card.append(cv); }
  const ecg = h('span'); ecg.innerHTML = '<svg class="ecg" viewBox="0 0 300 56" aria-hidden="true"><path d="M0 30 H90 L104 30 L114 8 L128 50 L140 18 L150 30 H210 C216 22 226 22 232 30 C238 22 248 22 254 30 L232 48 L210 30 M254 30 H300"/></svg>';
  const title = h('h1'), msg = h('p', { class: 'msg' });
  const lines = String(c.poem || '').split('\n').map(t => h('span', { class: 'ln' }, t));
  const poem = lines.length && c.poem.trim() ? h('div', { class: 'poem' }, lines) : null;
  const inv = c.details.length ? h('section', { class: 'inv' }, h('h2', {}, c.inviteTitle), c.details.map(d => h('div', {}, h('span', {}, d.l), h('b', {}, d.v)))) : null;
  const ft = h('p', { class: 'ft' }, c.footer);
  card.append(ecg, title, msg, poem, inv, ft); root.append(card);

  const type = async (el, text, sp) => { if (quick) return el.textContent = text; for (const ch of Array.from(text)) { if (root._run !== run) return; el.textContent += ch; await sleep(sp); } };
  const play = async () => {
    card.classList.add('show');
    if (!c.typing) { title.textContent = c.title; msg.textContent = c.message; } else { await sleep(quick ? 0 : 1200); await type(title, c.title, 65); await type(msg, c.message, 26); }
    if (!c.typing && !quick) await sleep(1300);
    for (const l of lines) { if (root._run !== run) return; l.classList.add('on'); await sleep(quick ? 0 : 800); }
    inv && inv.classList.add('on'); await sleep(quick ? 0 : 1000); ft.classList.add('on');
  };

  if (c.music !== 'none') {
    const b = h('button', { class: 'snd', 'aria-label': 'قطع و وصل موسیقی', onclick: () => { b.textContent = Music.toggle() ? '🔊' : '🔇'; } }, '🔊'); root.append(b); root._snd = b;
  }
  const start = () => { if (c.music !== 'none') { Music.start(c.music); root._snd.style.display = 'block'; } play(); };
  if (instant) { play(); return; }

  const gate = h('div', { class: 'gate', role: 'button', tabindex: '0', 'aria-label': 'باز کردن کارت' });
  if (c.opening === 'envelope') { const env = h('div', { class: 'env' }, h('div', { class: 'bd' }), h('div', { class: 'flap' }), h('div', { class: 'seal' }, '♥')); gate.append(env); gate._env = env; }
  else gate.append(h('div', { class: 'heart' }, '♥'));
  gate.append(h('div', { class: 'hint' }, 'برای باز کردن کارت، لمس کنید')); root.append(gate);
  let opened = false;
  const open = async () => { if (opened) return; opened = true; gate._env && gate._env.classList.add('opened'); start(); await sleep(still ? 0 : 900); gate.classList.add('gone'); };
  gate.onclick = open; gate.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && open();

  // particles
  if (c.effect !== 'none') {
    const x = fx.getContext('2d'); let W, H; const P = [];
    const size = () => { W = fx.width = root.clientWidth; H = fx.height = root.clientHeight; }; size(); addEventListener('resize', size);
    for (let i = 0; i < 50; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + .6, v: Math.random() * .4 + .15, a: Math.random() * 6, hh: c.effect === 'hearts' ? Math.random() < .6 : Math.random() < .1 });
    (function loop() { if (root._run !== run || !root.isConnected) return; x.clearRect(0, 0, W, H);
      for (const p of P) { p.y -= p.v; p.a += .03; if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; } x.globalAlpha = .3 + .35 * Math.sin(p.a);
        if (p.hh) { x.fillStyle = '#e0566f'; x.font = p.r * 7 + 'px serif'; x.fillText('♥', p.x, p.y); } else { x.fillStyle = '#e6c36e'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); } }
      still || requestAnimationFrame(loop); })();
  }
}
