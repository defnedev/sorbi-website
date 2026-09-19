# Sorbi renk sistemi — 19 Eylül 2026

Bundan sonra siteye yeni bir renk eklenmez. Gereken şey buradaki bir token'dır.

## Neden

Önce: **157 benzersiz hex**, 6.267 renk bildirimi. Kümelendiğinde 88 görsel
küme çıkıyordu ve **66'sı toplam 148 kullanımla %3'lük bir kuyruk** —
yani birer kez yazılmış, unutulmuş değerler.

Değişken adları da karışmıştı: `#E3A692` hem `--terra` hem `--gold` hem
`--goldstar` olarak tanımlıydı; `#C4744E` bir yerde `--purple` deniyordu;
`#F2D3B8` bir yerde `--vermilion`.

## Token'lar

### Zemin — tek nötr aile (mor-siyah, ~265°)
| | | |
|---|---|---|
| `--bg`   | `#0B0810` | sayfa |
| `--s1`   | `#151220` | kart |
| `--s2`   | `#1F1B2C` | iç kart, girdi alanı |
| çizgi    | `rgba(255,255,255,.08)` | ince ayraç |
| çizgi-2  | `rgba(255,255,255,.14)` | belirgin kenar |

### Metin
| | | kontrast (bg / s1 / s2) |
|---|---|---|
| `--ink` | `#F2EFE9` | 17.8 / 16.5 / 15.0 |
| `--mut` | `#A5A3AE` | 8.00 / 7.42 / 6.75 |
| `--dim` | `#868494` | 5.44 / 5.04 / **4.59** |

`--dim` kasten bu ton: üç zeminde de 4.5:1'i geçen **en koyu** değer.
Daha koyusu iç kartta kalıyor (ilk denemem `#76747F` idi, 3.66 veriyordu).

### Vurgu — TEK
| | | |
|---|---|---|
| `--acc`   | `#E3A692` | birincil eylem, aktif gösterge, bağlantı, odak halkası |
| `--acc-dk`| `#C4744E` | hover / basılı |
| `--btn-ink`| `#2B140C` | vurgu dolgusu **üstündeki** metin — 8.39:1 |
| vurgu-zemin | `rgba(227,166,146,.10)` | seçili durum dolgusu |

### Sayı
| | | |
|---|---|---|
| `--gold` | `#E4CF9A` | **yalnız ölçülmüş sayı** — `%4,9`, `650'de 1`, `24.000 gök anı` |

Altın gördüğün yer, hesaplanmış olan yer. Düğmede altın kullanılmaz.

### Zemin düz
Sayfa arkasında hiçbir katman yok. `html{background:#0B0810}`, tek yüzey.

Önce burada üç ayrı sistem üst üste biniyordu:
- `body::before` (57 sayfa): **10 radial gradyan** — üç renkli parıltı (mor `%5,5`,
  mavi-yeşil `%8`, terracotta `%5`, üç ayrı yönden) + yedi adet 1px "yıldız" noktası
- `.sky` divi (3 sayfa): aynı on katmanın kopyası
- Bunların **altında** ayrıca bir vinyet (`radial-gradient(1100px 520px …)`, 10 sayfa)
- Beş sayfada kendi iki-elipsli terracotta yıkaması, **%20'ye kadar**

Noktalar yıldız değil toz lekesi gibi okunuyordu; üç parıltı metnin arkasında
birbiriyle yarışıyordu. Hepsi kaldırıldı. Sitede kalan tek `radial-gradient`,
`/seni-taniyorum`'daki deklanşör flaş animasyonu (`opacity:0`, tetiklenince çalışır).

### Çark — dört element, başka yok
| | | |
|---|---|---|
| ateş   | `#C4744E` | = `--acc-dk` |
| toprak | `#8A9A6A` | yeni |
| hava   | `#E4CF9A` | = `--gold` |
| su     | `#5E93A8` | yeni |

Açılar: sert → ateş, yumuşak → su, ana → altın, küçük → `--mut`. Retro → `--acc-dk`.
Çarkın üç teması (beyaz/kâğıt/koyu) aynı dört rengi kullanır; yalnız saydamlık değişir.
Astrokartografi'deki on gezegen hattı da bu dörde iner: ışıklar altın, kişisel
gezegenler vurgu, sosyal gezegenler toprak, dış gezegenler su.

### Tek istisna
`#25D366` — WhatsApp marka rengi, paylaşım düğmesi. Başka marka rengi yok.

**TOPLAM: 15.** Site genelinde, JS dahil, başka hex yok. Yeni bir hex eklemek
bu belgeye eklemeyi gerektirir.

## Kurallar

**Vurgu KULLANILIR:** sayfadaki tek birincil düğme · aktif nav göstergesi
(alt çizgi, dolgu değil) · odak halkası · gerçek bağlantı · seçili sekme/filtre.

**Vurgu KULLANILMAZ:** başlıklar ve başlık içi kelime vurgusu · eyebrow ·
gövde içi bold · rozetler · kart kenarlığı ve ayraç · ikonlar ve ✦ süsleri ·
istatistik sayıları (onlar altın) · placeholder · ikincil düğme · footer bağlantıları.

**Sayısal kural:** bir ekranda dolu vurgu renkli **en fazla bir nesne**.

## Sonuç

| | önce | sonra |
|---|---|---|
| Benzersiz hex | 157 | **15** |
| Arayüz rengi | ~107 | **12** + çark 2 + WhatsApp 1 |
| Ekranda sıcak piksel | %6,97 | **%3,83** |
| Doygun + parlak sıcak | %3,88 | **%1,93** |
| Zemin katmanı | 10–13 | **0** |
| Kontrast hatası (12 sayfa, otomatik denetim) | — | **0** |

## Yol boyunca bulunan iki hata

1. **17 sayfada birincil düğmenin yazısı açık renkti** (`--btn-ink:#F6EFE1`)
   → terracotta üstünde **1,81:1**. Sitenin en büyük tıklanabilir yüzeyi aynı
   zamanda en okunmaz yeriydi. Diğer 30 sayfa zaten `#2B140C` kullanıyordu.
   Bu devralınan bir hataydı, bu turda düzeltildi.
2. Birincil düğme üç ayrı biçimdeydi: terracotta düz, terracotta gradyan,
   altın gradyan. Hepsi terracotta düz dolguya indi.
