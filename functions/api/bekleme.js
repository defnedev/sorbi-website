// /api/bekleme — ücretli planlar (pro, egitim) için bekleme listesi. Giriş gerekir.
import { json, semaKur, oturumKullanici } from '../_lib/hesap.js';

const PLANLAR = ['pro', 'egitim'];

export async function onRequest({ request, env }) {
  try {
    await semaKur(env);
    const k = await oturumKullanici(env, request);
    if (!k) return json({ error: 'Önce giriş yap.' }, 401);
    if (request.method !== 'POST') return json({ error: 'Not found' }, 404);
    const b = await request.json().catch(() => ({}));
    const plan = String(b.plan || '');
    if (!PLANLAR.includes(plan)) return json({ error: 'Geçersiz plan' }, 400);
    await env.DB.prepare("INSERT INTO bekleme (kullanici_id, plan, kaynak) VALUES (?,?,?) ON CONFLICT(kullanici_id, plan) DO NOTHING")
      .bind(k.id, plan, String(b.kaynak || '').slice(0, 60) || null).run();
    await env.DB.prepare("INSERT INTO events (type, meta, kullanici_id) VALUES ('bekleme', ?, ?)").bind(plan + ':' + String(b.kaynak || '').slice(0, 40), k.id).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Sunucu hatası' }, 500);
  }
}
