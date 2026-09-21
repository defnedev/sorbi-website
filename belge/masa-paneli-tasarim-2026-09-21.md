# Astrolog Masası — Uygulama Tasarımı (B3)

Tarih: 2026-09-21 · Aşama: tasarım. Bu belgede kod yok, karar ve şema var.
Hiçbir dosya değiştirilmedi.

---

## 0. Bir cümlede durum

`masa.html` bitmiş bir arayüz, ama arkasında sunucu yok: sayfa kendi içinde
`/api/panel/*` yollarını taklit eden bir `api()` fonksiyonu barındırıyor, veriyi
`localStorage.sorbiMasa_v1`'e yazıyor. Kimlik doğrulaması yok, sayfa `noindex` ve
hiçbir sayfadan bağlantısız. Yani ekran "yayında duruyor" değil, "yayında saklanıyor".

---

## 1. Sayfanın gerçekte ne yaptığı

### 1.1 Ekranlar

| Ekran | Tetik | İçerik |
|---|---|---|
| Boş masa | ilk açılış | "Soldan bir danışan seç ya da + ile yeni dosya aç" |
| Kenar çubuğu | her zaman | arama kutusu (`ara`), `+` düğmesi, danışan listesi (`dlist`) |
| Danışan formu | `+` veya "Dosyayı düzenle" | isim, doğum tarih/saat, yer (Open-Meteo geocoding), etiketler, saat-belirsiz onayı, dosya notu, Kaydet / Vazgeç / Arşivle |
| Sekme: Seans hazırlığı | dosya açık | brif şeridi (sect, en dar transit, ilerlemiş Ay, en zayıf gezegen) + harita çizimi + bugünün transitleri (orb ≤ 2.5°) + sekonder ilerletim (orb ≤ 1.5°) + esansiyel dignite tablosu + natal açılar (ilk 24) |
| Sekme: Sinastri | dosya açık | ikinci dosya seçici, çift çark çizimi, açı sayımları (sert/yumuşak/kavuşum), kişisel gezegenler arası açılar, tüm karşılıklı açılar (ilk 26) |
| Sekme: Seanslar | dosya açık | seans ekleme formu (tarih, tür, tek cümle özet, not) + geçmiş listesi + tek tek silme |
| Sekme: Danışana çıktı | dosya açık | fildişi zeminli, yazdırılabilir sayfa: harita SVG (`theme:'paper'`), üç temel yerleşim, en dar 8 açı, son seansın özeti, imza metni. Yazdır/PDF ve SVG indir. |
| Yedek al / yükle | üst şerit | tüm `sorbiMasa_v1` nesnesini JSON indir / JSON'dan **üzerine yaz** |

### 1.2 Akış

```
aç → tohumla() (depo boşsa iki örnek dosya + bir örnek seans)
   → listele() → GET /api/panel/danisanlar[?q=]
   → satıra tıkla → ac(id) → GET /api/panel/danisan?id=
   → cizDosya() → sekme fonksiyonu (hazirlik|sinastri|seanslar|cikti)
   → hesap gerekiyorsa motor() ile 4 script'i tembel yükle:
        astronomy.browser.min.js, sorbi-chart.js, sorbi-astro.js, sorbi-dignite.js
```

Hesaplama tamamen istemcide. Sunucu tarafına hiçbir zaman harita, açı ya da
dignite hesabı taşınmıyor — bu doğru karar, korunmalı.

### 1.3 Sunucuya gerçekten giden tek şey (bugün)

`olay(tur)` → `POST /api/track` ile üç anonim olay: `masa_acildi`, `masa_dosya`,
`masa_seans`, `masa_cikti`. Yalnız `type` alanı gidiyor, danışan verisi gitmiyor.
Bu uç `functions/api/[[route]].js` içinde gerçekten var ve çalışıyor.

### 1.4 Ölü kalıntılar

- `var TOK=null` — hiçbir yerde okunmuyor/yazılmıyor. Eski giriş sürümünden kalma.
- `.giris` CSS bloğu (`.giris`, `.giris .mark`, `.giris h1`, `.giris p`, `.giris .sat`) —
  karşılığı olan HTML yok.
