/* Öğren bölümü verisi — ogren.html'deki üç efemeris animasyonu buradan beslenir.
   Çıktı: ogren-veri.json   (şema ogren.html / sorbi-gosteri.js ile birebir aynı)

   Çalıştırma (repo kökünde):  node tools/ogren-veri-uret.mjs
   Doğrulama:                  node tools/veri-dogrula.mjs

   NEDEN BU DOSYA VAR — eski tools/ogren-uret.mjs yükselen halkasını kendi eliyle
   yeniden yazdığı için iki hata birikmişti:
     1) Kareler Date.UTC ile üretiliyor ama ogren.html'de "İstanbul saati" diye
        etiketleniyordu → 3 saatlik kayma.
     2) Yükselen formülünde ARMC'ye 90° ekleniyordu (oa = armc + 90). Doğru
        formül ARMC'yi doğrudan alır (sorbi-astro.js:137 ascLon). 90° ARMC =
        6 yıldız saati ≈ 5,98 güneş saati → ikinci kayma.
     Toplam 8,98 saat. Bu dosya artık kendi gök mekaniğini yazmıyor; yükseleni de
     gezegen boylamını da sitenin motoruna (SorbiAstro.chart) sorar, böylece
     sayfadaki animasyon ile sayfadaki hesap makinesi aynı kaynaktan gelir.

   Saat dilimi ve konum aşağıdaki YER sabitinde ve çıktının meta alanında yazılı;
   bir daha "acaba UTC miydi" tartışması olmasın diye dosyanın içine gömülüyor.
*/
import fs from 'fs'; import vm from 'vm';

/* ── motoru sayfadaki gibi yükle (desen: tools/ozellik-say.mjs) ── */
const ctx = { console, Math, Date, Intl, JSON, Object, Array, String, Number, isNaN, parseInt, parseFloat, TextEncoder, setTimeout, module: { exports: {} } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['astronomy.browser.min.js', 'sorbi-astro.js'])
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
const A = ctx.window.SorbiAstro;      // harita motoru (yükselen, gezegen boylamı)
const Ast = ctx.window.Astronomy;     // ham efemeris (heliosentrik vektörler)

/* ── tek doğruluk kaynağı: yer ve saat dilimi ── */
export const YER = {
  ad: 'İstanbul',
  tz: 'Europe/Istanbul',
  lat: 41.0082,
  lon: 28.9784,
  /* Gün bazlı karelerin hangi saate sabitlendiği. Yerel saat, UTC değil. */
  gunSaati: 12
};

const r3 = (x) => Math.round(x * 1000) / 1000;
const r2 = (x) => Math.round(x * 100) / 100;

/* Yerel takvim alanlarından UTC Date üretir — motorun localToUTC'siyle aynı
   sonucu versin diye saat dilimi çevirisini motora yaptırıyoruz. */
