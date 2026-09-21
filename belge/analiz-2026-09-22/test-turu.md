# Sorbi web sitesi — temizlik turu sonrası regresyon testi

Tarih: 22 Eylül 2026 · Ortam: yerel `python3 -m http.server 8899`, Playwright Chromium 1194,
390×844 · dpr 2 · isMobile · tr-TR · Europe/Istanbul. `/api/**` istekleri canlı sorbiapp.com'a
vekillendi. Hiçbir dosya değiştirilmedi. Test betikleri: `scratchpad/t/` (smoke.mjs, flow.mjs,
burc.mjs, persist.mjs, post.mjs, ovf.mjs, astro.cjs).

Test verisi: 14.06.1994 · 09:35 · İstanbul (41,0138 K · 28,9497 D).

---

## Sonuç tablosu

| Madde | Sonuç | Not |
|---|---|---|
| A · Duman testi, 65 sayfa | **GEÇTİ** (65/65) | Hiçbir sayfada JS/pageerror yok. Tek tekrarlayan kayıt: `/api/track` beacon'ı canlı uçtan 403 aldı (yerel origin) — ölçüm ucu, sayfa işlevini etkilemiyor. bugun.html ve ikizler-burcu-ozellikleri'nde `pagead2.googlesyndication.com/pagead/ping` ERR_ABORTED (reklam ağı, dış). |
| B1 · index.html akışı | **GEÇTİ** | Büyük üçlü: ☉ 22° İkizler 59′ · ☽ 20° Aslan 43′ · AC 12° Aslan 55′. Harita SVG çizildi (103 KB). Gökyüzü halkası doğum anına gitti; anlatı: "Güneş doğudan yükseliyordu. Gündüz doğmuşsun. Ay tam ufuktaydı, doğuda; büyüyordu. Merkür o gün geri gidiyordu." Transit listesi doldu. |
| B2 · /dogum-haritasi-hesaplama | **GEÇTİ** | Güneş İkizler 22°59 · Ay Aslan 20°44 · Yükselen Aslan 12°55. |
| B3 · /detayli-dogum-haritasi | **GEÇTİ** | ☉ 22° İkizler 59′ · ☽ 20° Aslan 43′ · AC 12° Aslan 55′ · ARMC 30.03° · Placidus · gündüz haritası. |
| B · Üç sayfa aynı harita mı? | **GEÇTİ** | Üç sayfa da aynı Güneş/Ay/Yükselen'i veriyor (Ay'daki 43′/44′ farkı yuvarlama). Bağımsız hesapla da doğrulandı (aşağıda Astrolog). |
| B4 · /nadirlik | **GEÇTİ** | Sonuç çıktı: en nadir yan "Mars Boğa — 13 kişiden 1"; üçlü İkizler·Aslan·Aslan 1.300 kişiden 1; 9 yapısal olgu. Örneklem metni her yerde **210.384 harita (1930–2025)**, üçlü için 1.367.496 gök anı. Sayfada **24.000 yok**. |
| B5 · /seni-taniyorum | **GEÇTİ** | "Gururlu Rüzgâr" okuması, üçlü nadirliği (100.000'de 75, ~1.342'de 1), 5 paragraf yorum, geri bildirim ve soru kutusu çıktı. |
| B6 · /yukselen-tahmini | **GEÇTİ** | Saatsiz akış sonuna kadar gitti: 13 yükselen penceresi listelendi → sorular → "Ayırt edilemedi / en yakın iki aday 04:16–06:08 ve 22:56–00:00" ekranı + "Bu saatle devam et / Baştan". (Cevapsız girişte adayları ayıramaması yöntemin beyan edilmiş sınırı, hata değil.) |
| C · Kalıcılık (sorbi_birth) | **KISMEN GEÇTİ** | index'te girilen bilgi dogum-haritasi-hesaplama, detayli, yukselen-burc, ay-burcu, soru-sor, astrokartografi, yukselen-tahmini, uygun-gun-secimi'nde çip + ön dolumla geldi. "çıkış" çalışıyor: sorbi_birth ve sorbi_profile silindi, form boşaldı. **KALDI:** /nadirlik çip göstermiyor ve tarih/saat alanlarını doldurmuyor (sorbi-profil.js yüklü değil, sorbi_birth yalnız lat/lon için okunuyor). detayli-dogum-haritasi kendi girişini sorbi_birth'e YAZMIYOR (yalnız okuyor). |
| D · /rapor-araci yönlendirmesi | **GEÇTİ (dosya düzeyinde)** | `_redirects` satır 74-75: `/rapor-araci` ve `/rapor-araci.html` → `/detayli-dogum-haritasi` 301. `rapor-araci.html` dosyası yok (yerelde python 404 veriyor; `_redirects` yalnız Cloudflare Pages'ta çalışır — yerelde doğrulanamaz). sitemap.xml'de yok, hiçbir sayfada `href` yok. Tek kalıntı: 61 sayfadaki nav vurgulama betiğinde `'/rapor-araci':'/araclar'` anahtarı (zararsız, ölü anahtar). |
| E · Yatay taşma (65 sayfa, yüklenme anı) | **1 KALDI** | hakkinda.html: scrollWidth 406 / clientWidth 390 → **16 px taşma**. Diğer 64 sayfa 390/390. |
| E' · Yatay taşma (sonuç çıktıktan sonra) | **1 KALDI** | index.html profil doluyken: `.calc` kolonu 392,8 px (kap 351 px) → büyük üçlü kartları ve transit kartları sağdan **~22 px kesiliyor** (ekran görüntüsü: Yükselen kartında "55′" kenarda, transit kartlarının sağ kenarı yok). dogum-haritasi-hesaplama, detayli, seni-taniyorum, yukselen-burc, ay-burcu, soru-sor: taşma yok. |
| F · "24.000" hâlâ görünüyor mu? | **3 sayfada EVET** | ogren.html:232 ("24.000 gök anında saydık"), sayim-yukselen.html (meta, JSON-LD, gövde: 10 yerde), sayim.html:193 (hub kartı). Bunlar 24.000'lik eski sayım yazısının kendisi ve ona işaret eden iki bağlantı; nadirlik/burç sayfalarına sızma yok. Ancak içerik çelişkisi var — bkz. Astrolog 3. |
| F · Silinen sayfaya bağlantı | **GEÇTİ** | 65 sayfada `rapor-araci`'ye giden `href` yok; kırık iç bağlantı yok (tüm href'ler dosyaya çözüldü). Sitemap 61 giriş, hepsinin dosyası var. |
| Bugünkü diğer değişiklikler | **GEÇTİ** | araclar.html: 9 `.tool` kartı (3 hot + 6). burc-ozellikleri hub'ında çark/ızgara/dağılım/sınav yok, 12 kart var; kunye slotu doluyor (kapalı `<details>` içinde). index `#dogum-haritasi` id'si + scroll-margin-top (58/70/50 px) var, 30+ sayfa `/#dogum-haritasi`'ye bağlanıyor. ogren.html: "Merkür 24 Ekim – 13 Kasım 2026 geri" — motorla doğrulandı (24 Ekim Rx başlangıcı, 14 Kasım direkt). ogren-veri.json geçerli JSON, uretim 2026-09-21, meta bloğu eklenmiş. Altbilgi 64 sayfada birebir aynı (masa.html'de altbilgi yok — tasarım gereği görünüyor). uygulama.html açılıyor, 5 adet "Metin bekleniyor." yer tutucusu var. |

