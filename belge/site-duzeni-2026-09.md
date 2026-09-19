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

### 18 Eyl 2026 — Defne'nin üç kararı (canlıda: cb139ff)

1. **5 rehber Google'a açıldı.** natal-harita, sinastri, horary, yasam-donguleri, tarot: `noindex,nofollow` kaldırıldı, sitemap'e eklendi (priority 0.7, 54 URL). Başlık/açıklama/canonical yerinde, uyum taraması temiz. 58 sayfadan aldıkları footer linki artık anlamlı.
2. **/destek footer ve sitemap'ten çıktı.** 58 sayfanın footer'ından link kaldırıldı, sitemap'ten silindi, sayfaya `noindex,follow` eklendi. Sayfa erişilebilir kaldı (App Store Support URL'i ona bakıyor). Uygulama çıkınca geri eklenecek.
3. **LLM:** Defne'nin kurduğu sistem tarandı (aşağıdaki bölüm). Site tarafında uygulama kararı bekliyor.

### Mevcut LLM altyapısının haritası (18 Eyl 2026 taraması)

İki bağımsız sistem var, sitede LLM yok.

**AstroMotor (Python/FastAPI)** — `content/llm_provider.py`: 5 sağlayıcı (Gemini 2.5 Flash, Claude Haiku 4.5, Claude Sonnet 4, gpt-4o-mini, Grok 3 Mini Fast) ve 4 zincir + consensus: `standard` openai→claude→gemini→grok, `premium` claude_sonnet→…, `creative`, `bold` (satır 211-216). Kademe soru tipinden geliyor: `consultation/classifier.py` soruyu 6 tipe sokuyor (NATAL/HORARY/TRANSIT/RELATIONSHIP/LIFE_AREA/GENERAL_QA), `consultation/engine.py:40-56` her tipe kademe ve token bütçesi veriyor (1500–3000); kullanıcı standard seçse bile tip gerektiriyorsa otomatik yükseltiliyor. Circuit breaker 5 hata → 10 dk. Prompt'lar `consultation/prompts.py` (544 satır): 7 persona, 6 builder, 3 çıkış şablonu, 6 adımlı zorunlu analiz sırası ve anti-halüsinasyon kuralı ("Swiss Ephemeris verisinde yoksa uydurma"). Çıkış süzgeci sadece içerik üretiminde var (`llm_content_enricher.py:24-53`), danışmanlık yolunda yok.

