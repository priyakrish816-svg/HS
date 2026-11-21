/*
 * harising.cloud: portfolio site with member login for the calculators.
 * Zero dependencies: Node.js 18+ built-ins only (http, crypto, fs, path).
 *
 * Environment variables
 *   PORT            port to listen on (default 3000)
 *   DATA_DIR        where users.json is stored; mount a persistent volume here (default /data)
 *   SESSION_SECRET  long random string used to sign login cookies (REQUIRED in production)
 *   SIGNUP          open | code | closed   (default open)
 *   SIGNUP_CODE     access code needed to create an account when SIGNUP=code
 *   COOKIE_SECURE   set to "false" only for local testing over plain http (default true)
 *   SESSION_DAYS    how long a login lasts (default 30)
 *
 * Admin commands (run inside the container, for example from the Coolify terminal):
 *   node server.js users                 list accounts
 *   node server.js delete <email>        delete an account
 *   node server.js reset <email> <pass>  set a new password
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = process.env.DATA_DIR || '/data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PRIVATE_DIR = path.join(__dirname, 'private');
const SIGNUP = (process.env.SIGNUP || 'open').toLowerCase();
const SIGNUP_CODE = process.env.SIGNUP_CODE || '';
const COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';
const SESSION_DAYS = parseFloat(process.env.SESSION_DAYS || '30');
const COOKIE = 'hs_session';

let SECRET = process.env.SESSION_SECRET;
if (!SECRET || SECRET.length < 32) {
  SECRET = crypto.randomBytes(48).toString('hex');
  if (process.argv.length <= 2) console.warn('[warn] SESSION_SECRET is missing or shorter than 32 characters. Using a random one: everyone is logged out when the server restarts.');
}

/* ---------- user store ---------- */
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return { users: [] }; throw e; }
}
function saveUsers(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = USERS_FILE + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, USERS_FILE);
}
const normEmail = e => String(e || '').trim().toLowerCase();

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve(key.toString('hex')));
  });
}
async function verifyPassword(password, user) {
  const h = Buffer.from(await hashPassword(password, user.salt), 'hex');
  const stored = Buffer.from(user.hash, 'hex');
  return h.length === stored.length && crypto.timingSafeEqual(h, stored);
}