Toplam: **20 madde → 16 GEÇTİ, 1 KISMEN, 3 KALDI** (nadirlik kalıcılığı, index taşması, hakkinda taşması).
Konsol hatası: 0/65. Regresyon: **evet, iki adet kullanıcıya görünür düzen/akış kusuru; hesap katmanında regresyon yok.**

---

## TEST MANAGER

1. 65 sayfa duman testi temiz: 0 pageerror, 0 gerçek konsol hatası. Yeni `sorbi-sayim.js` servisi 12 burç sayfası + burc-uyumu + nadirlik + hub'da yükleniyor, tüm `[data-sayim]` yuvaları doluyor, hiçbir sayfada "NaN/undefined/yükleniyor…" kalmıyor.
2. Doğum bilgisi akışı üç hesap sayfasında da aynı büyük üçlüyü veriyor; nadirlik, seni-taniyorum ve yukselen-tahmini sonuna kadar gidiyor. Hesap katmanında regresyon yok.
3. En kritik 3 bulgu: (a) index.html'de sonuç çıkınca büyük üçlü + transit kartları 390 px'te sağdan ~22 px kesiliyor — ana sayfanın ana akışı, mobilde herkes görür; (b) /nadirlik profil çipi göstermiyor ve kaydedilmiş doğum bilgisini doldurmuyor — kullanıcı "bilgilerin her araçta hazır" vaadine rağmen yeniden giriyor; (c) sayim-yukselen/ogren "en sık yükselen Aslan" derken nadirlik "en yaygını Terazi" diyor — aynı sitede iki farklı iddia.
4. Küçük: hakkinda.html 16 px yatay taşma; nadirlik künye cümlesi bozuk ("…— ev ve açısal noktalar enleme bağlıdır ile hesaplandı"); nadirlik'te "Ay evresi: buyuyen hilal" ASCII etiket; "MC MC Boğa" / "AC Yükselen Aslan" çift etiket.
5. Yerelde doğrulanamayan: `_redirects` (Cloudflare Pages) — dosya doğru, canlıda `curl -I https://sorbiapp.com/rapor-araci` ile 301 kontrolü yapılmalı. `/api/track` canlı 403'ü yerel origin kaynaklı; canlıda ayrıca teyit edilmeli.
6. detayli-dogum-haritasi girilen bilgiyi `sorbi_birth`'e yazmıyor; kullanıcı ilk girişi orada yaparsa diğer araçlara taşınmıyor (tasarım kararı olabilir; belirtildi).
7. Karar: hesap ve veri katmanı yayınlanabilir; (a) ve (b) yayın öncesi düzeltilmeli, (c) editoryal karar ister.

