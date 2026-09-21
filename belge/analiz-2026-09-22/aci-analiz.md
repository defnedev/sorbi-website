# Açı katmanı — ölçüm, gösterim, tasarım

Ortam: yerel statik sunucu (`python3 -m http.server`), Playwright/Chromium 1194,
390×844 @3x, `Emulation.setCPUThrottlingRate = 4`, üçüncü taraf istekleri
(reklam, sodar) engellendi — ölçülen yalnız sitenin kendi maliyeti.
Test doğumu: 1990-06-15 14:30 İstanbul, Placidus. localStorage'a `sorbi_birth`
önceden yazıldı ki hesap açılışta kendiliğinden koşsun.

---

## BÖLÜM 1 · BUGÜN NE HESAPLANIYOR, NE KADAR SÜRÜYOR

### 1.1 Hangi sayfa gerçekten harita hesaplıyor

İstenen 13 sayfanın hepsi doğrulandı. Üçü hiç harita hesaplamıyor, dördü yalnız
tek bir konum çıkarıyor, altısı tam hesap yapıyor. Açı **çizgisi** yalnız dört
sayfada var.

| Sayfa | Motor | Açı hesabı | Açı çizgisi | Not |
|---|---|---|---|---|
| index.html | dinamik: astronomy + sorbi-chart + **sorbi-astro** + sorbi-gokyuzu | `within` + `cross` | var (417 çizgi) | ayrıca canlı gökyüzü tuvali |
| dogum-haritasi-hesaplama.html | astronomy + **sayfa içi kendi motoru** + sorbi-chart | sayfa içi `ASPECTS` (yalnız 5 majör) | var (384 çizgi) | kendi çark çizici, ortak temayı kullanmıyor |
| detayli-dogum-haritasi.html | astronomy + **sorbi-eph** + sayfa içi tam motor + sorbi-chart | `aspectsWithin` / `aspectsCross`, minör seçmeli | var (538 çizgi) | en ağır sayfa |
| seni-taniyorum.html | astronomy + **sorbi-astro** + sorbi-chart (+9 modül) | `within` | forma bağlı | 15 modül yüklüyor |
| soru-sor.html | dinamik: astronomy + sorbi-astro + sorbi-chart | `now` + `chart` + `within` + `cross` | var (407 çizgi) | horary |
| masa.html | dinamik, gecikmeli | 2× `chart`, 2× `within`, 3× `cross` | çağrıldığında | danışan masası, girişte hesap yok |
| bugun.html | astronomy (yalnız konum) | **yok** | yok | açı adı bile geçmiyor |
| yukselen-tahmini.html | sorbi-astro (yalnız ASC) | yok | yok | |
| ay-burcu-hesaplama.html | astronomy (yalnız Ay) | yok | yok | |
| yukselen-burc-hesaplama.html | astronomy (yalnız ASC) | yok | yok | |
| astrokartografi.html | astronomy + Leaflet | yok | yok | harita çizgileri açı değil |
| uygun-gun-secimi.html | astronomy | yok | yok | açı adı geçmiyor |
| burc-uyumu.html | sorbi-uyum + sorbi-gosteri | **burç-burç** açısı (gezegen yok) | yok | astronomy'yi hiç yüklemiyor |

Önemli bulgu: açı mantığı **üç ayrı yerde** yazılı —
`sorbi-astro.js` (10 açı türü, ışık/ağır gezegen orb çarpanlı),
`sorbi-chart.js` içindeki `ASPMAP` (7 tür, eski sayfa nesnelerini uyarlamak
için) ve `dogum-haritasi-hesaplama.html` içindeki satır içi `ASPECTS` (5 tür,
orb çarpanı yok). Aynı doğum için bu üç yol farklı açı listesi üretir.

### 1.2 Sayfa açılış ölçümleri (4× CPU, reklamlar kapalı)

