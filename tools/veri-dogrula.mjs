/* Sorbi veri dosyalarının denetimi — üretilmiş JSON'ları motora ve kurama karşı sınar.
   Çalıştırma (repo kökünde):  node tools/veri-dogrula.mjs
   Kırık varsa exit 1, temizse tek satır özet.

   İki tür dosya var, iki tür denetim:
   · ogren-veri.json  → kare kare yeniden hesaplanabilir. Her kare motora tekrar
     sorulur; 0,1°'den büyük sapma hatadır (dosya 0,01° yuvarlamayla yazılıyor,
     0,1° eşiği yuvarlama payının on katı — gerçek bir kayma her zaman bundan
     çok daha büyük olur: saat dilimi hatası derece değil onlarca derece kaydırır).
   · sayim-veri.json / ozellik-veri.json → bunlar on binlerce haritanın SAYIMI.
     Kare kare doğrulanamaz (yeniden saymak saatler sürer), onun yerine yapısal
     tutarlılık + bilinen kuramsal oranlarla karşılaştırma yapılır.
*/
import fs from 'fs'; import vm from 'vm';

/* ── motoru sayfadaki gibi yükle (desen: tools/ozellik-say.mjs) ── */
const ctx = { console, Math, Date, Intl, JSON, Object, Array, String, Number, isNaN, parseInt, parseFloat, TextEncoder, setTimeout, module: { exports: {} } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['astronomy.browser.min.js', 'sorbi-astro.js'])
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
const A = ctx.window.SorbiAstro;

const hatalar = [];
const uyarilar = [];
const bak = (kosul, mesaj) => { if (!kosul) hatalar.push(mesaj); };
const oku = (yol) => { try { return JSON.parse(fs.readFileSync(yol, 'utf8')); }
  catch (e) { hatalar.push(yol + ': okunamadı — ' + e.message); return null; } };

/* İki boylam arasındaki en kısa açısal fark. */
const ayrim = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