## CPO

1. Ana sayfada bilgi giren herkes (390–414 px cihazlar) büyük üçlü kartlarının sağ kenarının kesildiğini görür; "Yükselen" kartı en çok merak edilen değer ve tam o kesiliyor. Fark edilir.
2. "Bilgilerin her araçta hazır" çipi nadirlik'te yok; kullanıcı index'ten "Nadirlik"e geçince tarih ve saati sıfırdan giriyor. Vaat kırılıyor; hem de bugün yeniden kurulan sayfada.
3. Aynı oturumda seni-taniyorum "1.342 kişide bir", nadirlik "1.300 kişiden 1" diyor — aynı üçlü, iki sayı. Kullanıcı çelişki sanır; yuvarlama kuralı tek olmalı.
4. Sayım anlatısı: nadirlik "en yaygın yükselen Terazi %10,7" derken sayım hub'ı ve ogren "Aslan 2,2 kat" diyor. "Sayım, tahmin değil" iddiası olan bir sitede iki cevap olması güveni zedeler.
5. uygulama.html canlıya çıkarsa 5 yerde "Metin bekleniyor." okunur; sitemap'te ve 2 sayfadan bağlantılı. Metin gelmeden yayınlanmamalı ya da noindex olmalı.
6. araclar.html 9 karta inmiş; nadirlik, detaylı harita, sinastri, astrokartografi, uygun gün, yaşam döngüleri, yükselen tahmini kart değil yalnız metin bağlantısı. Kırık değil ama bulunabilirlik düştü; başlık hâlâ "Ücretsiz Astroloji Araçları", h1 "Gökyüzü Hesaplayıcıları".
7. Kopmayan akışlar: giriş → harita → transit → Atölye; giriş → seni-taniyorum → soru; saatsiz → yükselen tahmini sonuna kadar. "çıkış" bilgiyi gerçekten siliyor.

