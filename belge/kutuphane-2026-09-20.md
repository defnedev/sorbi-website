# Sorbi Astroloji Kütüphanesi
**20 Eylül 2026 · kuruldu · `sorbi-ozellik.js` + `tools/ozellik-say.mjs`**

Kütüphanenin tek kuralı: **sayı elle yazılmaz, katalogdan üretilir.**

---

## 1. Neden

Bugüne kadar her sayım ayrı yazıldı: nadirlik için bir script, retro için bir script,
sabit yıldızlar için bir başkası. Her yeni soru yeni kod demekti ve sayılar dağınıktı.

Kütüphane bunu tersine çeviriyor: **bir haritada tespit edilebilen her şey tek bir
katalogda** duruyor. Sayım scripti katalogdaki her maddeyi örneklem üzerinde sayıyor.
Kataloğa yeni bir madde eklediğin an, o maddenin "kaç kişide bir" sayısı bir sonraki
sayımda kendiliğinden çıkıyor.

---

## 2. Yapı

```
sorbi-ozellik.js        → KATALOG. Her özellik: id, ad, grup, bul(H), saat gerekir mi.
tools/ozellik-say.mjs   → SAYAÇ. Katalogdaki her id'yi örneklem üzerinde sayar.
ozellik-veri.json       → ÇIKTI. {n, say:{id:adet}, uclu:{kod:adet}}
```

Bir haritadaki özellikleri bulmak tek çağrı:

```js
SorbiOzellik.tara(chart)   // → ['burc.sun.6', 'ev.sat.1', 'yildiz.Regulus', ...]
```

Kaç kişide bir olduğu:

```js
Math.round(veri.n / veri.say['yildiz.Regulus'])
```

---

## 3. Katalogda ne var (ilk sürüm: 451 özellik, 21 grup)

| Grup | Adet | Örnek |
|---|---|---|
| Burçta gezegen | 120 | Satürn Koç'ta |
| Evde gezegen | 120 | Ay 6. evde |
| Açısal nokta | 24 | Yükselen Balık, MC Yay |
| Asalet ve zarar | 30 | Merkür kendi burcunda, Jüpiter düşüşte |
| Karşılıklı kabul | 21 | Güneş ile Ay karşılıklı kabulde |
| Sabit yıldız | 19 | Regulus teması (18 yıldız + hiçbiri) |
| Derece | 15 | Ay 29. derecede, Venüs 0. derecede |
| Harita yöneticisi | 14 | Yöneticisi 11. evde, yöneticisi geri |
| Geri hareket | 12 | Satürn geri, üç gezegen birden geri |
| Açısız gezegen | 10 | Merkür açısız |
| Güneş yakınlığı | 10 | Venüs yanık, Merkür cazimi |
| Açısal güç | 9 | Mars köşe evde, dört gezegen köşede |
| Açı | 9 | Yarım dereceden dar açı, 24+ açı |
| Yığın | 8 | Dört klasik gezegen aynı burçta / aynı evde |
| Ay evresi | 8 | Dolunay, son dördün |
| Element | 8 | Suda hiç gezegen yok |
| Açı kalıbı | 5 | T-kare, büyük üçgen, büyük kare |
| Ay | 3 | Ay boşlukta, Ay hızlı |
| Nitelik | 3 | Sabit burçlarda dört gezegen |
| Sect | 2 | Gündüz / gece haritası |
| Üçlü | 1 | Güneş–Ay–Yükselen kombinasyonu (1.728 olası) |

---

## 4. Doğrulama

Katalog kurulurken bilinen oranlarla karşılaştırıldı:

| Özellik | Kütüphane | Beklenen | Kaynak |
|---|---|---|---|
| Merkür geri | %19,2 | %19,1 | Sayım 03 |
| Dolunay evresi | %12,3 | %12,5 | 45°/360° |
| Üç gezegen aynı burçta | %43,3 | %43,3 | Sayım 04 |
| Güneş Koç'ta | %8,3 | %8,3 | 1/12 |
| 29. derecede en az bir gezegen | %20,8 | %21,0 | 1−(29/30)⁷ |
| Ay boşlukta | %22,1 | %15–25 | Literatür |

İki detektör ilk sürümde yanlıştı ve düzeltildi: **Ay boşlukta** (burçtan çıkana dek tam
olacak açı var mı diye bakmıyordu; şimdi göreli hızla hesaplıyor) ve **açı sayısı
eşikleri** (8/12/16 neredeyse her haritada gerçekleşiyordu, 12/18/24 oldu).