- `#modRozet`, `#gbRozet`, `.gbk`, `.gb-ozet`, `.rapor`, `.mod-akis` CSS'leri —
  moderasyon ve geri-bildirim paneli stilleri; `masa.html` içinde bu ekranlar yok.
  (Karşılıkları `functions/api/geri-bildirim/[[route]].js` uçlarında duruyor;
  panel HTML'i bu depoda görünmüyor.)
- Tema betiği `.sbnav` arıyor; `masa.html`'de `.sbnav` yok → tema düğmesi hiç eklenmiyor.
  Sayfa daima gece temasında. (Küçük hata, B3 kapsamında düzeltilebilir.)
- `cevap(j, ok)` her zaman çözülen bir Promise döndürüyor; `.catch()` blokları
  pratikte hiç çalışmıyor. Gerçek `fetch`'e geçince bu bloklar ilk kez anlam kazanacak.

---

## 2. `sorbiMasa_v1` şeması (çözülmüş hali)

```jsonc
{
  "sira": 4,                 // TEK paylaşılan sayaç: hem danışan hem seans id'si buradan
  "danisanlar": [
    {
      "id": 1,               // number, sira'dan
      "ad": "Örnek — Deniz",           // zorunlu (boşsa "İsim gerekli")
      "dogum_tarih": "1991-03-14",     // "YYYY-MM-DD" | "" 
      "dogum_saat": "09:20",           // "HH:MM" | ""
      "saat_belirsiz": 0,              // 0 | 1 → 1 ise saat 12:00'ye sabitlenir, evler Whole Sign
      "yer": "İzmir, Türkiye",         // serbest metin (geocoder etiketi)
      "lat": 38.4237,                  // number | null
      "lon": 27.1428,                  // number | null
      "tz": "Europe/Istanbul",         // IANA | null
      "etiketler": "örnek, kariyer",   // VİRGÜLLE AYRILMIŞ TEK METİN, dizi değil
      "notlar": "…",                   // serbest metin
      "arsiv": 1                       // yalnız arşivlenmişse var; yoksa alan hiç yok
    }
  ],
  "seanslar": [
    {
      "id": 3,
      "danisan_id": 1,
      "tarih": "2026-08-18",   // "YYYY-MM-DD"
      "tur": "natal",          // serbest metin (natal / transit / horary…)
      "ozet": "…",             // max 200 (input maxlength)
      "notlar": "…"            // serbest metin
    }
  ]
}
```

Türetilmiş alan (kalıcı değil): `seans_sayisi` — listeleme sırasında sayılıyor.

**Şemanın zayıf yanları (sunucuya taşırken düzeltilecek):**
1. `sira` tek sayaç, iki varlık için. D1'de `AUTOINCREMENT` ayrı ayrı olacağı için
   göçte eski id'ler korunamaz → eşleme tablosu gerekir (bkz. §5).
2. Hiçbir kayıtta `created_at` / `updated_at` yok. Sıralama `tarih` metnine dayanıyor.
3. Silme iki farklı davranış: danışan **arşivlenir** (`arsiv:1`), seans **gerçekten silinir**.
4. `etiketler` tek metin. Sunucuda da metin kalsın — normalize etmenin bedeli faydasından büyük.
5. `lat`/`lon` doğrulanmıyor; geocoder seçilmeden yazılan şehir adı kayda `lat:null` ile girer.
6. Arama yalnız `ad` üzerinde, Türkçe küçültmeyle (`toLocaleLowerCase('tr')`) — sunucuda
   SQLite `LOWER()` Türkçe'yi bilmez (İ/ı). Bu farkı bilerek kabul edip aramayı
   ya istemcide bırakacağız ya da `ad_arama` diye normalize edilmiş bir kolon tutacağız.

---

## 3. Sunucu tarafı tasarımı

### 3.1 D1 tabloları

Mevcut `schema.sql` stiline uyuyor: `id INTEGER PRIMARY KEY AUTOINCREMENT`,
`created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))`, `CREATE TABLE IF NOT EXISTS`.
Fonksiyon çalışma anında da kurar (`semaKur` deseni).

```sql
-- Astrolog Masası (2026-09-xx)
CREATE TABLE IF NOT EXISTS masa_danisan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sahip TEXT NOT NULL,              -- Access e-postası (küçük harfe indirgenmiş)
  ad TEXT NOT NULL,
  ad_arama TEXT,                    -- Türkçe-duyarlı küçük harf kopya, LIKE için
  dogum_tarih TEXT,                 -- YYYY-MM-DD
  dogum_saat TEXT,                  -- HH:MM
  saat_belirsiz INTEGER DEFAULT 0,
  yer TEXT,
  lat REAL,
  lon REAL,
  tz TEXT,
  etiketler TEXT,
  notlar TEXT,
  arsiv INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS ix_masa_danisan_sahip ON masa_danisan(sahip, arsiv, id DESC);

CREATE TABLE IF NOT EXISTS masa_seans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  danisan_id INTEGER NOT NULL,
  sahip TEXT NOT NULL,              -- danışandan kopya; her sorguda JOIN'siz sahiplik kontrolü
  tarih TEXT,
  tur TEXT,
  ozet TEXT,
  notlar TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS ix_masa_seans_danisan ON masa_seans(danisan_id, tarih DESC);
```

`sahip` kolonu tek kullanıcı için bile konulmalı: yarın ikinci bir astrolog
eklendiğinde şema göçü gerekmez, ve her sorguda `WHERE sahip=?` yazma alışkanlığı
bir yetkilendirme hatasını baştan imkânsız kılar.

Yabancı anahtar kısıtı bilerek yazılmadı — mevcut şemada hiç kullanılmamış;
silme sırası kodda yönetilecek (§3.2, DELETE danışan).

### 3.2 Uçlar — `functions/api/panel/[[route]].js`

Ayrı dosya, `geri-bildirim/[[route]].js` ile aynı desende: kendi `json()`,
kendi `ensureSchema()`, `clean()`, başta tek bir yetki kontrolü.

Ortak davranış:
- Tüm uçlar önce `kimlik(request, env)` çağırır; kimlik yoksa `401 {error:'Yetkisiz'}`.
- `Access-Control-Allow-Origin` **`*` olmayacak** — panel uçlarında yıldız yanlış.
  Ya başlık hiç verilmez (aynı-köken zaten çalışır) ya `https://sorbiapp.com` sabiti verilir.
- Yanıtlara `Cache-Control: no-store` ve `X-Robots-Tag: noindex`.
- Gövde üst sınırları: `ad` 80, `yer` 160, `etiketler` 120, `notlar` 8000,
  `ozet` 200, `tur` 40, `notlar` (seans) 8000.

| # | Yol | Metot | Girdi | Çıktı | Hatalar |
|---|---|---|---|---|---|
| 1 | `/api/panel/kim` | GET | — | `{ok:true, eposta:"…", ad:"…"}` | 401 kimlik yok |
| 2 | `/api/panel/danisanlar` | GET | `?q=` (ops., ≤80) | `{danisanlar:[{…, seans_sayisi}]}` | 401 |
| 3 | `/api/panel/danisanlar` | POST | danışan gövdesi | `{id}` 201 | 400 `ad` boş · 400 tarih biçimi · 401 · 429 |
| 4 | `/api/panel/danisan?id=` | GET | `id` | `{danisan, seanslar:[…]}` | 400 id yok · 401 · 404 |
| 5 | `/api/panel/danisan` | PUT | `{id, …alanlar}` | `{ok:true}` | 400 · 401 · 404 |
| 6 | `/api/panel/danisan?id=` | DELETE | `id` | `{ok:true}` | 400 · 401 · 404 |
| 7 | `/api/panel/seans` | POST | `{danisan_id, tarih, tur, ozet, notlar}` | `{id}` 201 | 400 · 401 · 404 (danışan yok/başkasının) |
| 8 | `/api/panel/seans?id=` | DELETE | `id` | `{ok:true}` | 400 · 401 · 404 |
| 9 | `/api/panel/disa` | GET | — | `{surum:1, danisanlar:[…], seanslar:[…]}` | 401 |
| 10 | `/api/panel/goc` | POST | `sorbiMasa_v1` nesnesi | `{ok:true, danisan:N, seans:M, atlanan:K}` | 400 biçim · 401 · 409 (bkz. §5) |

Ayrıntılar:

**2 — listeleme.** `SELECT d.*, (SELECT COUNT(*) FROM masa_seans s WHERE s.danisan_id=d.id) seans_sayisi
FROM masa_danisan d WHERE d.sahip=? AND d.arsiv=0 [AND d.ad_arama LIKE ?] ORDER BY d.id DESC LIMIT 500`.
`q` varsa `%q%`. `notlar` bu uçta **dönmez** — liste ekranı okumuyor, gereksiz veri taşımayalım.

**3/5 — yazma.** `ad` boş → `400 {error:'İsim gerekli'}` (istemcideki metinle birebir aynı,
arayüz değişmesin). `dogum_tarih` boş değilse `^\d{4}-\d{2}-\d{2}$` ve yıl 1850–2069
(istemcideki `haritaKur` sınırı) aranır. `lat`/`lon` ya ikisi de sayı ve aralıkta
(−90..90 / −180..180) ya ikisi de `null`. `tz` yalnız `[A-Za-z0-9_+\-/]{1,60}`.
PUT kısmi güncelleme yapar: gövdede olmayan alan `COALESCE` ile korunur, `updated_at` yenilenir.

**6 — danışan silme.** Arşiv (`arsiv=1`). Gerçek silme için ayrı ve açık bir uç
gerekir (`DELETE /api/panel/danisan?id=&kalici=1`), çünkü KVKK "silme hakkı"
arşivle karşılanmaz (§4). Kalıcı silme önce `masa_seans`'ı, sonra danışanı siler,
tek `env.DB.batch([...])` içinde.

**7 — seans ekleme.** Önce `SELECT id FROM masa_danisan WHERE id=? AND sahip=?`;
yoksa 404 (403 değil — başkasının kaydının varlığını sızdırmayalım). `sahip`
danışandan kopyalanır.

**Hız sınırı.** Panel tek kişilik; yine de yazma uçlarına saatlik 300 kayıt sınırı
(`SELECT COUNT(*) … WHERE sahip=? AND created_at > ?`) — yanlışlıkla döngüye giren
bir göç betiği D1 kotasını yakmasın.

**Hata gövdesi.** Mevcut stille aynı: `{error:'…'}`, Türkçe, kullanıcıya gösterilebilir.
`geri-bildirim`'deki `detail: String(err)` **kopyalanmamalı** — panel hata metni
danışan verisi ya da SQL parçası sızdırabilir. 500'de yalnız `{error:'Sunucu hatası'}`.

### 3.3 İstemci tarafında ne değişir

`masa.html` içindeki sahte `api()` silinir, yerine gerçek `fetch` gelir:

```
function api(yol, secenek){
  return fetch(yol, {credentials:'same-origin', headers:{'Content-Type':'application/json'}, ...secenek})
    .then(r => r.json().then(j => ({ok:r.ok, durum:r.status, j})));
}
```

Çağrı yerlerinin hiçbiri değişmez — `api()` zaten `{ok, j}` döndürüyor. Bu,
sayfanın en iyi tasarlanmış yanı: geçiş tek fonksiyonluk.

Eklenmesi gerekenler:
- `durum===401` → sayfayı yeniden yükle (Access oturumu düşmüştür, tarayıcı
  giriş ekranına gider).
- `tohumla()` kaldırılır ya da yalnız sunucu "hiç danışan yok" derse çalışır;
  örnek dosyalar artık sunucuya yazılacağı için tercih: **kaldır**.
- Üst şeritteki "Veriler bu tarayıcıda kalır" yazısı **yalan olur** → değişmeli
  (§4). Yerine: kim olarak girildiği (`/api/panel/kim` çıktısı) yazılsın.
- "Yedek al" artık `GET /api/panel/disa`'dan beslenir; "Yedek yükle"
  `POST /api/panel/goc`'a gider ve **üzerine yazmaz, ekler** (mevcut davranış
  "şu anki verinin yerine geçecek" — sunucuda bu tehlikeli).
