// Sorbi hesap çekirdeği — oturum, şema, yardımcılar.
// Kurallar: sır kodda durmaz (depo açık); her sır env'den gelir, yoksa ilgili özellik kapalı kalır.
// Danışan dosyaları sunucuya yalnız tarayıcıda şifrelenmiş halde gelir (kasalar.veri); anahtar sunucuda yok.

const enc = new TextEncoder();

export const json = (data, status = 200, ekBaslik = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...ekBaslik }
  });

export const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function b64urlCoz(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function ozet(s) {
  return b64url(await crypto.subtle.digest('SHA-256', enc.encode(String(s))));
}

export function rastgele(n = 32) {
  const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a);
}

export async function hmac(tuz, s) {
  const key = await crypto.subtle.importKey('raw', enc.encode(tuz), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(s)));
}

export const simdi = () => new Date().toISOString().slice(0, 19) + 'Z';
export const sonra = (ms) => new Date(Date.now() + ms).toISOString().slice(0, 19) + 'Z';

let SEMA_TAMAM = false;
export async function semaKur(env) {
  if (SEMA_TAMAM) return;
  const T = [
    "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, date TEXT, meta TEXT, referrer TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')))",
    "CREATE TABLE IF NOT EXISTS liste (id INTEGER PRIMARY KEY AUTOINCREMENT, eposta TEXT NOT NULL UNIQUE, kaynak TEXT, referrer TEXT, ip_ozet TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')))",
    "CREATE TABLE IF NOT EXISTS kullanicilar (id INTEGER PRIMARY KEY AUTOINCREMENT, eposta TEXT UNIQUE, google_sub TEXT UNIQUE, kullanici_adi TEXT UNIQUE COLLATE NOCASE, plan TEXT DEFAULT 'ucretsiz', kaynak TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')), son_gorulme TEXT)",
    "CREATE TABLE IF NOT EXISTS oturumlar (token_ozet TEXT PRIMARY KEY, kullanici_id INTEGER NOT NULL, bitis TEXT NOT NULL, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')))",
    "CREATE TABLE IF NOT EXISTS giris_linkleri (token_ozet TEXT PRIMARY KEY, eposta TEXT NOT NULL, bitis TEXT NOT NULL, kullanildi INTEGER DEFAULT 0, geri TEXT, ip_ozet TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')))",
    "CREATE TABLE IF NOT EXISTS kasalar (kullanici_id INTEGER PRIMARY KEY, veri TEXT NOT NULL, iv TEXT NOT NULL, tuz TEXT NOT NULL, surum INTEGER NOT NULL DEFAULT 1, boyut INTEGER, guncel TEXT)",
    "CREATE TABLE IF NOT EXISTS bekleme (id INTEGER PRIMARY KEY AUTOINCREMENT, kullanici_id INTEGER, plan TEXT NOT NULL, kaynak TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')), UNIQUE(kullanici_id, plan))",
    "CREATE INDEX IF NOT EXISTS ev_tarih ON events(created_at)",
    "CREATE INDEX IF NOT EXISTS ot_kul ON oturumlar(kullanici_id)"
  ];
  for (const q of T) await env.DB.prepare(q).run();
  // Eski events tablosuna yeni kolonlar (varsa hata verir; yutulur).
  for (const q of ["ALTER TABLE events ADD COLUMN kullanici_id INTEGER", "ALTER TABLE events ADD COLUMN ziyaretci TEXT"]) {
    try { await env.DB.prepare(q).run(); } catch (e) {}
  }
  try { await env.DB.prepare("CREATE INDEX IF NOT EXISTS ev_kul ON events(kullanici_id)").run(); } catch (e) {}
  SEMA_TAMAM = true;
}

