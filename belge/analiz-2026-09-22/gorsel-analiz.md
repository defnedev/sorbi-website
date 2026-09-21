# Sorbi web — görsel analiz (nadirlik gösterimi · zemin rengi · harita açı çizgileri)

Tur: ANALİZ, kod değişmedi. Ölçümler 390×844 (2× DPR) Playwright ile alındı; `/api/**` sorbiapp.com'a yönlendirildi.
Ekran görüntüleri: `scratchpad/ga/` klasöründe (aşağıda dosya adlarıyla anılır). Kontrast hesabı: `ga/kontrast.py` (WCAG 2.x bağıl parlaklık; alfa katmanları zemine bileşiklenerek ölçüldü).

---

## 0. Ortak teşhis: "site bana bile karışık geliyor"

Üç şikâyet ayrı gibi görünüyor ama tek köke iniyor: **görsel hiyerarşi zeminde eriyor.** Kartlar zeminden 1,05:1 ile ayrılıyor (fark yok demek), harita çizgileri 1,1–2,9:1 arasında (görünmez ile zor görünür arası), nadirlik sayıları ise büyük puntoyla basılıyor ama sayının **neye göre** nadir olduğu (eşit dağılım çizgisi) küçücük bir çentik. Yani göz, "önemli olan ne?" sorusuna sayfadan cevap alamıyor; her şey aynı ağırlıkta karanlıkta yüzüyor. Aşağıdaki üç başlık bu tek sorunun üç yüzü.

---

## 1. NADİRLİK GÖSTERİMİ

### 1.1 Envanter — sayılar bugün nerede, nasıl basılıyor

| Sayfa | Kaynak | Gösterim | Görsel |
|---|---|---|---|
| `/nadirlik` manşet | `nadirlik.html` `kacKiside()` | "14 kişiden 1" (Fraunces 2,6–4,4rem) + 100 noktalı ızgara (7 nokta yanık) + "%7,1" | `ga/nadirlik-sonuc-clip.png` |
| `/nadirlik` satırlar | `satirlar()` | yatay çubuk (tam çubuk = %12,5) + 1px "eşit" çentiği + "%7,1" | `ga/nadirlik-satirlar.png` |
| `/nadirlik` üçlü | aynı | "1.300 kişiden 1" + çubuk (tam çubuk = eşitin 2 katı) | aynı |
| `/nadirlik` kanca (üst) | `kanca()` | "%4,8", "5'te 1", "1.232'de 1" (üç kutu) | `ss-nadirlik-sonuc.png` (scratchpad kökü) |
| `/seni-taniyorum` | satır 732–757 | "100.000 kişiden yalnızca 77 kişide" + "yaklaşık 1.300 kişide bir" + 212px ince çubuk (`.nbar`) | — |
| 12 burç sayfası | `sorbi-burc.js` 227–241 | düz cümle ("her 12 haritadan biri…") + canvas çubuk grafiği, kesikli eşit çizgisi | `ss-aslan.png` |
| `/burc-uyumu` | `sorbi-uyum.js` 282–310 | düz cümle (iki Güneş burcunun payı) | `ss-uyum.png` |

Aynı kavram için sitede **beş farklı yazım** var: "14 kişiden 1", "5'te 1", "1.232'de 1", "yüz bin kişiden 77 kişide", "%7,1". Ve dört farklı görsel: 100 nokta, çubuk+çentik, ince çubuk, canvas çubuk grafiği. "Karışık" hissinin bir parçası bu: nadirlik tek bir şey ama beş kılıkta dolaşıyor.

### 1.2 "9 kişiden 1'i" bir insana ne hissettiriyor?

Ekran görüntüsündeki gerçek örnek: manşet **"14 kişiden 1 — Venüs Terazi burcunda"**, altında "Haritandaki en seyrek kişisel yerleşim". Sorun şu: Venüs'ün herhangi bir burçta olma olasılığı zaten ~1/12. "14 kişiden 1" ile "12 kişiden 1" arasındaki fark, insan ölçeğinde **yoktur**. Ama sayfa bunu "EN NADİR YANIN" etiketiyle, en büyük puntoyla sunuyor. Kullanıcı üç şeyden birini hissediyor:

