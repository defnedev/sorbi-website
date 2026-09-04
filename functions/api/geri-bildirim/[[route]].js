// Sorbi Geri Bildirim — /api/geri-bildirim/*
// Herkese açık: kim olursa olsun öneri, hata ve özellik isteği bırakabilir.
// Kimlik zorunlu değil — zorunlu olsa gerçek geri bildirimin çoğu hiç gelmez.
// D1: env.DB | Secret: env.AUTH_SECRET (panel tarafı için)

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
});
const enc = new TextEncoder();
const b64url = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
async function yonetici(env, request) {
  const t = (request.headers.get('authorization') || '').split(' ')[1];
  if (!t) return false;
  const [p, s] = t.split('.');
  if (!p || !s) return false;
  if (await hmac(env.AUTH_SECRET || 'sorbi-secret', p) !== s) return false;
  try { const o = JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/')));
    return !!(o.exp && Date.now() < o.exp && o.a === 1); } catch { return false; }
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const TURLER = ['ozellik', 'hata', 'oneri'];

async function ensureSchema(env) {
  await env.DB.exec("CREATE TABLE IF NOT EXISTS g_bildirim (id INTEGER PRIMARY KEY AUTOINCREMENT, tur TEXT NOT NULL, metin TEXT NOT NULL, sayfa TEXT, iletisim TEXT, rol TEXT, durum TEXT DEFAULT 'yeni', not_ TEXT, ip_ozet TEXT, user_agent TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')));");
  await env.DB.exec("CREATE INDEX IF NOT EXISTS ix_bildirim_durum ON g_bildirim(durum, id DESC);");
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const p = url.pathname.replace(/\/+$/, '');
  const m = request.method;
  if (m === 'OPTIONS') return new Response(null, { headers: {
    'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type,Authorization' } });

  try {
    await ensureSchema(env);

    // ── Gönder (açık uç) ──
    if (p === '/api/geri-bildirim' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (b.hp) return json({ error: 'Geçersiz istek' }, 400);
      const metin = clean(b.metin, 4000);
      if (metin.length < 5) return json({ error: 'Birkaç kelime daha yaz' }, 400);
      const tur = TURLER.indexOf(b.tur) >= 0 ? b.tur : 'oneri';

      const ip = request.headers.get('cf-connecting-ip') || '';
      const ipOzet = ip ? await hmac(env.AUTH_SECRET || 'sorbi-secret', 'ip:' + ip) : null;
      if (ipOzet) {
        const esik = new Date(Date.now() - 3600000).toISOString().slice(0, 19) + 'Z';
        const say = await env.DB.prepare("SELECT COUNT(*) c FROM g_bildirim WHERE ip_ozet=? AND created_at > ?")
          .bind(ipOzet, esik).first();
        if (say && say.c >= 6) return json({ error: 'Bu saatlik yeter. Yazdıkların bize ulaştı.' }, 429);
      }

      await env.DB.prepare(
        "INSERT INTO g_bildirim (tur,metin,sayfa,iletisim,rol,ip_ozet,user_agent) VALUES (?,?,?,?,?,?,?)"
      ).bind(tur, metin, clean(b.sayfa, 120) || null, clean(b.iletisim, 140) || null,
             clean(b.rol, 30) || null, ipOzet, (request.headers.get('user-agent') || '').slice(0, 200)).run();
      return json({ ok: true }, 201);
    }

    // ── Panel: kuyruk ──
    if (p === '/api/geri-bildirim/kuyruk' && m === 'GET') {
      if (!(await yonetici(env, request))) return json({ error: 'Yetkisiz' }, 401);
      const durum = clean(url.searchParams.get('durum'), 20);
      let sql = "SELECT id,tur,metin,sayfa,iletisim,rol,durum,not_,created_at FROM g_bildirim";
      const bag = [];
      if (durum && durum !== 'hepsi') { sql += " WHERE durum=?"; bag.push(durum); }
      sql += " ORDER BY id DESC LIMIT 200";
      const { results } = await env.DB.prepare(sql).bind(...bag).all();
      const sayim = await env.DB.prepare(
        "SELECT tur, COUNT(*) adet FROM g_bildirim WHERE durum='yeni' GROUP BY tur"
      ).all();
      const yeni = await env.DB.prepare("SELECT COUNT(*) c FROM g_bildirim WHERE durum='yeni'").first();
      return json({ ok: true, bildirimler: results || [], sayim: sayim.results || [], yeni: yeni ? yeni.c : 0 });
    }

    // ── Panel: durum güncelle ──
    if (p === '/api/geri-bildirim/durum' && m === 'POST') {
      if (!(await yonetici(env, request))) return json({ error: 'Yetkisiz' }, 401);
      const b = await request.json().catch(() => ({}));
      const id = Number(b.id);
      const durum = ['yeni','sirada','yapildi','kapali'].indexOf(b.durum) >= 0 ? b.durum : null;
      if (!id || !durum) return json({ error: 'id ve geçerli durum gerekli' }, 400);
      await env.DB.prepare("UPDATE g_bildirim SET durum=?, not_=COALESCE(?, not_) WHERE id=?")
        .bind(durum, clean(b.not_, 500) || null, id).run();
      return json({ ok: true });
    }

    return json({ error: 'Bilinmeyen uç' }, 404);
  } catch (err) {
    return json({ error: 'Sunucu hatası', detail: String(err && err.message || err) }, 500);
  }
}
