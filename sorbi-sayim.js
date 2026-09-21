/*! sorbi-sayim.js — Sorbi sayım servisi · tek servis katmanı
 *
 *  NE İŞE YARAR
 *  Sayfalar artık "hangi dosyada hangi alan var" bilmez. Servise soru sorar,
 *  cevabı alır; cevabın içinde hangi örneklemden geldiği de yazılıdır.
 *  JSON okuma, alan adları, oran hesabı, önbellek ve sürüm burada durur.
 *
 *  TASARIM KARARLARI VE GEREKÇELERİ
 *
 *  1) İki ayrı örneklem, tek kapı.
 *     Kural: bir iddia hangi örneklemde ölçüldüyse o örneklemle yayımlanır.
 *     · ÖZELLİK sayımı  → ozellik-veri.json · 210.384 harita · 1930–2025 · saatli.
 *       Kataloğun (sorbi-ozellik.js) her id'si için "kaç haritada görüldü".
 *     · ÜÇLÜ sayımı     → sorbi-nadir.js · 1.367.496 gök anı · 1960–2012 · 20 dk.
 *       Güneş×Ay×Yükselen 1.728 kutuya dağıldığı için 6,5 kat yoğun örneklem
 *       gerekir; bu iddiayı küçük örnekleme düşürmek doğruluk kaybıdır.
 *     Her cevap kendi künyesini taşır (kunye.n, kunye.yil, kunye.yontem), böylece
 *     sayfa iki sayıyı yanlışlıkla aynı cümlede karıştıramaz.
 *
 *  2) İndirilen bayt örneklem büyüklüğünden BAĞIMSIZDIR.
 *     Sayım dosyası örneklemi değil, KATALOĞU taşır: her özellik için tek tamsayı
 *     ve tüm dosya için tek n. 210.384 → 2.000.000 olduğunda dosyada yalnız
 *     sayılar büyür (birkaç basamak), satır sayısı değişmez. Bugünkü ölçüm:
 *     441 kayıt + 1.728 üçlü = 29 KB ham / 9,6 KB gzip.
 *     Değişmemesi gereken şey budur; üretici (tools/ozellik-say.mjs) bu biçimi korur.
 *
 *  3) Büyüyen şey örneklem değil, KATALOG olursa.
 *     Asıl risk n değil, id sayısıdır. Bunun için dosya bölünebilir:
 *     kök dosyaya `bolum: { "ev": "/ozellik-veri-ev.json", ... }` eklendiğinde
 *     servis yalnız sorulan önekin dosyasını çeker (bkz. bolumYukle). Bugün
 *     `bolum` yok, her şey tek dosyada; eklendiği gün SAYFA KODU DEĞİŞMEZ.
 *
 *  4) 210 binden 2 milyona çıkıldığında ne değişir?
 *     Değişen  : ozellik-veri.json içeriği (n ve sayılar) + buradaki SURUM.
 *     Değişmeyen: bu dosyanın API'si, nadirlik.html, diğer sayfalar, bayt bütçesi.
 *     Sayfada elle yazılı örneklem rakamı olmadığı için metinler kendiliğinden
 *     doğru kalır — sayfa n'i servisten basar.
 *
 *  5) Sürüm ve önbellek. SURUM sorgu dizgisine eklenir (?v=). Veri dosyası
 *     değiştiğinde SURUM artırılır; tarayıcı yeni dosyayı çeker, eskisi kalmaz.
 *     Cevapların künyesinde ayrıca verinin kendi `uretim` tarihi durur.
 *
 *  6) Tembel + tek uçuş + modül içi önbellek. Dosya yalnız gerçekten sorulduğunda
 *     çekilir; aynı anda gelen on çağrı tek ağ isteğine biner; ikinci çağrıda
 *     ağ isteği yoktur.
 *
 *  API (hepsi Promise döner)
 *    SorbiSayim.kunye(kaynak)        → örneklem künyesi ('ozellik' | 'uclu')
 *    SorbiSayim.harita(ch, sec)      → haritadaki tüm özellikler + nadirlikleri
 *    SorbiSayim.ozellik(id)          → tek özelliğin nadirliği
 *    SorbiSayim.uclu(g, a, y)        → Güneş×Ay×Yükselen üçlüsünün nadirliği
 *    SorbiSayim.dagilim(onek)        → dağılım tablosu ('asc', 'burc.sun', 'uclu'…)
 *    SorbiSayim.hazir(kaynak)        → isteğe bağlı ön yükleme
 *
 *  Bulgu biçimi (her cevapta aynı):
 *    { id, ad, grup, sayi, oran, yuzde, biriKac, altSinir, kunye }
 *    altSinir=true → örneklemde hiç görülmedi; nadirliği "n'de 1'den seyrek".
 */
