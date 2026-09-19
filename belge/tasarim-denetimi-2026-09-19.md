# Tasarım denetimi — 19 Eylül 2026

Üç bağımsız eleştiri alındı (renk sistemi · editoryal/tipografi · ürün arayüzü).
Üçü de ekran görüntülerine gerçekten baktı. Aşağıdaki her sayı ölçüldü.

## Ölçülen başlangıç durumu

- **157 benzersiz hex**, 44 rgb/rgba tabanı, **6.267 renk bildirimi**
- En çok kullanılan renk `#E3A692` (630 kez) — mercan/şeftali, S59 L73
- `#E3A692` ve `#DFA98F` her kanalda 4 fark: **iki renk değil, iki kez yazılmış tek renk**
- `#F2EFE9` / `#F6EFE1` / `#F6F1E7` / `#E8E4DA` — dört değil, bir renk
- Aynı rengin **on ayrı saydamlık değeri** (`.04 .05 .06 .07 .08 .1 …`)
- **12 farklı konteyner genişliği**: 820px (29 sayfa), 760, 680, 900, 660, 1120, 920, 840, 640, 600, 1320, 1140

## Üç eleştirinin buluştuğu nokta

Vurgu renginin **rol disiplini yok**. Aynı terracotta şunların hepsinde:
aktif nav hapı · birincil düğme · başlık vurgusu · kart kenarlığı · "YENİ" rozeti ·
bağlantı rengi · gövde içi bold · eyebrow · ilerleme çubuğu · bilgi çipi.

> Her şey vurguysa hiçbir şey vurgu değil.

Not: kontrast sorun değil. `#E3A692` koyu zeminde **9.57:1** — fazlasıyla geçiyor.
Sorun okunabilirlik değil, **hiyerarşi**.

## Ayrıştıkları nokta — karar sana

| | Öneri |
|---|---|
| **Renk sistemi** | Terracotta gitsin, yerine `#A9C3E8` (soğuk yıldız mavisi) gelsin; altın `#E4CF9A` yalnız **ölçülmüş sayılara** ayrılsın |
| **Ürün arayüzü** | Terracotta kalsın ama **sayfada yalnız bir nesnede** — birincil düğme |
| **Editoryal** | Renk asıl sorun değil; **hizasızlık** — 12 konteyner genişliği, 30/47/55/60/70/78/80/90/95px dikey boşluklar |

## Yapılanlar (ölçülü)

| İş | Kapsam |
|---|---|
| Nav aktif durumu: dolu hap → beyaz metin + 2px alt çizgi | 60 sayfa |
| Sayfa zemininin sıcak parıltısı nötre çekildi (`rgba(227,166,146,.11)` → `rgba(186,178,208,.055)`) | 57 sayfa |
| Gradyanlı düğmeler düz dolguya indi | 11 sayfa |
| Aynı rengin 10 saydamlığı → 2 | 14 sayfa |
| Sıcak kart dolguları nötre (`%12–22 terracotta` → `%3.5 beyaz`) | 4 sayfa |

**Ekranda ölçülen sonuç** (aynı 6 sayfa, aynı ölçü, mobil):

| | Önce | Sonra |
|---|---|---|
| Sıcak piksel | %7,0 | **%4,3** |
| Doygun + parlak sıcak | %3,88 | **%2,56** |

## Yapılmayanlar — karar bekliyor

1. **Vurgu rengi değişsin mi?** `#E3A692` → `#A9C3E8`. Marka kararı, benim kararım değil.
   Renk eleştirisinin gerekçesi: sitenin kendi seçim notu *"ink/gold/paper"* diyor ve
   ink de gold da paper da palette var — ama **en çok kullanılan renk bunların hiçbiri
   değil**, dördüncü bir şey, ve tam olarak notun "olmasın" dediği mercan.
2. **12 konteyner genişliği tekleşsin mi?** Editoryal eleştirinin 1 numarası. Sayfalar
   arası geçişte içerik yana kayıyor; insan bunu "kaymış" diye okur, sebebini söyleyemez.
   Riskli: her sayfanın düzeni değişir.
3. **Başlıklardaki kelime vurgusu** (`Haritanı **şimdi** çıkar`) — üç sayfada aynı numara.
   Renk eleştirisi "artık numara değil, şablon" diyor; beyaza dönmesini öneriyor.
4. **Kart biçimi 11–12 ayrı** (editoryal sayımı). Tek `.card` primitifi gerekiyor.
5. **Düğme biçimi 9 ayrı** (ürün sayımı). Bilgi rozetleri ile gerçek düğmeler aynı görünüyor.
6. **Mobil nav**: yatay kayıyor, her sayfada farklı dilim görünüyor, kullanıcı menüyü
   hiç bütün göremiyor. Ürün eleştirisi tam ekran menü öneriyor.
7. Doğum Haritası sayfasında **saat alanı varsayılan `12:00`'yi dolu metin renginde**
   gösteriyor — kullanıcı bunu kendi girdiği sanıp bırakıyor, yükselen yanlış çıkıyor.
   *Bu bir hata, tasarım tercihi değil.*
8. `8,4%` → `%8,4` — Burçlar kartlarında dördünde de yanlış yerleşim.

## Doğrulanan bir eleştiri yanlıştı

Renk eleştirisi `#2B140C`, `#1A0F14`, `#180F14` için "sıcak kart zeminleri, kartları
uyarı kutusu gibi gösteriyor" dedi. Kontrol ettim: bunların **141'i ve 57'si `color:`**,
yani açık zemin üstündeki koyu metin rengi — kart zemini değil. İddia yanlıştı,
uygulanmadı.
