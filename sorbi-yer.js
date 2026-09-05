/* Sorbi Yer — doğum yeri araması.
   Sorun: open-meteo geocoding'i Türkçesiz yazınca bulamıyor ("Sanliurfa" → 0 sonuç),
   ve yabancı/alakasız yerleri üste koyuyor ("Mugla / Bulgaristan", "İstanbulya Ada / Yunanistan").
   Çözüm: 81 il yerelde tutulur (koordinatlar open-meteo'dan doğrulanarak alındı,
   Hatay→Antakya ve Kocaeli→İzmit gibi yanlış merkezler elle düzeltildi); arama
   Türkçe-duyarsız eşleşir; uzak sonuçlar önce TR olacak şekilde harmanlanır.
   Sayfalarda kod değişikliği gerekmez: yalnız geocoding isteğini yakalar. */
(function () {
  'use strict';
  var UC = 'https://geocoding-api.open-meteo.com/v1/search';
  var TZ = 'Europe/Istanbul';

  /* [il, enlem, boylam, merkez adı (il adından farklıysa)] */
  var IL = [
["Adana",36.9862,35.3253,0],["Adıyaman",37.7644,38.2763,0],["Afyonkarahisar",38.7567,30.5433,0],
["Ağrı",39.7147,43.0401,0],["Aksaray",38.3725,34.0254,0],["Amasya",40.6533,35.8331,0],
["Ankara",39.9199,32.8543,0],["Antalya",36.9081,30.6956,0],["Ardahan",41.1087,42.7022,0],
["Artvin",41.1816,41.8217,0],["Aydın",37.845,27.8396,0],["Balıkesir",39.6492,27.8861,0],
["Bartın",41.6358,32.3375,0],["Batman",37.8874,41.1322,0],["Bayburt",40.2563,40.2229,0],
["Bilecik",40.1419,29.9793,0],["Bingöl",38.8847,40.4939,0],["Bitlis",38.4012,42.1078,0],
["Bolu",40.7358,31.6061,0],["Burdur",37.7203,30.2908,0],["Bursa",40.1956,29.0601,0],
["Çanakkale",40.1555,26.4127,0],["Çankırı",40.5999,33.6153,0],["Çorum",40.5489,34.9533,0],
["Denizli",37.7742,29.0875,0],["Diyarbakır",37.9136,40.2172,0],["Düzce",40.8389,31.1639,0],
["Edirne",41.6772,26.556,0],["Elazığ",38.6743,39.2232,0],["Erzincan",39.7392,39.4901,0],
["Erzurum",39.9086,41.2769,0],["Eskişehir",39.7767,30.5206,0],["Gaziantep",37.0594,37.3825,0],
["Giresun",40.917,38.3874,0],["Gümüşhane",40.46,39.4718,0],["Hakkâri",37.5744,43.7408,0],
["Hatay",36.2066,36.1572,"Antakya"],["Iğdır",39.9237,44.045,0],["Isparta",37.7644,30.5522,0],
["İstanbul",41.0138,28.9497,0],["İzmir",38.4127,27.1384,0],["Kahramanmaraş",37.5847,36.9264,0],
["Karabük",41.2049,32.6277,0],["Karaman",37.1811,33.215,0],["Kars",40.5983,43.0855,0],
["Kastamonu",41.3781,33.7753,0],["Kayseri",38.7322,35.4853,0],["Kırıkkale",39.8453,33.5064,0],
["Kırklareli",41.7351,27.2252,0],["Kırşehir",39.1458,34.1639,0],["Kilis",36.7161,37.115,0],
["Kocaeli",40.765,29.9293,"İzmit"],["Konya",37.8713,32.4846,0],["Kütahya",39.4242,29.9833,0],
["Malatya",38.3502,38.3167,0],["Manisa",38.612,27.4265,0],["Mardin",37.3131,40.7436,0],
["Mersin",36.812,34.6389,0],["Muğla",37.2181,28.3665,0],["Muş",38.7316,41.4848,0],
["Nevşehir",38.625,34.7122,0],["Niğde",37.9658,34.6793,0],["Ordu",40.9778,37.8905,0],
["Osmaniye",37.0742,36.2478,0],["Rize",41.0208,40.5219,0],["Sakarya",40.7806,30.4033,"Adapazarı"],
["Samsun",41.2798,36.3361,0],["Siirt",37.9293,41.9413,0],["Sinop",42.0268,35.1625,0],
["Sivas",39.7483,37.0161,0],["Şanlıurfa",37.1671,38.7939,0],["Şırnak",37.5139,42.4543,0],
["Tekirdağ",40.9781,27.511,0],["Tokat",40.3139,36.5544,0],["Trabzon",41.005,39.7269,0],
["Tunceli",39.0992,39.5435,0],["Uşak",38.6735,29.4058,0],["Van",38.4946,43.3832,0],
["Yalova",40.655,29.2769,0],["Yozgat",39.82,34.8044,0],["Zonguldak",41.4514,31.7931,0]
  ];

  /* Türkçe-duyarsız karşılaştırma anahtarı */
  function anahtar(s) {
    return String(s || '')
      .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
      .toLowerCase()
      .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
      .replace(/[^a-z0-9]/g, '');
  }

  var DIZIN = IL.map(function (r) {
    return { il: r[0], lat: r[1], lon: r[2], merkez: r[3] || r[0], k: anahtar(r[0]), km: anahtar(r[3] || r[0]) };
  });

  function yerel(q) {
    var k = anahtar(q);
    if (k.length < 2) return [];
    var tam = [], bas = [], ic = [];
    DIZIN.forEach(function (d) {
      if (d.k === k || d.km === k) tam.push(d);
      else if (d.k.indexOf(k) === 0 || d.km.indexOf(k) === 0) bas.push(d);
      else if (d.k.indexOf(k) > 0 || d.km.indexOf(k) > 0) ic.push(d);
    });
    return tam.concat(bas, ic).slice(0, 6).map(function (d) {
      return {
        name: d.il, latitude: d.lat, longitude: d.lon, timezone: TZ,
        country: 'Türkiye', country_code: 'TR',
        admin1: d.merkez === d.il ? 'Türkiye' : d.merkez,
        _sorbi: 'il'
      };
    });
  }

  function kimlik(x) { return anahtar(x.name) + '|' + anahtar(x.admin1 || '') + '|' + (x.country_code || ''); }

  function harmanla(yerelListe, uzakListe) {
    var goruldu = {}, cikti = [];
    function ekle(x) { var id = kimlik(x); if (goruldu[id]) return; goruldu[id] = 1; cikti.push(x); }
    yerelListe.forEach(ekle);
    uzakListe.filter(function (x) { return x.country_code === 'TR'; }).forEach(ekle);
    uzakListe.filter(function (x) { return x.country_code !== 'TR'; }).forEach(ekle);
    return cikti.slice(0, 6);
  }

  function ara(q) {
    var y = yerel(q);
    return fetch(UC + '?name=' + encodeURIComponent(q) + '&count=10&language=tr&format=json')
      .then(function (r) { return r.json(); })
      .catch(function () { return {}; })
      .then(function (j) { return { results: harmanla(y, (j && j.results) || []) }; });
  }

  /* Sayfalardaki mevcut fetch çağrılarını olduğu gibi bırakıp araya giriyoruz. */
  var asilFetch = window.fetch ? window.fetch.bind(window) : null;
  if (asilFetch) {
    window.fetch = function (girdi, secenek) {
      var url = (typeof girdi === 'string') ? girdi : (girdi && girdi.url) || '';
      if (url.indexOf(UC) === 0) {
        var m = /[?&]name=([^&]*)/.exec(url);
        var q = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
        if (q) {
          return ara(q).then(function (veri) {
            return new Response(JSON.stringify(veri), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          });
        }
      }
      return asilFetch(girdi, secenek);
    };
  }

  window.SorbiYer = { ara: ara, iller: IL, anahtar: anahtar };
})();