**Sorbi backend (.NET, ~/Desktop/SorbiBackend)** — maliyete göre 3 kademe, `AIRouter.cs:48-69`, fiyatlar kodda yazılı: Economy (llama-3.1-8b 0,05$ → gemini-2.0-flash → llama-3.3-70b), Standard (llama-3.3-70b → gemini-2.5-flash → gemini-2.0-flash), Premium (gemini-2.5-flash → llama-3.3-70b → gpt-4.1-mini → gemini-2.5-pro 1,25/10$). Görev tipi eşlemesi `AIRouter.cs:72-80` (Chat/Validation → Economy, Guidance/Analysis/Creative → Standard, Synthesis → Premium) + kullanıcı segmenti override'ı (Premium/Professional → Premium tier). Template üç katman: kod içi prompt kütüphanesi `AstrologySystemPrompts.cs` (3368 satır, ~34 blok), derlenmiş builder'lar `AI/Prompts/*.cs` (5 dosya), ve **admin panelden düzenlenebilir DB template'leri** (`AIPromptTemplates` tablosu, `{{natalChart}}` gibi yer tutucular, A/B varyant hash%2). Kota: `PremiumGating.cs` — ai_chat 7/gün, compatibility 1/gün, transit/synastry/detaylı harita premium (AI maliyet puanı 3/5/10), günlük burç AI çağırmıyor (template'ten). Cache `AstroTemplateCache` 24 saat. Çıkış güvenliği asıl burada: `OutputValidator.cs` (533 satır, sistem tag'i/URL allowlist/PII/secret redaksiyonu), `PredictiveLanguageBlocker.cs` (~35 yasak kalıp, `RetryFeedbackPromptTr` ile modele yeniden yazdırma, son çare mesaj), `Safety/` altında kriz tespiti + YEDAM hattı, tıbbi/finansal/romantik manipülasyon blokerları; girişte `InputSanitizer` + untrusted sarma.

**Tespit edilen kusur (taşımadan önce düzeltilmeli):** kademe merdiveni canlı yolda bağlı değil. `ResolveProviderAndModel` yalnız testlerden çağrılıyor; üretim yolu `Sorbi.Infrastructure/Services/AIService.cs:74-77` doğrudan `FallbackOrder`'ı geziyor ve `request.Tier`'ı yok sayıyor; client'lar `ModelOverride` boş olduğu için sabit modelle çalışıyor. Yani prod'da her çağrı `groq / llama-3.3-70b`'ye gidiyor, Economy/Premium ayrımı kâğıt üstünde.

**Siteye ne birebir gelir:** kademe tabloları ve yönlendirme kararı (saf veri), tüm prompt metinleri, `AIPromptTemplates` şeması D1'e, `{{...}}` ikamesi ve A/B, çıkış süzgeçleri (regex'ler — `ı/İ` için test şart), sağlayıcı çağrıları (hepsi düz HTTPS, Workers `fetch`), kota sayacı (D1'de .NET'in in-memory sürümünden daha iyi olur), cache ve rate limit. **Yeniden yazılacak:** Swiss Ephemeris (Workers'ta çalışmaz — Cloud Run servisi HTTP ile çağrılır) ve harita verisi serileştiricileri, `ResilientAIClient`/DI/Prometheus katmanı, oturum ve konuşma hafızası tabloları. **Gelmez:** React Native tarafı, FastAPI router'ları, içerik fabrikası (Instagram/Canva), push teslimatı.

## 18 Eyl 2026 — altıncı tur (ücretsiz katman kısıldı, Burçlar/Uyum yenilendi, oyunlaştırma geldi; commit 42a7a1d)

Defne'nin talimatı iki başlıktı: (1) "bu kadar detayı premiumda verelim, servisi boşuna yorma, bu dataları çıkartmak için gereksiz maliyet — bu bakış açısında devam et", (2) "burçlar ve burç uyumunu çok daha iyi hale getirmelisin, gamification ve öğrendeki hareketleri her yere entegre edip daha pahalı ve profesyonel durmasını sağla".

**Ücretsiz katman kısıldı (/soru-sor).** Siteden kalkanlar: dignite çipleri (dekan/düşüş/üçlü yönetici), günlük hız dereceleri, "burcu terk etmesine X°", alıcılık–engelleme paragrafı, Zamanlama kutusunun tamamı. Yerine fiyatsız ve linksiz tek şerit: tam okumanın (dignite tablosu, alıcılık/engelleme, zamanlama penceresi) uygulamada hesaplandığı bilgisi. Kalan 5 kutuda KURAL metni en fazla 2 cümle. Türetilmiş hesap çağrısı 9 → 2 (−%78), `sorbi-dignite.js` bu sayfada artık hiç istenmiyor, iskelet içi görünür kelime 358 → 217, sayfa yüksekliği 390px'te 11.048 → 10.470. Görünür dereceler ve radikallik kutusu birebir aynı (yükselen 27° Yay 02′, Ay 21° Yay 23′ — önce ve sonra). Dürüst not: bu sayfanın hesabı tarayıcıda dönüyor, sunucu maliyeti yoktu; kazanç indirilen dosya, CPU ve değerin ücretsiz dağıtılmaması tarafında. 216 kombinasyon (9 konu × 3 ev sistemi × 8 an) tarandı, hata 0.

**Yeni paylaşılan modüller.**
- `sorbi-gosteri.js` (20,1 KB ham / 7,5 KB brotli): bildirimli canlı gösterim — `<div data-sorbi-gosteri="zodyak-carki" data-burc="Akrep">`. 6 tip: zodyak-carki, element-nitelik, aci-gosterimi, retro-dongusu, uzaklik-grafigi, yukselen-halkasi. Retina ölçekleme, sekme gizlenince duraklatma, `prefers-reduced-motion`'da statik kare, klavye erişimi, canvas dışında metin özeti. Açı sınıflandırması `sorbi-astro.js`'in ortak tablosundan; efemeris yüklemiyor.
- `sorbi-oyun.js` (13,9 KB / 5,0 KB brotli): sunucusuz oyunlaştırma — tek anahtar `sorbi_oyun_v1`, sıfır istek, hesap yok, çerez yok. Puan, 5 seviye, seri (gün atlanınca sıfırlanır), nişan, çoktan seçmeli sınav (anında geri bildirim + doğru yanıtın nedeni), ilerleme halkası. `data-onek` ile bölüm bazlı sayım (Öğren yalnız `ogren`, hub yalnız `burc-` anahtarlarını sayıyor). localStorage kapalıysa bellekte çalışıyor ve kullanıcıya söylüyor. Rozetler öğrenmeye dayalı; şans/kehanet dili yok.
- `ogren.html` bu modüllere taşındı: 227 satırlık satır içi çizim kodu silindi, dosya 32,6 → 28,3 KB, metin genişlikleri ve anlatım aynı (giriş bölgesi piksel farkı 0).

**Burçlar (hub + 12 sayfa).** Hub 63 → 962 kelime: element (5) ve nitelik (4) süzgeci, 12 zengin kart (glif, tarih aralığı, element, nitelik, yönetici, özet, 24.000 haritadaki gerçek oran), seçime göre canlı güncellenen zodyak çarkı ve element×nitelik ızgarası, 12 burcun Güneş/Ay/yükselen dağılım grafiği, ilerleme halkası + 4 soruluk sınav. 12 burç sayfası tek Python üreticiyle basıldı (~580 → ~1.100 kelime): kimlik şeridi (yönetici + modern yönetici, element, nitelik, karşı burç, tarih aralığı, kuşak derecesi), iki gösterim, `burc-dagilimi` + gerçek oran ve sıra, 3 soruluk sınav, "okudum" işaretlemesi, /dogum-haritasi-hesaplama + /seni-taniyorum linkleri. Mevcut SEO metni korundu: 13/13 sayfada meta title/description/canonical/og aynı, h1 aynı, mevcut tüm h2 ve `<p>` metinleri yerinde (0 hata). Yeni `sorbi-burc.js` (9,6 KB) `SorbiGosteri.ekle` ile yeni tip ekliyor, modül dosyasını büyütmüyor. Ayrıca yengeç/aslan/başak sayfalarında "Diğer Burçlar" bağlantılarının 9'u yanlışlıkla `-gunluk-yorum` sayfalarına gidiyordu; koç/boğa/ikizler'de yalnız 3 bağlantı vardı — 12'ye normalize edildi.

**Burç Uyumu.** 21,6 → 35,4 KB + yeni `sorbi-uyum.js`. İki `role="radiogroup"`, 12 gerçek `<button role="radio">`, roving tabindex, ok tuşları, Home/End, Enter/boşluk — önce `tabindex`/`role` hiç yoktu. Seçim değişince `uyum-carki` (iki burç birlikte, aralarında kiriş ve açı yayı) ve `aci-gosterimi` canlı sürülüyor. Puanın dökümü açık: burçlar arası uzaklık → taban, element ilişkisi → satır düzeltmesi, nitelik ve yönetici (bunların puana GİRMEDİĞİ açıkça yazılı), üç ölçünün aritmetiği (`52 −6 +0 = 46`, `(50+48+46)÷3 = 48`). 4 soruluk açı sınavı, 5 nişan, sinastri sınır şeridi. **144 çiftin tamamında puan/etiket eski sürümle birebir aynı (fark 0).** Veride çift sıklığı olmadığı için o satır iki paydan türetilmiş hesap olarak ve "gözlenmiş bir çift sıklığı değil" notuyla veriliyor.

**Erişilebilirlik ve görsel kalite.** En küçük yazı 8–11px'ten 12,5px üstüne çıktı (`.bk-fet`, `dt`, `.bk-etiket`, `.bk-us`, `.l`, `.who`, `.sbg-e`, `.sbo-r`, Öğren `.no`). Footer alt satırı `#6D7280` → `#8E949F` (4,12:1 → 5,9:1, 59 sayfa); modül etiketleri `#7A8090` → `#9BA0AB` (5,02:1 → 7,2:1). Ölçülen en düşük kontrast 5,6:1. Nav: `/burc-uyumu` artık "Burçlar" sekmesini yakıyor ve hub'dan link alıyor.

**Test:** 60 sayfa eski/yeni `pageerror` diff → 0 hata; 12 hesaplayıcıda sayısal çıktı birebir aynı (kayıp değer yok); 390/768/1440px'te yatay taşma yok; uyum taraması 43 hit → hepsi triyajlı, yeni ihlal yok; `prefers-reduced-motion` ve localStorage-kapalı senaryoları çalışıyor; kontrast ve dokunma hedefi ölçüldü.

**Not:** Bu tur Mac uyanık olmadığı için canlıya alınamadı; commit bulut deposunda (`42a7a1d`) ve yedeği git bundle olarak Defne'ye iletildi. Mac açılınca Mac'ten commit + push + `wrangler pages deploy` yapılacak.