/* ═══ 1 · ogren-veri.json — kare kare motora sor ═══ */
const ESIK = 0.1;                 // derece; yuvarlama payının (0,005°) yirmi katı
const D = oku('ogren-veri.json');
let ogrenKare = 0;
if (D) {
  bak(D.meta && D.meta.tz, 'ogren-veri.json: meta.tz yok — saat dilimi yazılı olmalı');
  const M = D.meta || {};
  const tz = M.tz || 'Europe/Istanbul', lat = M.lat, lon = M.lon;
  bak(Number.isFinite(lat) && Number.isFinite(lon), 'ogren-veri.json: meta.lat/meta.lon sayı değil');
  const saat = parseInt(M.gunSaati, 10);
  bak(Number.isFinite(saat), 'ogren-veri.json: meta.gunSaati okunamadı');
  const yer = { tz, lat, lon };

  for (const bol of ['retro', 'uzaklik', 'yukselen'])
    bak(D[bol] && Array.isArray(D[bol].kareler) && D[bol].kareler.length,
      'ogren-veri.json: ' + bol + ' bölümü ya da kareleri eksik');

  /* Meta eksikse kare kare sorgu anlamsız: hangi saat diliminde sorulacağı
     bilinmiyor demektir. Bulgu zaten yazıldı, kareleri atla. */
  const metaTam = Number.isFinite(saat) && Number.isFinite(lat) && Number.isFinite(lon);
  if (!metaTam) D.retro = D.uzaklik = D.yukselen = null;

  /* — retro: her günün Merkür boylamı ve geri bayrağı — */
  if (D.retro && D.retro.kareler) for (const k of D.retro.kareler) {
    const [y, mo, d] = k.t.split('-').map(Number);
    const c = A.chart({ y, mo, d, h: saat, mi: 0, ...yer });
    const mer = c.pls.find((p) => p.k === 'mer');
    const f = ayrim(k.lon, mer.lon); ogrenKare++;
    if (f > ESIK) hatalar.push('retro ' + k.t + ': lon ' + k.lon.toFixed(2)
      + '° ≠ motor ' + mer.lon.toFixed(2) + '° (sapma ' + f.toFixed(2) + '°)');
    if (!!k.geri !== !!mer.rx) hatalar.push('retro ' + k.t + ': geri=' + k.geri + ' ≠ motor rx=' + mer.rx);
  }

  /* — uzaklık: Merkür–Güneş açı farkı, iki günde bir — */
  if (D.uzaklik && D.uzaklik.kareler) {
    const [by, bmo, bd] = (D.uzaklik.bas || '').split('-').map(Number);
    const adim = 2;
    D.uzaklik.kareler.forEach((v, i) => {
      const g = new Date(Date.UTC(by, bmo - 1, bd) + i * adim * 86400000);
      const c = A.chart({ y: g.getUTCFullYear(), mo: g.getUTCMonth() + 1, d: g.getUTCDate(),
        h: saat, mi: 0, ...yer });
      let f = c.pls.find((p) => p.k === 'mer').lon - c.pls.find((p) => p.k === 'sun').lon;
      if (f > 180) f -= 360; if (f < -180) f += 360;
      const s = Math.abs(v - f); ogrenKare++;
      if (s > ESIK) hatalar.push('uzaklik[' + i + ']: ' + v.toFixed(2) + '° ≠ motor '
        + f.toFixed(2) + '° (sapma ' + s.toFixed(2) + '°)');
    });
    const eb = Math.max(...D.uzaklik.kareler.map(Math.abs));
    /* Merkür'ün en büyük elongasyonu 18°–28° arasında salınır; iki yıllık bir
       örneklemde tepe değer 27°–28,5° bandına düşmeli. */
    bak(eb > 26.5 && eb < 28.6, 'uzaklik: en büyük ayrılık ' + eb.toFixed(1) + '° — 26,5–28,6° dışında');
  }

  /* — yükselen: dk YEREL dakika olarak yorumlanır — */
  if (D.yukselen && D.yukselen.kareler) {
    const [y, mo, d] = (D.yukselen.tarih || '').split('-').map(Number);
    for (const k of D.yukselen.kareler) {
      const c = A.chart({ y, mo, d, h: (k.dk / 60) | 0, mi: k.dk % 60, ...yer });
      const f = ayrim(k.asc, c.asc); ogrenKare++;
      if (f > ESIK) hatalar.push('yukselen dk=' + k.dk + ': asc ' + k.asc.toFixed(2)
        + '° ≠ motor ' + c.asc.toFixed(2) + '° (sapma ' + f.toFixed(2) + '°'
        + (f > 30 ? ' — saat dilimi kayması olabilir' : '') + ')');
    }
    const burc = new Set(D.yukselen.kareler.map((k) => Math.floor(k.asc / 30)));
    bak(burc.size === 12, 'yukselen: bir günde ' + burc.size + ' burç yükseliyor, 12 olmalı');
  }
}

/* ═══ sayım dosyaları için ortak yardımcılar ═══ */
/* Eşik neden 2,0 puan: n ~19.000–210.000'de %20'lik bir oranın binom standart
   sapması 0,3 puanın altında; ızgara örneklemesi (sabit saat adımı) bunu birkaç
   katına çıkarsa bile 2,0 puan ~7σ eder. Öte yandan gerçek bir kırılma —
   birim hatası, saat dilimi kayması, ters işaret — bu oranları onlarca puan
   oynatır. Yani eşik gürültüye takılmayacak kadar geniş, bozulmayı kaçırmayacak
   kadar dar. Kuramsal değerler de zaten yarım puan hassasiyetle anılıyor. */
const PUAN_ESIK = 2.0;
function oran(ad, pay, n, kuramsal, dosya) {
  if (!Number.isFinite(pay) || !n) { hatalar.push(dosya + ': ' + ad + ' sayısı yok'); return; }
  const p = 100 * pay / n, s = Math.abs(p - kuramsal);
  if (s > PUAN_ESIK) hatalar.push(dosya + ': ' + ad + ' %' + p.toFixed(1)
    + ' — kuramsal ~%' + kuramsal + ', sapma ' + s.toFixed(1) + ' puan (eşik ' + PUAN_ESIK + ')');
}
function sayilar(o, n, dosya, ad) {
  for (const [k, v] of Object.entries(o || {})) {
    if (!Number.isInteger(v) || v < 0) hatalar.push(dosya + ': ' + ad + '.' + k + ' tam sayı değil: ' + v);
    else if (v > n) hatalar.push(dosya + ': ' + ad + '.' + k + ' = ' + v + ' > n = ' + n);
  }
}
const topla = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

