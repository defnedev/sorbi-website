// /api/hesap/* — giriş (Google, e-posta linki), kullanıcı adı, oturum, hesap silme.
// Env: DB (D1) · GOOGLE_CLIENT_ID (Google girişi için) · RESEND_KEY + POSTA_GONDEREN (e-posta linki için)
//      IP_TUZU (hız sınırı) · TEST_GIRIS="1" yalnız yerel geliştirmede (üretimde asla tanımlanmaz)
import {
  json, b64urlCoz, ozet, rastgele, simdi, sonra, semaKur, oturumAc, oturumKullanici, oturumCerezi,
  oturumSilCerezi, kullaniciBulVeyaOlustur, ipOzeti, guvenliGeri
} from '../../_lib/hesap.js';

const enc = new TextEncoder();
const YASAK_AD = new Set(['admin', 'yonetim', 'yonetici', 'sorbi', 'destek', 'moderator', 'mod', 'root', 'sistem', 'astrolog', 'defne', 'resmi', 'info', 'iletisim']);

let JWKS = null, JWKS_T = 0;
async function googleDogrula(env, cred) {
  const p = String(cred || '').split('.');
  if (p.length !== 3) throw new Error('bicim');
  const bas = JSON.parse(new TextDecoder().decode(b64urlCoz(p[0])));
  const yuk = JSON.parse(new TextDecoder().decode(b64urlCoz(p[1])));
  if (!JWKS || Date.now() - JWKS_T > 3600000) {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    JWKS = (await r.json()).keys || []; JWKS_T = Date.now();
  }
  const jwk = JWKS.find((k) => k.kid === bas.kid);
  if (!jwk || bas.alg !== 'RS256') throw new Error('anahtar');
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlCoz(p[2]), enc.encode(p[0] + '.' + p[1]));
  if (!ok) throw new Error('imza');
  if (yuk.aud !== env.GOOGLE_CLIENT_ID) throw new Error('aud');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(yuk.iss)) throw new Error('iss');
  if (!yuk.exp || yuk.exp * 1000 < Date.now()) throw new Error('exp');
  if (!yuk.email || yuk.email_verified === false) throw new Error('eposta');
  return { sub: String(yuk.sub), eposta: String(yuk.email).toLowerCase() };
}

