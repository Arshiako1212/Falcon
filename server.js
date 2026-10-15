// Node server + PostgreSQL (Railway). Auth (phone+password), cards, uploads (stored in Postgres), admin panel.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { Pool, types } = require('pg');
types.setTypeParser(20, Number); // bigint -> number

const PORT = process.env.PORT || 3000;
const PUB = __dirname; // flat layout: all files live in one folder
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '';
const PROD = !!(process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production');
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not set. Add a PostgreSQL database and reference it (see README).'); process.exit(1); }

/* ---------- database ---------- */
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined });
const Q = (t, p) => pool.query(t, p).then(r => r.rows);
const one = (t, p) => Q(t, p).then(r => r[0]);
const SCHEMA = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const uid = () => crypto.randomBytes(6).toString('hex');
const log = (who, action, detail = '') => Q('INSERT INTO logs(t,who,action,detail) VALUES($1,$2,$3,$4)', [Date.now(), who, action, String(detail).slice(0, 200)]).catch(console.error);

/* ---------- helpers ---------- */
const hash = (p, s = crypto.randomBytes(16).toString('hex')) => s + ':' + crypto.scryptSync(p, s, 32).toString('hex');
const verify = (p, h) => { const [s, x] = h.split(':'); return crypto.timingSafeEqual(Buffer.from(x), Buffer.from(crypto.scryptSync(p, s, 32).toString('hex'))); };
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const digits = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[\s-]/g, '');
const ip = q => (q.headers['x-forwarded-for'] || q.socket.remoteAddress || '').split(',')[0].trim();
const cookies = q => Object.fromEntries((q.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(a => a[0]));
const J = (r, code, obj) => { r.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); r.end(JSON.stringify(obj)); };
const tries = new Map();
const limited = (q, r) => { const k = ip(q), n = Date.now(); let t = tries.get(k); if (!t || t.reset < n) t = { c: 0, reset: n + 9e5 }; t.c++; tries.set(k, t); if (t.c > 15) { J(r, 429, { error: 'تعداد تلاش بیش از حد است، کمی بعد دوباره امتحان کنید' }); return true; } return false; };

/* sessions live in the database; 'sid' = normal user, 'asid' = admin (role is checked server-side) */
const sess = async (q, name) => { const t = cookies(q)[name]; if (!/^[a-f0-9]{64}$/.test(t || '')) return null; return (await one('SELECT * FROM sessions WHERE token=$1 AND exp>$2', [t, Date.now()])) || null; };
const startSess = async (r, name, role, userId, days) => {
  const t = crypto.randomBytes(32).toString('hex');
  await Q('INSERT INTO sessions(token,role,uid,exp) VALUES($1,$2,$3,$4)', [t, role, userId, Date.now() + days * 864e5]);
  r.setHeader('Set-Cookie', `${name}=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${days * 86400}${PROD ? '; Secure' : ''}`);
};
const endSess = async (q, r, name) => { const t = cookies(q)[name]; if (t) await Q('DELETE FROM sessions WHERE token=$1', [t]); r.setHeader('Set-Cookie', `${name}=; HttpOnly; Path=/; Max-Age=0`); };
const user = async q => { const s = await sess(q, 'sid'); return s && s.role === 'user' ? one('SELECT * FROM users WHERE id=$1', [s.uid]) : null; };
const isAdmin = async q => { const s = await sess(q, 'asid'); return !!s && s.role === 'admin'; };