/* ═══ 2 · sayim-veri.json ═══ */
const SV = oku('sayim-veri.json');
if (SV) {
  const n = SV.n, f = 'sayim-veri.json';
  bak(Number.isInteger(n) && n > 0, f + ': n alanı yok ya da geçersiz');
  if (n > 0) {
    sayilar(SV.rx, n, f, 'rx'); sayilar(SV.anaretikGez, n, f, 'anaretikGez');
    /* Bunlar bölüntü: her harita tam bir kovaya düşer, toplam n etmeli. */
    for (const [ad, o] of [['esZamanli5', SV.esZamanli5], ['yigin7', SV.yigin7],
      ['yigin10', SV.yigin10], ['anaretik', SV.anaretik]]) {
      sayilar(o, n, f, ad);
      const t = topla(o);
      if (t !== n) hatalar.push(f + ': ' + ad + ' toplamı ' + t + ' ≠ n = ' + n);
    }
    /* Kuramsal paylar — ogren/nadirlik sayfalarında alıntılanan değerler. */
    oran('Merkür retro', (SV.rx || {}).mer, n, 19, f);
    oran('29. derece (en az bir gezegen)', ((SV.anaretik || {}).bir || 0) + ((SV.anaretik || {}).ikiArti || 0), n, 21, f);
    const Y = SV.yildiz;
    if (Y && Y.n) { sayilar(Y.oob, Y.n, f, 'yildiz.oob'); sayilar(Y.bagsiz, Y.n, f, 'yildiz.bagsiz');
      /* Güneş tanımı gereği hiç sınır dışına çıkamaz. */
      bak((Y.oob || {}).Sun === 0, f + ': yildiz.oob.Sun 0 olmalı (Güneş ekliptiği tanımlar)');
    } else hatalar.push(f + ': yildiz.n yok');
  }
}