- Ölü `TOK`, `.giris` CSS'i, moderasyon/geri-bildirim CSS blokları silinir.

---

## 4. Kimlik — Cloudflare Access değerlendirmesi

### 4.1 Karar: evet, doğru yaklaşım

Gerekçe:
- Parola saklanmıyor, hash'lenmiyor, sıfırlanmıyor. Saklamadığımız sır sızmaz.
- Depo açık; `geri-bildirim` ucundaki `env.AUTH_SECRET || 'sorbi-secret'` deseni
  tam olarak bu yüzden kötü — kendi kimliğimizi yazarsak aynı tuzağa düşme riski var.
  Access bu kararı bizden alıyor.
- Tek kullanıcılık bir panel için kendi oturum/çerez/CSRF katmanını yazmak,
  panelin kendisinden daha çok iş.

### 4.2 Akış

```
tarayıcı → sorbiapp.com/masa
   └─ Access uygulaması eşleşir (hostname sorbiapp.com, path /masa ve /api/panel)
      ├─ oturum yoksa → <ekip>.cloudflareaccess.com giriş ekranı
      │     → e-posta tek kullanımlık kod (One-time PIN) ya da Google ile giriş
      │     → politika: e-posta == destek@sorbiapp.com (tek kişilik izin listesi)
      │     → CF_Authorization çerezi yazılır, /masa'ya döner
      └─ oturum varsa → istek Pages'a geçer, üstünde iki şey vardır:
            Cookie: CF_Authorization=<JWT>
            Cf-Access-Jwt-Assertion: <JWT>          (doğrulanmalı: başlık adı bu)
            Cf-Access-Authenticated-User-Email: <e-posta>
```