---

## 5. Kataloğa nasıl eklenir

```js
ek('id.benzersiz', 'İnsan adı', 'Grup',
   function (H) { return /* true ya da false */; },
   false /* saat gerekiyorsa true */);
```

`H` içinde: `H.ch` (harita), `H.P` (gezegenler), `H.asps` (açılar), `H.gunduz`,
`H.YZ` (o yıla taşınmış sabit yıldız boylamları), `H.saatli`.

Ekledikten sonra sayacı çalıştır:

```
node tools/ozellik-say.mjs 1950 2009 2 6
```

---

## 6. Örneklem ve sınırları

- **1930–2025, her gün, günde altı saat** → **210.384 harita.** İlk sürüm 1950–2009
  aralığında 67.050 haritaydı; örneklem üç kat büyütüldü ve yıl aralığı 96 yıla çıkarıldı.
  Sebep: 60 yıl Uranüs'ün bir turunu (84 yıl) bile kapatmıyordu; şimdi kapatıyor.
- Sayım iki çekirdekte paralel koşar: `ozellik-say.mjs` parça üretir,
  `ozellik-birlestir.mjs` birleştirir. Toplam süre yaklaşık bir saat.
- Ev ve açısal noktalar **İstanbul enlemi** (41,01°K) ile hesaplandı. Gezegen burçları
  enlemden bağımsızdır; evler değildir.
- Bu bir **gökyüzü dağılımıdır, doğum istatistiği değildir.** Doğumlar gün ve mevsim
  içinde eşit dağılmaz.
- Yavaş gezegenler (Uranüs, Neptün, Plüton) için burç sayıları kuşak yerleşimidir,
  kişisel seyreklik değildir. Kitapçıkta bu ayrım açıkça yazılır.
- Örneklemde bir kez bile görülmeyen özellikler "bu örneklemde görülmedi" diye
  raporlanır; sıfır yazılmaz.

---

## 7. Neyi besliyor

| Ürün | Nasıl kullanıyor |
|---|---|
| **Kitapçık** | Her yerleşimin yanına gerçek sayı; "öne çıkanlar" katalogdan seçiliyor |
| **/nadirlik** | 451 özelliğin tamamı sorgulanabilir hâle geliyor |
| **/sayim** | Her grup bir yazı konusu; sayı zaten hazır |
| **/anlat** | Terim kartlarındaki sayılar tek kaynaktan |
| **Atölye ve kurs** | Ders materyali: "bu ne kadar yaygın" sorusunun cevabı hazır |

---

## 7.5 Örneklem büyütmenin getirdiği

67.050 → 210.384 haritaya çıkınca:

- **1.728 olası Güneş–Ay–Yükselen üçlüsünün tamamı görüldü.** Küçük örneklemde on tanesi
  hiç çıkmamıştı; artık hepsinin sayısı var.
- 29. derece oranı %17,5'ten %20,8'e oturdu (kuramsal değer %21,0). Küçük örneklemde
  yavaş gezegenlerin derece dağılımı pürüzlüydü.
- Katalogda en az bir kez görülen özellik 433'ten **441**'e çıktı.
- En seyrek sayılar keskinleşti: altı gezegen aynı burçta **1.582 kişide bir**,
  Satürn cazimi **589'da bir**, Güneş–Ay karşılıklı kabul **139'da bir**.

## 8. Sırada ne var (katalog büyütme)

Bugünkü katalog natal haritayla sınırlı. Sıradaki katmanlar, zorluk sırasına göre:

1. **Arap noktaları** (Şans, Ruh, Eros…) — hesabı basit, katalog maddesi kolay.
2. **Antiscia ve deklinasyon** (paralel, kontra-paralel) — motor deklinasyonu zaten veriyor.
3. **Terim, dekan, yüz detayı** — `sorbi-dignite.js` hesaplıyor, katalog maddesi yok.
4. **Ay düğümü ve tutulma yakınlığı** — doğum tutulmaya kaç gün uzakta.
5. **Orta noktalar (midpoints)** — kombinatorik büyük, eşik gerekir.
6. **Harmonikler** — 5., 7., 9. harmonik açılar.

**Zamanlama teknikleri (profeksiyon, solar ark, return, firdaria) bilerek dışarıda.**
Sebep: bunlar öngörüye açılan kapı ve ürün dili "hesap ve gelenek aktarımı" olarak
kurulmuş durumda. Gerekirse ayrı bir katalog olarak, ayrı bir kararla eklenir.