/* ═══ 3 · ozellik-veri.json ═══ */
let ascOzet = 'yükselen kapıları çalışmadı';
const OV = oku('ozellik-veri.json');
if (OV) {
  const n = OV.n, f = 'ozellik-veri.json', say = OV.say || {};
  bak(Number.isInteger(n) && n > 0, f + ': n alanı yok ya da geçersiz');
  if (n > 0) {
    sayilar(say, n, f, 'say'); sayilar(OV.uclu, n, f, 'uclu');
    const tu = topla(OV.uclu);
    if (tu !== n) hatalar.push(f + ': uclu toplamı ' + tu + ' ≠ n = ' + n);
    /* Burç dağılımı bölüntüdür: her gezegen her haritada tam bir burçtadır. */
    const gez = new Set(Object.keys(say).filter((k) => k.startsWith('burc.')).map((k) => k.split('.')[1]));
    for (const g of gez) {
      const t = Object.keys(say).filter((k) => k.startsWith('burc.' + g + '.')).reduce((a, k) => a + say[k], 0);
      if (t !== n) hatalar.push(f + ': burc.' + g + '.* toplamı ' + t + ' ≠ n = ' + n);
    }
    /* Ay evreleri de bölüntü: sekiz evre, toplam n. */
    const te = Object.keys(say).filter((k) => k.startsWith('evre.')).reduce((a, k) => a + say[k], 0);
    if (te !== n) hatalar.push(f + ': evre.* toplamı ' + te + ' ≠ n = ' + n);
    if (Number.isInteger(OV.katalog))
      bak(Object.keys(say).length <= OV.katalog,
        f + ': say anahtarı (' + Object.keys(say).length + ') katalogdan (' + OV.katalog + ') fazla');
    /* Kuramsal paylar. */
    oran('Merkür retro', say['retro.mer'], n, 19, f);
    oran('29. derece (en az bir gezegen)', say['derece.anaretik.var'], n, 21, f);
    oran('dolunay evresi', say['evre.dolunay'], n, 12.5, f);

    /* ═══ (a) SİMETRİ KAPISI ═══
       Yükselen dağılımı ekinoks eksenine göre ayna simetriktir: Koç ile Balık,
       Boğa ile Kova, İkizler ile Oğlak, Yengeç ile Yay, Aslan ile Akrep,
       Başak ile Terazi aynı payı alır. Nedeni geometrik: ekliptiğin ufukla
       yaptığı açı 0° Koç ve 0° Terazi noktalarına göre aynalanır, bu yüzden
       ekinoksa eşit uzaklıktaki iki burç ufukta eşit süre kalır. Enlem bu
       simetriyi bozmaz — yalnız payların büyüklüğünü değiştirir.
       Sabit saat ızgarası bu simetriyi bozar — ama ÖLÇTÜK, ne kadar bozduğunu
       burada yazalım ki gelecekte kimse bu kapıdan fazlasını beklemesin:
       1930–2025 × 6 saat (n=210.384, Europe/Istanbul, yaz saati dahil)
         sabit ızgara      → en büyük çift sapması %0,50 (Başak–Terazi), kat 2,199
         kaydırmalı ızgara → en büyük çift sapması %0,14, kat 2,161
       Yani %1 eşiği sabit ızgarayı TEK BAŞINA yakalamaz; onu yakalayan (b)
       kuram kapısıdır (aynı sabit ızgarada 12 burcun 8'i kırmızı verir).
       Bu kapı daha kaba bozulmalar içindir: ters işaret, kova kayması, elle
       düzeltilmiş sayı, yanlış yarımküre — hepsi simetriyi puanlarca kırar.
       Eşik neden %1 ve daha dar değil: yayındaki ozellik-veri.json'un kendi
       en büyük çift sapması %0,30. %0,5'e indirmek yalnız 1,7 kat pay bırakır,
       meşru örnekleme dalgalanması kırmızı verebilir. %1 üç kat pay demek. */
    const BURC_AD = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak',
      'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'];
    const ASC_CIFT = [[0, 11], [1, 10], [2, 9], [3, 8], [4, 7], [5, 6]];
    const ascTam = [...Array(12).keys()].every((i) => Number.isFinite(say['asc.' + i]));
    if (!ascTam) hatalar.push(f + ': asc.0–asc.11 eksik — yükselen kapıları çalıştırılamadı');
    else {
      const asc = [...Array(12).keys()].map((i) => say['asc.' + i]);
      const ta = asc.reduce((a, b) => a + b, 0);
      if (ta !== n) hatalar.push(f + ': asc.* toplamı ' + ta + ' ≠ n = ' + n);
      const SIM_ESIK = 1.0;                       /* yüzde, göreli */
      for (const [i, j] of ASC_CIFT) {
        const s = 200 * Math.abs(asc[i] - asc[j]) / (asc[i] + asc[j]);
        if (s > SIM_ESIK) hatalar.push(f + ': simetri kırık — ' + BURC_AD[i] + ' ' + asc[i]
          + ' ile ' + BURC_AD[j] + ' ' + asc[j] + ' arasında %' + s.toFixed(2)
          + ' fark (eşik %' + SIM_ESIK + ') — ekinoks simetrisi bozuk:'
          + ' kova kayması, elle düzeltilmiş sayı ya da yanlış enlem/yarımküre');
      }

      /* ═══ (b) KURAM KAPISI ═══
         Kuramsal yükselen dağılımı yerinde hesaplanır; efemeris GEREKMEZ,
         çünkü yükselen yalnız iki şeye bağlıdır: ARMC (yerel yıldız zamanının
         derece karşılığı) ve gözlem enlemi φ. Gezegenlerin yeri hiç girmez.
           Yükselen, ekliptiğin doğu ufkunu kestiği noktadır. Küresel üçgenden:
             tan(Asc) = cos(ARMC) / −( sin(ARMC)·cos ε + tan φ · sin ε )
           ε = ekliptik eğikliği ≈ 23,44°. Doğru dörtte biri için atan2 ile
           yazılır: atan2( cos ARMC , −(sin ARMC·cos ε + tan φ·sin ε) ).
         Uzun vadede ARMC düzgün dağılır: yıldız zamanı sabit hızla döner ve
         doğum anları ona göre rastgeledir. O yüzden ARMC'yi 0–360° arasında
         DÜZGÜN tarayıp her adımın düştüğü burcu saymak tam kuramsal dağılımı
         verir — Monte Carlo'ya da efemerise de gerek yok.
         Paylar neden eşit değil: 41°K gibi orta enlemlerde ekliptiğin ufukla
         açısı burçtan burca değişir; "yavaş yükselen" kanat (Yengeç–Akrep)
         ufukta daha uzun kalır, payı büyür. En büyük payın en küçüğe oranı
         (kat farkı) 41°K'de ≈ 2,161'dir; 2,10–2,25 dışına çıkan bir ölçüm ya
         yanlış enlemde ya bozuk bir ızgarayla üretilmiştir. */
      const ENLEM = 41.0082;                      /* İstanbul — sayım bu enlemde yapıldı */
      const DR = Math.PI / 180, EPS = 23.44 * DR, TANF = Math.tan(ENLEM * DR);
      const TARAMA = 1000000;                     /* 0,00036°'lik ARMC adımı — kuantalama hatası ihmal edilir */
      const kur = new Array(12).fill(0);
      for (let i = 0; i < TARAMA; i++) {
        const armc = 2 * Math.PI * (i + 0.5) / TARAMA;
        const a = Math.atan2(Math.cos(armc),
          -(Math.sin(armc) * Math.cos(EPS) + TANF * Math.sin(EPS)));
        kur[Math.floor(((((a / DR) % 360) + 360) % 360) / 30)]++;
      }
      const KUR_ESIK = 0.1;                       /* puan */
      let enCok = -1, enAz = 101;
      for (let i = 0; i < 12; i++) {
        const p = 100 * asc[i] / n, t = 100 * kur[i] / TARAMA;
        if (p > enCok) enCok = p; if (p < enAz) enAz = p;
        const s = Math.abs(p - t);
        if (s > KUR_ESIK) hatalar.push(f + ': yükselen ' + BURC_AD[i] + ' %' + p.toFixed(2)
          + ' — kuramsal %' + t.toFixed(2) + ', sapma ' + s.toFixed(2)
          + ' puan (eşik ' + KUR_ESIK + ')');
      }
      const kat = enCok / enAz;
      if (!(kat >= 2.10 && kat <= 2.25))
        hatalar.push(f + ': yükselen kat farkı ' + kat.toFixed(3)
          + ' — 2,10–2,25 dışında (41°K kuramsal ≈ 2,161)');
      ascOzet = 'yükselen 6 simetrik çift %' + SIM_ESIK + ' içinde, 12 burç kuramın '
        + KUR_ESIK + ' puanı içinde, kat farkı ' + kat.toFixed(3);
    }
  }

  /* ═══ (c) KÜNYE KAPISI ═══
     Sabit saat ızgarasıyla üretilmiş dosya yayına çıkmasın. Künyede izgara
     alanı 'kaydirmali' değilse ve gün içi örnek sayısı 24'ün altındaysa dosya
     eski yöntemle üretilmiş demektir (24 ve üstü ızgara saat başlarını zaten
     doldurur, örtüşme payı düşer). Hata değil UYARI: sayılar sayısal olarak
     geçerli olabilir — ama yöntem künyesi düzelmeden yayına girmemeli. */
  if (OV.izgara !== 'kaydirmali' && Number.isFinite(OV.saatAdet) && OV.saatAdet < 24)
    uyarilar.push(f + ': künye izgara="' + (OV.izgara || '—') + '", saatAdet=' + OV.saatAdet
      + ' — sabit saat ızgarası şüphesi; bu dosya yayına çıkmamalı'
      + ' (kaydırmalı ızgarayla yeniden üretin)');
}