Kritik nokta: **`Cf-Access-Authenticated-User-Email` başlığına tek başına güvenilmez.**
Access'i atlayan (ör. doğrudan `<proje>.pages.dev` adresine giden) bir istek bu başlığı
kendi uydurabilir. Bu yüzden sunucu tarafı:

1. `Cf-Access-Jwt-Assertion` başlığını (yoksa `CF_Authorization` çerezini) alır.
2. JWT'yi `https://<ekip>.cloudflareaccess.com/cdn-cgi/access/certs` adresindeki
   açık anahtarlarla doğrular (RS256). Anahtarlar `caches.default` ya da KV'de
   bir saat önbelleklenir; her istekte ağ çağrısı yapılmaz.
3. `aud` iddiasını, Access uygulamasının **Application Audience (AUD) tag**'i ile
   karşılaştırır (`env.ACCESS_AUD`, secret).
4. `iss`'in `https://<ekip>.cloudflareaccess.com` olduğunu, `exp`'in geçmediğini doğrular.
5. `email` iddiasını `sahip` olarak kullanır; ayrıca `env.MASA_SAHIPLERI`
   (virgülle ayrılmış izin listesi) ile ikinci bir kapı — Access politikası
   yanlışlıkla genişletilirse veri yine kapalı kalır.

