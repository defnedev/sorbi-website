// /api/yonetim/ozet — kurucu paneli verisi. Yalnız YONETICI_EPOSTA ile girmiş oturum görür.
import { json, semaKur, oturumKullanici } from '../../_lib/hesap.js';

export async function onRequest({ request, env }) {
  try {
    await semaKur(env);
    const k = await oturumKullanici(env, request);
    const izinli = (env.YONETICI_EPOSTA || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    if (!k || !k.eposta || !izinli.includes(k.eposta.toLowerCase())) return json({ error: 'Yetki yok' }, 403);
    const gun = Math.min(90, Math.max(7, parseInt(new URL(request.url).searchParams.get('gun') || '30', 10)));
    const bas = new Date(Date.now() - gun * 86400000).toISOString().slice(0, 10);
    const q = (s, ...a) => env.DB.prepare(s).bind(...a).all().then((r) => r.results || []);
    const f = (s, ...a) => env.DB.prepare(s).bind(...a).first();

    const [gunluk, uyeGunluk, sayfalar, olaylar, uyeler, bekleme, liste, toplam, kasaSay, wa] = await Promise.all([
      q("SELECT substr(created_at,1,10) g, COUNT(DISTINCT ziyaretci) ziyaretci, SUM(type='sayfa') sayfa, COUNT(DISTINCT kullanici_id) aktif_uye FROM events WHERE created_at>=? GROUP BY g ORDER BY g", bas),
      q("SELECT substr(created_at,1,10) g, COUNT(*) yeni FROM kullanicilar WHERE created_at>=? GROUP BY g ORDER BY g", bas),
      q("SELECT meta yol, COUNT(*) goruntu, COUNT(DISTINCT ziyaretci) tekil FROM events WHERE type='sayfa' AND created_at>=? GROUP BY meta ORDER BY goruntu DESC LIMIT 25", bas),
      q("SELECT type tur, COUNT(*) adet, COUNT(DISTINCT kullanici_id) uye FROM events WHERE type<>'sayfa' AND created_at>=? GROUP BY type ORDER BY adet DESC LIMIT 30", bas),
      q(`SELECT u.id, u.kullanici_adi, u.eposta, u.plan, u.kaynak, u.created_at, u.son_gorulme,
          (SELECT COUNT(*) FROM events e WHERE e.kullanici_id=u.id AND e.type='sayfa') sayfa,
          (SELECT COUNT(*) FROM events e WHERE e.kullanici_id=u.id AND e.type='masa_dosya') masa_dosya,
          (SELECT COUNT(*) FROM events e WHERE e.kullanici_id=u.id AND e.type='kasa_senk') senk,
          (SELECT GROUP_CONCAT(DISTINCT e.meta) FROM (SELECT meta FROM events WHERE kullanici_id=u.id AND type='sayfa' ORDER BY id DESC LIMIT 40) e) son_sayfalar,
          (SELECT GROUP_CONCAT(plan) FROM bekleme b WHERE b.kullanici_id=u.id) bekleme
        FROM kullanicilar u ORDER BY u.id DESC LIMIT 300`),
      q("SELECT plan, COUNT(*) adet FROM bekleme GROUP BY plan"),
      q("SELECT kaynak, COUNT(*) adet FROM liste GROUP BY kaynak ORDER BY adet DESC"),
      f("SELECT (SELECT COUNT(*) FROM kullanicilar) uye, (SELECT COUNT(*) FROM kullanicilar WHERE created_at>=?) yeni_uye, (SELECT COUNT(DISTINCT ziyaretci) FROM events WHERE created_at>=? AND ziyaretci IS NOT NULL) ziyaretci, (SELECT COUNT(DISTINCT kullanici_id) FROM events WHERE created_at>=? AND kullanici_id IS NOT NULL) aktif_uye", bas, bas, bas),
      f("SELECT COUNT(*) c FROM kasalar"),
      q("SELECT substr(meta,1,instr(meta||':',':')-1) baglam, SUM(type='wa_goruldu') goruldu, SUM(type='wa_tiklandi') tiklandi FROM events WHERE type IN ('wa_goruldu','wa_tiklandi') AND created_at>=? GROUP BY baglam ORDER BY tiklandi DESC", bas)
    ]);
    const ziy = (toplam && toplam.ziyaretci) || 0;
    return json({
      gun, bas,
      toplam: { ...toplam, kasa: kasaSay ? kasaSay.c : 0, donusum: ziy ? (toplam.yeni_uye / ziy) : null },
      gunluk, uyeGunluk, sayfalar, olaylar, uyeler, bekleme, liste, wa,
      not: 'Tekil ziyaretçi = gün + ip + tarayıcının tuzlu özeti (çerezsiz); günler arası aynı kişi ayrı sayılır.'
    });
  } catch (e) {
    return json({ error: 'Sunucu hatası' }, 500);
  }
}