/* ═══ 4 · sayfa metinlerindeki istasyon / retro tarihleri ═══
   NEDEN: bir retro aralığı elle ya da "gün farkı" yöntemiyle yazıldığında
   bir gün kayabilir (ilk geri GÖRÜLEN gün ≠ istasyon günü). Aşağıdaki iddialar
   sayfa metninden okunur ve motorla — hız işaretinin sıfırı kestiği anı ikiye
   bölerek dakika hassasiyetinde bularak — karşılaştırılır. Bir günden büyük
   sapma hatadır. Sapma eşiği bir gün: yerel saat sınırında oynayan bir
   istasyon (ör. 00:10) yazılı tarihi meşru olarak bir gün kaydırabilir.
   Yeni bir tarih cümlesi yazılınca buraya bir satır eklenir; motorla
   doğrulanmayan tarih siteye girmez. */
const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const GEZ = { mer: 'Mercury', ven: 'Venus', mar: 'Mars', jup: 'Jupiter',
  sat: 'Saturn', ura: 'Uranus', nep: 'Neptune', plu: 'Pluto' };

/* Bir gezegenin görünür boylam hızı (°/gün) — sayfalardaki yöntemle aynı:
   jeosentrik ekliptik boylamın merkezi farkı. */
const Ast = ctx.window.Astronomy;
const nrm = (d) => ((d % 360) + 360) % 360;
function boylam(body, ms) {
  const tt = Ast.MakeTime(new Date(ms));
  return nrm(Ast.SphereFromVector(Ast.RotateVector(Ast.Rotation_EQJ_ECT(tt), Ast.GeoVector(body, tt, true))).lon);
}
function hiz(body, ms) {
  let d = boylam(body, ms + 3600000) - boylam(body, ms - 3600000);
  if (d > 180) d -= 360; if (d < -180) d += 360;
  return d;
}
/* İşaret değişimini ikiye bölerek dakikanın altına indir. */
function istasyon(body, lo, hi) {
  const s0 = Math.sign(hiz(body, lo));
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2;
    if (Math.sign(hiz(body, m)) === s0) lo = m; else hi = m; }
  return new Date((lo + hi) / 2);
}
/* [bas, son] penceresinde (UTC ms) gezegenin istasyonlarını sırayla bulur. */
function istasyonlar(gezKod, bas, son) {
  const body = Ast.Body[GEZ[gezKod]], G = 86400000, out = [];
  let onceMs = bas, onceH = hiz(body, bas);
  for (let t = bas + G; t <= son; t += G) {
    const v = hiz(body, t);
    if (Math.sign(v) !== Math.sign(onceH))
      out.push({ yon: onceH > 0 ? 'R' : 'D', an: istasyon(body, onceMs, t) });
    onceH = v; onceMs = t;
  }
  return out;
}
/* Yerel takvim gününü 'g Ay' biçiminde yazar (metinle aynı dil). */
function yerelGun(dt, tz) {
  const p = new Intl.DateTimeFormat('tr-TR', { timeZone: tz, day: 'numeric', month: 'numeric', year: 'numeric' })
    .formatToParts(dt).reduce((a, x) => (a[x.type] = x.value, a), {});
  return { gun: +p.day, ay: +p.month, yil: +p.year, metin: +p.day + ' ' + AYLAR[+p.month - 1] };
}
const gunFark = (a, b) => Math.abs(Date.UTC(a.yil, a.ay - 1, a.gun) - Date.UTC(b.yil, b.ay - 1, b.gun)) / 86400000;