Ek olarak `<proje>.pages.dev` adresi ya Access ile aynı şekilde korunmalı ya da
panel uçları `Host` başlığı `sorbiapp.com` değilse 403 dönmeli. Aksi halde Access
kapısının yanından geçen bir yol açık kalır.

> **Doğrulanmalı:** başlık adlarının ve certs yolunun bugünkü tam yazımı;
> Pages projesinin `*.pages.dev` adresinin Access uygulaması kapsamına
> alınıp alınamadığı; Access'in Pages Functions isteklerine (aynı-köken `fetch`)
> çerezle sorunsuz geçip geçmediği.

### 4.3 Ücret

Cloudflare Zero Trust'ın ücretsiz katmanı **50 kullanıcıya kadar** kendi-barındırdığı
uygulamaları korumaya yetiyor; One-time PIN kimlik sağlayıcısı da ücretsiz katmanda
var — **bu iki cümle doğrulanmalı**, Cloudflare fiyatlandırması değişken.
Tek kullanıcılık bir panel her hâlükârda bu sınırın çok altında. Yani öneri,
sitenin "neredeyse sıfır maliyet" durumunu bozmuyor.

D1 tarafı: panel günde birkaç düzine okuma/yazma üretir; D1 ücretsiz katmanının
(5 GB depolama, günlük milyonlarca satır okuma, 100 bin satır yazma mertebesinde —
**rakamlar doğrulanmalı**) yanına bile yaklaşmaz. Maliyet: 0.

### 4.4 Access olmayan ortamda — yerel geliştirme

`wrangler pages dev` Access'in önünde çalışmaz; JWT hiç gelmez. Çözüm:

- `env.MASA_GELISTIRME === '1'` ise (yalnız `.dev.vars` içinde, üretimde asla)
  kimlik `env.MASA_GELISTIRME_EPOSTA` sabitine düşer.
- Bu düşüş **yalnız** `MASA_GELISTIRME` açıkken olur; değişken yoksa kimlik yok,
  401. `|| 'sorbi-secret'` tarzı sessiz varsayılan **yok** — `[[route]].js`'in
  başındaki yorumda yazan ders bu.
- Ek emniyet: geliştirme düşüşü yalnız `request.url` hostname'i `localhost`
  veya `127.0.0.1` ise kabul edilir.

### 4.5 Access'e erişimimiz yoksa — alternatifler

Öncelik sırasıyla:

1. **Cloudflare Access (tercih).** Yukarıdaki.
2. **Tek kullanımlık bağlantı + imzalı çerez.** `env.MASA_SIR` (zorunlu, varsayılansız)
   ile HMAC'lenmiş, 30 günlük, `HttpOnly; Secure; SameSite=Lax` çerez. Giriş:
   panele e-posta yazılır, sunucu kayıtlı adrese 6 haneli kod gönderir
   (e-posta gönderimi için bir servis gerekir → yeni bağımlılık, yeni maliyet).
   `geri-bildirim` ucundaki HMAC deseni zaten var, ama oradaki `|| 'sorbi-secret'`
   yedeği taşınmamalı.
3. **Paylaşılan parola + HMAC oturum.** En basit, en zayıf. Parola `env` sırrında,
   sabit-zamanlı karşılaştırma, hız sınırı, `HttpOnly` çerez. Danışan doğum verisi
   ve seans notu tutan bir panel için **tek başına yeterli değil** — ancak
   Access gelene kadarki geçici köprü olarak, ve panelde gerçek danışan verisi
   yokken kabul edilebilir.
4. **Hiç sunucu yok (bugünkü hâl).** Aşağıdaki §4.6'da anlatılan gizlilik sorunu
   hiç doğmaz. Karşılığı: veri tek tarayıcıda, cihaz değişince kaybolur,
   tarayıcı deposu temizlenince gider.