| Sayfa | Kendi JS'i (KB, ham) | JS ağ+bekleme (ms) | DCL (ms) | load (ms) | TBT (ms) | en uzun görev (ms) |
|---|---|---|---|---|---|---|
| index | 237 | 443 | 327 | 1229 | **667** | 553 |
| dogum-haritasi-hesaplama | 186 | 551 | 372 | 415 | 346 | 324 |
| detayli-dogum-haritasi | **391** | 354 | 478 | 543 | 376 | 198 |
| seni-taniyorum | 304 | **2897** | 505 | 534 | 336 | 184 |
| soru-sor | 202 | 255 | 355 | 879 | 442 | 351 |
| bugun | 120 | 260 | 245 | 271 | 349 | 399 |
| yukselen-tahmini | 143 | 210 | 198 | 258 | 12 | 62 |
| masa | 7 | 65 | 222 | 274 | 30 | 80 |
| ay-burcu-hesaplama | 139 | 160 | 210 | 243 | 37 | 87 |
| yukselen-burc-hesaplama | 139 | 272 | 281 | 307 | 51 | 101 |
| astrokartografi | 139 | 350 | 283 | 313 | 97 | 147 |
| uygun-gun-secimi | 133 | 176 | 263 | 299 | 10 | 60 |
| burc-uyumu | 115 | 880 | 505 | 604 | 232 | 253 |

(seni-taniyorum'un 2897 ms'i 15 ayrı dosyanın sıralı beklemesinin toplamı;
paralel indirildikleri için duvar saatine birebir yansımıyor, ama istek sayısı
tek başına bir maliyet.)

### 1.3 Dosya başına indirme + ayrıştırma (4× CPU, ayrı ölçüm)

| Dosya | ham KB | gzip KB | fetch ms | **eval ms** |
|---|---|---|---|---|
| astronomy.browser.min.js | 114 | 46 | 22.1 | **16.9** |
| sorbi-eph.js | 206 | 70 | 15.8 | 1.2 |
| sorbi-chart.js | 46 | 17 | 14.3 | 7.7 |
| sorbi-kart.js | 23 | — | 24.6 | 7.9 |
| sorbi-astro.js | 16 | 6 | 11.5 | 4.2 |
| sorbi-sohbet.js | 22 | — | 13.9 | 2.0 |
| sorbi-anlat.js | 23 | 9 | 14.2 | 1.8 |
| sorbi-yildiz.js | 14 | — | 14.3 | 0.5 |

sorbi-eph.js 206 KB ama eval'i 1.2 ms — çünkü içi tek bir dize sabiti. Bedeli
ayrıştırmada değil, çözmede: `decodeEph` 50.235 örneği 36'lık tabandan açıyor,
profilde **20.9 ms** (detayli sayfası).

### 1.4 Mikro ölçüm — hesabın hangi parçası pahalı (4× CPU, medyan/25 koşu)

| İşlem | medyan | min | maks |
|---|---|---|---|
| `SorbiAstro.chart` — **ilk çağrı (soğuk)** | **117.2 ms** | — | — |
| `SorbiAstro.chart` — ısınmış | 2.8 ms | 1.3 | 20.6 |
| Astronomy: 9 gezegen + Ay konumu | 2.3 ms | 0.3 | 9.4 |
| **`within` — 15 nokta, yalnız majör (34 açı)** | **0.1 ms** | 0.0 | 0.4 |
| **`within` — minörlerle (43 açı)** | **0.1 ms** | 0.0 | 3.4 |
| **`cross` — transit×natal (45 açı)** | **0.0 ms** | 0.0 | 0.1 |
| `SorbiChart.draw` — 100 KB SVG dizesi üretimi | 1.4 ms | 0.5 | 4.3 |
| **SVG'yi DOM'a basmak + yerleşim** | **43.9 ms** | 11.2 | 104.7 |

### 1.5 CPU profili — gerçek sayfa açılışında payların dağılımı