- **Sayı** olarak: "14" — ne kadar? Bilmiyor. Referans yok.
- **Oran** olarak: 100 nokta 7'sini yakıyor → "%7" — ama manşet "14'te 1" diyor; iki dili kafasında çevirmek zorunda (1/14 = %7,1). Nokta ızgarası oranı, manşet ise ters oranı gösteriyor. **Aynı kartta iki ters ölçek.**
- **Karşılaştırma** olarak: hiç. "Normali 12'de 1'dir, sen 14'te 1'sin, yani neredeyse sıradan" cümlesini hiçbir öğe söylemiyor. Satır listesinde 1px'lik "eşit" çentiği var ama 390px'te fark edilmiyor (`ga/nadirlik-satirlar.png`: yedi çubuk aynı boyda, çentik hepsinde neredeyse aynı yerde).

Kurucunun "9 kişiden 1'i hepsinde" gözlemi tam olarak bu: **tek yerleşimler nadir değildir**, dağılım neredeyse düz (Güneş burcu %8,1–%8,6 — `ss-aslan.png` bunu dürüstçe gösteriyor). Nadir olan **bileşimdir** (üçlü 1/1.300, katalog özellikleri 1/2.364). Ama sayfa büyük puntoyu bileşime değil tek yerleşime veriyor. Bugünkü gösterimin kaçırdığı şey: **taban (eşit dağılım) ile sapma**. Nadirlik mutlak oran değil, beklenenden sapmadır.

### 1.3 Doğru form hangisi — seçim ve eleme

Nadirlik burada iki farklı büyüklükle geliyor:
- **Tek yerleşim**: 1/9 … 1/14 arası; beklenen 1/12. Bilgi, sapmadadır (±%30).
- **Bileşim** (üçlü, katalog özellikleri): 1/300 … 1/2.364 … "n'de 1'den seyrek". Bilgi, mertebededir.

**Seçilen form: "1/N nokta ızgarası" değil, "tabanlı karşılaştırma şeridi" + mertebe için "insan sırası".** Somutu:

1. **Tek yerleşim → karşılaştırma şeridi (baseline bar).** Yatay şerit, ortada belirgin "12'de 1 — herkes için beklenen" çizgisi; senin değerin o çizgiden sola (daha seyrek) ya da sağa (daha sık) sapan bir işaret. Etiket: "Herkeste 12'de 1 · sende 14'te 1 → **biraz daha seyrek**". Sapma %10'un altındaysa görsel işaret çizginin üstünde durur ve metin "sıradan" der. Bu, "9 kişiden 1'i hepsinde" itirazına verilen dürüst cevap: sayfa, sıradan olanı sıradan gösterir.
2. **Bileşim → insan sırası (1 vurgulu figür, N zemin figür değil; "N kişide 1" için logaritmik kademe).** 1/1.300'ü nokta ızgarasıyla göstermek imkânsız (1.300 nokta) ve yüzde çubuğuyla anlamsız (%0,08 → sıfır piksel). Doğru olan **kademe**: 12 · 100 · 1.000 · 10.000 · 100.000 basamaklı bir merdiven/cetvel üzerinde işaret. "1.300 kişide 1" işareti "1.000" ile "10.000" arasında durur; cetvelin üstünde referanslar ("bir sınıf: 30 · bir mahalle: 1.000 · bir ilçe: 100.000"). Aynı cetvel 1/9 (soldaki "12" basamağının hemen sağında) ve 1/2.364 için de çalışır → **üç mertebe tek formda.**