function yerelUTC(y, mo, d, h, mi) {
  return A.chart({ y, mo, d, h, mi, tz: YER.tz, lat: YER.lat, lon: YER.lon }).utc;
}
/* Yerel gün + dakika → takvim alanları (gün taşmasını Date'e saydırır). */
function gunEkle(y, mo, d, gun) {
  const t = new Date(Date.UTC(y, mo - 1, d) + gun * 86400000);
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
const iso = (o) => o.y + '-' + String(o.mo).padStart(2, '0') + '-' + String(o.d).padStart(2, '0');

/* ═══ DERS 01 · retro döngüsü ═══
   Sonbahar 2026 Merkür retrosunu kapsayan 120 gün, her gün yerel öğlen.
   Alanlar: t (yerel tarih), mx/my ve ex/ey (heliosentrik ekliptik AU),
   lon (Dünya'dan görünen boylam), geri (motorun rx bayrağı). */
const RETRO_BAS = { y: 2026, mo: 9, d: 5 }, RETRO_GUN = 120;
function retroUret() {
  const kareler = [];
  for (let i = 0; i < RETRO_GUN; i++) {
    const g = gunEkle(RETRO_BAS.y, RETRO_BAS.mo, RETRO_BAS.d, i);
    const c = A.chart({ ...g, h: YER.gunSaati, mi: 0, tz: YER.tz, lat: YER.lat, lon: YER.lon });
    const mer = c.pls.find((p) => p.k === 'mer');
    const t = Ast.MakeTime(c.utc);
    const hm = Ast.HelioVector(Ast.Body.Mercury, t), he = Ast.HelioVector(Ast.Body.Earth, t);
    kareler.push({ t: iso(g), mx: r3(hm.x), my: r3(hm.y), ex: r3(he.x), ey: r3(he.y),
      lon: r2(mer.lon), geri: !!mer.rx });
  }
  return { etiket: 'Merkür retrosu · Sonbahar 2026', bas: iso(RETRO_BAS), kareler };
}

/* ═══ DERS 02 · Merkür–Güneş açı farkı ═══
   İki yıl, iki günde bir örnek. Kare = işaretli açı farkı (derece), düz sayı
   dizisi — sorbi-gosteri.js uzaklik-grafigi bunu böyle bekliyor. */
const UZ_BAS = { y: 2026, mo: 1, d: 1 }, UZ_GUN = 730, UZ_ADIM = 2;
function uzaklikUret() {
  const kareler = [];
  for (let i = 0; i < UZ_GUN; i += UZ_ADIM) {
    const g = gunEkle(UZ_BAS.y, UZ_BAS.mo, UZ_BAS.d, i);
    const c = A.chart({ ...g, h: YER.gunSaati, mi: 0, tz: YER.tz, lat: YER.lat, lon: YER.lon });
    const m = c.pls.find((p) => p.k === 'mer').lon, s = c.pls.find((p) => p.k === 'sun').lon;
    let f = m - s; if (f > 180) f -= 360; if (f < -180) f += 360;
    kareler.push(r2(f));
  }
  return { etiket: 'Merkür ile Güneş arasındaki açı · 2026–2027', bas: iso(UZ_BAS), kareler };
}

/* ═══ DERS 03 · bir günde yükselen ═══
   20 Mart 2026, İstanbul YEREL saati, on dakikada bir. dk alanı gece yarısından
   itibaren geçen yerel dakika; sorbi-gosteri.js bunu doğrudan saat olarak yazıyor
   (sa(k.dk)), o yüzden dk'nın yerel olması ŞART. asc = yükselen boylamı. */
const YUK_TARIH = { y: 2026, mo: 3, d: 20 }, YUK_ADIM = 10;
function yukselenUret() {
  const kareler = [];
  for (let dk = 0; dk < 1440; dk += YUK_ADIM) {
    const c = A.chart({ ...YUK_TARIH, h: (dk / 60) | 0, mi: dk % 60,
      tz: YER.tz, lat: YER.lat, lon: YER.lon });
    kareler.push({ dk, asc: r2(c.asc) });
  }
  return { etiket: 'Bir günde yükselen · ' + YER.ad, tarih: iso(YUK_TARIH),
    yer: YER.ad, tz: YER.tz, kareler };
}

/* ── çalıştırma ── */
const retro = retroUret(), uzaklik = uzaklikUret(), yukselen = yukselenUret();
const cikti = {
  uretim: new Date().toISOString().slice(0, 10),
  meta: {
    yer: YER.ad,
    tz: YER.tz,
    lat: YER.lat,
    lon: YER.lon,
    saat: 'Tüm t / tarih / dk alanları ' + YER.tz + ' YEREL saatidir, UTC değil.',
    gunSaati: String(YER.gunSaati).padStart(2, '0') + ':00 yerel',
    motor: 'astronomy.browser.min.js + sorbi-astro.js (SorbiAstro.chart)',
    uretici: 'tools/ogren-veri-uret.mjs',
    dogrulama: 'tools/veri-dogrula.mjs'
  },
  retro, uzaklik, yukselen
};
fs.writeFileSync('ogren-veri.json', JSON.stringify(cikti));

/* ── özet ── */
const geri = retro.kareler.filter((k) => k.geri);
console.error('retro   : ' + retro.kareler.length + ' gün, ' + geri.length + ' günü geri hareketli'
  + (geri.length ? ' (' + geri[0].t + ' → ' + geri[geri.length - 1].t + ')' : ''));
console.error('uzaklik : ' + uzaklik.kareler.length + ' kare, en büyük ayrılık '
  + Math.max(...uzaklik.kareler.map(Math.abs)).toFixed(1) + '° (kuramsal ~28°)');
const S = ['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
const bs = (l) => S[Math.floor(l / 30) % 12] + ' ' + (l % 30).toFixed(0) + '°';
console.error('yukselen: ' + yukselen.kareler.length + ' kare, '
  + new Set(yukselen.kareler.map((k) => Math.floor(k.asc / 30))).size + ' farklı burç yükseliyor'
  + ' · 06:00 → ' + bs(yukselen.kareler.find((k) => k.dk === 360).asc));
console.error('yer     : ' + YER.ad + ' (' + YER.tz + ')  ' + YER.lat + '°K ' + YER.lon + '°D');
console.error('dosya   : ' + (fs.statSync('ogren-veri.json').size / 1024).toFixed(0) + ' KB');
