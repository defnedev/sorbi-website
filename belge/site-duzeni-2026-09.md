# Site düzeni — Eylül 2026

Kayıt: 16–17 Eylül 2026 oturumunda sorbiapp.com'da yapılan görsel/yapısal düzenlemeler, verilen kararlar ve kalan adımlar.
Kod: PR #1 (`site-duzeni` → `main`), birleşme commit'i `cadfc71`.

## Durum

- [x] Değişiklikler GitHub `main` dalında (PR #1 birleşti)
- [x] **Canlıya alındı:** 17 Eyl 2026, Mac'ten `wrangler pages deploy` (d8500ff). Canlı 59 sayfa repo ile birebir karşılaştırıldı.
- [ ] Deploy sonrası sorbiapp.com'da header, renk tonu ve footer göz kontrolü (Defne)
- [x] Deploy sırasında bulunan ek hata düzeltildi: `/destek` sonsuz yönlendirme döngüsündeydi (App Store Support URL `/support` açılmıyordu) → `5db285a`
- [x] Mac'teki 15 Eyl tarihli commit edilmemiş çalışma (sayfa kapısı `tools/kapi.py` + `ACIK.txt`, nav/footer taslakları, sitemap/_redirects değişiklikleri) kaybolmasın diye `yerel-kapi-wip-2026-09-15` dalına yedeklendi; canlıya çıkmadı

Not: Cloudflare Pages GitHub'dan otomatik deploy etmiyor (direct upload). `main`'e girmek siteyi değiştirmez; wrangler komutu gerekir.

## Bulunan sorunlar (denetim)

1. **"head>" yazısı:** 14 Eylül AdSense eklemesinde script 10 sayfada `</head>` etiketinin ortasına yapışmıştı (detayli-dogum-haritasi, burc-uyumu, sinastri, soru-sor, seni-taniyorum, sayim-yukselen, uygun-gun-secimi, hava-burclari, ikizler-burcu-gunluk-yorum, ikizler-burcu-ozellikleri). Script çıkarılınca sayfalar AdSense öncesiyle birebir aynıydı; script `</head>` önüne taşındı.
2. **5 ayrı header sistemi** (sbnav, topnav, sorbi-topnav, Sayım nav'ı, ana sayfa varyantı); logo 4 farklı yazım/3 font; Araçlar'da çift header.
3. **Font:** Space Grotesk'in g/ğ ve D harfleri beğenilmedi.
4. **Renk tonu:** 3 ayrı dünya — mor-siyah (ana sayfa), lacivert-yeşil (araç sayfaları), açık krem (30 burç sayfası).
5. **URL:** kırık iç link yok. "Harita Atölyesi" menü adı ↔ `/detayli-dogum-haritasi` adresi ↔ sayfanın kendi menüsünde "Detaylı Harita" uyumsuzdu.

## Kararlar (Defne)

| Konu | Karar |
|---|---|
| Başlık/logo fontu | Fraunces (etiket, sayı, buton: Inter) |
| Logo | ✦ SORBİ, harf aralıklı |
| Menü | Harita Atölyesi · Doğum Haritası · Gökyüzü Hesaplayıcıları · Bugün · Burçlar · Nadirlik · Sayım · Öğren (+ profil varsa Haritam) |
| Mobil menü | Yana kayan sıra korunur; kenarlara solma eklendi, aktif sekme görünür yere kayar |
| URL'ler | Değişmeyecek (SEO + paylaşılmış linkler) |
| Renk | Tüm sayfalar ana sayfanın arka planı + gökyüzü gradyanı |
| /araclar başlığı | "Gökyüzü Hesaplayıcıları" + içeriği anlatan alt metin |
| Sayfa içi "✦ SORBİ" üst etiketi | Kaldırıldı |
| /burc-ozellikleri | 6×2 ızgara (mobilde 3×4), "Özellikleri" alt yazısı yok |
| Footer | Sol marka bloğu yok; sıra Sorbi · Burçlar · Hesaplayıcılar · Gökyüzü; tüm sayfalarda aynı |
| Harita Atölyesi mobil | Başlık boşluğu azaltıldı, mod seçici 3×2 düzenli ızgara |

## Uygulama notları

- Ortak parçalar sayfalarda işaretli bloklar halinde: `<!-- SORBI-NAV:START/END -->`, `<!-- SORBI-TEMA:START/END -->`, `<!-- SORBI-FOOTER:START/END -->`. Değişiklik gerekince bu blok 58 sayfada birlikte güncellenmeli.
- Fraunces self-host (`/fontlar`, `sorbi-fonts.css?v=10`); 600 dosyası 600–900 ağırlık aralığına tanımlı. Space Grotesk Google Fonts'tan hâlâ yükleniyor çünkü `sorbi-kart.js` paylaşım kartı canvas'ı onu kullanıyor.
- Harita Atölyesi'nin PDF raporu (`#rpt`) bilinçli olarak açık renkte bırakıldı.
- Dokunulmayanlar: /masa (sadece logo), /rapor-araci (iç araç), park edilmiş/yönlendirilen sayfalar.

## Testler

- 59 sayfa eski/yeni yan yana açıldı: yeni JavaScript hatası yok.
- 10 araç sayfası aynı doğum bilgisiyle çalıştırıldı: hesap çıktıları birebir aynı (farklar yalnız kaldırılan/yeniden adlandırılan yazılar).
- Header 58 sayfada ölçüldü: masaüstünde logo konumu, yükseklik (70px), menü birebir aynı; menü 900–1920px arası her genişlikte sığıyor.
- Footer 8 sayfada ölçüldü: sütun konumları piksel olarak aynı.

## Açık konular (karar bekleyen)

- ~~`/`, `/dogum-haritasi-hesaplama`, `/natal-harita` üçlüsü~~ → 17 Eyl fable kararıyla çözüldü (aşağıda).
- ~~Öğren mobil taşma~~ → 17 Eyl düzeltildi.
- ~~`/rapor-araci` açık~~ → zaten noindex; sitemap'te yok.

## 17 Eyl 2026 — ikinci tur (fable incelemesi sonrası)

**Defne kararları:** iOS ve Android henüz çıkmadı → çıkış öncesi e-posta listesi toplanacak (Apple/Google'a bekleyen sayısı gösterilecek). Natal Harita, Horary, Sinastri, Yaşam Döngüleri, Tarot yazılarını biz yeniden yazacağız; Google'a kapalı (noindex) kalacaklar. Ana sayfa kararı fable'a bırakıldı.

**Fable kararı (ana sayfa):** Ana sayfa keşif sayfası; "doğum haritası hesaplama" anahtar kelimesini yalnız /dogum-haritasi-hesaplama sahiplenir. 301 yok (URL kaldırmak sayılır).

**Canlıya alınan (7531299):** ana sayfa title/description/H1, e-posta listesi hesaplayıcı altına + iOS/Android metni + okunur onay metni, 4 kart (Seni Tanıyorum/Nadirlik/Sayım/Öğren), sitemap'ten 6 noindex sayfa + /masa çıktı, /masa noindex, og-sayim-yildiz.png, Öğren mobil taşma, Nadirlik GG.AA.YYYY, 5 yazıda yeşil CTA → ilgili araç, sorbi-profil.js yanlış yorum.
Test: 59 sayfa JS hatası yok; Nadirlik aynı doğum bilgisiyle eski/yeni aynı sonuç; liste formu onaysız/onaylı akış doğrulandı; canlı dosyalar repo ile birebir.

**Veri (D1, 17 Eyl):** liste = 0, profiles = 0; `sayfa` olayı 4 Eyl'den beri 67. Sorun form değil, trafik/dağıtım.

**E-posta pazarlaması (avukat görüşü değil):** Profil onayı ("profilim için işlenmesine") pazarlama e-postası için kullanılamaz (KVKK amaçla sınırlılık). Uygulama duyurusu büyük olasılıkla ticari elektronik ileti (6563 sayılı Kanun) → önceden onay + İYS. Sıra: listede 50 kayıt → İYS kaydı; 100 kayıt → ücretsiz katmanlı gönderim aracı (Brevo/MailerLite). Şimdi araç seçilmeyecek.

**Açık işler:** 5 yazının yeniden yazımı (natal-harita → okuma rehberi; sinastri → neyi ölçer/ölçmez; horary → soru haritası mantığı; yasam-donguleri → gerçek tarihli transit takvimi; tarot → astrolojiden ayrımı, kısa). Liste bloğunun Seni Tanıyorum ve Nadirlik sonuç ekranlarına da eklenmesi. Nadirlik (24.000 harita) ile Seni Tanıyorum (1.367.496 gök anı) yöntem metinlerinin tekleştirilmesi.

## 17 Eyl 2026 — üçüncü tur (açık işlerin kapatılması)

**P0 — canlı hata (9ddb43b, hemen deploy edildi):** /soru-sor'da "Harita çizilemedi: null is not an object (s.hidden)" — 4 Eyl uyum temizliğinde kaldırılan `#summary` elemanına JS yazıyordu. Tüm sayfalar profil verisiyle tarandı; aynı kökenli ikinci hata /haritam'da (`#chips` yok → büyük üçlü ve mühür yüklenmiyordu). İkisi de korumaya alındı. Haritam'daki "Aklındaki soruyu ilet" (hizmet kalıntısı) → "Soruna Bak · Bir soru haritada nasıl okunur".

**Kapatılan açık işler:**
- 5 rehber yazı yeniden yazıldı (fable; noindex korundu, uydurma anekdot/alıntı ve kehanet/hizmet dili kaldırıldı): natal-harita "Haritayı Okuma Rehberi", sinastri "Neyi Ölçer, Neyi Ölçmez", horary "Soru Haritası: Mantığı ve Sınırları", yasam-donguleri "Gerçek tarihli transit takvimi" (2026–2027 ağır gezegen olayları sitenin kendi efemeris motoruyla hesaplandı; Jüpiter→Aslan 30 Haziran 2026 ayrıca doğrulandı), tarot "Tarot Kısaca".
- E-posta listesi: ortak bileşen `sorbi-liste.js` (`<div data-sorbi-liste="kaynak" data-bekle="#sonuc">`); Nadirlik ve Seni Tanıyorum sonuç ekranlarında, sonuç görününce açılır. Kaynak etiketleri: ana-sayfa / nadirlik / seni-taniyorum.
- Yöntem metinleri: Nadirlik (24.000 harita, 1950–2009) ve Seni Tanıyorum (1.367.496 gök anı, 1960–2012) iki ayrı örneklem olduğu, neden ikisinin var olduğu ve oranların neden küçük farklar gösterebileceği her iki sayfada açıkça yazıldı; birbirine ve Sayım'a link.
- AdSense hijyeni: 58 sayfanın footer'ına "Gizlilik ve KVKK" + "İletişim (destek@sorbiapp.com)"; 404 sayfasından reklam kodu kaldırıldı.

**Test:** 59 sayfa eski/yeni JS hata karşılaştırması temiz; profil verisiyle tüm sayfa taraması temiz; 10 araçta hesap çıktıları aynı (farklar yalnız footer linkleri ve yeniden yazılan yazılar); liste bloğu 1440/390 px'te gizli→görünür, onaysız/onaylı akış ve gönderilen kaynak etiketi doğrulandı.

**Hâlâ açık (Defne kararı / zaman):** Space Grotesk yalnız paylaşım kartı sayfalarında yüklensin (performans); günlük burç yorum sayfaları ince içerik (AdSense); Sayım yazılarına paylaş butonu; 12 burç özellikleri sayfasına Sayım verisi + Seni Tanıyorum linki; liste 25'i geçince "X kişi bekliyor" sayacı.

## 17 Eyl 2026 — dördüncü tur (fable 2. denetim + düzeltmeler, canlıda: 1f70af2)

**Canlıya alınan düzeltmeler:**
- **Giriş doğrulama (sorbi-form.js, 11 araç sayfası):** gelecek tarih ("Bu tarih gelecekte"), olmayan gün (31.02 → "Böyle bir tarih yok"), 1900 öncesi uyarısı — hepsi satır içi, `alert()` yok. Bulunamayan şehir artık sessizce İstanbul'a düşmüyor: "Bu yeri bulamadım — hesap İstanbul'a göre yapılır" uyarısı çıkıyor.
- **Liste formu (sorbi-liste.js):** onay kutusu butonun ÜSTÜNE alındı (varsayılan yol hatayla bitiyordu), gerçek `<form>` + Enter ile gönderim, kayıtlı kullanıcıya form bir daha gösterilmiyor. Ana sayfa da artık kendi kopyası yerine bu bileşeni kullanıyor (tek kaynak).
- 6 sayfada kalan sayfa içi "✦ SORBI" etiketi kaldırıldı (üstelik Türkçe olmayan I ile yazılıydı).
- 5 rehber birbirine bağlandı ("Diğer rehberler"); /tarot artık Günün Kartı'ndan link alıyor (önceden yetimdi).
- sorbi-yildiz.js: "dekilinasyon" → "deklinasyon" (Seni Tanıyorum sonucunda görünüyordu).

**Fable 2. denetim — kalan bulgular (yapılmadı):**
- Yükselen hesaplayıcısı saat alanı 12:00 dolu geliyor; dokunmayan kullanıcı kesin bir yükselen alıyor → boş+zorunlu ya da "12:00 varsayıldı" şeridi (30 dk).
- burc-uyumu burç seçici klavye/ekran okuyucuyla kullanılamıyor (tabindex/role yok), `.sg .n` ~10px, `--dim` ipucu kontrastı 3,53:1 (AA 4,5 altında) (45 dk).
- Ana sayfada keşif kartları masaüstünde 1409px, mobilde 1637px aşağıda; kartlar hesaplayıcının hemen altına, liste bloğu sonuç görününce açılacak şekilde taşınabilir (1 s).
- "X kişi bekliyor" için altyapı yok: `liste` tablosunda onay metni sürümü yok, sayı ucu (`GET /api/liste/sayi`) yok, doğrulama e-postası yok. Not: Apple'ın Pre-Order ve Google'ın Pre-registration sayaçları ayrı; bizim liste onların yerine geçmez.
- Inter Google Fonts'tan render-blocking geliyor (sayfa başına 210–269 KB font); Fraunces gibi self-host edilebilir (~−100 KB, −1 RTT).
- Hata dili tutarsız: bazı sayfalar `alert()` kullanıyor, ortak satır içi hataya çevrilebilir.
- /destek sayfası uygulama çıkmadan App Store abonelik fiyatlarını (₺59,99/hafta) anlatıyor; footer ve sitemap'te.
- Fable'ın "yapmayalım" dediği: Space Grotesk'i 56 sayfadan ayıklamak (ölçüm: sayfa açılışında 0 bayt iniyor, kazanç yok), 5 yazıyı yeniden elden geçirmek, günlük yorum sayfalarını şablon metinle şişirmek.

**Defne'nin kararı gereken 2 soru:** (1) 5 rehber artık özgün ve doğru — Google'a açalım mı, yoksa 58 sayfanın footer'ından çıkarılsınlar mı (noindex sayfaya 58 yerden link vermek anlamsız)? (2) /destek uygulama çıkana kadar footer ve sitemap'ten çıksın mı (adres App Store için kalır)?

## 18 Eyl 2026 — beşinci tur (Defne'nin listesi, orkestra: 6 agent, canlıda: 3018c17 / Mac 812d58f)

**Defne'nin istekleri ve karşılıkları:**
- **"Sorbi telefonuna geliyor" bölümü kaldırıldı** (ana sayfa `#uygulama` bloğu + `sorbi-liste.js` etiketi + 58 footer'daki "Uygulama" linki). Liste bileşeni Nadirlik ve Seni Tanıyorum sonuç ekranlarında duruyor.
- **Öğren metin alanı genişledi:** `.wrap` 780→920px, giriş paragrafı 56→72ch, ders metni 62→76ch, çıkarım 60→74ch. 390px'te değişiklik yok.
- **"Profilim" her zaman görünür ve navın en sağında** (58 sayfa). Artık profil yoksa da duruyor (tıklayınca doğum bilgisi ekranı). Etiket her durumda "✦ Profilim" — "Profil Haritam"a dönüşmüyor. 1440 ve 390px'te, profilli ve profilsiz doğrulandı: son link her zaman "✦ Profilim".
- **Sekme seçim durumu (design agent önerisi uygulandı):** aktif sekme 40px yüksekliğinde dolu altın pill (`#E3A692` zemin, `#1A0F14` metin — kontrast 9,03:1), `aria-current="page"`, hover'da hafif dolgu, klavye için `:focus-visible` halkası, `prefers-reduced-motion` desteği; aktif sekme mobilde görünür alana ortalanıyor.
- **Nav ebeveyn haritası:** navda kendi sekmesi olmayan sayfalar artık ait olduğu sekmeyi yakıyor — /soru-sor, /horary, /sinastri, /natal-harita, /yukselen-burc-hesaplama, /ay-burcu-hesaplama, /burc-uyumu, /tarot, /gunun-karti, /astrokartografi, /uygun-gun-secimi, /yasam-donguleri, /retro-ay-takvimi, /rapor-araci, /seni-taniyorum → "Gökyüzü Hesaplayıcıları"; /sayim-* → "Sayım"; burç sayfaları → "Burçlar"; /haritam → "Profilim". Böylece hiçbir sayfa "hiçbir sekme seçili değil" durumunda kalmıyor.
- **900–1119px'te nav kaydırma göstergesi:** 9. link (Profilim) eklendikten sonra bu aralıkta nav kaydırmalı hale geliyor; sağ/sol solma maskesi 899px yerine 1119px'e kadar açıldı. 1280px ve üstünde tam sığıyor (976/976).
- **/soru-sor gerçek horary oldu:** "Sorunun Anının Haritası" — doğum saati gerekmez, konu→ev seçimi, şimdi ya da geçmiş bir an, ev sistemi (Regiomontanus varsayılan), 6 "hesap + geleneksel kural" kutusu, ikincil katman olarak natal karşılaştırma, /horary rehberine ve Atölye'ye (`?m=moment`) link. Yükselen doğrulaması: sayfa 12° Yengeç 52′, Atölye 12° Yengeç 52′58″, bağımsız Meeus kontrolü ile fark <1′.
- **Harita çıktısı sadeleşti:** basit sayfada görünür kelime 662→264, sayfa yüksekliği 4128→3380px (1440), 5211→4440px (390); Atölye 2666→2061 / 5061→3826px. Detaylar `<details>` içine alındı, yazdırmada hepsi otomatik açılıyor. Tablo ve değerler birebir aynı (12 hesaplayıcı sayfasında sayısal çıktı karşılaştırıldı).
- **Nadirlik:** doğum bilgisi inputları artık kaymıyor (1440px'te iki kolon 388,9/406,9 → 513,9/513,9; ≤480px tek kolon), tek büyük başlık sayısı + 100 noktalı ölçer, `nadirlik-veri.json`'dan 3 merak kutusu, kuşak yerleşimleri `<details>` içinde. 23 sonuç sayısı birebir aynı.
- **sorbi-sohbet.js mobil uygulamanın kurallarına hizalandı:** Özet/Yorum/Zamanlama/Sınır yapısı, doğum saati yoksa ev/açı iddiası üretmiyor (halüsinasyon engeli), olasılık kipi süzgeci (`kipSuz`), kriz yolu (`krizMi`), 90 kelime sınırı, `SorbiSohbet.ozTest()`. Dış API aynı — çağıran sayfalar değişmedi. 10 konu × saatli/saatsiz denendi, yasaklı kalıp 0.
- **Uyum:** /odeme-tamam artık `/`'a 301 (parked ödeme akışının son sayfasıydı); Atölye'deki hayz tanımında "olacak" → "olmalı". /gizlilik hâlâ kanonik politikaya 301 — Mac'te bulunan yerel `gizlilik.html` taslağı kaybolmasın diye ayrı commit'le (1f28c47) saklandı, hiçbir yerden linklenmiyor ve sitemap'te değil; açılıp açılmayacağı Defne'nin kararı.

**Test:** 59 sayfa eski/yeni `pageerror` karşılaştırması → 0 hata (iki tarafta da); 12 hesaplayıcı sayfasında sayısal çıktı kümesi birebir aynı (tek fark Nadirlik'te yeni eklenen sayılar, kaybolan yok); 390/768/1440px'te yatay taşma yok (58 sayfa); nav 900–1920px ölçüldü; uyum taraması 43 hit → hepsi triyajlı (yorum/blocklist tanımı, meslek listesi, disclaimer, App Store abonelik SSS'i), gerçek ihlal yok. Canlı doğrulama: değişen 60 dosya canlıda repo ile birebir aynı (Cloudflare e-posta gizleme normalize edildi); /soru-sor /nadirlik /ogren /haritam /araclar /destek 200, /support /odeme-tamam /randevu /gizlilik /privacy doğru 301.
