# Sorbi renk sistemi — 19 Eylül 2026 (son)

**Altı renk. Başka yok.** Gökyüzü gibi: koyu zemin, açık yazı, tek bir sıcak nokta.

| | | rol |
|---|---|---|
| `#0B0810` | zemin | sayfa **ve** kart — kart kenarla ayrılır, renkle değil |
| `#F2EFE9` | kâğıt | başlık, gövde, sayı, çark çizgisi, ikon — parlak olan her şey |
| `#A5A3AE` | gri | ikincil yazı, çip, rozet, element etiketi, çark elementi |
| `#807E8B` | soluk | üçüncül yazı, placeholder, dipnot |
| `#E3A692` | vurgu | **yalnız** birincil düğme ve aktif nav çizgisi |
| `#2B140C` | vurgu-yazı | vurgu dolgusunun üstündeki metin |

## Kurallar

1. Bir ekranda vurgu renkli **en fazla bir nesne.**
2. Sayı, başlık, rozet, çip, kenar, ikon, ilerleme çubuğu, bağlantı — hiçbiri
   vurgu rengi almaz. Hepsi kâğıt ya da gri.
3. Çark tek renkli: elementler glifle ayrılır, renkle değil. Sert/yumuşak açı
   çizgi kalınlığıyla ayrılır.
4. Saydam katman yalnız `rgba(242,239,233,.xx)` (kâğıt) ya da `rgba(11,8,16,.xx)` (zemin).
5. Marka rengi yok — WhatsApp düğmesi bile tek renk.
6. **Yeni bir hex eklemek bu belgeye eklemeyi gerektirir.** Belgede yoksa yanlıştır.

## Yol

| | renk | ekranda sıcak piksel |
|---|---|---|
| Başlangıç | 157 | %6,97 |
| Token seti | 62 | %3,83 |
| Katı set | 15 | %3,86 |
| **Tek renk + bir vurgu** | **6** | — |

Kontrast: 12 sayfada otomatik denetim, 0 hata. Paylaşım paneli ve çark çizimi test edildi, bozulmadı.

## Neden 15'te durmadım — ve neden durmalıydım demedim

15 bir tasarımcının seveceği bir sistemdi: dört element, altın-sayı kuralı,
tek istisna. Ama tek bir sayfada altı ayrı ton görünüyordu — terracotta, altın,
yeşil, mavi, beyaz, gri. "Sistem" temizdi, göz için kalabalıktı. Sahibi beş kez
"çok renk" dedi. Altıncısında sayıyı bırakıp ekrana baktım.

---

## Gökyüzüne göre tema — 19 Eylül, gece

Aynı altı rol, iki değer seti. Gece varsayılan; gündüz `html[data-tema="gunduz"]`.

| rol | gece | gündüz | gündüz kontrast |
|---|---|---|---|
| zemin | `#0B0810` | `#F6F3EC` | — |
| kâğıt/mürekkep | `#F2EFE9` | `#1A1720` | 15,96 |
| gri | `#A5A3AE` | `#5C5966` | 6,16 |
| soluk | `#807E8B` | `#666370` | 4,99 |
| vurgu | `#E3A692` | `#A85A36` | 4,53 (metin olarak da, üstünde kâğıt olarak da) |
| vurgu-yazı | `#2B140C` | `#F6F3EC` | 4,53 |

**Seçim:** varsayılan gece. Kullanıcı navdaki ☀/☾ ile seçtiyse o (`localStorage.sorbi_tema`).
Gündoğumuna göre otomatik tema 19 Eylül'de kapatıldı (kurucu: gündüz yalın kaldı);
NOAA hesabı satır içi blokta duruyor, tek satırla geri açılır.

**19 Eylül ton denetimi (Fable):** zemin ve vurgu kalıyor. `--dim` #868494 → #807E8B
(üç gri kademesi ekranda iki okunuyordu; yeni değer zeminde 4,99:1, kart üstünde 4,58:1).
Footer başlıkları vurgudan çıktı (başlık asla vurgu kuralı).

**Sayfalar renk bilmez.** 61 HTML'de `<style>` ve `style=""` içindeki her literal
`var(--rol)` oldu; `rgba(242,239,233,.08)` gibi saydamlar `rgba(var(--ink-rgb),.08)`.
JS'ten enjekte edilen CSS de (form, geri bildirim, profil, liste, oyun, burç, uyum,
gösteri) aynı değişkenleri kullanıyor. Yalnız canvas/SVG üreten iki dosya literal
tutar: `sorbi-kart.js` (paylaşım kartı — daima koyu, karar) ve `sorbi-chart.js`
(çark — `data-tema`'yı okuyup `paper`/`night` seçer).

**Başlık kuralı kapatıldı:** h1/h2/h3 hiçbir yerde vurgu rengi almaz — `--gold`,
`--terra`, `--purple` gibi 13 eski takma ad bunu delip geçiyordu (43 dosyada).
Artık hepsi kâğıt.

Kontrast: iki temada da 12 sayfa, 0 hata.