Seçim 1'e gidilemiyorsa, 3 ile açmak yerine **panelin yayına alınmasını ertelemek**
daha doğru: yarım kimlik, kimliksizden daha tehlikelidir çünkü güven duygusu yaratır.

---

## 5. Veri hassasiyeti ve gizlilik metni

### 5.1 Site şu an ne diyor

`gizlilik.html` (17 Eylül 2026) — "Kısaca" bölümü:

> Doğum tarihiniz, saatiniz ve yeriniz bu sitede **tarayıcınızda** hesaplanır;
> sunucumuza gönderilmez.

Ve "Saklama süresi":

> Doğum verisi bizde hiç saklanmaz; yalnızca sizin cihazınızdadır.

`functions/api/[[route]].js` başındaki yorum da aynı ilkeyi savunuyor:
`/api/profile` ucu tam olarak bu cümleyi bozduğu için sökülmüş.

### 5.2 Panel bu cümleyi bozuyor mu?

**Hayır — ama yalnız metin doğru ayrılırsa.**

Kritik ayrım: panelde saklanan veri **ziyaretçinin kendi verisi değil**,
astrologun kendi danışanlarının verisi. Ziyaretçi açısından "sizin doğum veriniz
sunucumuza gitmez" cümlesi aynen doğru kalır. Bozulan şey cümlenin mutlak okunuşu:
"Sorbi sunucusunda hiç doğum verisi yoktur."

Dolayısıyla gizlilik metni **üç kişiyi** ayırmalı:

| Kim | Verisi nerede | Sorumlu |
|---|---|---|
| Site ziyaretçisi | yalnız kendi tarayıcısında | — (veri işlenmiyor) |
| Panel kullanıcısı (astrolog) | e-postası ve kayıtları Sorbi sunucusunda | Sorbi, veri sorumlusu |
| Panelde dosyası açılan danışan | doğum verisi + seans notu Sorbi sunucusunda | **astrolog veri sorumlusu, Sorbi veri işleyen** |

Üçüncü satır işin göbeği: seans notu KVKK'nın "özel nitelikli kişisel veri"
sınırına yaklaşabilir (sağlık, inanç, cinsel hayat başlıkları bir danışanlık
notunda kolayca geçer). Sorbi bu veriyi kendi amacı için kullanmaz, yalnız
astrolog adına saklar — bu, işleyen (veri işleyen) rolüdür.

### 5.3 Gizlilik metninde ne değişmeli

`gizlilik.html` içine **yeni bir bölüm** ("Astrolog Masası (panel)") ve
mevcut iki cümleye **kapsam eki**:

1. "Kısaca" bloğuna ek cümle:
   > Bu, siteyi ziyaret eden herkes için geçerlidir. Kapalı bir panel olan
   > Astrolog Masası'nı kullanan astrologların kaydettiği danışan dosyaları
   > ayrı kurallara tabidir; aşağıda anlatılıyor.

2. "Hangi verileri işliyoruz" listesine yeni madde:
   > **Astrolog Masası kayıtları.** Girişi kapalı olan bu panele yalnız yetkili
   > astrolog erişir. Panelde tutulan veriler: danışanın adı ya da rumuzu, doğum
   > tarihi, saati ve yeri, etiketler, dosya notu ve seans kayıtları (tarih, tür,
   > özet, not). Bu veriler Cloudflare D1 veritabanında saklanır. Panele giriş
   > Cloudflare Access ile yapılır; bu kapsamda giriş yapan astrologun e-posta
   > adresi işlenir.

3. "Saklama süresi" maddesi düzeltilmeli — bugünkü hâli mutlak:
   > Doğum verisi bizde hiç saklanmaz; yalnızca sizin cihazınızdadır.
   >
   > → **Site ziyaretçilerinin** doğum verisi bizde hiç saklanmaz; yalnız kendi
   > cihazlarındadır. Astrolog Masası'nda kayıtlı danışan dosyaları, dosyayı açan
   > astrolog silene kadar ya da panel hesabı kapandıktan sonra **en geç 30 gün**
   > içinde silinir. Arşivlenen dosyalar da bu süreye tabidir.

4. Yeni madde — **roller**:
   > Astrolog Masası'nda danışan verisinin veri sorumlusu, dosyayı açan
   > astrologdur. Sorbi bu veriyi yalnız astrolog adına barındırır ve kendi
   > amaçları için kullanmaz, analiz etmez, üçüncü kişilere aktarmaz.

5. Yeni madde — **silme hakkı**:
   > Bir danışan, hakkında tutulan dosyanın silinmesini isteyebilir. Talep
   > öncelikle dosyayı açan astrologa yapılır; doğrudan destek@sorbiapp.com
   > adresine de iletilebilir. Silme talebi en geç 30 gün içinde yerine getirilir
   > ve kayıt geri alınamaz biçimde silinir (arşivleme silme sayılmaz).