Elenenler ve nedeni:
- **100 nokta ızgarası (mevcut)**: 1/14 için 7 nokta yakıyor, 1/1.300 için 0 nokta → mertebe değişince çöküyor. Ayrıca oran/ters-oran çelişkisi (yukarıda). Kaldırılsın ya da yalnız %1'in üstündeki değerlerde, taban çizgisiyle birlikte kullanılsın.
- **Yüzde çubuğu (satırlar)**: değerler %7–10 bandında; çubuklar aynı boyda, göz ayırt edemiyor. Sıfırdan başlayan çubuk sapmayı gizler. Elendi; yerine taban-merkezli sapma şeridi.
- **Sıralama ("1645/1728")**: doğru bilgi ama kimse 1728'in ne olduğunu bilmiyor; yalnız dipnot olarak kalsın, ana görsel olamaz.
- **Pasta/halka**: oran %7 iken dilim görünmez; elendi.

### 1.4 Sorbi'nin kendi dili: mevcudu genişletmek mümkün mü?

Evet, yeni dil icat etmeye gerek yok; parçalar zaten var:
- **Halka** (`sorbi-sayim-gorsel.js` `halka()`, `sorbi-gosteri.js` `halka()`): 12 dilimli burç halkası, vurgulu dilim `--acc` %16 alfa. Tek yerleşim için "12'de 1" tabanı **halkanın kendisidir**: 12 eşit dilim = beklenen; senin burcunun dilimi sapma kadar daha ince/kalın ya da daha koyu/açık. Bu, "14'te 1 vs 12'de 1"i sayısız anlatır: halkada 12 dilim, seninki azıcık daha dar. Halka bileşeni (`SorbiGosteri.ekle(tip,fn)`) yeni tip ekleyebiliyor → `TIP['nadirlik-halkasi']` olarak eklenebilir, CSS/renk altyapısı hazır.
- **Eşit dağılım çizgisi**: `sorbi-burc.js` canvas'ında "kesikli çizgi: eşit dağılım" zaten kurulu bir sözlük öğesi. Aynı çizgi nadirlik satırlarına taşınmalı ama 1px'ten kalın ve etiketli.
- **Kademe cetveli** için mevcut kart dili (`sorbi-kart.js` `tur:'liste'`) yeterli; yalnız "büyük sayı" yerine "büyük sayı + cetvel" varyantı gerekir.

Bir sayfada tek gösterim dili: **halka = tek yerleşim, cetvel = bileşim.** Beş yazım da tek kurala insin: `<1/50` için "N'de 1", `≥1/50` için "12'de 1'e karşı 14'te 1" biçiminde her zaman tabanla birlikte.

---

## 2. ZEMİN RENGİ

### 2.1 Doğrulama: site tasarım sistemini kullanmıyor

`nadirlik.html` 188–193 (ve tüm sayfalarda aynı `SORBI-TEMA` bloğu):
```
:root{--bg:#0B0810; --ink:#F2EFE9; --mut:#A5A3AE; --dim:#807E8B; --acc:#E3A692; --acc-ink:#2B140C}
gündüz: --bg:#F6F3EC; --ink:#1A1720; --mut:#5C5966; --dim:#666370; --acc:#A85A36; --acc-ink:#F6F3EC
```
Tasarım sisteminin `#0B0F14 / #121820 / #C9A962 / #7BC9A0 / #CE4F4F / #4E9C7B` renklerinin **hiçbiri** sitede geçmiyor (grep: 0 sonuç). Site mor-siyah bir zemin, sistem mavi-gri bir zemin tanımlıyor; iki ayrı dünya.

Önemli bir yapısal nokta: sitede **yüzey belirteci yok**. Kart, çerçeve, manşet hepsi `rgba(var(--ink-rgb), α)` ile türetiliyor: `--card: .032`, `--card2: .05`, `--stroke: .08`, `--stroke2: .14`, manşet gradyanı `.09→.03`, `.sbg` (gösteri kutusu) `.032`.

### 2.2 Ölçüm: koyu mu, ayrışmıyor mu?

Zemin `#0B0810` üstünde (ga/kontrast.py çıktısı):