## CTO

1. **index.html:92** `@media(max-width:880px){.calc{grid-template-columns:1fr}}` — `1fr` = `minmax(auto,1fr)`, kolon min-content'e büyüyor (392,8 px); **index.html:130** `.b3 .v{white-space:nowrap}` üç kartı sıkıştırılamaz kılıyor. Masaüstü kuralı (satır 91) zaten `minmax(0,…)` kullanıyor; mobil kuralı `minmax(0,1fr)` olmalı ya da `.calc>div{min-width:0}`.
2. **hakkinda.html:98** `.sbnav{margin:-2rem -2rem 2rem!important}` + **hakkinda.html:25** `@media(max-width:560px){body{padding:1rem}}` → başlık gövdeden 16 px taşıyor. uygulama.html:132 aynı sorun için `@media(max-width:560px){header.sbnav{margin:-1rem -1rem 1.5rem!important}}` düzeltmesini içeriyor; hakkinda'da (ve destek/gizlilik'te gövde 2rem kaldığı için görünmüyor ama aynı desen) yok.
3. **nadirlik.html**: `sorbi-profil.js` script etiketi yok (55 sayfada var, nadirlik + sayım sayfaları + ogren'de yok); `sorbi_birth` yalnız satır 218'de lat/lon için okunuyor, `#tarih/#saat/#yer` ön dolumu yok. seni-taniyorum.html'deki ön dolum kalıbı aynen taşınabilir.
4. **detayli-dogum-haritasi.html**: `sorbi_birth` üç yerde okunuyor (319, 2008-2020), hiçbir yerde `setItem` yok. Diğer 8 hesap sayfası yazıyor.
5. **sorbi-ozellik.js:214** `'Ay evresi: ' + e[0].replace(/-/g,' ')` — id'den insan adı üretiyor; "buyuyen hilal", "kuculen siskin" ASCII kalıyor. Katalogda ayrı `ad` alanı gerekli.
6. **nadirlik.html** künye şablonu `K.yer + ' ile hesaplandı'` dizerken `ozellik-veri.json.yer` alanı "İstanbul (41,01°K 28,98°D) — ev ve açısal noktalar enleme bağlıdır" içeriyor; sorbi-burc.js:224 aynı alanı `split('—')[0]` ile temizliyor, nadirlik temizlemiyor.
7. **sorbi-yer.js:72** yerel il kayıtlarında `admin1: 'Türkiye'` (merkez=il ise) + **dogum-haritasi-hesaplama.html:462** `[x.name,x.admin1,x.country].join(', ')` → `sorbi_birth.place = "İstanbul, Türkiye, Türkiye"`. Çipte `split(',')[0]` sayesinde görünmüyor, PDF/paylaşım etiketlerinde görünebilir.
8. 61 sayfadaki nav betiğinde `'/rapor-araci':'/araclar'` ölü anahtar; zararsız ama temizlik listesine girmeli. sorbi-sayim.js `SURUM='1'` + `?v=1`: veri dosyası değiştiğinde ikisi birlikte artırılmalı (dosyada belgelenmiş, uyulmuş).

## ASTROLOG

1. Bağımsız kontrol (astronomy-engine + kendi ARMC/ASC formülüm, 14.06.1994 06:35 UT, 41,0138 K / 28,9497 D): ☉ 22°59′ İkizler, ☽ 20°44′ Aslan, ☿ 8°19′ Yengeç R, ♀ 28°47′ Yengeç, ♂ 15°49′ Boğa, ♃ 5°15′ Akrep R, ♄ 12°20′ Balık (direkt; istasyon 23 Haziran), ♅ 25°35′ Oğlak R, ♆ 22°44′ Oğlak R, ♇ 25°58′ Akrep R; ARMC 30,03°, **AC 12°55′ Aslan, MC 2°13′ Boğa**. Üç sayfa da bununla dakika dakika örtüşüyor. Harita doğru.
2. Yorum katmanı tutarlı: harita yöneticisi Güneş 11. evde (Aslan yükselen, Güneş 50° önde) ✓; "5 gezegen geri" ✓ (Satürn henüz direkt); Mars Boğa'da zararda ✓; yedi klasik gezegenin hiçbiri yücelme/yönetimde değil ✓; su elementinde 4+ (☿♀ Yengeç, ♃ Akrep, ♄ Balık) ✓; detaylı sayfanın "baskın element Su" 10 gezegenle (5 su) ✓; Ay–Güneş uzaklığı 57,7° → büyüyen hilal ✓; Güneş 3. dekan İkizler = Güneş'in yüzü ✓; Ay–Mars kare (20° Aslan – 16° Boğa) ✓; gündüz haritası ✓.
3. **Çelişki (editoryal):** sayim-yukselen.html ve ogren.html "İstanbul enleminde en sık yükselen Aslan, Balık'tan 2,2 kat" (24.000'lik örneklem: Aslan 10,67 / Terazi 10,65 / Akrep 10,62); nadirlik ve 12 burç sayfası (210.384): **Terazi 10,67 / Başak 10,61 / Aslan 10,53 / Akrep 10,50**, en seyrek Koç 4,87 / Balık 4,85. Sıralamadaki fark örneklem gürültüsü (Aslan–Terazi arası 0,02–0,15 puan), astrolojik olarak doğru olan şey "uzun yükselişli burçlar (Yengeç–Yay) sık, kısa yükselişliler (Oğlak–İkizler) seyrek"dir. "En sık Aslan" cümlesi tek bir burcu öne çıkardığı için artık savunulamaz; ogren.html:232 ve sayim.html:193 yeni sayımdan güncellenmeli, sayim-yukselen ya arşiv notu almalı ya yeniden üretilmeli.
4. Yeni 210.384'lük örneklem eskisinden **daha sağlam**: Ay burcu dağılımı %8,31–8,35 (düz) — eski 24.000'lik örneklemde Ay dağılımı 1.500–2.550 arasında dalgalanıyordu (yılda 40 sabit tarih × 9,1 gün adımı sideral ayla örtüşüp yanlılık üretiyor). Güneş dağılımı Yengeç %8,61 / Oğlak %8,06 — bu yanlılık değil, Dünya'nın günberi hızı (Güneş Oğlak'ı ~29,5, Yengeç'i ~31,4 günde geçer); doğru ölçülmüş.
5. index gökyüzü anlatısı doğru: Ay 20° Aslan, yükselenin 8° altında, doğu ufkunda doğmak üzere ("tam ufuktaydı, doğuda") ✓; Merkür 12 Haziran–6 Temmuz 1994 geri ✓.
6. Transitler (22.09.2026): ♄ 12,3° Koç üçgen natal AC 12,9° Aslan, geri gidiyor → "0,6° ayrılıyor" ✓; ♇ 3,2° Kova geri, kare MC 2,2° Boğa → "1,0° yaklaşıyor" ✓; ♇ kare natal ♃ 5,25° Akrep 2,0° ✓.
7. ogren.html tarih düzeltmesi doğru: Merkür 24 Ekim 2026 istasyon-geri, 13/14 Kasım direkt (motorla teyit).
8. Üçlü nadirliği aynı veriden (1.367.496 gök anı) geliyor ama seni-taniyorum "1.342'de 1", nadirlik "1.300'de 1" basıyor; 1507/1728 sıra ↔ "%87'lik dilim" tutarlı. Yuvarlama tek yerde (serviste) yapılmalı.