function postaHtml(link) {
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#F6F3EC;color:#1A1720;padding:32px">
<div style="max-width:460px;margin:0 auto;background:#fff;border-radius:14px;padding:28px">
<p style="letter-spacing:.2em;color:#803A1A;font-weight:600;margin:0 0 18px">✦ SORBİ</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 20px">Sorbi'ye girmek için aşağıdaki düğmeye dokun. Link 15 dakika geçerli ve bir kez kullanılır.</p>
<p><a href="${link}" style="display:inline-block;background:#1A1720;color:#F6F3EC;text-decoration:none;padding:12px 22px;border-radius:99px;font-weight:600">Sorbi'ye gir</a></p>
<p style="font-size:13px;color:#666370;line-height:1.6;margin:22px 0 0">Bu isteği sen yapmadıysan e-postayı yok sayabilirsin; hesabına kimse giremez.</p>
</div></body></html>`;
}

async function oturumYaniti(env, kullaniciId, yeni, ek = {}) {
  const token = await oturumAc(env, kullaniciId);
  const k = await env.DB.prepare("SELECT id, kullanici_adi, plan FROM kullanicilar WHERE id=?").bind(kullaniciId).first();
  return json({ ok: true, yeni, kullanici_adi: k.kullanici_adi, plan: k.plan, ...ek }, 200, { 'Set-Cookie': oturumCerezi(token) });
}

export async function onRequest({ request, env, params }) {
  const yol = '/' + [].concat(params.route || []).join('/');
  const m = request.method;
  try {
    await semaKur(env);

    // İstemcinin hangi giriş yollarının açık olduğunu bilmesi için (sır içermez).
    if (yol === '/ayar' && m === 'GET') {
      return json({ google: env.GOOGLE_CLIENT_ID || null, eposta: !!(env.RESEND_KEY), test: env.TEST_GIRIS === '1' });
    }

    if (yol === '/ben' && m === 'GET') {
      const k = await oturumKullanici(env, request);
      if (!k) return json({ kullanici: null });
      const kasa = await env.DB.prepare("SELECT surum, guncel, boyut FROM kasalar WHERE kullanici_id=?").bind(k.id).first();
      const bek = await env.DB.prepare("SELECT plan FROM bekleme WHERE kullanici_id=?").bind(k.id).all();
      return json({ kullanici: { id: k.id, eposta: k.eposta, kullanici_adi: k.kullanici_adi, plan: k.plan,
        kasa: kasa || null, bekleme: (bek.results || []).map((x) => x.plan) } });
    }

    if (yol === '/google' && m === 'POST') {
      if (!env.GOOGLE_CLIENT_ID) return json({ error: 'Google girişi henüz açık değil.' }, 503);
      const b = await request.json().catch(() => ({}));
      let g; try { g = await googleDogrula(env, b.credential); } catch (e) { return json({ error: 'Google doğrulaması başarısız.' }, 401); }
      const r = await kullaniciBulVeyaOlustur(env, { eposta: g.eposta, googleSub: g.sub, kaynak: b.kaynak || 'google' });
      return oturumYaniti(env, r.id, r.yeni);
    }

    if (yol === '/eposta-link' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (b.hp) return json({ error: 'Geçersiz istek' }, 400);
      const eposta = String(b.eposta || '').trim().toLowerCase().slice(0, 120);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return json({ error: 'Geçerli bir e-posta gir.' }, 400);
      const testMi = env.TEST_GIRIS === '1';
      if (!env.RESEND_KEY && !testMi) return json({ error: 'E-postayla giriş henüz açık değil; şimdilik Google ile girebilirsin.' }, 503);
      const esik = new Date(Date.now() - 15 * 60000).toISOString().slice(0, 19) + 'Z';
      const c1 = await env.DB.prepare("SELECT COUNT(*) c FROM giris_linkleri WHERE eposta=? AND created_at>?").bind(eposta, esik).first();
      if (c1 && c1.c >= 3) return json({ error: 'Kısa sürede çok fazla link istedin. 15 dakika sonra tekrar dene.' }, 429);
      const io = await ipOzeti(env, request);
      if (io) {
        const esik2 = new Date(Date.now() - 3600000).toISOString().slice(0, 19) + 'Z';
        const c2 = await env.DB.prepare("SELECT COUNT(*) c FROM giris_linkleri WHERE ip_ozet=? AND created_at>?").bind(io, esik2).first();
        if (c2 && c2.c >= 10) return json({ error: 'Çok fazla istek. Biraz sonra dener misin?' }, 429);
      }
      const token = rastgele(32);
      await env.DB.prepare("INSERT INTO giris_linkleri (token_ozet, eposta, bitis, geri, ip_ozet) VALUES (?,?,?,?,?)")
        .bind(await ozet(token), eposta, sonra(15 * 60000), guvenliGeri(b.geri), io).run();
      const kok = new URL(request.url).origin;
      const link = `${kok}/hesap?t=${token}`;
      if (testMi && !env.RESEND_KEY) return json({ ok: true, test_link: link });
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.RESEND_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.POSTA_GONDEREN || 'Sorbi <giris@sorbiapp.com>', to: [eposta],
          subject: 'Sorbi giriş linkin', html: postaHtml(link),
          text: `Sorbi'ye girmek için: ${link}\nLink 15 dakika geçerli ve bir kez kullanılır.`
        })
      });
      if (!r.ok) return json({ error: 'E-posta gönderilemedi. Biraz sonra tekrar dene.' }, 502);
      return json({ ok: true });
    }

    // Link sayfası (/hesap?t=...) bu ucu JS ile POST eder; e-posta tarayıcılarının
    // önizleme GET'leri linki tüketemesin diye doğrulama GET değil.
    if (yol === '/dogrula' && m === 'POST') {
      const b = await request.json().catch(() => ({}));
      const tz = await ozet(String(b.t || ''));
      const l = await env.DB.prepare("SELECT eposta, bitis, kullanildi, geri FROM giris_linkleri WHERE token_ozet=?").bind(tz).first();
      if (!l || l.kullanildi || l.bitis < simdi()) return json({ error: 'Bu link geçersiz ya da süresi dolmuş. Yeni link iste.' }, 400);
      await env.DB.prepare("UPDATE giris_linkleri SET kullanildi=1 WHERE token_ozet=?").bind(tz).run();
      const r = await kullaniciBulVeyaOlustur(env, { eposta: l.eposta, kaynak: b.kaynak || 'eposta' });
      return oturumYaniti(env, r.id, r.yeni, { geri: l.geri || '/hesap' });
    }

    if (yol === '/kullanici-adi' && m === 'POST') {
      const k = await oturumKullanici(env, request);
      if (!k) return json({ error: 'Önce giriş yap.' }, 401);
      const b = await request.json().catch(() => ({}));
      const ad = String(b.ad || '').trim().toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
      if (!/^[a-z0-9_.]{3,20}$/.test(ad) || /^[._]|[._]$/.test(ad)) return json({ error: 'Kullanıcı adı 3–20 karakter; harf, rakam, nokta ve alt çizgi olabilir.' }, 400);
      if (YASAK_AD.has(ad)) return json({ error: 'Bu ad ayrılmış, başka bir ad seç.' }, 400);
      const var_ = await env.DB.prepare("SELECT id FROM kullanicilar WHERE kullanici_adi=? AND id<>?").bind(ad, k.id).first();
      if (var_) return json({ error: 'Bu kullanıcı adı alınmış.' }, 409);
      await env.DB.prepare("UPDATE kullanicilar SET kullanici_adi=? WHERE id=?").bind(ad, k.id).run();
      return json({ ok: true, kullanici_adi: ad });
    }

    if (yol === '/cikis' && m === 'POST') {
      const k = await oturumKullanici(env, request);
      if (k) await env.DB.prepare("DELETE FROM oturumlar WHERE token_ozet=?").bind(k._tz).run();
      return json({ ok: true }, 200, { 'Set-Cookie': oturumSilCerezi });
    }

    // KVKK: hesabı ve bağlı tüm veriyi kalıcı sil.
    if (yol === '/sil' && m === 'POST') {
      const k = await oturumKullanici(env, request);
      if (!k) return json({ error: 'Önce giriş yap.' }, 401);
      const b = await request.json().catch(() => ({}));
      if (b.onay !== 'SIL') return json({ error: 'Onay gerekli.' }, 400);
      await env.DB.batch([
        env.DB.prepare("DELETE FROM kasalar WHERE kullanici_id=?").bind(k.id),
        env.DB.prepare("DELETE FROM bekleme WHERE kullanici_id=?").bind(k.id),
        env.DB.prepare("DELETE FROM oturumlar WHERE kullanici_id=?").bind(k.id),
        env.DB.prepare("UPDATE events SET kullanici_id=NULL WHERE kullanici_id=?").bind(k.id),
        env.DB.prepare("DELETE FROM giris_linkleri WHERE eposta=?").bind(k.eposta || ''),
        env.DB.prepare("DELETE FROM kullanicilar WHERE id=?").bind(k.id)
      ]);
      return json({ ok: true }, 200, { 'Set-Cookie': oturumSilCerezi });
    }

    // Yalnız yerel geliştirme: sahte giriş (üretimde TEST_GIRIS tanımlı değil → 404).
    if (yol === '/test-giris' && m === 'POST' && env.TEST_GIRIS === '1') {
      const b = await request.json().catch(() => ({}));
      const r = await kullaniciBulVeyaOlustur(env, { eposta: String(b.eposta || 'test@ornek.com'), kaynak: 'test' });
      return oturumYaniti(env, r.id, r.yeni);
    }

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Sunucu hatası' }, 500);
  }
}