| Sayfa | açı ile ilişkili | efemeris/astronomi | çizim | en pahalı tek kare |
|---|---|---|---|---|
| detayli-dogum-haritasi | **1.9 ms (%0,0)** | 158.5 ms (%3,7) | 74.7 ms | `renderAll` 55 ms |
| dogum-haritasi-hesaplama | **0.0 ms (%0,0)** | 198.8 ms (%5,1) | 26.5 ms | hesapla düğmesi 139 ms |
| index | **5.1 ms (%0,1)** | 405.7 ms (%7,5) | 476.6 ms | `ciz` (gökyüzü) 441 ms |
| seni-taniyorum | **0.0 ms (%0,0)** | 151.9 ms (%3,8) | — | sayfa içi `f` 54 ms |

### 1.6 Net yanıt: açı hesabı pahalı mı?

**Hayır. Ölçülebilir düzeyde bedava.** 15 nokta arasındaki 105 çiftin 10 açı
türüne karşı sınanması **0,1 ms** sürüyor — dört kat yavaşlatılmış bir telefon
CPU'sunda. Aynı sayfada efemeris 150–400 ms, SVG'yi DOM'a basmak 44 ms, ilk
`chart()` çağrısı tek başına 117 ms. Açı hesabı, harita hesabının **binde
birinden az**ı.

Endişe yanlış yerde durmuyor ama yanlış şeyi gösteriyor. Asıl maliyetler,
büyükten küçüğe:

1. **Script bayt ve ayrıştırma** — 186–391 KB kendi JS'i; `astronomy.browser.min.js`
   tek başına 114 KB / 17 ms eval, her sayfada.
2. **Soğuk ilk hesap** — 117 ms; içinde efemeris tablosu çözümü (21 ms) ve
   JIT ısınması var.
3. **SVG'yi DOM'a basmak** — 100 KB'lık dize, 44 ms yerleşim (en kötü 105 ms).
4. **index'teki gökyüzü tuvali** — 441 ms, sayfadaki en pahalı tek iş; açıyla
   hiç ilgisi yok.

Dolayısıyla "her hesaplamada hesaplanmasın" şartı **açı hesabı için gereksiz,
açıklama METNİ için kesinlikle gerekli**. Bugün açıklama yok; eklenecek olan
şey 15–60 KB metin ve onu haritaya eşleyen kod. Onu kritik yola koymak, bugün
ölçülen en pahalı üç kalemin yanına dördüncüyü eklemek olur. Şart doğru; yalnız
hedefi açı hesabı değil, açıklama katmanı.

---

## BÖLÜM 2 · AÇI GÖSTERİMİ BUGÜN NE HALDE

### 2.1 sorbi-chart.js çizgiyi nasıl çiziyor

`sorbi-chart.js:361-373`:

```
var tight = 1 - min(1, x.abs / (x.as.orb * 1.4));
var w  = T.flat ? (major ? .8+tight*.7 : .7) : (major ? .55+tight*1.25 : .35+tight*.4);
var op = T.flat ? (major ? .55+tight*.45 : .55) : (major ? .45+tight*.5  : .32+tight*.33);
stroke = T.asp[x.as.cls];  dasharray = major ? yok : "3,3"
```

- **Renk yalnız dört sınıfa göre**: `a-maj`, `a-hard`, `a-soft`, `a-min`.
- **Kalınlık ve saydamlık orba göre**: dar orb daha kalın ve daha opak — bu
  kısım doğru çalışıyor, tek sürekli değişken bu.
- **Kesik çizgi yalnız majör/minör ayrımı için** (`3,3`), açı türü için değil.
- **Kavuşum hiç çizilmiyor** (`if(x.as.a===0) return;`). Sonuç: `a-maj` rengi
  tanımlı ama üç temada da **ölü kod** — `a-maj` sınıfının tek üyesi kavuşum.
- Dış çember (transit) kipinde minörler tamamen atlanıyor.

Ayırt edilebilirlik tablosu:

| Açı | Sınıf | Gece temasında renk | Ayırt edilebilir mi |
|---|---|---|---|
| Kavuşum 0° | a-maj | — | çizilmiyor |
| Kare 90° | a-hard | `rgba(227,166,146,.5)` | **Karşıt'tan ayırt edilemez** |
| Karşıt 180° | a-hard | `rgba(227,166,146,.5)` | **Kare'den ayırt edilemez** |
| Üçgen 120° | a-soft | `rgba(165,163,174,.5)` | **Altmışlık'tan ayırt edilemez** |
| Altmışlık 60° | a-soft | `rgba(165,163,174,.5)` | **Üçgen'den ayırt edilemez** |
| Yüzelli/Otuzluk/Yarım kare/Buçuk kare/Beşlik | a-min | `rgba(165,163,174,.24)` + kesik | beşi de birbirinin aynı |

**Beş majör açı ekranda iki görünüme iniyor.** Geometriden (çizginin uzunluğu,
uçlarının nereye değdiği) çıkarılabilir, ama çizginin kendisi söylemiyor.

Ek olarak `dogum-haritasi-hesaplama.html:443` kendi renk tablosunu taşıyor:
Üçgen `#E3A692` w1.8, Kare `#E3A692` w1.7, Karşıt `#E3A692` w1.5, Kavuşum
`#E3A692` w1.3 — dördü **aynı renk**, yalnız 0,2–0,5 px kalınlık farkıyla; ve
burada Üçgen (yumuşak) ile Kare (sert) aynı renkte, ortak temanın tam tersi.

### 2.2 Kontrast — ölçülen rakamlar

Not: görevde geçen `#0B0F14` bu sitede yok. Gerçek koyu zemin **`#0B0810`**
(`index.html:218`, `--bg`). İkisi arasındaki kontrast 1,03 — pratikte aynı
renk, aşağıdaki sonuçlar her ikisi için de geçerli.

İkinci not: **çark sayfanın tersi temayı kullanıyor** (`sorbi-chart.js:215`).
Site varsayılanı koyu olduğu için bugün kullanıcıların gördüğü çark `paper`,
yani `#F2EFE9` açık zeminli bir kart. `night` teması ancak kullanıcı gündüz
kipine geçince görünüyor. Her ikisi de ölçüldü.

Etkin alfa = `stroke` rengindeki alfa × `opacity` niteliği. Orb daraldıkça
`opacity` büyüdüğü için aralık verildi.