/* ---------- card validation (allow-lists, never trust the client) ---------- */
const S = (v, n) => String(v ?? '').slice(0, n);
const pick = (v, list, d) => list.includes(v) ? v : d;
const color = v => /^#[0-9a-fA-F]{6}$/.test(v) ? v : '';
const asset = v => /^(\/uploads\/[a-f0-9]{12}\.(png|jpg|webp|mp3|ogg|wav|m4a)|[a-z]{2,12})$/.test(v) ? v : 'none';
const clean = b => ({
  title: S(b.title, 80), message: S(b.message, 600), poem: S(b.poem, 800), inviteTitle: S(b.inviteTitle, 60), footer: S(b.footer, 120),
  details: (Array.isArray(b.details) ? b.details : []).slice(0, 8).map(d => ({ l: S(d?.l, 30), v: S(d?.v, 80) })),
  font: pick(b.font, ['vazir', 'ruqaa', 'harmattan', 'lemonada'], 'vazir'),
  theme: pick(b.theme, ['night', 'rose', 'ocean', 'emerald'], 'night'),
  opening: pick(b.opening, ['envelope', 'gate'], 'envelope'),
  effect: pick(b.effect, ['hearts', 'sparkles', 'confetti', 'petals', 'balloons', 'fireworks', 'stars', 'none'], 'hearts'),
  titleColor: color(b.titleColor), textColor: color(b.textColor), poemColor: color(b.poemColor),
  titleFx: pick(b.titleFx, ['shimmer', 'rainbow', 'solid'], 'shimmer'),
  entrance: pick(b.entrance, ['rise', 'zoom', 'flip', 'bounce'], 'rise'),
  imgRatio: pick(b.imgRatio, ['16/9', '4/3', '1/1', '3/1'], '16/9'),
  imgPos: pick(b.imgPos, ['center', 'top', 'bottom'], 'center'),
  typing: !!b.typing, image: asset(b.image || 'none'), music: asset(b.music || 'none'),
});
const card = r => ({ id: r.id, uid: r.uid, createdAt: r.created_at, updatedAt: r.updated_at, views: r.views, ...r.data });

/* ---------- routes ---------- */
const routes = [];
const R = (m, p, f) => routes.push([m, new RegExp('^' + p + '$'), f]);
const ADM = f => async (q, r, b, m) => (await isAdmin(q)) ? f(q, r, b, m) : J(r, 401, { error: 'دسترسی ندارید' });
const USR = f => async (q, r, b, m) => { const u = await user(q); return u ? f(q, r, b, m, u) : J(r, 401, { error: 'ابتدا وارد شوید' }); };

R('GET', '/api/health', async (q, r) => { await Q('SELECT 1'); J(r, 200, { ok: 1 }); });
R('POST', '/api/register', async (q, r, b) => {
  if (limited(q, r)) return;
  const ph = digits(b.phone), pw = String(b.password || '');
  if (!/^\+?\d{10,15}$/.test(ph)) return J(r, 400, { error: 'شماره تلفن معتبر نیست' });
  if (pw.length < 6 || pw.length > 100) return J(r, 400, { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
  const id = uid(), now = Date.now();
  try { await Q('INSERT INTO users(id,phone,pass,created_at,last_login) VALUES($1,$2,$3,$4,$4)', [id, ph, hash(pw), now]); }
  catch (e) { if (e.code === '23505') return J(r, 409, { error: 'این شماره قبلاً ثبت‌نام کرده است' }); throw e; }
  log(ph, 'ثبت‌نام'); await startSess(r, 'sid', 'user', id, 30); J(r, 200, { ok: 1 });
});
R('POST', '/api/login', async (q, r, b) => {
  if (limited(q, r)) return;
  const u = await one('SELECT * FROM users WHERE phone=$1', [digits(b.phone)]);
  if (!u || !verify(String(b.password || ''), u.pass)) { log(digits(b.phone) || '؟', 'ورود ناموفق', ip(q)); return J(r, 401, { error: 'شماره یا رمز اشتباه است' }); }
  await Q('UPDATE users SET last_login=$1 WHERE id=$2', [Date.now(), u.id]); log(u.phone, 'ورود'); await startSess(r, 'sid', 'user', u.id, 30); J(r, 200, { ok: 1 });
});
R('POST', '/api/logout', async (q, r) => { await endSess(q, r, 'sid'); J(r, 200, { ok: 1 }); });
R('GET', '/api/me', USR(async (q, r, b, m, u) => J(r, 200, { phone: u.phone })));

R('GET', '/api/cards', USR(async (q, r, b, m, u) => J(r, 200, (await Q('SELECT * FROM cards WHERE uid=$1 ORDER BY updated_at DESC', [u.id])).map(card))));
R('POST', '/api/cards', USR(async (q, r, b, m, u) => {
  if ((await one('SELECT count(*) n FROM cards WHERE uid=$1', [u.id])).n >= 50) return J(r, 400, { error: 'حداکثر ۵۰ کارت مجاز است' });
  const d = clean(b), now = Date.now();
  const row = await one('INSERT INTO cards(id,uid,created_at,updated_at,data) VALUES($1,$2,$3,$3,$4) RETURNING *', [uid(), u.id, now, d]);
  log(u.phone, 'ساخت کارت', d.title); J(r, 200, card(row));
}));
R('PUT', '/api/cards/([a-f0-9]+)', USR(async (q, r, b, m, u) => {
  const d = clean(b), row = await one('UPDATE cards SET data=$1,updated_at=$2 WHERE id=$3 AND uid=$4 RETURNING *', [d, Date.now(), m[1], u.id]);
  if (!row) return J(r, 404, { error: 'کارت پیدا نشد' }); log(u.phone, 'ویرایش کارت', d.title); J(r, 200, card(row));
}));
R('DELETE', '/api/cards/([a-f0-9]+)', USR(async (q, r, b, m, u) => {
  const row = await one('DELETE FROM cards WHERE id=$1 AND uid=$2 RETURNING data', [m[1], u.id]);
  if (!row) return J(r, 404, { error: 'کارت پیدا نشد' }); log(u.phone, 'حذف کارت', row.data.title); J(r, 200, { ok: 1 });
}));
R('GET', '/api/public/card/([a-f0-9]+)', async (q, r, b, m) => {
  const row = await one('UPDATE cards SET views=views+1 WHERE id=$1 RETURNING *', [m[1]]);
  if (!row) return J(r, 404, { error: 'کارت پیدا نشد' }); const { uid: _u, ...pub } = card(row); J(r, 200, pub);
});

const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'audio/mpeg': '.mp3', 'audio/ogg': '.ogg', 'audio/wav': '.wav', 'audio/mp4': '.m4a' };
R('POST', '/api/upload', USR(async (q, r, b, m, u) => {
  const x = /^data:([a-z]+\/[a-z0-9]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.data || ''));
  if (!x || !EXT[x[1]]) return J(r, 400, { error: 'فرمت فایل مجاز نیست (png, jpg, webp, mp3, ogg, wav, m4a)' });
  const buf = Buffer.from(x[2], 'base64');
  if (buf.length > 3 * 1024 * 1024) return J(r, 400, { error: 'حجم فایل بیش از ۳ مگابایت است' });
  if (u.uploads >= 30) return J(r, 400, { error: 'سقف آپلود پر شده است' });
  const name = uid() + EXT[x[1]];
  await Q('INSERT INTO files(name,mime,data,uid,created_at) VALUES($1,$2,$3,$4,$5)', [name, x[1], buf, u.id, Date.now()]);
  await Q('UPDATE users SET uploads=uploads+1 WHERE id=$1', [u.id]);
  log(u.phone, 'آپلود فایل', name); J(r, 200, { url: '/uploads/' + name });
}));

