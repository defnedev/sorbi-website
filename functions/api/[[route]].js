// Sorbi Randevu — Cloudflare Pages Function (tek dosya, tüm /api/* uçları)
// D1 binding: env.DB | Secrets: env.ADMIN_PASSWORD, env.AUTH_SECRET
// Doluluk (MANUAL_SLOTS) randevu.html ile SENKRON tutulmalı — sadece sunucu-taraf doğrulama için.

const WORK_SLOTS = ['10:00','11:30','13:00','14:30','16:00','17:30'];
const MANUAL_SLOTS = {
  '2026-07-22': ['21:00'],
  '2026-07-23': ['08:30'],
  '2026-07-24': ['08:30','20:00','21:30'],
  '2026-07-25': ['09:00','19:30'],
  '2026-07-29': ['08:30','20:00','22:00'],
  '2026-08-02': ['09:00','20:00','21:30'],
};

// ── Shopier ödeme ──────────────────────────────────────────────────────────────
// Fiyatlar TL — Defne verecek (sayfada gösterilmez, sadece Shopier'e gönderilir). 0 = ödeme kapalı.
const PRICES = {
  'natal-harita': 0, 'sorbi-ongorisu': 0, 'tarot': 0, 'horary': 0, 'sinastri': 0, 'yasam-donguleri': 0,
};
const SVC_NAMES = {
  'natal-harita':'Detaylı Doğum Haritası Raporu','sorbi-ongorisu':'Sorbi Öngörüsü','tarot':'Tarot Açılımı',
  'horary':'Horary','sinastri':'Sinastri (İlişki)','yasam-donguleri':'Yaşam Döngüleri',
};
const SHOPIER_ENDPOINT = 'https://www.shopier.com/ShowProduct/api_pay4.php';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