6. Yeni madde — **veri yeri**:
   > Panel verileri Cloudflare altyapısında (D1) saklanır ve yurt dışındaki
   > sunucularda işlenebilir. KVKK'nın yurt dışına aktarım hükümleri bu aktarım
   > için geçerlidir.

7. "Yürürlük tarihi" güncellenir ve "Değişiklikler" maddesindeki "önemli
   değişikliklerde sitede ayrıca duyurulur" taahhüdü yerine getirilir.

**Ayrıca panelin kendi içinde olması gerekenler** (metin değil, arayüz):
- Yeni danışan formunda, bugünkü "Doğum verisi kimlik belirleyicidir — yalnız bu
  panelde durur" cümlesi **artık yanlış** → "Bu dosya Sorbi sunucusunda saklanır.
  Danışanına bu kaydı tuttuğunu söylemiş olmalısın."
- Üst şerit "Veriler bu tarayıcıda kalır" → kaldırılır.
- Seans notu alanındaki "panel dışında hiçbir uçtan yayınlanmaz" cümlesi doğru
  kalır ama zayıf; "sunucuda saklanır, yalnız senin hesabın görür" daha dürüst.
- Danışan dosyası ekranına "Bu dosyayı kalıcı sil" eylemi — silme hakkının
  teknik karşılığı arayüzde olmalı, yoksa madde 5 kâğıt üstünde kalır.

**Hukuk tavsiyesi değil:** yukarıdakiler *neyin yazılması gerektiği*.
Metnin nihai hâli ve aydınlatma yükümlülüğünün kimde olduğu bir hukukçuya
okutulmalı — özellikle Sorbi'nin "veri işleyen" konumu ve astrologla arasında
bir veri işleme sözleşmesi gerekip gerekmediği.

---

## 6. Göç — bugün localStorage'da veri varsa

Bugünkü kullanıcı kitlesi pratikte tek kişi ve verinin çoğu `tohumla()`'nın
yazdığı iki örnek dosya. Yine de veri kaybı kabul edilemez.

**Plan:**

1. Sunucu uçları yayına girdiğinde `masa.html` açılışta iki şeyi birden yapar:
   - `GET /api/panel/danisanlar` (sunucu verisi)
   - `localStorage.sorbiMasa_v1` okuması (yerel veri)
2. Yerel veride **örnek olmayan** kayıt varsa (id 1, 2, 3 ve `ad`'ı
   `'Örnek — '` ile başlayanlar hariç) tek seferlik bir şerit çıkar:
   > Bu tarayıcıda N danışan dosyası duruyor. Sunucudaki hesabına taşımak ister misin?
   > [Taşı] [Önce yedek al] [Sonra sor]
3. "Taşı" → `POST /api/panel/goc` ile tüm nesne gönderilir. Sunucu:
   - her danışanı `INSERT` eder, yeni `id`'yi eski `id` ile eşler
     (`{eski_id: yeni_id}` sözlüğü),
   - seansları bu sözlükle yeni `danisan_id`'ye bağlar,
   - `arsiv:1` olanları arşiv olarak aktarır,
   - aynı `sahip` + `ad` + `dogum_tarih` üçlüsü zaten varsa o kaydı **atlar**
     (tekrarlı tıklama iki kopya yaratmasın), `atlanan` sayacına ekler.
4. Başarılıysa yerel anahtar **silinmez**, `sorbiMasa_v1_gocmus` olarak yeniden
   adlandırılır ve şerit bir daha çıkmaz. Kullanıcı isterse tarayıcı deposundan
   kendisi siler. Bir hafta sonra ayrı bir sürümde temizlik.
5. Göç başarısızsa hiçbir şey silinmez, hata gösterilir, "Yedek al" düğmesi öne çıkar.
6. **Her durumda**, sunucuya geçiş sürümü yayına alınmadan önce mevcut
   `disaBtn` ("Yedek al") ile bir JSON yedeği alınır ve dışarıda saklanır.
   Bu, tek ve gerçek güvenlik ağı.

Ters yön de kalmalı: `GET /api/panel/disa` aynı `sorbiMasa_v1` biçiminde JSON
döndürsün ki yedek dosyaları tek biçim olsun ve kullanıcı istediği an
verisini yanına alabilsin (KVKK "veri taşınabilirliği" tarafına da denk gelir).

---

## 7. İş kırılımı