export function cerezOku(req, ad) {
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + ad + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

const OTURUM_GUN = 90;
export function oturumCerezi(token) {
  return `sorbi_oturum=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OTURUM_GUN * 86400}`;
}
export const oturumSilCerezi = 'sorbi_oturum=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

export async function oturumAc(env, kullaniciId) {
  const token = rastgele(32);
  await env.DB.prepare("INSERT INTO oturumlar (token_ozet, kullanici_id, bitis) VALUES (?,?,?)")
    .bind(await ozet(token), kullaniciId, sonra(OTURUM_GUN * 86400000)).run();
  return token;
}

export async function oturumKullanici(env, req) {
  const token = cerezOku(req, 'sorbi_oturum');
  if (!token || token.length < 20) return null;
  const tz = await ozet(token);
  const r = await env.DB.prepare(
    "SELECT k.id, k.eposta, k.kullanici_adi, k.plan, k.son_gorulme, o.bitis FROM oturumlar o JOIN kullanicilar k ON k.id=o.kullanici_id WHERE o.token_ozet=?"
  ).bind(tz).first();
  if (!r || r.bitis < simdi()) return null;
  // son görülme: en fazla saatte bir yazılır
  const esik = new Date(Date.now() - 3600000).toISOString();
  if (!r.son_gorulme || r.son_gorulme < esik) {
    try { await env.DB.prepare("UPDATE kullanicilar SET son_gorulme=? WHERE id=?").bind(simdi(), r.id).run(); } catch (e) {}
  }
  return { id: r.id, eposta: r.eposta, kullanici_adi: r.kullanici_adi, plan: r.plan || 'ucretsiz', _tz: tz };
}

// Google veya e-postayla gelen kişiyi bul ya da oluştur.
export async function kullaniciBulVeyaOlustur(env, { eposta, googleSub, kaynak }) {
  eposta = eposta ? String(eposta).trim().toLowerCase() : null;
  let k = null;
  if (googleSub) k = await env.DB.prepare("SELECT id FROM kullanicilar WHERE google_sub=?").bind(googleSub).first();
  if (!k && eposta) k = await env.DB.prepare("SELECT id FROM kullanicilar WHERE eposta=?").bind(eposta).first();
  if (k) {
    if (googleSub) await env.DB.prepare("UPDATE kullanicilar SET google_sub=COALESCE(google_sub,?) WHERE id=?").bind(googleSub, k.id).run();
    return { id: k.id, yeni: false };
  }
  const r = await env.DB.prepare("INSERT INTO kullanicilar (eposta, google_sub, kaynak, son_gorulme) VALUES (?,?,?,?)")
    .bind(eposta, googleSub || null, kaynak ? String(kaynak).slice(0, 60) : null, simdi()).run();
  await env.DB.prepare("INSERT INTO events (type, meta, kullanici_id) VALUES ('uye_oldu', ?, ?)")
    .bind(kaynak ? String(kaynak).slice(0, 60) : null, r.meta.last_row_id).run();
  return { id: r.meta.last_row_id, yeni: true };
}

export async function ipOzeti(env, req) {
  const ip = req.headers.get('cf-connecting-ip') || '';
  if (!env.IP_TUZU || !ip) return null;
  return hmac(env.IP_TUZU, 'ip:' + ip);
}

// Günlük, çerezsiz tekil ziyaretçi özeti: gün + ip + tarayıcı, gizli tuzla. Ertesi gün bağ kopar.
export async function ziyaretciOzeti(env, req) {
  const ip = req.headers.get('cf-connecting-ip') || '';
  if (!env.IP_TUZU || !ip) return null;
  const gun = new Date().toISOString().slice(0, 10);
  return (await hmac(env.IP_TUZU, 'z:' + gun + ':' + ip + ':' + (req.headers.get('user-agent') || ''))).slice(0, 22);
}

// Yönlendirme hedefi yalnız site içi yol olabilir (açık yönlendirme yok).
export function guvenliGeri(g) {
  g = String(g || '');
  return /^\/[a-z0-9\-\/]*(\?[a-z0-9=&\-]*)?$/i.test(g) && !g.startsWith('//') ? g : '/hesap';
}