| Tema | Sınıf | Etkin alfa | **Kontrast (zemine karşı)** | WCAG 3:1 |
|---|---|---|---|---|
| night (#0B0810) | a-hard — Kare/Karşıt | 0,225 – 0,475 | **1,50 – 2,89** | **geçmiyor** |
| night | a-soft — Üçgen/Altmışlık | 0,225 – 0,475 | **1,43 – 2,58** | **geçmiyor** |
| night | a-min — minörler | 0,077 – 0,156 | **1,09 – 1,24** | **geçmiyor** |
| night | a-maj — kavuşum (çizilmiyor) | 0,189 – 0,399 | 1,61 – 3,41 | ölü kod |
| paper (#F2EFE9) | a-hard | 0,198 – 0,418 | **1,12 – 1,27** | **geçmiyor** |
| paper | a-soft | 0,180 – 0,380 | **1,13 – 1,31** | **geçmiyor** |
| paper | a-min | 0,051 – 0,104 | **1,11 – 1,25** | **geçmiyor** |
| white | a-hard | 0,55 – 1,0 | 1,37 – 1,81 | geçmiyor |
| white | a-soft | 0,55 – 1,0 | 1,49 – 2,17 | geçmiyor |

**Hiçbir temada, hiçbir açı çizgisi 3:1 eşiğini geçmiyor.** Bugün kullanıcının
gördüğü tema (paper) en kötüsü: en dar orblu, en kalın çizgi bile **1,31**.
Karşılaştırma: aynı sayfadaki ikincil metin `--mut` (#A5A3AE) koyu zeminde
**8,00**. Yani açı çizgileri, sitedeki en soluk metinden altı kat daha soluk.

### 2.3 Ekran görüntüsü — bakıldı

`th-night.png`, `th-paper.png`, `aci-detayli.png` (390 px genişlikte, 3×).

- Gece temasında çarkın ortası bir örümcek ağı: iki renk tonu (somon/gri)
  birbirine karışıyor, minörler zemine gömülü, hiçbiri okunmuyor.
- Paper temasında (bugün varsayılan) çizgiler kâğıt üstünde soluk bir hayalet;
  telefon boyunda 335 px'e sıkıştırılınca Ay–Satürn ile Venüs–Plüton çizgisini
  gözle ayırmak mümkün değil.
- Hiçbir çizginin yanında ne açı adı ne derece yazıyor. Tablo ayrı yerde
  (`detayli-dogum-haritasi.html:1265-1280`) ve tabloda da **yalnız** glif, ad,
  orb ve "yaklaşan/ayrılan" var — **ne anlama geldiği yazmıyor.** Kurucunun
  (a) şıkkı birebir doğrulandı.

### 2.4 Tasarım sisteminde açı belirteci var mı

**Yok.** Site CSS değişkenleri (`index.html:218-223`) yalnız
`--bg --ink --mut --dim --acc` ve bunların rgb ikizleri. Açı için tek bir
belirteç yok. Açı renkleri iki yerde gömülü:

1. `sorbi-chart.js:61-100` — `THEMES.{white,paper,night}.asp` sözlükleri.
2. `dogum-haritasi-hesaplama.html:443` — sayfaya gömülü ayrı tablo.

Tema sözlükleri `--acc` (#E3A692) ve `--mut` (#A5A3AE) değerlerini **sayı
olarak kopyalıyor**; değişken değişirse çark değişmez. Yani açı renkleri
tasarım sisteminin dışında, iki kopya hâlinde duruyor.

---

## BÖLÜM 3 · AÇIKLAMA KATMANI TASARIMI

### 3.1 İçerik nereden gelecek — korpus zaten var

Sitede yok, ama **AstroMotor korpusu mevcut** ve `tools/kitapcik.mjs:18-19`
onu bugün kullanıyor. Konum: `_gecici-korpus/` (sitenin dışında, geçici
yükleme). Dört dosya:

| Dosya | Üst anahtar | Alt kayıt | ham | **gzip** |
|---|---|---|---|---|
| `natal_aspects.json` | 5 açı türü | 164 (5 × ~45 gezegen çifti + `_description`) | 17,6 KB | **4,7 KB** |
| `natal_planets_in_signs.json` | 12 gezegen | 144 (12 × 12) | 17,8 KB | **5,6 KB** |
| `natal_planets_in_houses.json` | 10 gezegen | 120 (10 × 12) | 13,6 KB | **4,7 KB** |
| `life_areas.json` | 12 ev | 72 | 9,3 KB | **3,1 KB** |
| **toplam** | | **500 kayıt** | 58 KB | **15,5 KB** |

Biçim örneği: `natal_aspects["Kare"]["Güneş-Satürn"]` → *"Özgüven zorlukları ve
otorite çatışması. Sert dersler ama derin bilgelik."*
Her açı türünün ayrıca bir `_description` alanı var: *"İki gezegenin enerjisi
natal haritada birleşmiş — hayat boyu güçlü bir tema"* — bu tam olarak
kurucunun istediği "açının ne işe yaradığı" metni.

Eksikler (doldurulması gereken):
- Açı türü olarak yalnız 5 majör var; sitedeki motor 10 tür tanıyor. Minörler
  (Yüzelli, Otuzluk, Yarım kare, Buçuk kare, Beşlik) yok.
- **Ad uyuşmazlığı**: korpusta `Altıgen`, sitede `Altmışlık`. Bir eşleme
  tablosu gerekiyor, yoksa altmışlık açıklaması hiç bulunamaz.
- Yalnız 10 klasik gezegen; Chiron, Lilith, düğümler, ASC/MC açıları boşta —
  oysa `sorbi-astro.js` 15 nokta arasında açı üretiyor (test haritasında 34
  majör açının bir bölümü bu noktaları içeriyor).
- Gezegen çifti anahtarları tek yönlü (`Güneş-Satürn` var, `Satürn-Güneş`
  yok) — `kitapcik.mjs:145` bunu iki anahtar deneyerek çözüyor; aynı davranış
  tarayıcıda da gerekli.

### 3.2 Veri biçimi — kombinasyon patlamasına karşı

Sayım servisinin dersi (`sorbi-sayim.js` başlık yorumu, madde 2): *"İndirilen
bayt örneklem büyüklüğünden BAĞIMSIZDIR. Sayım dosyası örneklemi değil,
KATALOĞU taşır."* Aynı kural burada da geçerli ve şans eseri korpus zaten bu
biçimde.

Kaçınılması gereken: gezegen × burç × ev × açı türü çarpımını önceden yazmak.
12 × 12 × 12 × 15 = **311.040** hücre. Her hücre 200 bayt olsa 62 MB.

Doğru biçim — **dik eksenler, çarpım değil toplam**:

```
aci/tur.json      →  15 kayıt   ("Kare nedir, ne işe yarar")
aci/cift.json     →  15 × ~105 = seyrek; bugün 164 dolu kayıt
gezegen/burc.json →  12 × 12  = 144
gezegen/ev.json   →  12 × 12  = 144
ev/alan.json      →  12
```

Toplam ~465 satır, bugünkü ölçümle **15,5 KB gzip**. Eksenler bağımsız kaldığı
sürece bayt, kombinasyon sayısına değil **katalog boyutuna** bağlı kalır: yeni
bir açı türü eklemek +1 satır, yeni bir gezegen eklemek +12 satır. Cümle,
okunurken birleşir:

> Kare (tür metni) · Güneş–Satürn (çift metni) · Satürn 3. evde (ev metni)

Katalog büyürse sayım servisindeki `bolum` düzeni aynen uygulanır: kök dosyaya
`{ "bolum": { "cift": "/aci-cift.json", "tur": "/aci-tur.json" } }` eklenir,
servis yalnız sorulan öneki çeker, **sayfa kodu değişmez**.

Dosyalar `?v=` sürümüyle servis edilmeli (sayım servisi maddesi 5) ki içerik
değişince tarayıcı yenisini çeksin.

### 3.3 Tembel yükleme — hangi anda

**Kullanıcı bir açıya dokunduğunda.** Bölüm görünür olduğunda değil.

Gerekçe ölçümden: açıklama katmanı 15,5 KB gzip + JSON.parse. Bugün
`detayli-dogum-haritasi` zaten 391 KB kendi JS'i taşıyor ve ilk hesap 117 ms
sürüyor. "Bölüm görünür olunca" kuralı, kullanıcı açı tablosuna kaydırdığı anda
—yani sayfanın en yoğun olduğu anda— bir fetch + parse daha ekler. Oysa açı
tablosunda 34 satır var; kullanıcı bunların hepsini değil, bir ikisini merak
eder.

Somut düzen:

- Her açı satırı ve her çark çizgisi `data-aci="Kare" data-cift="sun-sat"`
  taşır. **Sıfır ek bayt** — veri zaten hesapta var.
- İlk dokunuşta `SorbiAnlam.getir('aci','Kare','sun-sat')` çağrılır. Servis:
  tembel + tek uçuş + modül içi önbellek (sayım servisi maddesi 6 ile birebir
  aynı desen — o kod zaten yazılı, kopyalanacak şey mimari).
- İlk dokunuş: ~5 KB gzip indir + parse (<5 ms). Sonraki her dokunuş: 0 ağ.
- Kullanıcı açı tablosuna hiç dokunmazsa: **0 bayt, 0 ms**. Bugünkü sayfa
  aynen bugünkü hızında kalır.
- İsteğe bağlı ısıtma: tablo görünür olduğunda `requestIdleCallback` içinde
  `<link rel="prefetch">` — ana iş parçacığını bloklamadan, ağ boştayken.

### 3.4 Üyelik kapısı — bugün ne var, en ucuz gerçekçi yol ne

Bugünkü durum, doğrulandı: **hesap yok, giriş yok, oturum yok.** Her şey
localStorage. `functions/api/[[route]].js` 2026-09-19'da bilinçli olarak
budanmış — randevu, ödeme, yönetici paneli ve `/api/profile` sökülmüş; gerekçe
dosyanın başında yazılı: *"gizlilik politikası 'bu veriler sunucumuza
gönderilmez ve tarafımızca saklanmaz' diyor."* Geriye iki uç kalmış: anonim
sayaç ve e-posta listesi.

Eldeki altyapı: **Cloudflare Pages + D1 bağlı** (`wrangler.toml`, `env.DB`),
`liste` tablosu (eposta UNIQUE) ve `IP_TUZU` ile HMAC-SHA256 hız sınırı zaten
çalışıyor. Yani "sıfırdan üyelik" değil, var olanın üstüne bir oturum katmanı.

**En ucuz gerçekçi yol — e-posta sihirli bağlantı, parolasız:**

1. `POST /api/uye/iste` — e-posta alır, `liste` tablosuna yazar (zaten var),
   HMAC ile imzalı 15 dakikalık tek kullanımlık jeton üretir, e-posta yollar.
2. `GET /api/uye/gir?j=…` — jetonu doğrular, **HttpOnly + Secure + SameSite=Lax**
   imzalı çerez basar (30 gün). Sunucuda yeni tablo gerekmez: çerezin kendisi
   `eposta|bitiş|HMAC(sır)` taşır. Doğum verisi sunucuya **hiç gitmez** —
   gizlilik politikası bozulmaz.
3. `GET /api/anlam/*` — çerez yoksa 401, varsa JSON'u döner. Açıklama dosyaları
   `/public` altında değil, Function arkasında durur.

Maliyet:

| Kalem | Ücretsiz sınır | Sorbi'nin ihtiyacı | Aylık |
|---|---|---|---|
| Pages Functions | 100.000 istek/gün | açıklama + giriş uçları | **0 ₺** |
| D1 | 5 GB, 5M okuma/gün | e-posta listesi (zaten kullanımda) | **0 ₺** |
| E-posta (Resend / MailChannels) | 3.000 mail/ay | giriş bağlantısı | **0 ₺** |
| Sır saklama (Pages secret) | — | `UYE_SIRRI` | **0 ₺** |

**Yinelenen maliyet 0 ₺.** Ödenen şey para değil, üç kalemde karmaşa:

- Bir sır daha (`UYE_SIRRI`) — ve dosyanın kendi kuralı: *"varsayılan bir sır
  bırakılmaz."* Ortam değişkeni yoksa uç **kapanmalı**, sabite düşmemeli.
- Bir e-posta sağlayıcısı bağımlılığı (bugün hiç yok).
- KVKK metninin güncellenmesi: e-posta artık kimlik olarak saklanıyor.

**Daha da ucuz ama daha zayıf alternatif** (sunucu hiç dokunmadan): açıklama
dosyalarını istemciye gönderip localStorage bayrağıyla kapatmak. 0 ₺, 0 kod,
ama DevTools açan herkes içeriği alır. Kurucunun isteği "üyelik gereksin";
istemci tarafı bayrak bunu karşılamıyor — **önerilmiyor**, yalnız bir "önce
e-postanı bırak" akışı olarak (kapı değil, eşik) anlamlı olur.

Ara yol, ilk sürüm için önerilen: **açıklama metinlerinin ilk cümlesi herkese
açık, gerisi Function arkasında.** Kullanıcı ne aldığını görür, SEO korunur,
kapı gerçek kalır.

### 3.5 Kritik yoldan çıkarma — somut

Bugün harita hesabının zinciri:

```
script indir/ayrıştır → chart() [117 ms soğuk] → within() [0,1 ms] → draw() [1,4 ms] → DOM [44 ms]
```

Açıklama katmanı bu zincire **hiç girmemeli**. Somut kurallar:

1. **Ayrı modül, ayrı dosya.** `sorbi-anlam.js`, `sorbi-sayim.js`'in birebir
   deseni: tembel + tek uçuş + modül içi önbellek, hepsi Promise. Hiçbir sayfa
   `<script src>` ile yüklemez; ilk dokunuşta `import()` ile gelir.
2. **Hesap açıklamayı beklemez.** `within()` çıktısı anında tabloya ve çarka
   basılır. Açıklama, satırın yanındaki bir "?" ile çağrılır.
3. **Açıklama hesap üretmez.** Servis yalnız `{tur, cift}` anahtarıyla sözlüğe
   bakar — O(1), efemeris yok, astronomy yüklenmez. Anahtarlar zaten `within()`
   çıktısında duruyor (`x.as.n`, `x.a.k`, `x.b.k`).
4. **Sonuç önbelleği.** Aynı haritanın aynı açısı ikinci kez sorulduğunda ağ da
   parse da yok.
5. **Ayrı ölçüm.** `sorbi-olcum.js`'e `anlam_ilk_dokunus` olayı eklenir; açıklama
   katmanının gerçek maliyeti ayrı izlenir, harita hesabının sayısına karışmaz.
6. **Görsel ipucu bedava.** "Bu açının bir açıklaması var" göstergesi CSS ile
   çizilir; JSON inmeden önce de görünür. Kullanıcı kapının varlığını
   açıklamayı indirmeden görür.

Sonuç: açıklama katmanı eklendiğinde 1.2'deki tablonun **hiçbir sayısı
değişmez**.

### 3.6 Bu analizin yan ürünü: açı gösterimi de düzeltilmeli

Kurucunun üç şartının dışında ama aynı damardan çıkan bulgu: açıklama katmanı
eklenip de çizgiler bugünkü hâlinde kalırsa, kullanıcı "ne anlama geldiğini"
okuyacağı çizgiyi **ekranda bulamaz** (Bölüm 2: hiçbiri 3:1'i geçmiyor, beş
majör açı iki görünüme iniyor). Sıralama önerisi:

1. Açı renklerini tasarım sistemine taşı: `--aci-sert`, `--aci-yumusak`,
   `--aci-kavusum`, `--aci-minor` — `:root` üstünde, gece/gündüz ayrı; tema
   sözlükleri bu değişkenleri okusun, sayı kopyalamasın.
2. Beş majör açıyı beş görünüme ayır: renk **artı** çizgi deseni (kare/karşıt
   düz, üçgen/altmışlık farklı ağırlık, kavuşum kısa bir bağ işareti).
3. Etkin alfayı en az 3:1'e çıkar — gece temasında `a-hard` için etkin alfa
   ~0,47'den ~0,70'e; hesaplanan kontrast 2,89 → ~4,2.
4. `dogum-haritasi-hesaplama.html` içindeki kopya renk tablosunu ve kopya
   `ASPECTS`'i sil, ortak motora bağla — üç farklı açı listesi üreten durum
   açıklama katmanı gelince üç farklı açıklama üretir.
5. Kavuşum için ölü `a-maj` dalını ya canlandır ya kaldır.

---

## ÖLÇÜM DOSYALARI

- `olcum.json` — 13 sayfanın ham ölçümü
- `measure.mjs` / `bench.mjs` / `bench2.mjs` / `prof.mjs` / `shot3.mjs` — koşulan betikler
- `th-night.png` / `th-paper.png` / `th-white.png` / `aci-detayli.png` — ekran görüntüleri

Hiçbir site dosyası değiştirilmedi.
