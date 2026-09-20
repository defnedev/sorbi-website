/*! sorbi-ozellik.js — Sorbi Astroloji Kütüphanesi · özellik kataloğu
 *
 *  Tek bir yerde: bir doğum haritasında tespit edilebilen her şey.
 *  Her özellik dört alan taşır:
 *    id      · değişmez anahtar (sayım dosyasıyla eşleşir)
 *    ad      · insan adı
 *    grup    · katalogdaki yeri
 *    bul(H)  · tespit eder; true / sayı / dizi döner, yoksa false
 *    saat    · true ise doğum saati şart (ev ve açısal noktalara bağlı)
 *
 *  Sayım (kaç kişide bir) bu katalogdan ÜRETİLİR: tools/ozellik-say.mjs
 *  katalogdaki her id için örneklem üzerinde kaç kez gerçekleştiğini sayar.
 *  Yani katalog büyüdükçe sayım kendiliğinden büyür; elle sayı yazılmaz.
 *
 *  H = { ch, P, asps, gunduz } — hazırla(chart) ile kurulur.
 */
(function () {
'use strict';
var W = typeof window !== 'undefined' ? window : globalThis;
var M = Math;

var SIGNS = ['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
var AD = { sun:'Güneş', moon:'Ay', mer:'Merkür', ven:'Venüs', mar:'Mars', jup:'Jüpiter', sat:'Satürn', ura:'Uranüs', nep:'Neptün', plu:'Plüton' };
var K7 = ['sun','moon','mer','ven','mar','jup','sat'];
var K10 = K7.concat(['ura','nep','plu']);
var RULER = ['mar','ven','mer','moon','sun','mer','ven','mar','jup','sat','sat','jup'];
var EXALT = { sun:0, moon:1, mer:5, ven:11, mar:9, jup:3, sat:6 };      /* burç indeksi */
var FALL  = { sun:6, moon:7, mer:11, ven:5, mar:3, jup:9, sat:0 };
var ELEM = ['ateş','toprak','hava','su'], NITE = ['öncü','sabit','değişken'];

/* J2000 ekliptik boylamları; yıla presesyonla taşınır */
var YILDIZ = { Regulus:149.8, Spica:203.8, Antares:249.8, Aldebaran:69.8, Algol:56.1,
  Sirius:104.1, Fomalhaut:333.8, Vega:285.3, Altair:301.8, Arcturus:204.2,
  Alcyone:59.9, Betelgeuse:88.7, Rigel:76.7, Castor:110.2, Pollux:113.2,
  Procyon:115.9, Achernar:15.3, DenebAlgedi:323.5 };

function nrm(x) { return ((x % 360) + 360) % 360; }
function kisa(a, b) { var d = nrm(b - a); return d > 180 ? d - 360 : d; }
function ayr(a, b) { return M.abs(kisa(a, b)); }
function bn(l) { return M.floor(nrm(l) / 30); }
function der(l) { return nrm(l) % 30; }

/* ── haritayı özellik testlerine hazırla ── */
function hazirla(ch) {
  var P = {}; ch.pls.forEach(function (p) { if (AD[p.k]) P[p.k] = p; });
  var A = W.SorbiAstro;
  var asps = A.within(ch, 1, false).filter(function (x) { return AD[x.a.k] && AD[x.b.k]; });
  var yil = ch.utc ? ch.utc.getUTCFullYear() : 2000;
  var kay = (yil - 2000) * (50.3 / 3600);
  var YZ = {}; for (var y in YILDIZ) YZ[y] = nrm(YILDIZ[y] + kay);
  return { ch: ch, P: P, asps: asps, gunduz: ch.day, YZ: YZ, saatli: !ch.saatsiz };
}

/* ── yardımcılar ── */
function burcSay(H, liste) {
  var s = new Array(12).fill(0);
  (liste || K7).forEach(function (k) { s[bn(H.P[k].lon)]++; });
  return s;
}
function evSay(H, liste) {
  var s = new Array(13).fill(0);
  (liste || K7).forEach(function (k) { s[H.P[k].house]++; });
  return s;
}
function aciBul(H, a, b, tip) {
  for (var i = 0; i < H.asps.length; i++) {
    var x = H.asps[i];
    if (x.as.n !== tip) continue;
    if ((x.a.k === a && x.b.k === b) || (x.a.k === b && x.b.k === a)) return x;
  }
  return null;
}
function enDar(H) { return H.asps.length ? H.asps[0] : null; }

/* ── KATALOG ──────────────────────────────────────────────────────── */
var OZ = [];
function ek(id, ad, grup, bul, saat, aciklama) {
  OZ.push({ id: id, ad: ad, grup: grup, bul: bul, saat: !!saat, aciklama: aciklama || '' });
}

/* ---- 1. Temel yerleşim: her gezegen × her burç (120 özellik) ---- */
K10.forEach(function (k) {
  SIGNS.forEach(function (sg, si) {
    ek('burc.' + k + '.' + si, AD[k] + ' ' + sg + '’da', 'Burçta gezegen',
      function (H) { return bn(H.P[k].lon) === si; }, false);
  });
});

/* ---- 2. Evdeki gezegen: her gezegen × her ev (120 özellik, saat ister) ---- */
K10.forEach(function (k) {
  for (var e = 1; e <= 12; e++) (function (ev) {
    ek('ev.' + k + '.' + ev, AD[k] + ' ' + ev + '. evde', 'Evde gezegen',
      function (H) { return H.P[k].house === ev; }, true);
  })(e);
});

/* ---- 3. Yükselen ve MC burcu (24) ---- */
SIGNS.forEach(function (sg, si) {
  ek('asc.' + si, 'Yükselen ' + sg, 'Açısal nokta', function (H) { return bn(H.ch.asc) === si; }, true);
  ek('mc.' + si, 'MC ' + sg, 'Açısal nokta', function (H) { return bn(H.ch.mc) === si; }, true);
});

/* ---- 4. Asalet ve zarar ---- */
K7.forEach(function (k) {
  ek('dig.yonetici.' + k, AD[k] + ' kendi burcunda', 'Asalet',
    function (H) { return RULER[bn(H.P[k].lon)] === k; }, false);
  ek('dig.yucelme.' + k, AD[k] + ' yüceldiği burçta', 'Asalet',
    function (H) { return EXALT[k] === bn(H.P[k].lon); }, false);
  ek('dig.zarar.' + k, AD[k] + ' zararda', 'Asalet',
    function (H) { return RULER[(bn(H.P[k].lon) + 6) % 12] === k; }, false);
  ek('dig.dusus.' + k, AD[k] + ' düşüşte', 'Asalet',
    function (H) { return FALL[k] === bn(H.P[k].lon); }, false);
});
ek('dig.hicbiri', 'Yedi klasik gezegenin hiçbiri kendi burcunda ya da yücelmede değil', 'Asalet',
  function (H) { return !K7.some(function (k) { return RULER[bn(H.P[k].lon)] === k || EXALT[k] === bn(H.P[k].lon); }); }, false);
ek('dig.ucArti', 'Üç ya da daha fazla gezegen asaletli', 'Asalet',
  function (H) { return K7.filter(function (k) { return RULER[bn(H.P[k].lon)] === k || EXALT[k] === bn(H.P[k].lon); }).length >= 3; }, false);

/* ---- 5. Karşılıklı kabul ---- */
K7.forEach(function (a, i) {
  K7.slice(i + 1).forEach(function (b) {
    ek('kabul.' + a + '.' + b, AD[a] + ' ile ' + AD[b] + ' karşılıklı kabulde', 'Karşılıklı kabul',
      function (H) { return RULER[bn(H.P[a].lon)] === b && RULER[bn(H.P[b].lon)] === a; }, false);
  });
});

/* ---- 6. Yığın ---- */
[3, 4, 5, 6].forEach(function (n) {
  ek('yigin.burc7.' + n, n + ' klasik gezegen aynı burçta', 'Yığın',
    function (H) { return M.max.apply(null, burcSay(H, K7)) >= n; }, false);
  ek('yigin.ev7.' + n, n + ' klasik gezegen aynı evde', 'Yığın',
    function (H) { return M.max.apply(null, evSay(H, K7).slice(1)) >= n; }, true);
});

/* ---- 7. Açı kalıpları ---- */
ek('kalip.tkare', 'T-kare', 'Açı kalıbı', function (H) {
  for (var i = 0; i < H.asps.length; i++) {
    var o = H.asps[i]; if (o.as.n !== 'Karşıt') continue;
    for (var k in H.P) {
      if (k === o.a.k || k === o.b.k) continue;
      if (aciBul(H, k, o.a.k, 'Kare') && aciBul(H, k, o.b.k, 'Kare')) return true;
    }
  }
  return false;
}, false);
ek('kalip.buyukucgen', 'Büyük üçgen', 'Açı kalıbı', function (H) {
  var ks = Object.keys(H.P);
  for (var i = 0; i < ks.length; i++) for (var j = i + 1; j < ks.length; j++) {
    if (!aciBul(H, ks[i], ks[j], 'Üçgen')) continue;
    for (var l = j + 1; l < ks.length; l++)
      if (aciBul(H, ks[i], ks[l], 'Üçgen') && aciBul(H, ks[j], ks[l], 'Üçgen')) return true;
  }
  return false;
}, false);
ek('kalip.buyukkare', 'Büyük kare', 'Açı kalıbı', function (H) {
  var ks = Object.keys(H.P);
  for (var i = 0; i < ks.length; i++) for (var j = i + 1; j < ks.length; j++) {
    if (!aciBul(H, ks[i], ks[j], 'Karşıt')) continue;
    for (var l = 0; l < ks.length; l++) for (var m = l + 1; m < ks.length; m++) {
      if (l === i || l === j || m === i || m === j) continue;
      if (!aciBul(H, ks[l], ks[m], 'Karşıt')) continue;
      if (aciBul(H, ks[i], ks[l], 'Kare') && aciBul(H, ks[j], ks[m], 'Kare')) return true;
    }
  }
  return false;
}, false);
ek('kalip.stelyum.yok', 'Hiç majör açı yok', 'Açı kalıbı',
  function (H) { return H.asps.length === 0; }, false);
ek('kalip.tkare.kisisel', 'T-kare (yalnız Güneş, Ay, Merkür, Venüs, Mars)', 'Açı kalıbı', function (H) {
  var KIS = ['sun','moon','mer','ven','mar'];
  for (var i = 0; i < H.asps.length; i++) {
    var o = H.asps[i];
    if (o.as.n !== 'Karşıt' || KIS.indexOf(o.a.k) < 0 || KIS.indexOf(o.b.k) < 0) continue;
    for (var j = 0; j < KIS.length; j++) {
      var k = KIS[j];
      if (k === o.a.k || k === o.b.k) continue;
      if (aciBul(H, k, o.a.k, 'Kare') && aciBul(H, k, o.b.k, 'Kare')) return true;
    }
  }
  return false;
}, false);

/* ---- 8. Açısız gezegen ---- */
K10.forEach(function (k) {
  ek('acisiz.' + k, AD[k] + ' açısız', 'Açısız gezegen', function (H) {
    return !H.asps.some(function (x) { return x.a.k === k || x.b.k === k; });
  }, false);
});

/* ---- 9. Geri hareket ---- */
['mer','ven','mar','jup','sat','ura','nep','plu'].forEach(function (k) {
  ek('retro.' + k, AD[k] + ' geri hareketli', 'Geri hareket',
    function (H) { return !!H.P[k].rx; }, false);
});
ek('retro.hicbiri', 'Hiçbir gezegen geri hareketli değil', 'Geri hareket',
  function (H) { return !K10.some(function (k) { return H.P[k].rx; }); }, false);
[3, 4, 5].forEach(function (n) {
  ek('retro.adet.' + n, n + ' ya da daha fazla gezegen geri', 'Geri hareket',
    function (H) { return K10.filter(function (k) { return H.P[k].rx; }).length >= n; }, false);
});

/* ---- 10. Güneş yakınlığı: yanık, cazimi ---- */
['mer','ven','mar','jup','sat'].forEach(function (k) {
  ek('yanik.' + k, AD[k] + ' yanık (Güneş’e 8° içinde)', 'Güneş yakınlığı',
    function (H) { var d = ayr(H.P[k].lon, H.P.sun.lon); return d <= 8 && d > 0.28; }, false);
  ek('cazimi.' + k, AD[k] + ' cazimi (Güneş’e 17′ içinde)', 'Güneş yakınlığı',
    function (H) { return ayr(H.P[k].lon, H.P.sun.lon) <= 0.28; }, false);
});

/* ---- 11. Ay evresi ---- */
[['yeni', 0, 22.5], ['buyuyen-hilal', 22.5, 67.5], ['ilk-dordun', 67.5, 112.5],
 ['buyuyen-siskin', 112.5, 157.5], ['dolunay', 157.5, 202.5], ['kuculen-siskin', 202.5, 247.5],
 ['son-dordun', 247.5, 292.5], ['kuculen-hilal', 292.5, 337.5]].forEach(function (e) {
  ek('evre.' + e[0], 'Ay evresi: ' + e[0].replace(/-/g, ' '), 'Ay evresi', function (H) {
    var f = nrm(H.P.moon.lon - H.P.sun.lon);
    if (e[1] === 0) return f < 22.5 || f >= 337.5;
    return f >= e[1] && f < e[2];
  }, false);
});

/* ---- 12. Sect (gündüz/gece) ---- */
ek('sect.gunduz', 'Gündüz haritası', 'Sect', function (H) { return H.gunduz; }, true);
ek('sect.gece', 'Gece haritası', 'Sect', function (H) { return !H.gunduz; }, true);

/* ---- 13. Element ve nitelik dengesi ---- */
[0, 1, 2, 3].forEach(function (e) {
  ek('elem.yok.' + e, ELEM[e] + ' elementinde hiç gezegen yok', 'Element',
    function (H) { return !K7.some(function (k) { return bn(H.P[k].lon) % 4 === e; }); }, false);
  ek('elem.baskin.' + e, ELEM[e] + ' elementinde dört ya da daha fazla gezegen', 'Element',
    function (H) { return K7.filter(function (k) { return bn(H.P[k].lon) % 4 === e; }).length >= 4; }, false);
});
[0, 1, 2].forEach(function (n) {
  ek('nite.baskin.' + n, NITE[n] + ' burçlarda dört ya da daha fazla gezegen', 'Nitelik',
    function (H) { return K7.filter(function (k) { return bn(H.P[k].lon) % 3 === n; }).length >= 4; }, false);
});

/* ---- 14. Derece özellikleri ---- */
K7.forEach(function (k) {
  ek('derece.anaretik.' + k, AD[k] + ' 29. derecede', 'Derece',
    function (H) { return M.floor(der(H.P[k].lon)) === 29; }, false);
  ek('derece.sifir.' + k, AD[k] + ' 0. derecede', 'Derece',
    function (H) { return M.floor(der(H.P[k].lon)) === 0; }, false);
});
ek('derece.anaretik.var', 'Yedi klasik gezegenden en az biri 29. derecede', 'Derece',
  function (H) { return K7.some(function (k) { return M.floor(der(H.P[k].lon)) === 29; }); }, false);

/* ---- 15. Sabit yıldız teması (1° orb) ---- */
Object.keys(YILDIZ).forEach(function (y) {
  ek('yildiz.' + y, y + ' teması (herhangi bir gezegen ya da açısal nokta)', 'Sabit yıldız',
    function (H) {
      var l = H.YZ[y];
      for (var k in H.P) if (ayr(H.P[k].lon, l) <= 1) return true;
      if (H.saatli && (ayr(H.ch.asc, l) <= 1 || ayr(H.ch.mc, l) <= 1)) return true;
      return false;
    }, false);
});
ek('yildiz.hicbiri', 'Hiçbir sabit yıldız teması yok', 'Sabit yıldız', function (H) {
  for (var y in H.YZ) {
    var l = H.YZ[y];
    for (var k in H.P) if (ayr(H.P[k].lon, l) <= 1) return false;
    if (H.saatli && (ayr(H.ch.asc, l) <= 1 || ayr(H.ch.mc, l) <= 1)) return false;
  }
  return true;
}, false);

/* ---- 16. Açısal güç (1, 4, 7, 10. ev) ---- */
K7.forEach(function (k) {
  ek('acisal.' + k, AD[k] + ' köşe evde (1, 4, 7, 10)', 'Açısal güç',
    function (H) { return [1,4,7,10].indexOf(H.P[k].house) >= 0; }, true);
});
[3, 4].forEach(function (n) {
  ek('acisal.adet.' + n, n + ' ya da daha fazla gezegen köşe evlerde', 'Açısal güç',
    function (H) { return K7.filter(function (k) { return [1,4,7,10].indexOf(H.P[k].house) >= 0; }).length >= n; }, true);
});

/* ---- 17. Harita yöneticisi ---- */
for (var e2 = 1; e2 <= 12; e2++) (function (ev) {
  ek('yonetici.ev.' + ev, 'Harita yöneticisi ' + ev + '. evde', 'Harita yöneticisi',
    function (H) { return H.P[RULER[bn(H.ch.asc)]].house === ev; }, true);
})(e2);
ek('yonetici.acisal', 'Harita yöneticisi köşe evde', 'Harita yöneticisi',
  function (H) { return [1,4,7,10].indexOf(H.P[RULER[bn(H.ch.asc)]].house) >= 0; }, true);
ek('yonetici.retro', 'Harita yöneticisi geri hareketli', 'Harita yöneticisi',
  function (H) { return !!H.P[RULER[bn(H.ch.asc)]].rx; }, true);

/* ---- 18. Dar açılar (0,5° altı) ---- */
ek('aci.cokdar', 'Yarım dereceden dar bir majör açı', 'Açı',
  function (H) { return H.asps.some(function (x) { return M.abs(x.orb) < 0.5; }); }, false);
['Kavuşum','Karşıt','Üçgen','Kare','Altmışlık'].forEach(function (t) {
  ek('aci.tip.' + t, 'En az bir ' + t.toLowerCase(), 'Açı',
    function (H) { return H.asps.some(function (x) { return x.as.n === t; }); }, false);
});
[12, 18, 24].forEach(function (n) {
  ek('aci.adet.' + n, n + ' ya da daha fazla majör açı', 'Açı',
    function (H) { return H.asps.length >= n; }, false);
});

/* ---- 19. Ay'ın durumu ---- */
ek('ay.bosyol', 'Ay boşlukta (burcundan çıkana dek tam olacak majör açısı yok)', 'Ay', function (H) {
  var ay = H.P.moon;
  var kalan = 30 - der(ay.lon);                 /* burç sonuna derece */
  var tSinir = kalan / ay.speed;                /* gün */
  var ACI = [0, 60, 90, 120, 180];
  for (var k in H.P) {
    if (k === 'moon' || ['ura','nep','plu'].indexOf(k) >= 0) continue;   /* klasik gezegenler */
    var p = H.P[k], v = ay.speed - (p.speed || 0);
    if (v <= 0) continue;
    for (var i = 0; i < ACI.length; i++) {
      var hedefler = ACI[i] === 0 || ACI[i] === 180 ? [nrm(p.lon + ACI[i])] : [nrm(p.lon + ACI[i]), nrm(p.lon - ACI[i])];
      for (var j = 0; j < hedefler.length; j++) {
        var fark = nrm(hedefler[j] - ay.lon);   /* ileri yönde uzaklık */
        var t = fark / v;
        if (t > 0 && t <= tSinir) return false; /* burçtan çıkmadan tam oluyor */
      }
    }
  }
  return true;
}, false);
ek('ay.hizli', 'Ay hızlı (günde 13°10′ üstü)', 'Ay',
  function (H) { return H.P.moon.speed > 13.1667; }, false);
ek('ay.yavas', 'Ay yavaş (günde 12° altı)', 'Ay',
  function (H) { return H.P.moon.speed < 12; }, false);

/* ---- 20. Üçlü: Güneş-Ay-Yükselen kombinasyonu ---- */
ek('uclu', 'Güneş–Ay–Yükselen üçlüsü', 'Üçlü', function (H) {
  return bn(H.P.sun.lon) + '-' + bn(H.P.moon.lon) + '-' + bn(H.ch.asc);
}, true, 'Değer döndürür: üçlünün kimliği. Sayım her kombinasyonu ayrı sayar.');

/* ── dışa açılan ── */
var API = {
  hazirla: hazirla,
  OZ: OZ,
  SIGNS: SIGNS, AD: AD, K7: K7, K10: K10, RULER: RULER, YILDIZ: YILDIZ,
  /* bir haritada gerçekleşen her özelliğin id listesi (+ değer dönenler) */
  tara: function (ch) {
    var H = hazirla(ch), out = [];
    for (var i = 0; i < OZ.length; i++) {
      var o = OZ[i];
      if (o.saat && ch.saatsiz) continue;
      var r;
      try { r = o.bul(H); } catch (e) { continue; }
      if (r === true) out.push(o.id);
      else if (typeof r === 'string') out.push(o.id + ':' + r);
    }
    return out;
  },
  gruplar: function () {
    var g = {};
    OZ.forEach(function (o) { g[o.grup] = (g[o.grup] || 0) + 1; });
    return g;
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = API;
W.SorbiOzellik = API;
})();