/* ---------- sessions (signed, stateless cookies) ---------- */
const b64u = b => Buffer.from(b).toString('base64url');
function sign(payload) {
  const body = b64u(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + mac;
}
function unsign(token) {
  if (!token || token.indexOf('.') < 0) return null;
  const [body, mac] = token.split('.');
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
function sessionCookie(value, maxAgeSec) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${COOKIE_SECURE ? '; Secure' : ''}`;
}
function currentUser(req) {
  const p = unsign(parseCookies(req)[COOKIE]);
  if (!p) return null;
  const u = loadUsers().users.find(x => x.id === p.uid);
  return u && u.sv === p.sv ? u : null; // sv changes on password reset, which ends old sessions
}
function startSession(res, user) {
  const exp = Date.now() + SESSION_DAYS * 86400e3;
  res.setHeader('Set-Cookie', sessionCookie(sign({ uid: user.id, sv: user.sv, exp }), Math.floor(SESSION_DAYS * 86400)));
}
const publicUser = u => ({ name: u.name, email: u.email });

/* ---------- login rate limiting (per IP, in memory) ---------- */
const attempts = new Map();
function clientIp(req) {
  const xf = req.headers['x-forwarded-for']; // Coolify's proxy sets this
  return (xf ? String(xf).split(',')[0] : req.socket.remoteAddress || '').trim();
}
function limited(ip) {
  const now = Date.now(), win = 15 * 60e3, max = 10;
  const a = (attempts.get(ip) || []).filter(t => now - t < win);
  attempts.set(ip, a);
  return a.length >= max;
}
const noteAttempt = ip => attempts.get(ip).push(Date.now());
setInterval(() => { const now = Date.now(); for (const [k, v] of attempts) if (!v.some(t => now - t < 15 * 60e3)) attempts.delete(k); }, 10 * 60e3).unref();

/* ---------- helpers ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };
function baseHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (COOKIE_SECURE) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return reject(Object.assign(new Error('Expected JSON'), { status: 415 }));
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 10240) { reject(Object.assign(new Error('Too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch { reject(Object.assign(new Error('Bad JSON'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function sendFile(res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- API ---------- */
async function api(req, res, route) {
  const ip = clientIp(req);
  if (route === '/api/me' && req.method === 'GET') {
    const u = currentUser(req);
    return json(res, u ? 200 : 401, { user: u ? publicUser(u) : null, signup: SIGNUP });
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  let body;
  try { body = await readJson(req); } catch (e) { return json(res, e.status || 400, { error: 'Invalid request.' }); }

  if (route === '/api/signup') {
    if (SIGNUP === 'closed') return json(res, 403, { error: 'New accounts are by invitation only.' });
    if (limited(ip)) return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    noteAttempt(ip);
    const name = String(body.name || '').trim().slice(0, 80);
    const email = normEmail(body.email);
    const password = String(body.password || '');
    if (SIGNUP === 'code' && (!SIGNUP_CODE || String(body.code || '').trim() !== SIGNUP_CODE)) return json(res, 403, { error: 'That access code is not valid.' });
    if (!name) return json(res, 400, { error: 'Enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return json(res, 400, { error: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 200) return json(res, 400, { error: 'Password must be at least 8 characters.' });
    const db = loadUsers();
    if (db.users.some(u => u.email === email)) return json(res, 409, { error: 'An account with that email already exists. Log in instead.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const user = { id: crypto.randomUUID(), name, email, salt, hash: await hashPassword(password, salt), sv: 1, created: new Date().toISOString() };
    db.users.push(user); saveUsers(db);
    console.log(`[signup] ${email}`);
    startSession(res, user);
    return json(res, 201, { user: publicUser(user) });
  }
  if (route === '/api/login') {
    if (limited(ip)) return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    noteAttempt(ip);
    const email = normEmail(body.email);
    const user = loadUsers().users.find(u => u.email === email);
    const ok = user ? await verifyPassword(String(body.password || ''), user) : (await hashPassword('x', 'dummy-salt-equalise-timing'), false);
    if (!ok) return json(res, 401, { error: 'Email or password is incorrect.' });
    startSession(res, user);
    return json(res, 200, { user: publicUser(user) });
  }
  if (route === '/api/logout') {
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: 'Not found' });
}

/* ---------- server ---------- */
const server = http.createServer(async (req, res) => {
  baseHeaders(res);
  let route;
  try { route = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  try {
    if (route === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
    if (route.startsWith('/api/')) return await api(req, res, route);
    if (route === '/app/calculators.js') {
      if (!currentUser(req)) return json(res, 401, { error: 'Sign in required.' });
      return sendFile(res, path.join(PRIVATE_DIR, 'calculators.js'), 'private, no-store');
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    const rel = route === '/' ? '/index.html' : route;
    const file = path.normalize(path.join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end(); }
    const cache = file.endsWith('.html') ? 'no-cache' : 'public, max-age=604800';
    return sendFile(res, file, cache);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'Server error. Please try again.' });
  }
});

/* ---------- admin CLI ---------- */
async function cli(args) {
  const [cmd, a, b] = args;
  const db = loadUsers();
  if (cmd === 'users') { db.users.forEach(u => console.log(`${u.email}\t${u.name}\t${u.created}`)); console.log(`${db.users.length} account(s)`); return; }
  if (cmd === 'delete') { const n = db.users.length; db.users = db.users.filter(u => u.email !== normEmail(a)); saveUsers(db); console.log(n === db.users.length ? 'No such account.' : 'Deleted.'); return; }
  if (cmd === 'reset') {
    const u = db.users.find(x => x.email === normEmail(a));
    if (!u || !b || b.length < 8) { console.log('Usage: node server.js reset <email> <new password of 8+ characters>'); return; }
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = await hashPassword(b, u.salt); u.sv = (u.sv || 1) + 1; saveUsers(db); console.log('Password updated; existing sessions ended.'); return;
  }
  console.log('Commands: users | delete <email> | reset <email> <password>');
}

if (process.argv.length > 2) cli(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
else server.listen(PORT, () => console.log(`harising.cloud listening on :${PORT} (signup: ${SIGNUP}, data: ${DATA_DIR})`));
