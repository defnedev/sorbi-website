# Sorbi renk sistemi — 19 Eylül 2026 (son)

**Altı renk. Başka yok.** Gökyüzü gibi: koyu zemin, açık yazı, tek bir sıcak nokta.

| | | rol |
|---|---|---|
| `#0B0810` | zemin | sayfa **ve** kart — kart kenarla ayrılır, renkle değil |
| `#F2EFE9` | kâğıt | başlık, gövde, sayı, çark çizgisi, ikon — parlak olan her şey |
| `#A5A3AE` | gri | ikincil yazı, çip, rozet, element etiketi, çark elementi |
| `#868494` | soluk | üçüncül yazı, placeholder, dipnot |
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