| Öğe | Bileşik renk | Zemine oran |
|---|---|---|
| metin `--ink` | #F2EFE9 | **17,3:1** (AAA) |
| ikincil `--mut` | #A5A3AE | **8,0:1** (AAA) |
| soluk `--dim` | #807E8B | **5,0:1** (AA) |
| vurgu `--acc` | #E3A692 | 9,6:1 |
| **kart** (α.032) | #120F17 | **1,05:1** |
| kart2 (α.05) | #17141B | 1,09:1 |
| çerçeve (α.08) | #1D1A21 | 1,16:1 |
| manşet (α.09) | #201D24 | 1,20:1 |

**Teşhis: sorun "koyu olması" değil, "katmanların ayrışmaması".** Metin kontrastı fazlasıyla yeterli; ama kart ile sayfa zemini arasındaki fark 1,05:1 — insan gözü için sıfır. Kartı yalnızca 1px çerçeve (o da 1,16:1) tanımlıyor. `ga/seni-ust.png`'de form kartı zeminden ayırt edilemiyor; `ga/nadirlik-sonuc-clip.png`'de manşet kutusu ancak 0,3 alfalı çerçeveyle var oluyor. Referans: Material'ın koyu tema yükseklik katmanları %5–%16 beyaz üstkatman; Sorbi'nin kartı %3,2'de, yani en alt katmanın da altında. Kurucunun "çok koyu" dediği şey, aslında **her şeyin aynı koyulukta** olması.

İkinci bir bileşen: `#0B0810` L*≈3 — OLED-siyahına çok yakın. Mobilde ekran parlaklığı düşükken mor ton kaybolur, düz siyah kalır; "sanki koyu" hissi burada haklı. Ama yalnız zemini açmak (A) katman sorununu çözmez — kart alfaları da büyümek zorunda.

### 2.3 Üç seçenek (altı yuva, yeni renk yok)

Kart/çerçeve türetme alfaları belirteç değil ama görsel sonucun yarısı orada; her seçenek için ikisi birlikte verildi. Maket: `ga/zemin-secenekler.png` (soldan sağa: mevcut, A, B, C).

**(A) Zemini iki adım aç + katman farkını büyüt**
```
--bg #15111C  --ink #F2EFE9  --mut #A5A3AE  --dim #807E8B  --acc #E3A692  --acc-ink #2B140C
kart α.07 → #24212A (1,17:1) · kart2 α.11 (1,31:1) · çerçeve α.14 (1,44:1) · manşet α.16 (1,55:1)
```
Metin: ink 16,2 · mut 7,5 · dim 4,67 (AA geçer, sınıra yaklaşır) · acc 9,0 · acc-ink/acc 8,4. Kart üstünde dim 3,98 → **AA altı** (küçük metin için 4,5 gerek; `.ipucu`, `.lejant` gibi .72–.74rem dim metinler kart içinde kalıyor). Gerekçe: mor kimliği korur, OLED-siyah hissini kırar. Bedel: `--dim` kart üstünde AA'yı kaybediyor; ya dim'i bir ton açmak (yeni renk = kural ihlali) ya da dim'i kart içinde kullanmamak gerekir. Bir adım açık varyant (`#100C16`) da ölçüldü: dim/kart 4,21, yine altı.

