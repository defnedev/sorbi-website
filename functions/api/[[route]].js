// Sorbi — Cloudflare Pages Function.
// İki uç kaldı: anonim sayfa sayacı ve e-posta listesi. Başka hiçbir şey.
//
// 2026-09-19 · Randevu, ödeme, yönetici paneli ve sunucu tarafı
// profil kaydı söküldü. Gerekçeleri:
//   · Sorbi ücretli astroloji hizmeti satmıyor; randevu ve ödeme yüzeyi
//     2026-09-04'te zaten kapatılmıştı, kodu taşımanın bir sebebi kalmamıştı.
//   · /api/profile e-posta + doğum verisini sunucudaki bir tabloya yazıyordu.
//     Gizlilik politikası "bu veriler sunucumuza gönderilmez ve tarafımızca
//     saklanmaz" diyor. Politika doğru olan; uç yanlıştı, uç gitti.
//   · Yönetici uçları, ortam değişkeni tanımlı değilse kodun içindeki sabit
//     bir yedeğe düşüyordu. Depo açık olduğu için o yedekler herkesçe
//     okunabilirdi. Varsayılan sır bırakılmaz; uçlarla birlikte gitti.
//
// D1 binding: env.DB · Secret: env.IP_TUZU (tanımlı değilse ip özeti tutulmaz)

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Yalnız e-posta listesinin saatlik hız sınırı için. Tuz yoksa özet üretilmez
// ve ip hiç kaydedilmez — varsayılan bir tuza düşmek sırrı sır olmaktan çıkarır.
async function ipOzeti(env, ip) {
  const tuz = env.IP_TUZU;
  if (!tuz || !ip) return null;
  const key = await crypto.subtle.importKey('raw', enc.encode(tuz), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode('ip:' + ip)));
}

async function semaKur(env) {
  await env.DB.exec("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, date TEXT, meta TEXT, referrer TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')));");
  await env.DB.exec("CREATE TABLE IF NOT EXISTS liste (id INTEGER PRIMARY KEY AUTOINCREMENT, eposta TEXT NOT NULL UNIQUE, kaynak TEXT, referrer TEXT, ip_ozet TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')));");
}

const KALDIRILDI = [
  '/api/bookings', '/api/pay', '/api/admin', '/api/profile',
  '/api/slots', '/api/availability'
];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const p = url.pathname.replace(/\/+$/, '');
  const m = request.method;

  if (m === 'OPTIONS') return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });

  if (KALDIRILDI.some((k) => p === k || p.startsWith(k + '/'))) {
    return new Response(JSON.stringify({ error: 'Bu uç kaldırıldı.' }), {
      status: 410,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Robots-Tag': 'noindex' }
    });
  }

  try {
    await semaKur(env);

    // Anonim sayfa sayacı. Kimlik yok, çerez yok, parmak izi yok.
    if (p === '/api/track' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      const type = String(b.type || '').slice(0, 40);
      if (!type) return json({ error: 'type gerekli' }, 400);
      await env.DB.prepare("INSERT INTO events (type,date,meta,referrer) VALUES (?,?,?,?)")
        .bind(type, b.date || null, b.meta ? String(b.meta).slice(0, 200) : null,
              request.headers.get('referer') || null).run();
      return json({ ok: true });
    }

    // E-posta listesi. Yalnız adres ve kaynak; doğum verisi buraya girmez.
    if (p === '/api/liste' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (b.hp) return json({ error: 'Geçersiz istek' }, 400);
      const eposta = String(b.eposta || b.email || '').trim().toLowerCase().slice(0, 120);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return json({ error: 'Geçerli bir e-posta gir.' }, 400);
      if (!b.kvkk) return json({ error: 'Devam için onay kutusunu işaretle.' }, 400);

      const ozet = await ipOzeti(env, request.headers.get('cf-connecting-ip') || '');
      if (ozet) {
        const esik = new Date(Date.now() - 3600000).toISOString().slice(0, 19) + 'Z';
        const rc = await env.DB.prepare("SELECT COUNT(*) c FROM liste WHERE ip_ozet=? AND created_at > ?")
          .bind(ozet, esik).first();
        if (rc && rc.c >= 5) return json({ error: 'Çok fazla istek. Biraz sonra dener misin?' }, 429);
      }

      await env.DB.prepare("INSERT INTO liste (eposta,kaynak,referrer,ip_ozet) VALUES (?,?,?,?) ON CONFLICT(eposta) DO NOTHING")
        .bind(eposta, String(b.kaynak || 'web').slice(0, 40), request.headers.get('referer') || null, ozet).run();
      await env.DB.prepare("INSERT INTO events (type,meta) VALUES ('liste_kaydi',?)")
        .bind(String(b.kaynak || 'web').slice(0, 40)).run();
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Sunucu hatası' }, 500);
  }
}