(function () {
'use strict';
var W = typeof window !== 'undefined' ? window : globalThis;

/* Veri dosyası her değiştiğinde artır. */
var SURUM = '1';

/* ── kaynak kütüğü ────────────────────────────────────────────────── */
var KAYNAK = {
  ozellik: {
    kod: 'ozellik',
    ad: 'Özellik sayımı',
    dosya: '/ozellik-veri.json',
    betik: '/sorbi-ozellik.js',      /* katalog: id → insan adı, grup */
    kglobal: 'SorbiOzellik',
    yontem: 'Katalogdaki her özellik için, örneklemdeki her haritada tek tek ' +
            'tespit edilip kaç haritada gerçekleştiği sayıldı. Oran tahmin değil, sayımdır.'
  },
  uclu: {
    kod: 'uclu',
    ad: 'Üçlü sayımı',
    betik: '/sorbi-nadir.js',
    kglobal: 'SorbiNadir',
    yontem: '20 dakikada bir örneklenmiş gök anlarında Güneş–Ay–Yükselen üçlüsünün ' +
            'kaç kez oluştuğu sayıldı. Doğum kaydı değil, gökyüzünün kendi dağılımıdır.'
  }
};

/* ── ortak yardımcılar ────────────────────────────────────────────── */
function sz(x) { return Promise.resolve(x); }
function hata(m) { return Promise.reject(new Error(m)); }

/* betik tek uçuşla yüklenir; zaten varsa ağ isteği yok */
var betikUcus = {};
function betikYukle(yol, global) {
  if (W[global]) return sz(W[global]);
  if (betikUcus[yol]) return betikUcus[yol];
  betikUcus[yol] = new Promise(function (ol, olma) {
    var s = document.createElement('script');
    s.src = yol + '?v=' + SURUM;
    s.async = false;
    s.onload = function () { W[global] ? ol(W[global]) : olma(new Error(yol + ' yüklendi ama ' + global + ' yok.')); };
    s.onerror = function () { betikUcus[yol] = null; olma(new Error(yol + ' yüklenemedi.')); };
    document.head.appendChild(s);
  });
  return betikUcus[yol];
}

/* JSON tek uçuşla yüklenir */
var jsonBellek = {}, jsonUcus = {};
function jsonYukle(yol) {
  if (jsonBellek[yol]) return sz(jsonBellek[yol]);
  if (jsonUcus[yol]) return jsonUcus[yol];
  jsonUcus[yol] = fetch(yol + '?v=' + SURUM).then(function (r) {
    if (!r.ok) throw new Error(yol + ' okunamadı (' + r.status + ').');
    return r.json();
  }).then(function (j) { jsonBellek[yol] = j; jsonUcus[yol] = null; return j; },
          function (e) { jsonUcus[yol] = null; throw e; });
  return jsonUcus[yol];
}

/* ── özellik kaynağı ──────────────────────────────────────────────── */
function ozellikVeri() { return jsonYukle(KAYNAK.ozellik.dosya); }
function katalog() { return betikYukle(KAYNAK.ozellik.betik, KAYNAK.ozellik.kglobal); }

/* id'nin önekini verir: 'burc.sun.9' → 'burc' */
function onekAl(id) { var i = id.indexOf('.'); return i < 0 ? id : id.slice(0, i); }

/* Katalog büyürse: kök dosyada `bolum` varsa yalnız gerekli parça çekilir.
   Bugün `bolum` yok; tek dosya her şeyi taşır. Sayfa bu farkı hiç görmez. */
function bolumYukle(v, onek) {
  if (!v.bolum || !v.bolum[onek]) return sz(v.say || {});
  return jsonYukle(v.bolum[onek]).then(function (p) { return p.say || p; });
}
/* Birden çok önek gerektiğinde (harita taraması) hepsini toplar. */
function sayimTablosu(v, onekler) {
  if (!v.bolum) return sz(v.say || {});
  var ler = [], gor = {};
  onekler.forEach(function (o) { if (!gor[o] && v.bolum[o]) { gor[o] = 1; ler.push(o); } });
  return Promise.all(ler.map(function (o) { return bolumYukle(v, o); })).then(function (parcalar) {
    var t = {};
    if (v.say) for (var k in v.say) t[k] = v.say[k];
    parcalar.forEach(function (p) { for (var k in p) t[k] = p[k]; });
    return t;
  });
}

/* ── künye ────────────────────────────────────────────────────────── */
var kunyeBellek = {};
function ozellikKunye(v) {
  if (!kunyeBellek.ozellik) kunyeBellek.ozellik = {
    kod: 'ozellik', ad: KAYNAK.ozellik.ad,
    n: v.n, nMetin: bin(v.n),
    birim: 'harita', yil: v.yil, yer: v.yer,
    katalog: v.katalog, yontem: KAYNAK.ozellik.yontem,
    uretim: v.uretim, surum: SURUM
  };
  return kunyeBellek.ozellik;
}
function ucluKunye(N) {
  if (!kunyeBellek.uclu) kunyeBellek.uclu = {
    kod: 'uclu', ad: KAYNAK.uclu.ad,
    n: N.ornek, nMetin: bin(N.ornek),
    birim: 'gök anı', yil: '1960–2012', yer: 'İstanbul enlemi (41,01°K)',
    katalog: 1728, yontem: KAYNAK.uclu.yontem,
    uretim: null, surum: SURUM
  };
  return kunyeBellek.uclu;
}
/* 210384 → "210.384" */
function bin(n) {
  var s = String(n), o = '', c = 0;
  for (var i = s.length - 1; i >= 0; i--) { o = s[i] + o; if (++c % 3 === 0 && i > 0) o = '.' + o; }
  return o;
}

/* ── bulgu kurucu ─────────────────────────────────────────────────── */
function bulgu(id, sayi, k, ozet) {
  var oran = k.n ? sayi / k.n : 0;
  return {
    id: id,
    ad: ozet ? ozet.ad : null,
    grup: ozet ? ozet.grup : null,
    sayi: sayi,
    oran: oran,
    yuzde: oran * 100,
    biriKac: sayi > 0 ? Math.round(k.n / sayi) : k.n,
    altSinir: sayi === 0,
    kunye: k
  };
}
function ozetAl(OZ, id) {
  if (!OZ) return null;
  if (!OZ._dizin) {
    var d = {};
    OZ.OZ.forEach(function (o) { d[o.id] = o; });
    OZ._dizin = d;
  }
  return OZ._dizin[id] || null;
}

/* ── API ──────────────────────────────────────────────────────────── */

/* Örneklem künyesi: n, yıl aralığı, yer, yöntem, sürüm. */
function kunye(kaynak) {
  if (kaynak === 'uclu') return betikYukle(KAYNAK.uclu.betik, KAYNAK.uclu.kglobal).then(ucluKunye);
  return ozellikVeri().then(ozellikKunye);
}

/* Tek bir özelliğin nadirliği. id: katalogdaki değişmez anahtar. */
function ozellik(id) {
  return Promise.all([ozellikVeri(), katalog()]).then(function (r) {
    var v = r[0], OZ = r[1];
    return bolumYukle(v, onekAl(id)).then(function (say) {
      return bulgu(id, say[id] || 0, ozellikKunye(v), ozetAl(OZ, id));
    });
  });
}

/* Bir haritanın TÜM özellikleri, nadirden sığa sıralı.
   sec: { saatsiz:bool, grup:'Asalet' (süz), enAz:n } */
function harita(ch, sec) {
  sec = sec || {};
  return Promise.all([ozellikVeri(), katalog()]).then(function (r) {
    var v = r[0], OZ = r[1];
    var k = ch;
    if (typeof sec.saatsiz === 'boolean') {           /* çağıranın nesnesini bozma */
      k = {}; for (var p in ch) k[p] = ch[p];
      k.saatsiz = sec.saatsiz;
    }
    var ham = OZ.tara(k);                              /* ['burc.sun.9', 'uclu:9-4-6', …] */
    var idler = [], ucluKod = null;
    ham.forEach(function (x) {
      var i = x.indexOf(':');
      if (i < 0) idler.push(x);
      else if (x.slice(0, i) === 'uclu') ucluKod = x.slice(i + 1);
    });
    var onekler = idler.map(onekAl);
    return sayimTablosu(v, onekler).then(function (say) {
      var ky = ozellikKunye(v);
      var bulgular = idler.map(function (id) { return bulgu(id, say[id] || 0, ky, ozetAl(OZ, id)); });
      if (sec.grup) bulgular = bulgular.filter(function (b) { return b.grup === sec.grup; });
      bulgular.sort(function (a, b) { return a.sayi - b.sayi; });
      var dizin = {};
      bulgular.forEach(function (b) { dizin[b.id] = b; });
      return {
        kunye: ky,
        bulgular: bulgular,
        dizin: dizin,                                  /* id → bulgu, sayfa doğrudan bakar */
        ucluKod: ucluKod,                              /* üçlü AYRI örneklemde sorulur */
        al: function (id) { return dizin[id] || null; }
      };
    });
  });
}

/* Üçlü nadirliği — kendi (yoğun) örnekleminden. g,a,y: 0–11 burç indeksi. */
function uclu(g, a, y) {
  return betikYukle(KAYNAK.uclu.betik, KAYNAK.uclu.kglobal).then(function (N) {
    var ky = ucluKunye(N);
    var r = N.uclu(g, a, y);
    if (!r) return { id: 'uclu', ad: 'Güneş · Ay · Yükselen üçlüsü', kod: null, kunye: ky,
                     sayi: 0, oran: 0, yuzde: 0, biriKac: ky.n, altSinir: true, sira: null, toplam: 1728 };
    var oran = r.ppm / 1e6;
    return {
      id: 'uclu', ad: 'Güneş · Ay · Yükselen üçlüsü', kod: g + '-' + a + '-' + y,
      sayi: Math.round(oran * ky.n), oran: oran, yuzde: oran * 100,
      biriKac: r.biriKac, altSinir: false,
      sira: r.sira, toplam: r.toplam, yuzdelik: r.yuzdelik,
      kunye: ky
    };
  });
}

/* Dağılım tablosu. onek: 'asc', 'mc', 'burc.sun', 'ev.moon', 'retro', 'uclu'…
   Yaygından seyreğe sıralı satırlar döner; her satır tam bir bulgudur. */
function dagilim(onek) {
  if (onek === 'uclu') {
    return betikYukle(KAYNAK.uclu.betik, KAYNAK.uclu.kglobal).then(function (N) {
      var ky = ucluKunye(N), satirlar = [];
      for (var g = 0; g < 12; g++) for (var a = 0; a < 12; a++) for (var y = 0; y < 12; y++) {
        var r = N.uclu(g, a, y), o = r.ppm / 1e6;
        satirlar.push({ id: 'uclu', kod: g + '-' + a + '-' + y, anahtar: [g, a, y],
          sayi: Math.round(o * ky.n), oran: o, yuzde: o * 100, biriKac: r.biriKac,
          altSinir: false, kunye: ky });
      }
      satirlar.sort(function (x, z) { return z.oran - x.oran; });
      return { kunye: ky, onek: onek, satirlar: satirlar };
    });
  }
  return Promise.all([ozellikVeri(), katalog()]).then(function (r) {
    var v = r[0], OZ = r[1];
    return bolumYukle(v, onekAl(onek)).then(function (say) {
      var ky = ozellikKunye(v), bas = onek + '.', satirlar = [];
      /* Katalog gerçeği: sayımda 0 çıkan id de tabloda yer alır (eksik satır olmaz). */
      OZ.OZ.forEach(function (o) {
        if (o.id.slice(0, bas.length) !== bas) return;
        var b = bulgu(o.id, say[o.id] || 0, ky, o);
        b.anahtar = o.id.slice(bas.length);
        satirlar.push(b);
      });
      satirlar.sort(function (x, z) { return z.sayi - x.sayi; });
      return { kunye: ky, onek: onek, satirlar: satirlar };
    });
  });
}

/* İsteğe bağlı ön yükleme (ör. sayfa boştayken). */
function hazir(kaynak) {
  if (kaynak === 'uclu') return betikYukle(KAYNAK.uclu.betik, KAYNAK.uclu.kglobal).then(function () {});
  return Promise.all([ozellikVeri(), katalog()]).then(function () {});
}

W.SorbiSayim = {
  SURUM: SURUM,
  kunye: kunye,
  harita: harita,
  ozellik: ozellik,
  uclu: uclu,
  dagilim: dagilim,
  hazir: hazir,
  bin: bin              /* 210384 → "210.384" — sayfa aynı biçimi kullansın diye */
};
})();