**(B) Zemin aynı, yüzey katmanları belirginleşsin — ÖNERİLEN**
```
--bg #0B0810  --ink #F2EFE9  --mut #A5A3AE  --dim #807E8B  --acc #E3A692  --acc-ink #2B140C   (değişmez)
kart α.07 → #1B181F (1,13:1) · kart2 α.11 → #242128 (1,25:1) · çerçeve α.14 (1,37:1) · manşet α.16 → #302D33 (1,47:1)
```
Metin oranları mevcutla aynı (17,3 / 8,0 / 5,0). Kart üstünde: ink 15,3 · mut 7,06 · **dim 4,41** (AA'nın 0,09 altında; dim yalnız .72rem etiketlerde kullanılıyor, ya `--mut`'a çekilir ya da dim'in kart içi kullanımı α.06 kartla sınırlanır → 4,5 üstü). Gerekçe: **altı yuva dokunulmadan** katman sorunu çözülüyor; değişen yalnız türetme alfaları (tek satır `:root`). Zemin koyu kalır ama artık üç net katman var: sayfa → kart → kabartılmış kart/manşet. Maket görüntüsünde form kartı ilk kez "kart" olarak okunuyor. Bedel: "OLED-siyah" hissi tamamen gitmez; ama şikâyetin ölçülen kökü katmandı.

**(C) Tasarım sisteminin Gece temasına geç**
```
--bg #0B0F14  --ink #EBF0F8  --mut #B8C5D6  --dim ???  --acc #C9A962 (varak)  --acc-ink #0B0F14
kart = yüzey-1 #121820 (1,08:1) · kart2 = yüzey-2 #1A222D (1,20:1) · çerçeve/manşet = yüzey-3 #232D3A (1,38:1)
```
Metin: ink 16,8 · mut 11,0 · acc 8,5 · acc-ink/acc 8,5. Sistem `dim` tanımlamıyor; `#807E8B` (mor-gri) mavi zeminde 4,83 ile geçer ama tonu uyuşmaz; `rgba(mut,.62)` türetmesi (#76808C, 4,79) yeni hex olmadan çözer. Sistemin yüzey merdiveni **de** düşük (yüzey-1 1,08:1); sistem "kart" için yüzey-2'yi kullanmak zorunda. Gerekçe: uygulama ile web'in aynı dili konuşması, kızıl/yeşil açı renklerine ve varak/aksan ikilisine kapı açması. Bedel: tüm sayfa kimliği değişir (mor→mavi-gri, şeftali→altın), OG görselleri/kartlar yeniden üretilir, `sorbi-chart.js` sabit hex'leri (11,8,16 / 242,239,233) elle yazılı → hepsi güncellenir. Bu bir "zemin düzeltmesi" değil, "yeniden markalama" turudur; şimdiki şikâyete orantısız.

**Öneri: B şimdi, C ayrı bir karar.** B tek satırlık bir belirteç değişikliği ile ölçülen sorunu çözüyor ve altı yuvaya dokunmuyor. Eğer "OLED-siyah" hissi B'den sonra da sürerse A' (`#100C16`, bir adım) B'nin alfalarıyla birleştirilir; o durumda `--dim` kart içinden çekilir.

Not: `--dim` mevcut haliyle bile kart üstünde 4,77 — sınıra yakın; hangi seçenek seçilirse seçilsin dim'in .72rem'lik kullanımları (`.ipucu`, `.lejant`, `.nokta-alt`) gözden geçirilmeli.

---

## 3. HARİTA ÇİZGİLERİ VE AÇI GÖSTERİMİ

### 3.1 Bugün ne çiziliyor (`sorbi-chart.js`)

- Tema seçimi: `night` (sayfa gece) / `paper` (gündüz) / `white` (baskı). Renkler **sabit hex/rgba**, CSS belirteci okumuyor (satır 62–101).
- Açı sınıfları: `a-hard` (kare, karşıt) · `a-soft` (üçgen, altmışlık) · `a-min` (150°, 30°) · `a-maj` (kavuşum — **çizilmiyor**, satır 365 "astro.com/astro-seek çizgi çizmez").
- Gece renkleri: hard `rgba(227,166,146,.5)` (acc), soft `rgba(165,163,174,.5)` (mut), min `rgba(165,163,174,.24)` + `stroke-dasharray 3,3`.
- **Orb → kalınlık VE opaklık** (satır 366–368, doğrulandı): `tight = 1 − abs/(orb·1,4)`; büyük açı için w = .55 + tight·1,25 (viewBox birimi), op = .45 + tight·.5. Minör: w .35–.75, op .32–.65.
- Sınıf ayrımı yalnız **renk** (hard/soft) ve **kesikli** (min). Kalınlık türü değil orbu kodluyor.

### 3.2 Ölçümler (gece, zemin #0B0810)

Çizgi rengi × opaklık zemine bileşiklendi:

| Çizgi | En sıkı orb | En gevşek orb | 3:1 eşiği |
|---|---|---|---|
| a-hard (acc .5) | #71524D **2,86:1** | #3C2C2D 1,51:1 | **hiçbir durumda geçmiyor** |
| a-soft (mut .5) | #53515A 2,55:1 | #2E2B34 1,43:1 | geçmiyor |
| a-min (mut .24, kesik) | #232028 1,24:1 | #17141C 1,09:1 | görünmez |
| ev başlangıcı (cusp ink .26) | #474448 2,07:1 | — | geçmiyor |
| ince halkalar (hair ink .30) | 2,39:1 | — | geçmiyor |
| ana halka (ring .5) | 4,79:1 | — | geçer |
| AC/MC ekseni (angle .68) | 8,12:1 | — | geçer |

Ana sayfa halkası (`sorbi-gokyuzu.js` satır 123) daha da soluk: sert `acc α.10–.35` → 1,15–2,07:1; yumuşak `ink α.06–.18` → 1,11–1,57:1. `ga/index-harita.png`'de açı çizgileri zeminle aynı düzlemde; "çizgi var mı yok mu" seviyesinde.

Ölçek (viewBox 934 → 390px ekranda SVG 335px, k=0,359):
- Gezegen glifi 21 birim → **7,5 px**. Burç glifi 21 → 7,5 px. Ev numarası 12 → **4,3 px**. Derece etiketi 9,4 → **3,4 px**, dakika 8,1 → 2,9 px. Açı çizgisi .55–1,8 birim → **0,20–0,65 px**; minör .35 → 0,13 px (piksel altı; tarayıcı antialias ile silikleştiriyor).
- `ga/detayli-gece-zoom.png` (3× büyütme): sert açılar (şeftali) seçiliyor; yumuşak açılar ev başlangıç çizgileriyle **aynı gri, aynı kalınlık** — yapı çizgisi mi açı mı ayırt edilemiyor; minörler kayboluyor. Derece etiketleri büyütmede bile okunmuyor.

Yani "siyah olunca çizgiler silik" gözlemi ölçümle doğrulanıyor: **hiçbir açı çizgisi 3:1'i geçmiyor**, en sıkı sert açı bile 2,86.

### 3.3 Açı türlerini ayırt etmenin doğru yolu

İki bağımsız boyut var: **tür** (kavuşum / sert / yumuşak / minör) ve **orb** (sıkı → gevşek). Bugün tür = renk, orb = kalınlık+opaklık. Sorun: opaklık orb'la düşünce tür bilgisi de siliniyor (gevşek orblu sert açı 1,5:1 → görünmez → tür yok). Ayrıca opaklık tek başına "önemsiz" okunur; renk körlüğünde şeftali/gri ayrımı zayıf.

**Öneri — üçü birden ama görev bölüşümüyle:**
- **Tür → renk + çizgi deseni** (yedekli kodlama, renk körü güvenli):
  - Sert (kare, karşıt): `--acc` düz çizgi.
  - Yumuşak (üçgen, altmışlık): `--ink` **uzun kesikli** (9,6). Gri değil ink: yumuşak açının ev çizgilerinden ayrışması için renk değil desen kullanılır; ev çizgileri düz ve soluk kalır.
  - Kavuşum: çizgi değil, gezegen halkasında iki glifi saran **yay/köprü** (astro.com geleneğine sadık, ama kavuşumun "var" olduğu görünür).
  - Minör (150°, 30°): `--mut` **noktalı** (2,5); 400px altında varsayılan **kapalı**, "gelişmiş" açılınca gelir.
- **Orb → yalnız kalınlık; opaklık sabit tabanın altına inmez.** Sabit taban: sert için α≥.66 (4,5:1), yumuşak için ink α≥.50 (4,5:1), minör için mut α .55 (3,1:1). Kalınlık aralığı viewBox'ta 1,8 → 3,2 (390px'te 0,65 → 1,15 px; ekranda en az ~0,65 css px, retina'da 1,3 dp). Gevşek orb "ince ama görünür", sıkı orb "kalın"; her ikisi de tür rengini korur.
- Maket (`ga/aci-once-sonra.png`, sağ; `ga/aci-oneri-zoom.png`): kalibrasyon için bilerek abartılı (sert 2,6–5,0 birim). Doğru his için önerilen 1,8–3,2 bandı; maketin gösterdiği şey ayrımın **desenden** okunduğu — kesikli yumuşak açılar ev çizgilerinden anında ayrılıyor, minör noktalılar 390px'te gürültü yapıyor (bu yüzden mobilde kapalı).
- Diğer 390px düzeltmeleri: derece/dakika etiketleri 400px altında kapatılır ya da yalnız derece (dakikasız) kalır; ev numarası ≥ 5,5px için viewBox 15; ev çizgileri `.26 → .34` (2,6:1, yapı çizgisi için yeterli, açıların altında kalır).

### 3.4 Sistem renkleri (kızıl #CE4F4F, yeşil-veri #4E9C7B) kullanılıyor mu?

**Hayır.** Sitede hiçbir dosyada geçmiyor. `sorbi-chart.js` sitenin altı renginden (acc/mut/ink) türetiyor ve renkleri **CSS belirtecinden değil sabit hex'ten** alıyor. Neden: chart motoru sitenin kapalı palet kuralına göre yazılmış; sistem ise uygulama için ayrı bir palet tanımlamış. Sistem ile site ayrışmış — bunun kanıtı zemin (#0B0810 vs #0B0F14) ve vurgu (#E3A692 vs #C9A962) farkı.

Kızıl/yeşil ikilisi sitenin kapalı paletine **eklenemez** (kural: yeni renk yok) ve zaten gerekmez: yukarıdaki öneri tür ayrımını acc/ink/mut + desenle çözüyor. Ölçüldü: kızıl #CE4F4F mor zeminde 4,6:1, yeşil 6,0:1 — kullanılsa geçerdi, ama iki yeni renk = iki yeni yuva. Sistem C seçeneği (Gece teması) tercih edilirse kızıl/yeşil o pakete dahil gelir; o zaman `sorbi-chart.js`'in renkleri hex yerine `getComputedStyle` ile belirteçten okuması (sorbi-gosteri.js'teki `tk()` deseni zaten var) tek geçiş noktası olur.

---

## 4. Dosyalar

- `ga/nadirlik-sonuc.png` (tam sayfa), `ga/nadirlik-sonuc-clip.png` (manşet), `ga/nadirlik-satirlar.png` (satır listesi)
- `ga/seni-ust.png` (form kartı zeminden ayrışmıyor), `ss-aslan.png` (burç sayfası çubuk grafiği), `ss-uyum.png`, `ss-index.png`
- `ga/index-harita.png` (ana sayfa halkası, gece)
- `ga/detayli-gece-clip.png`, `ga/detayli-gece-zoom.png` (3× büyütme), `ga/detayli-kagit-clip.png`
- `ga/zemin-secenekler.png` (mevcut · A · B · C yan yana)
- `ga/aci-once-sonra.png`, `ga/aci-oneri-zoom.png` (açı kodlaması maketi — kalibrasyon abartılı)
- `ga/kontrast.py` (tüm oranlar), `ga/ga-shot.mjs` + `steps*.json` (yeniden üretim)

## 5. Öncelik sırası (uygulama turu için)

1. **B zemin**: `:root` alfaları (.032→.07, .05→.11, .08→.14, manşet .09→.16) — tek satır, tüm sayfalar.
2. **Açı çizgileri**: `sorbi-chart.js` night/paper `asp` renkleri + satır 366–372 kalınlık/opaklık formülü + yumuşak için dasharray; `sorbi-gokyuzu.js` 123 aynı taban.
3. **Nadirlik**: manşetten 100 noktayı kaldır; tek yerleşim için taban çizgili sapma şeridi (ya da `SorbiGosteri` halkası), bileşim için kademe cetveli; beş yazımı tek kurala indir.