// ── Auth (HMAC-SHA256 imzalı token, 12s geçerli) ──────────────────────────────
const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
// Shopier imzası: base64( HMAC-SHA256(data, secret) ) — standart base64
async function hmacB64(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
async function signToken(env) {
  const secret = env.AUTH_SECRET || 'sorbi-secret';
  const payload = b64url(enc.encode(JSON.stringify({ a: 1, exp: Date.now() + 12*3600*1000 })));
  return `${payload}.${await hmac(secret, payload)}`;
}
async function verifyToken(env, token) {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const secret = env.AUTH_SECRET || 'sorbi-secret';
  if (await hmac(secret, payload) !== sig) return false;
  try {
    const { exp } = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
    return exp && Date.now() < exp;
  } catch { return false; }
}
async function requireAdmin(request, env) {
  const token = (request.headers.get('authorization') || '').split(' ')[1];
  return verifyToken(env, token);
}

// ── DB init (idempotent) ──────────────────────────────────────────────────────
async function ensureSchema(env) {
  await env.DB.exec("CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, service TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, date TEXT NOT NULL, time TEXT NOT NULL, notes TEXT, kvkk INTEGER DEFAULT 1, status TEXT DEFAULT 'pending', source TEXT, referrer TEXT, user_agent TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')));");
  await env.DB.exec("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, date TEXT, meta TEXT, referrer TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')));");
  await env.DB.exec("CREATE TABLE IF NOT EXISTS profiles (email TEXT PRIMARY KEY, name TEXT, birth_json TEXT, kvkk INTEGER DEFAULT 1, source TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')), updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')));");
  try { await env.DB.exec("ALTER TABLE bookings ADD COLUMN ip_hash TEXT"); } catch (e) { /* kolon zaten var */ }
}

// ── Router ────────────────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const p = url.pathname.replace(/\/+$/,''); // trailing slash temizle
  const m = request.method;

  if (m === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,Authorization' } });

  try {
    await ensureSchema(env);

    // ---- Public: sipariş/booking oluştur ----
    if (p === '/api/bookings' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      const { service, name, phone, email, notes, kvkk } = b;
      let { date, time } = b;
      if (!service || !name || !phone) return json({ error: 'Eksik alan' }, 400);
      // Honeypot: gizli alan doluysa = bot
      if (b.hp) return json({ error: 'Geçersiz istek' }, 400);
      // IP başına saatlik rate-limit (kota koruması + spam)
      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
      const ipHash = ip ? await hmac(env.AUTH_SECRET || 'sorbi-secret', 'ip:' + ip) : null;
      if (ipHash) {
        const threshold = new Date(Date.now() - 3600000).toISOString().slice(0, 19) + 'Z';
        const rc = await env.DB.prepare("SELECT COUNT(*) c FROM bookings WHERE ip_hash=? AND created_at > ?").bind(ipHash, threshold).first();
        if (rc && rc.c >= 8) return json({ error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, 429);
      }
      if (date && time && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Zamanlı randevu (legacy) — slot doğrula
        const allowed = MANUAL_SLOTS[date] || [];
        if (!allowed.includes(time)) return json({ error: 'Bu saat müsait değil' }, 409);
        const taken = await env.DB.prepare("SELECT id FROM bookings WHERE date=? AND time=? AND status IN ('pending','approved')").bind(date, time).first();
        if (taken) return json({ error: 'Bu saat dolu' }, 409);
      } else {
        // Sipariş (saatsiz) — 3 iş günü içinde teslim
        date = new Date().toISOString().slice(0, 10);
        time = 'Sipariş';
      }

      const referrer = request.headers.get('referer') || null;
      const ua = request.headers.get('user-agent') || null;
      const res = await env.DB.prepare(
        "INSERT INTO bookings (service,name,phone,email,date,time,notes,kvkk,source,referrer,user_agent,ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(service, name.trim(), phone.trim(), email?.trim() || null, date, time, notes?.trim() || null, kvkk ? 1 : 0, 'web', referrer, ua, ipHash).run();
      const id = res.meta.last_row_id;
      await env.DB.prepare("INSERT INTO events (type,date,referrer) VALUES ('booking_submitted',?,?)").bind(date, referrer).run();
      return json({ success: true, bookingId: id, message: 'Talebin alındı, en kısa sürede WhatsApp\'tan iletişime geçeceğiz.' }, 201);
    }

    // ---- Public: funnel event ----
    if (p === '/api/track' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      const type = String(b.type || '').slice(0, 40);
      if (!type) return json({ error: 'type gerekli' }, 400);
      await env.DB.prepare("INSERT INTO events (type,date,meta,referrer) VALUES (?,?,?,?)")
        .bind(type, b.date || null, b.meta ? String(b.meta).slice(0,200) : null, request.headers.get('referer') || null).run();
      return json({ ok: true });
    }

    // ---- Public: Sorbi profili (hesap MVP — sunucu tarafı kayıt) ----
    if (p === '/api/profile' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (b.hp) return json({ error: 'Geçersiz istek' }, 400);
      const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Geçersiz e-posta' }, 400);
      if (!b.kvkk) return json({ error: 'KVKK onayı gerekli' }, 400);
      const name = b.name ? String(b.name).trim().slice(0, 80) : null;
      const birth = b.birth ? JSON.stringify(b.birth).slice(0, 600) : null;
      await env.DB.prepare(
        "INSERT INTO profiles (email,name,birth_json,kvkk,source,updated_at) VALUES (?,?,?,1,'web',strftime('%Y-%m-%dT%H:%M:%SZ','now')) ON CONFLICT(email) DO UPDATE SET name=COALESCE(excluded.name,name), birth_json=COALESCE(excluded.birth_json,birth_json), updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now')"
      ).bind(email, name, birth).run();
      await env.DB.prepare("INSERT INTO events (type,meta) VALUES ('profile_created',?)").bind(email).run();
      return json({ ok: true });
    }

    // ---- Shopier: ödeme başlat (imzalı form üret) ----
    if (p === '/api/pay/start' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      const { service, name, phone, email, notes } = b;
      if (!service || !name || !phone) return json({ error: 'Eksik alan' }, 400);
      if (b.hp) return json({ error: 'Geçersiz istek' }, 400);
      const amount = PRICES[service] || 0;
      if (!(amount > 0)) return json({ error: 'Bu hizmet için online ödeme henüz aktif değil — Talep Gönder ile ilerleyebilirsin.' }, 400);
      if (!env.SHOPIER_API_KEY || !env.SHOPIER_SECRET) return json({ error: 'Ödeme henüz yapılandırılmadı.' }, 503);

      const referrer = request.headers.get('referer') || null;
      const ua = request.headers.get('user-agent') || null;
      const ip = request.headers.get('cf-connecting-ip') || '';
      const ipHash = ip ? await hmac(env.AUTH_SECRET || 'sorbi-secret', 'ip:' + ip) : null;
      const today = new Date().toISOString().slice(0, 10);
      const res = await env.DB.prepare(
        "INSERT INTO bookings (service,name,phone,email,date,time,notes,kvkk,source,referrer,user_agent,ip_hash,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'awaiting_payment')"
      ).bind(service, name.trim(), phone.trim(), email?.trim() || null, today, 'Sipariş', notes?.trim() || null, 1, 'web-shopier', referrer, ua, ipHash).run();
      const orderId = String(res.meta.last_row_id);

      const total = Number(amount).toFixed(2);
      const currency = '0'; // TL
      const rnd = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const signature = await hmacB64(env.SHOPIER_SECRET, rnd + orderId + total + currency);
      const parts = name.trim().split(/\s+/);
      const surname = parts.length > 1 ? parts.pop() : '-';
      const fname = parts.join(' ') || name.trim();
      const fields = {
        API_key: env.SHOPIER_API_KEY, website_index: '1', platform_order_id: orderId,
        product_name: (SVC_NAMES[service] || service), product_type: '1',
        buyer_name: fname, buyer_surname: surname,
        buyer_email: (email?.trim() || 'siparis@sorbiapp.com'),
        buyer_account_age: '0', buyer_id_nr: orderId, buyer_phone: phone.trim(),
        billing_address: '-', billing_city: '-', billing_country: 'Turkey', billing_postcode: '34000',
        shipping_address: '-', shipping_city: '-', shipping_country: 'Turkey', shipping_postcode: '34000',
        total_order_value: total, currency, platform: '0', is_in_frame: '0', current_language: '0',
        modul_version: '1.0.4', random_nr: rnd, signature,
        callback: 'https://sorbiapp.com/api/pay/callback',
      };
      return json({ endpoint: SHOPIER_ENDPOINT, fields, orderId });
    }

    // ---- Shopier: ödeme callback (imza doğrula, ödendi işaretle) ----
    if (p === '/api/pay/callback' && m === 'POST') {
      const form = await request.formData().catch(() => null);
      if (!form || !env.SHOPIER_SECRET) return new Response('ERROR', { status: 400 });
      const orderId = String(form.get('platform_order_id') || '');
      const rnd = String(form.get('random_nr') || '');
      const sig = String(form.get('signature') || '');
      const status = String(form.get('status') || form.get('res') || '');
      const paymentId = String(form.get('payment_id') || '');
      const expected = await hmacB64(env.SHOPIER_SECRET, rnd + orderId);
      if (sig !== expected) return new Response('SIGNATURE_ERROR', { status: 400 });
      const ok = status.toLowerCase() === 'success';
      if (orderId) await env.DB.prepare("UPDATE bookings SET status=?, notes = COALESCE(notes,'') || ? WHERE id=?")
        .bind(ok ? 'approved' : 'rejected', `\n[Shopier: ${ok ? 'ÖDENDİ' : 'başarısız'} #${paymentId}]`, +orderId).run();
      return new Response('success', { status: 200 });
    }

    // ---- Public: booking durum sorgu ----
    let mBk;
    if ((mBk = p.match(/^\/api\/bookings\/(\d+)$/)) && m === 'GET') {
      const row = await env.DB.prepare("SELECT id,service,name,date,time,status,created_at FROM bookings WHERE id=?").bind(+mBk[1]).first();
      if (!row) return json({ error: 'Randevu bulunamadı' }, 404);
      return json(row);
    }

    // ---- Admin: login ----
    if (p === '/api/admin/login' && m === 'POST') {
      const { password } = await request.json().catch(() => ({}));
      if (password !== (env.ADMIN_PASSWORD || 'sorbi2026')) return json({ error: 'Yanlış şifre' }, 401);
      return json({ token: await signToken(env) });
    }

    // ---- Admin (korumalı) ----
    if (p.startsWith('/api/admin/')) {
      if (!(await requireAdmin(request, env))) return json({ error: 'Yetkisiz' }, 401);

      if (p === '/api/admin/stats' && m === 'GET') {
        const q = async (w) => (await env.DB.prepare(`SELECT COUNT(*) c FROM bookings ${w}`).first()).c;
        const visitors = (await env.DB.prepare("SELECT COUNT(*) c FROM events WHERE type='booking_started'").first()).c;
        const submitted = (await env.DB.prepare("SELECT COUNT(*) c FROM events WHERE type='booking_submitted'").first()).c;
        return json({
          total: await q(''), pending: await q("WHERE status='pending'"),
          approved: await q("WHERE status='approved'"), rejected: await q("WHERE status='rejected'"),
          bookingStarted: visitors, bookingSubmitted: submitted,
        });
      }
      if (p === '/api/admin/profiles' && m === 'GET') {
        const { results } = await env.DB.prepare("SELECT email,name,birth_json,created_at,updated_at FROM profiles ORDER BY updated_at DESC LIMIT 500").all();
        return json(results);
      }
      if (p === '/api/admin/bookings' && m === 'GET') {
        const { results } = await env.DB.prepare("SELECT * FROM bookings ORDER BY date DESC, time DESC LIMIT 500").all();
        return json(results);
      }
      if (p === '/api/admin/bookings/pending' && m === 'GET') {
        const { results } = await env.DB.prepare("SELECT * FROM bookings WHERE status='pending' ORDER BY date, time").all();
        return json(results);
      }
      let mAd;
      if ((mAd = p.match(/^\/api\/admin\/bookings\/(\d+)\/(approve|reject)$/)) && m === 'POST') {
        const id = +mAd[1], status = mAd[2] === 'approve' ? 'approved' : 'rejected';
        const cur = await env.DB.prepare("SELECT status FROM bookings WHERE id=?").bind(id).first();
        if (!cur) return json({ error: 'Randevu bulunamadı' }, 404);
        if (cur.status !== 'pending') return json({ error: 'Zaten işlendi' }, 400);
        await env.DB.prepare("UPDATE bookings SET status=? WHERE id=?").bind(status, id).run();
        const updated = await env.DB.prepare("SELECT * FROM bookings WHERE id=?").bind(id).first();
        return json({ success: true, booking: updated });
      }
      // Availability sekmesi — canlı doluluk randevu.html'de; burası şimdilik pasif
      if (p === '/api/admin/availability/template' && m === 'GET') return json([]);
      if (p === '/api/admin/availability/template' && m === 'PUT') return json({ success: true, note: 'Canlı doluluk randevu.html MANUAL_SLOTS ile kontrol edilir.' });
      if (p.startsWith('/api/admin/availability/overrides')) return json(m === 'GET' ? [] : { success: true });

      return json({ error: 'Bilinmeyen admin ucu' }, 404);
    }

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Sunucu hatası', detail: String(e && e.message || e) }, 500);
  }
}