/* Denetlenecek iddialar. desen: iki tarihi yakalayan regex (R-istasyonu, D-istasyonu).
   pencere: istasyonların arandığı yerel tarih aralığı. */
const TARIH_IDDIA = [
  { dosya: 'ogren.html', gezegen: 'mer', tz: 'Europe/Istanbul',
    pencere: ['2026-09-15', '2026-12-01'],
    desen: /Merkür\s+(\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+)\s+ile\s+(\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+)\s+arasında geri hareketli/ }
];

let iddiaSay = 0;
for (const it of TARIH_IDDIA) {
  let metin;
  try { metin = fs.readFileSync(it.dosya, 'utf8'); }
  catch (e) { hatalar.push(it.dosya + ': okunamadı — ' + e.message); continue; }
  const m = metin.match(it.desen);
  if (!m) { hatalar.push(it.dosya + ': retro tarihi cümlesi bulunamadı — desen güncellenmeli'); continue; }
  const [b1, b2] = it.pencere.map((s) => { const [y, mo, d] = s.split('-').map(Number);
    return Date.UTC(y, mo - 1, d) - 3 * 3600000; });   /* yerel gün başı ≈ UTC−3 (Europe/Istanbul) */
  const ist = istasyonlar(it.gezegen, b1, b2);
  const R = ist.find((x) => x.yon === 'R'), Dd = ist.find((x) => x.yon === 'D');
  if (!R || !Dd) { hatalar.push(it.dosya + ': pencerede R ve D istasyonu birlikte bulunamadı'); continue; }
  for (const [yazan, an, ad] of [[m[1], R.an, 'retro başlangıcı'], [m[2], Dd.an, 'direkt dönüş']]) {
    const [g, ayAd] = yazan.trim().split(/\s+/);
    const ai = AYLAR.findIndex((x) => x.toLocaleLowerCase('tr') === ayAd.toLocaleLowerCase('tr'));
    if (ai < 0) { hatalar.push(it.dosya + ': "' + yazan + '" ay adı çözülemedi'); continue; }
    const motor = yerelGun(an, it.tz);
    const fark = gunFark({ gun: +g, ay: ai + 1, yil: motor.yil }, motor);
    iddiaSay++;
    const bulgu = it.dosya + ': ' + ad + ' "' + yazan + '" ≠ motor "'
      + motor.metin + '" (' + an.toISOString() + ' UTC, sapma ' + fark + ' gün)';
    /* >1 gün kesin hata; tam 1 gün ise yerel gün sınırına yakın bir istasyon
       olabilir — uyarı verilir, elle bakılır (eski "25 Ekim" hatası buydu). */
    if (fark > 1) hatalar.push(bulgu); else if (fark === 1) uyarilar.push(bulgu);
  }
}