/* admin: sign in at /admin with ADMIN_ID + ADMIN_PASSWORD (Railway variables) */
R('POST', '/api/admin/login', async (q, r, b) => {
  if (limited(q, r)) return;
  const ok = ADMIN_PASS && crypto.timingSafeEqual(sha(b.id), sha(ADMIN_ID)) & crypto.timingSafeEqual(sha(b.password), sha(ADMIN_PASS));
  if (!ok) { log('admin?', 'ورود ناموفق ادمین', ip(q)); return J(r, 401, { error: 'شناسه یا رمز اشتباه است' }); }
  await startSess(r, 'asid', 'admin', null, 1); log('admin', 'ورود ادمین'); J(r, 200, { ok: 1 });
});
R('POST', '/api/admin/logout', async (q, r) => { await endSess(q, r, 'asid'); J(r, 200, { ok: 1 }); });
R('GET', '/api/admin/data', ADM(async (q, r) => {
  const [users, cards, logs] = await Promise.all([
    Q('SELECT u.id,u.phone,u.created_at "createdAt",u.last_login "lastLogin",(SELECT count(*) FROM cards c WHERE c.uid=u.id) cards FROM users u ORDER BY u.created_at DESC'),
    Q("SELECT c.id,c.data->>'title' title,u.phone owner,c.views,c.created_at \"createdAt\" FROM cards c LEFT JOIN users u ON u.id=c.uid ORDER BY c.created_at DESC"),
    Q('SELECT t,who,action,detail FROM logs ORDER BY id DESC LIMIT 300'),
  ]);
  J(r, 200, { users, cards, logs });
}));
R('DELETE', '/api/admin/users/([a-f0-9]+)', ADM(async (q, r, b, m) => {
  const row = await one('DELETE FROM users WHERE id=$1 RETURNING phone', [m[1]]); // cascades: cards, files, sessions
  if (!row) return J(r, 404, { error: 'کاربر پیدا نشد' }); log('admin', 'حذف کاربر', row.phone); J(r, 200, { ok: 1 });
}));
R('DELETE', '/api/admin/cards/([a-f0-9]+)', ADM(async (q, r, b, m) => {
  const row = await one('DELETE FROM cards WHERE id=$1 RETURNING data', [m[1]]);
  if (!row) return J(r, 404, { error: 'کارت پیدا نشد' }); log('admin', 'حذف کارت', row.data.title); J(r, 200, { ok: 1 });
}));

