// Sorbi — Cloudflare Pages Function.
// Uçlar: sayfa/olay sayacı ve e-posta listesi. Hesap, kasa, bekleme ve yönetim kendi dosyalarında (1 Eki 2026).
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

import { json, semaKur, ipOzeti as ipOzetiReq, ziyaretciOzeti, oturumKullanici } from '../_lib/hesap.js';

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
    if ((p === '/api/track' || p === '/api/olay') && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      const type = String(b.type || '').slice(0, 40);
      if (!type) return json({ error: 'type gerekli' }, 400);
      const ziy = await ziyaretciOzeti(env, request);
      let kid = null;
      try { const k = await oturumKullanici(env, request); kid = k ? k.id : null; } catch (e) {}
      await env.DB.prepare("INSERT INTO events (type,date,meta,referrer,ziyaretci,kullanici_id) VALUES (?,?,?,?,?,?)")
        .bind(type, b.date || null, b.meta ? String(b.meta).slice(0, 200) : null,
              request.headers.get('referer') || null, ziy, kid).run();
      return json({ ok: true });
    }

    // E-posta listesi. Yalnız adres ve kaynak; doğum verisi buraya girmez.
    if (p === '/api/liste' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (b.hp) return json({ error: 'Geçersiz istek' }, 400);
      const eposta = String(b.eposta || b.email || '').trim().toLowerCase().slice(0, 120);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return json({ error: 'Geçerli bir e-posta gir.' }, 400);
      if (!b.kvkk) return json({ error: 'Devam için onay kutusunu işaretle.' }, 400);

      const ozet = await ipOzetiReq(env, request);
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