/* ogren-veri.json retro bölümünün ilk/son geri günü de istasyonlarla tutmalı. */
if (D && D.retro && D.retro.kareler) {
  const g = D.retro.kareler.filter((k) => k.geri);
  if (g.length) {
    const tz = (D.meta || {}).tz || 'Europe/Istanbul';
    const [y0, m0, d0] = D.retro.kareler[0].t.split('-').map(Number);
    const bas = Date.UTC(y0, m0 - 1, d0) - 3 * 3600000;
    const ist = istasyonlar('mer', bas, bas + D.retro.kareler.length * 86400000);
    const R = ist.find((x) => x.yon === 'R'), Dd = ist.find((x) => x.yon === 'D');
    if (R && Dd) {
      const [ig, im] = [g[0].t, g[g.length - 1].t].map((t) => { const [a, b, c] = t.split('-').map(Number);
        return { yil: a, ay: b, gun: c }; });
      const fr = gunFark(ig, yerelGun(R.an, tz)), fd = gunFark(im, yerelGun(Dd.an, tz));
      iddiaSay += 2;
      if (fr > 1) hatalar.push('ogren-veri.json: ilk geri gün ' + g[0].t + ' ≠ R-istasyonu '
        + R.an.toISOString() + ' (sapma ' + fr + ' gün)');
      if (fd > 1) hatalar.push('ogren-veri.json: son geri gün ' + g[g.length - 1].t + ' ≠ D-istasyonu '
        + Dd.an.toISOString() + ' (sapma ' + fd + ' gün)');
    } else hatalar.push('ogren-veri.json: retro penceresinde iki istasyon birden bulunamadı');
  }
}

/* ═══ özet ═══ */
if (hatalar.length) {
  console.error('KIRIK · ' + hatalar.length + ' bulgu:');
  for (const h of hatalar) console.error('  · ' + h);
  process.exit(1);
}
for (const u of uyarilar) console.error('not: ' + u);
console.log('temiz · ogren-veri.json ' + ogrenKare + ' kare motorla ' + ESIK
  + '° içinde · sayim-veri.json ve ozellik-veri.json yapısal ve kuramsal kontrollerden geçti ('
  + PUAN_ESIK + ' puan eşik) · ' + ascOzet + ' · ' + iddiaSay
  + ' istasyon/retro tarihi motorla 1 gün içinde');