/* ---------- static files + uploads (served from Postgres, with Range support for audio) ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const PAGES = { '/': 'index.html', '/app': 'app.html', '/admin': 'admin.html' };
const NF = r => { r.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); r.end('پیدا نشد'); };
async function serveUpload(q, r, name) {
  const f = /^[a-f0-9]{12}\.(png|jpg|webp|mp3|ogg|wav|m4a)$/.test(name) && await one('SELECT mime,data FROM files WHERE name=$1', [name]);
  if (!f) return NF(r);
  const d = f.data, n = d.length, hd = { 'Content-Type': f.mime, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=86400' };
  const m = /^bytes=(\d*)-(\d*)$/.exec(q.headers.range || '');
  if (m && (m[1] || m[2])) {
    const a = m[1] ? +m[1] : Math.max(0, n - +m[2]), b = m[1] && m[2] ? Math.min(+m[2], n - 1) : n - 1;
    if (a > b || a >= n) { r.writeHead(416, { 'Content-Range': `bytes */${n}` }); return r.end(); }
    r.writeHead(206, { ...hd, 'Content-Range': `bytes ${a}-${b}/${n}`, 'Content-Length': b - a + 1 }); return r.end(d.subarray(a, b + 1));
  }
  r.writeHead(200, { ...hd, 'Content-Length': n }); r.end(d);
}
function serve(q, r, p) {
  if (p.startsWith('/uploads/')) return serveUpload(q, r, path.basename(p)).catch(() => NF(r));
  let file;
  if (PAGES[p]) file = path.join(PUB, PAGES[p]);
  else if (/^\/c\/[a-f0-9]+$/.test(p)) file = path.join(PUB, 'view.html');
  else if (p === '/card.js' || p === '/style.css') file = path.join(PUB, p.slice(1)); // allow-list: server.js etc. are never served
  else return NF(r);
  fs.readFile(file, (e, d) => {
    if (e || !MIME[path.extname(file)]) return NF(r);
    r.writeHead(200, { 'Content-Type': MIME[path.extname(file)], 'X-Content-Type-Options': 'nosniff' }); r.end(d);
  });
}

const server = http.createServer((q, r) => {
  const p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  const route = routes.map(([m, re, f]) => m === q.method && re.exec(p) && [f, re.exec(p)]).find(Boolean);
  if (!route) return q.method === 'GET' ? serve(q, r, p) : J(r, 404, { error: 'مسیر نامعتبر' });
  let size = 0; const chunks = [];
  q.on('data', c => { size += c.length; if (size > 6e6) { J(r, 413, { error: 'حجم درخواست زیاد است' }); q.destroy(); } else chunks.push(c); });
  q.on('end', async () => {
    let b = {};
    if (chunks.length) {
      if (!/json/.test(q.headers['content-type'] || '')) return J(r, 415, { error: 'نوع درخواست نامعتبر' });
      try { b = JSON.parse(Buffer.concat(chunks)); } catch { return J(r, 400, { error: 'JSON نامعتبر' }); }
    }
    try { await route[0](q, r, b, route[1]); } catch (e) { console.error(e); if (!r.headersSent) J(r, 500, { error: 'خطای سرور' }); }
  });
});

(async () => {
  try { await pool.query(SCHEMA); } catch (e) { console.error('Database connection/schema failed:', e.message); process.exit(1); }
  const tidy = () => Promise.all([Q('DELETE FROM sessions WHERE exp<$1', [Date.now()]), Q('DELETE FROM logs WHERE id < (SELECT COALESCE(max(id),0)-5000 FROM logs)')]).catch(console.error);
  tidy(); setInterval(tidy, 36e5);
  server.listen(PORT, () => console.log('Running on :' + PORT + (ADMIN_PASS ? '' : '  (ADMIN_PASSWORD not set: admin login disabled)')));
})();
