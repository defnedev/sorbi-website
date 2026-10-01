// /api/kasa — Astrolog Masası şifreli senkron.
// Sunucu yalnız şifreli blob, iv ve tuz görür; anahtar kullanıcının kasa şifresinden tarayıcıda türetilir.
import { json, semaKur, oturumKullanici, simdi } from '../_lib/hesap.js';

const AZAMI = 900000; // D1 satır sınırının altında güvenli pay

export async function onRequest({ request, env }) {
  const m = request.method;
  try {
    await semaKur(env);
    const k = await oturumKullanici(env, request);
    if (!k) return json({ error: 'Önce giriş yap.' }, 401);

    if (m === 'GET') {
      const r = await env.DB.prepare("SELECT veri, iv, tuz, surum, guncel FROM kasalar WHERE kullanici_id=?").bind(k.id).first();
      return json({ kasa: r || null });
    }

    if (m === 'PUT') {
      const b = await request.json().catch(() => ({}));
      const veri = String(b.veri || ''), iv = String(b.iv || ''), tuz = String(b.tuz || '');
      if (!veri || !/^[A-Za-z0-9_\-]{12,40}$/.test(iv) || !/^[A-Za-z0-9_\-]{16,60}$/.test(tuz)) return json({ error: 'Geçersiz kasa' }, 400);
      if (veri.length > AZAMI) return json({ error: 'Kasa çok büyük.' }, 413);
      const beklenen = Number.isInteger(b.surum) ? b.surum : 0;
      const var_ = await env.DB.prepare("SELECT surum FROM kasalar WHERE kullanici_id=?").bind(k.id).first();
      if (var_ && var_.surum !== beklenen) return json({ error: 'Başka bir cihazda daha yeni sürüm var.', surum: var_.surum }, 409);
      if (!var_ && beklenen !== 0) return json({ error: 'Kasa bulunamadı.', surum: 0 }, 409);
      const yeni = beklenen + 1;
      if (var_) {
        const r = await env.DB.prepare("UPDATE kasalar SET veri=?, iv=?, tuz=?, surum=?, boyut=?, guncel=? WHERE kullanici_id=? AND surum=?")
          .bind(veri, iv, tuz, yeni, veri.length, simdi(), k.id, beklenen).run();
        if (!r.meta.changes) return json({ error: 'Başka bir cihazda daha yeni sürüm var.' }, 409);
      } else {
        await env.DB.prepare("INSERT INTO kasalar (kullanici_id, veri, iv, tuz, surum, boyut, guncel) VALUES (?,?,?,?,?,?,?)")
          .bind(k.id, veri, iv, tuz, yeni, veri.length, simdi()).run();
      }
      await env.DB.prepare("INSERT INTO events (type, kullanici_id) VALUES ('kasa_senk', ?)").bind(k.id).run();
      return json({ ok: true, surum: yeni, guncel: simdi() });
    }

    if (m === 'DELETE') {
      await env.DB.prepare("DELETE FROM kasalar WHERE kullanici_id=?").bind(k.id).run();
      return json({ ok: true });
    }
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Sunucu hatası' }, 500);
  }
}