| # | Adım | Ne yapılır | Risk | Bağımlılık |
|---|---|---|---|---|
| 1 | **Access'i kur ve doğrula** | Zero Trust ekip alanı, `sorbiapp.com/masa` ve `sorbiapp.com/api/panel/*` için Access uygulaması, tek kişilik izin listesi, One-time PIN. AUD tag'i not edilir. `*.pages.dev` adresi de kapsanır ya da kapatılır. | **Yüksek** — ücretsiz katman sınırı ve Pages ile etkileşimi burada doğrulanır. Çalışmazsa §4.5'e düşülür, tasarımın geri kalanı ayakta kalır. | — |
| 2 | **Şema** | `schema.sql`'e iki tablo + iki indeks eklenir; mevcut dosyanın yorum stiliyle. Üretim D1'de `wrangler d1 execute` ile uygulanır. | Düşük | — |
| 3 | **Kimlik doğrulama modülü** | `functions/api/panel/` içine JWT doğrulama: certs çekme + önbellek, `aud`/`iss`/`exp` kontrolü, izin listesi, yerel geliştirme düşüşü. Tek başına test edilir (`/api/panel/kim`). | **Yüksek** — işin güvenlik göbeği. Varsayılan sır yok, başlığa körü körüne güven yok. | 1, 2 |
| 4 | **Panel uçları** | §3.2'deki 1–8 numaralı uçlar, `geri-bildirim/[[route]].js` stilinde, `detail:` sızıntısı olmadan. | Orta | 3 |
| 5 | **İstemci geçişi** | `masa.html` içinde sahte `api()` → gerçek `fetch`; 401 işleme; `tohumla()` kaldırma; ölü `TOK` / `.giris` / moderasyon CSS temizliği; tema düğmesi için `.sbnav` sorununun düzeltilmesi; yanlış olan "tarayıcında kalır" metinleri. | Orta — `api()` sözleşmesi aynı kaldığı için çağrı yerleri değişmiyor; asıl iş metin ve temizlik. | 4 |
| 6 | **Göç + dışa aktarım** | `/api/panel/goc`, `/api/panel/disa`; açılış şeridi; `sorbiMasa_v1_gocmus` yeniden adlandırma. | Orta — **veri kaybı riski burada**. Adım 5'ten önce manuel yedek zorunlu. | 4, 5 |
| 7 | **Gizlilik metni + kalıcı silme** | `gizlilik.html`'e §5.3'teki altı değişiklik; yürürlük tarihi; panelde "kalıcı sil" eylemi ve `DELETE …&kalici=1` ucu. | Düşük teknik, **yüksek sorumluluk** — panelde gerçek danışan verisi tutulmaya başlamadan önce bitmeli. | 4 |
| 8 | **Yayın kararı** | Panel hâlâ `noindex` ve bağlantısız kalır mı? Öneri: **evet kalsın.** Access zaten kapıda; ayrıca bağlantısız olması kapıyı hiç çalınmaz yapar. `robots.txt` ve `sitemap.xml` değişmez. | Düşük | 1–7 |

**Sıra önerisi:** 1 → 2 → 3 → (7 ile paralel) 4 → 5 → 6 → 8.
Adım 1 kapı görevi görüyor: orada Access ücretsiz katmanda Pages ile çalışmıyorsa
bütün tasarım 4.5'teki alternatiflerden birine kayar ve işin büyüklüğü değişir.
Adım 7, adım 6'dan önce bitmeli — gerçek danışan verisi sunucuya taşınmadan
metnin doğru olması gerekiyor.

**Tahmini büyüklük:** 3–4 ile 5–6 birer oturumluk; 1 ve 7 daha çok karar,
az kod. Toplam maliyet artışı: **0 TL** (Access ücretsiz katman ve D1 ücretsiz
katman varsayımıyla — her ikisi de adım 1'de doğrulanmalı).

---

## 8. Doğrulanacaklar listesi

- [ ] Cloudflare Zero Trust ücretsiz katman kullanıcı sınırı ve One-time PIN'in
      ücretsiz katmanda bulunup bulunmadığı.
- [ ] Access uygulamasının Pages **Functions** yollarını (`/api/panel/*`)
      kapsayıp kapsamadığı ve aynı-köken `fetch`'in `CF_Authorization` çerezini taşıdığı.
- [ ] `Cf-Access-Jwt-Assertion` başlık adının ve
      `/cdn-cgi/access/certs` yolunun bugünkü tam yazımı.
- [ ] `<proje>.pages.dev` adresinin Access kapsamına alınabilirliği
      (alınamazsa `Host` kontrolü zorunlu).
- [ ] D1 ücretsiz katman okuma/yazma/depolama sınırlarının güncel rakamları.
- [ ] SQLite `LOWER()` ile Türkçe İ/ı davranışı — `ad_arama` kolonunun
      istemcide mi sunucuda mı üretileceği buna bağlı.
