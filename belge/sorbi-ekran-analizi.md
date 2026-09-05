# Sorbi — Ekran Ekran Fonksiyonel Analiz

**Ürün:** sorbiapp.com (web) + Astrolog Masası + Sorbi Topluluk
**Doküman tarihi:** 5 Eylül 2026
**Hazırlayan:** Fonksiyonel analiz — Defne Holding
**Sürüm:** 1.0 (ilk tam çıkarım)

---

## Doküman hakkında

### Kaynak ve yöntem

Bu doküman bir tasarım dosyasından değil, **çalışan sistemden** çıkarılmıştır. Her ekranın davranışı üç kaynaktan doğrulanmıştır:

1. Kaynak kod (`~/Holding/sorbi-website-cini`, `main` ve `topluluk-mvp` dalları)
2. Cloudflare Pages Functions uç noktaları (`functions/api/**`)
3. Canlı sistemde yapılan doğrulama (sorbiapp.com üzerinde fiili tıklama ve HTTP kontrolü)

### Uyulan kurallar

- **Hiçbir mekanizma, kural ya da kısıt uydurulmamıştır.** Kodda karşılığı olmayan hiçbir davranış gövde metnine yazılmamıştır.
- **Karar gerektiren hiçbir konu bu dokümanda çözülmemiştir.** Belirsiz, çelişkili ya da henüz kararı verilmemiş her şey ilgili ekranın **Açık maddeler** bölümüne, karar merciine (Kurucu) yöneltilmiş soru olarak yazılmıştır.
- Tasarım/estetik yorumları dokümana alınmamıştır; yalnızca gerçek bir fonksiyonel tutarsızlık teşkil edenler açık madde olarak yer alır.

### Kapsam

| Bölüm | Ekran seti | Durum |
|---|---|---|
| A | Astrolog Masası (`/masa`) | Canlı |
| B | Kamuya açık site | Canlı |
| C | Sorbi Topluluk | **Yayında değil** (`topluluk-mvp` dalı) |
| D | Sistem geneli: kimlik, veri, ölçüm, uyum | — |

### Roller

Sistemde kodla ayrışan üç rol vardır:

| Rol | Nasıl tanınır | Nerede geçerli |
|---|---|---|
| **Ziyaretçi** | Kimlik yok | Kamuya açık site, Astrolog Masası |
| **Astrolog / Üye** | E-posta + 6 haneli kod ile alınan imzalı belirteç (`{e, r, exp}`) | Topluluk, `/astrolog` |
| **Yönetici (Kurucu)** | `/api/admin/login` parolası ile alınan belirteç (`{a:1}`) | `/panel` |

`/masa` bu üç rolün hiçbirini istemez — kimlik gerektirmez.

---

# BÖLÜM A — ASTROLOG MASASI

---

## A.1 — Masa (ana çalışma ekranı)

**Menü yolu:** doğrudan adres · `sorbiapp.com/masa`
**Dosya:** `masa.html`
**Giriş noktası:** doğrudan bağlantı (site menüsünde yer almaz)
**Çıkış noktası:** üst sol logo → ana sayfa
**Indeksleme:** `index` (arama motoruna açık), sitemap'te yer alır

### Kim görür

Herkes. Giriş ekranı, parola ya da kayıt yoktur. Sayfa açılır açılmaz kullanılabilir durumdadır.

### Amaç

Bir astroloğun danışan görüşmesine hazırlanırken kullandığı çalışma masası: danışan dosyası tutmak, seans öncesi haritayı ve o günün gökyüzünü tek ekranda görmek, iki haritayı karşılaştırmak, seans notu tutmak ve danışana verilecek çıktıyı üretmek.

### Veri mimarisi (kritik)

**Sunucu tarafında hiçbir veri tutulmaz.** Tüm danışan ve seans kayıtları kullanıcının tarayıcısında `localStorage` içinde, `sorbiMasa_v1` anahtarında saklanır. Sayfa içindeki `api()` fonksiyonu bir ağ çağrısı değildir; aynı imzayla yerel depoya yazan bir taklittir.

Sonuçları:

- Veri cihaz ve tarayıcı bazlıdır; başka cihazda görünmez.
- Tarayıcı verisi silinirse kayıtlar geri getirilemez (yedek dışında).
- Sorbi, kullanıcının danışan verisini görmez ve barındırmaz.
- Gizli sekmede oturum kapanınca veri kaybolur.

### Ekran yapısı

**Üst bar**

| Öğe | Davranış |
|---|---|
| `✦ Sorbi` | Ana sayfaya gider |
| `ASTROLOG MASASI` | Etiket, tıklanmaz |
| `Veriler bu tarayıcıda kalır` | Bilgi metni, tıklanmaz |
| `Yedek al` | Tüm depoyu `sorbi-masa-yedek-YYYY-AA-GG.json` olarak indirir |
| `Yedek yükle` | Dosya seçtirir; onay sorar; onaylanırsa mevcut veriyi **tamamen değiştirir** |

**Sol kenar — danışan listesi**

| Öğe | Davranış |
|---|---|
| `Danışan ara` | 250 ms gecikmeli, isim içinde arama (Türkçe küçük harf duyarsız) |
| `+` | Boş dosya formunu açar |
| Danışan satırı | İsim, doğum tarihi (yoksa "doğum bilgisi yok"), varsa seans sayısı |

Arşivlenmiş dosyalar listede görünmez.

**Sağ ana alan**

Dosya seçilmeden: boş durum. Dosya seçildikten sonra dört sekme: **Seans hazırlığı · Sinastri · Seanslar · Danışana çıktı**. Üstte künye satırı (isim, doğum bilgisi, etiketler) ve `Dosyayı düzenle` düğmesi.

### İlk açılış davranışı

Depo boşsa iki örnek dosya ve bir örnek seans yazılır:

| Ad | Doğum | Etiket |
|---|---|---|
| Örnek — Deniz | 14.03.1991 · 09:20 · İzmir | örnek, kariyer |
| Örnek — Kaya | 02.11.1988 · 21:45 · Ankara | örnek, sinastri |

Örnek seans: 18.08.2026, natal, "İlk görüşme — iş değişikliği zamanlaması konuşuldu."

### Ölçüm

Sayfa dört anonim olay gönderir (`POST /api/track`). Kişisel veri gönderilmez, yalnızca olay adı.

| Olay | Ne zaman |
|---|---|
| `masa_acildi` | Sayfa açılışında, oturum başına bir kez |
| `masa_dosya` | Yeni danışan dosyası kaydedildiğinde |
| `masa_seans` | Seans kaydedildiğinde |
| `masa_cikti` | Yazdır / PDF düğmesine basıldığında |

### Açık maddeler

1. Sayfa arama motoruna **açık** ve sitemap'te. Masa'nın herkese açık mı yoksa yalnız bağlantıyla mı ulaşılabilir olması isteniyor?
2. Yedek yükleme mevcut veriyi tamamen değiştirir; **birleştirme seçeneği yoktur**. Bu bilinçli mi, yoksa "birleştir" davranışı isteniyor mu?
3. Örnek dosyalar arşivlenebiliyor ama **silinemiyor**. İlk kullanım sonrası tamamen kaldırılmaları isteniyor mu?
4. Danışan sayısı, seans sayısı ya da depolama üst sınırı **tanımlı değildir**. Ücretsiz katman için bir sınır konacak mı?
5. Ücretli katmanın ne olacağı kararı verilmemiştir. (Kurucu'nun 4 Eylül tarihli kaydı: senkron değil, **tek seferlik lisans anahtarı** yönünde eğilim — karar değil.)
6. Tarayıcı verisi silindiğinde kullanıcı uyarılmaz. Periyodik "yedek al" hatırlatması isteniyor mu?

---

## A.2 — Danışan dosyası formu

**Giriş noktası:** `+` düğmesi (yeni) veya `Dosyayı düzenle` (mevcut)
**Çıkış noktası:** `Kaydet` → dosya ekranı · `Vazgeç` → önceki ekran

### Amaç

Danışanın harita hesabı için gereken doğum verisini ve çalışma notlarını tutmak.

### Alanlar

| Alan | Tip | Zorunlu | Kısıt / davranış |
|---|---|---|---|
| İsim ya da rumuz | metin | **Evet** | En fazla 80 karakter. Boşsa kayıt reddedilir ("İsim gerekli") |
| Doğum tarihi | tarih | Hayır | Boşsa dosya açılır ama harita hesaplanamaz |
| Doğum saati | saat | Hayır | — |
| Saat bilinmiyor | onay kutusu | Hayır | İşaretliyse saat yok sayılır |
| Doğum yeri | metin | Hayır | Şehir arama; seçim yapılınca enlem, boylam ve saat dilimi otomatik dolar |
| Etiketler | metin | Hayır | En fazla 120 karakter, virgülle ayrılır |
| Notlar | çok satırlı | Hayır | Sınır tanımlı değil |

Harita hesaplanabilmesi için **doğum tarihi ve enlem** gereklidir (`haritaVar()`).

### Aksiyonlar

| Aksiyon | Davranış |
|---|---|
| `Kaydet` | Yeni ise ekler ve listeler; mevcut ise günceller |
| `Vazgeç` | Değişikliği atar |
| `Arşivle` | Onay sorar; dosya listeden kalkar, **seans geçmişi silinmez** |

### Açık maddeler

7. Arşivlenmiş dosyaya erişilecek bir ekran yoktur — arşiv geri alınamaz durumdadır. "Arşivi göster" isteniyor mu?
8. Şehir arama dış bir servise bağlıdır. Servis yanıt vermezse enlem/boylam elle girilemez. Elle giriş alanı isteniyor mu?
9. Notlar alanında uzunluk sınırı yoktur; `localStorage` sınırına dayanma riski değerlendirilmemiştir.

---

## A.3 — Sekme: Seans hazırlığı

**Giriş noktası:** dosya açıldığında varsayılan sekme

### Amaç

Görüşmeye girmeden önce bakılması gereken her şeyi tek ekranda toplamak.

### Ekran yapısı

**Üst şerit — dört özet kutusu**

| Kutu | İçerik |
|---|---|
| Sect | Gündüz / Gece + sect ışığı (Güneş ya da Ay) |
| En dar transit | Gezegen çifti, açı adı, orb |
| İlerlemiş Ay | Burç ve derece + yaş |
| En zayıf gezegen | Gezegen adı + dignite etiketleri + puan |

**Sol sütun:** natal çark (yapışkan, sayfa kaydırılınca yerinde kalır)

**Sağ sütun — dört bölüm**

| Bölüm | Kapsam |
|---|---|
| Bugünün transitleri | Orb ≤ 2,5°, orb sıralı, yaklaşıyor/ayrılıyor etiketli, natal gezegenin evi belirtilir |
| Sekonder ilerletim | Orb ≤ 1,5° |
| Esansiyel dignite | −9 … +9 aralığında, gezegen başına puan ve etiket |
| Natal açılar | Majör açılar, orb sıralı |

### Hesap standardı

| Konu | Uygulama |
|---|---|
| Ev sistemi | Placidus (`house:'P'`) |
| Düğüm | Gerçek (true) düğüm |
| Sect | Ufka göre (Güneş ASC'nin üstünde mi) — ev numarasına göre **değil** |
| Dignite | Ptolemaik: yönetici, yücelme, üçlü (Dorothean), sınır (Mısır), yüz (Kalde) |
| Doğrulama | Ev başlangıçları ve açısal noktalar Swiss Ephemeris çıktısına karşı test edilmiştir |

### Açık maddeler

10. Ev sistemi Masa'da **sabittir (Placidus)**, kullanıcı değiştiremez. Harita Atölyesi'nde yedi ev sistemi seçilebilmektedir. Astrologların önemli bir kısmı Whole Sign kullanır — Masa'ya ev sistemi seçimi eklenecek mi?
11. Transit orbu 2,5°, ilerletim orbu 1,5° **sabittir**. Kullanıcı ayarı isteniyor mu?
12. "Bugünün transitleri" her zaman bugünü alır; ileri bir seans tarihi seçilemez. Randevu tarihine göre hesap isteniyor mu?
13. Sabit yıldızlar, firdaria/zaman yöneticileri ve solar dönüş bu sekmede yoktur. Kapsam dışı mı, sonraki sürüm mü?

---

## A.4 — Sekme: Sinastri

### Amaç

Açık dosyayı bir başka dosyayla karşılaştırmak.

### Ekran yapısı

| Öğe | Davranış |
|---|---|
| Dosya seçici | Diğer dosyaları listeler (ad + doğum tarihi). Seçim yapılmadan içerik boştur |
| Çift çark | İç halka açık dosya, dış halka seçilen dosya |
| Kişisel gezegenler arası | Güneş · Ay · Venüs · Mars · ASC karşılıklı açıları |
| Tüm karşılıklı açılar | Orb sıralı tam liste |

### Açık maddeler

14. Karşılaştırma için ikinci dosyanın da **kayıtlı olması** gerekir; tek seferlik harita girilemez. "Kaydetmeden karşılaştır" isteniyor mu?
15. Kompozit ve Davison haritası yoktur. Kapsam dışı mı?
16. Sinastri açı orbları görünmüyor / ayarlanamıyor — tanımlanması gerekiyor.

---

## A.5 — Sekme: Seanslar

### Amaç

Görüşme kaydı tutmak ve geçmişi görmek.

### Alanlar

| Alan | Tip | Zorunlu | Kısıt |
|---|---|---|---|
| Tarih | tarih | — | Varsayılan: bugün |
| Tür | metin | — | Serbest metin (ipucu: natal / transit / horary) |
| Tek cümle özet | metin | — | En fazla 200 karakter |
| Seans notu | çok satırlı | — | Sınır tanımlı değil |

### Aksiyonlar

| Aksiyon | Davranış |
|---|---|
| `Kaydet` | Kaydı ekler, geçmişi ve listeyi tazeler |
| `sil` | Onay sorar, kaydı **kalıcı siler** |

Geçmiş, tarihe göre yeniden eskiye sıralanır.

### Açık maddeler

17. Hiçbir alan zorunlu değildir; **tamamen boş bir seans kaydı** oluşturulabilir. Kasıtlı mı?
18. "Tür" serbest metindir; sabit liste isteniyor mu?
19. Seans kaydı silindiğinde geri alınamaz, çöp kutusu yoktur.

---

## A.6 — Sekme: Danışana çıktı

### Amaç

Görüşme sonunda danışana verilecek belgeyi üretmek.

### Ekran yapısı

| Bölüm | İçerik |
|---|---|
| Üç temel yerleşim | Güneş, Ay, Yükselen |
| Haritanın en dar açıları | İlk 8 açı |
| Son seansta konuşulan | Varsa son seans özeti |

### Aksiyonlar

| Aksiyon | Davranış |
|---|---|
| `Yazdır / PDF` | Tarayıcı yazdırma; arayüz öğeleri baskıda gizlenir. `masa_cikti` olayı gönderilir |
| `Haritayı SVG indir` | Çarkı vektör dosya olarak indirir |

### Açık maddeler

20. Çıktıda **astroloğun kendi markası yoktur** — logo, ad, iletişim alanı yok. Astrolog kendi adını koyabilmeli mi? (Ücretli katman adayı olarak Kurucu tarafından telaffuz edilmiştir, karar değildir.)
21. Çıktının içeriği sabittir; astrolog hangi bölümlerin gireceğini seçemez.
22. Çıktıda yorum metni yoktur, yalnız veri vardır. Yorum alanı isteniyor mu?

---

# BÖLÜM B — KAMUYA AÇIK SİTE

---

## B.1 — Ana sayfa

**Rota:** `/` · **Dosya:** `index.html` · **Indeksleme:** açık

### Kim görür

Herkes.

### Amaç

Ziyaretçinin doğum haritasını hiçbir engel olmadan, sayfadan ayrılmadan hesaplamasını sağlamak; oradan diğer araçlara dağıtmak.

### Ekran yapısı

| Bölüm | İçerik |
|---|---|
| Profil şeridi | Kayıtlı doğum bilgisi varsa gösterir; `değiştir` ve `çıkış` |
| Kanca | "Doğum haritanı şimdi çıkar" + üç rozet: Ücretsiz · Kayıt yok · Swiss Ephemeris doğrulamalı |
| Form + çark | Tarih, saat, yer; girildikçe çark anında çizilir |
| Üç özet kutusu | Güneş, Ay, Yükselen |
| Transit şeridi | O anki en dar transit |
| Dört kart | Harita Atölyesi · Bugünün göğü · Sorunu sor · Tüm araçlar |
| Uygulama bölümü | iOS uygulaması duyuru listesi |

### Alanlar

| Alan | Tip | Zorunlu | Kısıt |
|---|---|---|---|
| `bd` Doğum tarihi | tarih | Hesap için evet | — |
| `bt` Saat | saat | Hayır | Boşsa yükselen ve evler hesaplanmaz |
| `bp` Doğum yeri | metin | Hayır | Boşsa **İstanbul varsayılır** |
| `wlEmail` E-posta | e-posta | Evet | Biçim doğrulaması |
| `wlKvkk` Onay | onay kutusu | **Evet** | İşaretsizse kayıt reddedilir |
| `wlHp` | gizli | — | Bot tuzağı |

### Aksiyonlar

| Aksiyon | Uç | Davranış |
|---|---|---|
| `Haber ver ✦` | `POST /api/liste` | E-posta `liste` tablosuna yazılır. Aynı adres ikinci kez eklenmez. IP başına saatte 5 kayıt sınırı |

### Yerel veriler

`sorbi_birth` (doğum bilgisi), `sorbi_profile` (profil), `sorbi_wl` (listeye girildi işareti)

### Açık maddeler

23. Doğum yeri boş bırakılınca **sessizce İstanbul varsayılır**; kullanıcıya bildirilmez ve harita yanlış enlemle çizilebilir. Uyarı verilmeli mi?
24. Bölümün başlığı "Sorbi — iOS uygulaması" ve metni "çıktığında ilk sen haber al". Uygulama yayına girdiğinde bu bölümün ne olacağı tanımlı değildir.
25. Kartlardan biri "Sorunu sor" adıyla `/soru-sor`'a gider; o sayfa artık soru **almamaktadır** (bkz. B.5). Kart metni güncellenmemiştir.

---

## B.2 — Harita Atölyesi

**Rota:** `/detayli-dogum-haritasi` · **Indeksleme:** açık

### Amaç

Sitenin en derin hesaplama yüzeyi: tek haritada natal, transit, ilerletim, solar dönüş ve sinastri.

### Alanlar (özet)

| Grup | Alanlar |
|---|---|
| Harita | Ad, tarih, saat, yer, enlem, boylam, saat dilimi |
| Ayar | Ev sistemi (`fHouse`), düğüm tipi (`fNode`), orb seti (`fOrb`), minör açılar (`fMinor`), desen (`fPat`) |
| Transit | Tarih, saat, saat dilimi |
| İlerletim | Tarih |
| Solar | Yıl |
| İkinci harita | Seçici + ad, tarih, saat, yer, enlem, boylam, saat dilimi |
| Diğer | Mars hesabı onay kutusu |

### Yerel veriler

`sorbi_birth`, `sorbi_charts` (kaydedilmiş haritalar), `sorbi_wheel_theme` (çark teması)

### Açık maddeler

26. Bu ekran ile Astrolog Masası arasında **ayar farkı** vardır: burada yedi ev sistemi seçilebilir, Masa'da Placidus sabittir. Bu bilinçli bir ürün ayrımı mı?
27. Kaydedilen haritalar (`sorbi_charts`) ile Masa'nın danışan dosyaları (`sorbiMasa_v1`) **ayrı depolardır ve birbirine aktarılamaz**. Aktarım isteniyor mu?
28. Ekranda hiçbir ölçüm olayı gönderilmez; sitenin en derin aracının kullanımı ölçülememektedir.

---

## B.3 — Seni Tanıyorum

**Rota:** `/seni-taniyorum` · **Indeksleme:** açık

### Amaç

Doğum bilgisinden birkaç cümlelik karakter okuması üretmek; paylaşılabilir bir "mühür" göstermek.

### Ekran yapısı

| Bölüm | İçerik |
|---|---|
| Form | Tarih (`d`), saat (`t`), yer (`p`) |
| Mühür | Arketip başlığı + alt açıklama |
| Okuma | En fazla 5 cümle |
| Big-3 küresi | Özün / İç Dünyan / Masken |
| Tepki şeridi | Tam ben · Çoğu doğru · Emin değilim |
| Yönlendirme kartı | Harita Atölyesi + Nadirlik |
| Paylaş | Metin paylaşımı (görsel kart yok) |

### Okuma mantığı

Aday cümleler öncelik puanına göre sıralanır, ilki sabittir, toplam 5 cümle gösterilir. Havuz: Güneş–Ay açısı, Merkür retro, eksik/baskın element, ev yığılması, Venüs burcu, Mars burcu, modalite, yükselen yöneticisi, Satürn evi.

### Ölçüm

| Olay | Meta |
|---|---|
| `seni_taniyorum` | Güneş burcu / Ay burcu |
| `seni_taniyorum_react` | tam / cogu / emin |

### Açık maddeler

29. **Sayfa ana hesap motorunu (`sorbi-astro.js`) yüklemez**; kendi içinde `computeLite` adlı zayıf bir kopya kullanır. Sonucu: bu sayfada dignite, sect ve ASC/MC açıları yoktur; yüksek enlemde ev hesabı bozulabilir. Motora bağlanması kararı bekliyor.
30. Doğum saati bilinmediğinde **12:00 varsayılır** ve Ay burcu kesin dille söylenir. Ay günde ~13° gittiği için bir kısım ziyaretçiye yanlış Ay burcu söylenmesi olasıdır. Belirsizlik uyarısı eklenecek mi?
31. Tepki düğmeleri (`seni_taniyorum_react`) veritabanına yazılıyor ancak **bu veriyi gösteren bir ekran yoktur**. Rapor ekranı isteniyor mu?
32. Mühür alt metni yalnız Güneş burcuna bağlıdır (12 varyant); sayfanın vaat ettiği kişiselleşme düzeyiyle uyumsuzdur.

---

## B.4 — Nadirlik

**Rota:** `/nadirlik` · **Indeksleme:** açık

### Amaç

Ziyaretçinin yerleşimlerinin, 24.000 haritalık örneklemde kaç kişide bir görüldüğünü göstermek ve paylaşılabilir bir kart üretmek.

### Ekran yapısı

| Bölüm | İçerik |
|---|---|
| Form | Doğum tarihi, saat, yer |
| Manşet | En nadir yan + oran |
| Kişisel yerleşimler | Seyrekten sığa, çubuklu |
| Güneş · Ay · Yükselen üçlüsü | 1728 olası üçlüden biri |
| Kuşak yerleşimleri | Dış gezegenler — ayrı tutulur, kişisel sayılmaz |
| Dikkat çeken yanlar | Harita yapısına dair olgular |
| Paylaş şeridi | `Kartı indir ✦` · `Sonucu kopyala` · Harita Atölyesi · Araçlar |

### Veri kaynağı

`nadirlik-veri.json` — 1950–2009 aralığından örneklenmiş 24.000 harita, İstanbul koordinatı (41,0082°K), Placidus. Üretim: `tools/nadirlik-uret.mjs`.

### Kart çıktısı

1080 × 1350 PNG. İçerik: en nadir yan, alt açıklama, en fazla dört satır, "24.000 haritalık örneklem · 1950–2009", `sorbiapp.com/nadirlik`, imza `Veri ve hesaplama: Sorbi · @astrodefnee`.

### Açık maddeler

33. Kart imzasında `@astrodefnee` geçmektedir. Kurucu'nun 4 Eylül tarihli notu: imzanın kişi mi kurum mu olacağı **karara bağlanmamıştır**.
34. Oranlar İstanbul enlemine göredir; başka enlemde doğan ziyaretçiye de aynı tablo gösterilir. Sayfada bu sınır belirtilmemiştir.
35. Kart indirilir; doğrudan paylaşım (Web Share) yoktur. Mobilde indirme yerine görüntüleme davranışı test edilmemiştir.

---

## B.5 — Haritana Soru Sormak

**Rota:** `/soru-sor` · **Indeksleme:** açık

### Amaç

**Bu ekran 4 Eylül 2026'da değiştirilmiştir.** Önceden kişiye özel okuma talebi toplayan bir form ekranıydı; artık bir **yöntem anlatım sayfasıdır**.

### Ekran yapısı

| Bölüm | İçerik |
|---|---|
| Canlı harita | Ziyaretçi kendi haritasını sayfada görür |
| Yöntem | Dört adım: soru bir eve düşer → evin yöneticisi bulunur → transit okunur → zamanlama penceresi çıkarılır |
| Örnek | Kişisel bilgileri çıkarılmış örnek okuma |
| Buradan sonrası sende | Harita Atölyesi · Araçlar · Transit görünümü |
| Ne olduğu, ne olmadığı | Altı sınır maddesi |

### Kaldırılanlar (4 Eylül)

- Ad + WhatsApp numarası formu
- `@astrodefnee` DM bağlantısı
- "sana özel bir yorum hazırlanıp WhatsApp'tan iletilir" ifadesi ve bunu içeren FAQPage şeması
- `POST /api/bookings` çağrısı (uç 410 döner)

### Açık maddeler

36. Sayfa hâlâ "Soru Sorma Yöntemi" adıyla menüdedir; ziyaretçinin buradan soru soramayacağı yalnız sayfa içinde anlaşılır.
37. Sayfadaki örnek okuma "izin alınarak paylaşılan" bir vaka olarak sunulmaktadır. Bu iznin belgesi bulunup bulunmadığı doğrulanmamıştır.

---

## B.6 — Öğren

**Rota:** `/ogren` · **Indeksleme:** açık

### Amaç

Astroloji okuryazarlığı: gökyüzü mekaniğini gerçek efemeris verisiyle, animasyonla göstermek.

### Ekran yapısı

Üç ders, her biri kaydırıcıyla (`sRetro`, `sYuk`) canlandırılır:

| Ders | İçerik |
|---|---|
| Geri hareket | 120 günlük yörünge + burç izi |
| Merkür ayrılığı | 2 yıl, en büyük ayrılık 27,8° |
| Yükselen kadranı | 20.03.2026 İstanbul, 10 dakikalık adımlarla, günde 12 burç |

Veri: `ogren-veri.json`, üretim `tools/ogren-uret.mjs`.

### Açık maddeler

38. Ders sayısı üçtür ve seri olarak konumlanmamıştır (numara, ilerleme, "sıradaki ders" yoktur). Seriye dönüşecek mi?
39. Kurucu'nun eğitim/kurs planıyla bu sayfanın ilişkisi tanımlı değildir: ücretsiz katman mı, kursun tanıtımı mı?

---

## B.7 — Sayım (seri) ve Sayım 01

**Rotalar:** `/sayim` (seri sayfası) · `/sayim-yukselen` (ilk yazı) · **Indeksleme:** açık

### Amaç

Astroloji sorularının gerçek efemerisle sayımı. Yorum değil, ölçüm. İmza: Defne Turan.

### `/sayim` — seri sayfası

Seri kuralı, yazı listesi, sıradaki başlıklar (Merkür retro yüzdesi, retroda doğanlar, hiç görülmeyen Güneş–Ay–Yükselen üçlüleri).

### `/sayim-yukselen` — Sayım 01

| Bölüm | İçerik |
|---|---|
| Vurgu | 2,2 kat |
| Sayım | 12 burçluk yükselen dağılımı tablosu |
| Neden | Oblik yükseliş, enlem etkisi |
| Kontrol | Güneş burcu dağılımı (düz çıkıyor) |
| Bu senin için ne demek | Ziyaretçi için anlamı |
| Yöntem | Örneklem, konum, hesap, hata, sınır |

Şema: `Article` (yazar: Defne Turan) + `BreadcrumbList`. Kendi link önizleme görseli vardır.

### Açık maddeler

40. Yayın sıklığı taahhüt edilmemiştir. Seri sayfası "sıradakiler hazırlanıyor" der; takvim yoktur.
41. Sayım yazılarının Kurucu'nun sosyal hesabıyla ilişkisi tanımlı değildir.

---

## B.8 — Diğer kamuya açık ekranlar

| Rota | Amaç | Indeksleme | Not |
|---|---|---|---|
| `/araclar` | Araç dizini | açık | Profil varsa araçlar otomatik çalışır |
| `/bugun` | Günün gökyüzü + kişisel transitler | açık | Profil gerektirir |
| `/haritam` | Kayıtlı haritalar | **noindex** | Kişisel yüzey |
| `/dogum-haritasi-hesaplama` | Sıfır tıklı harita | açık | `POST /api/profile` ile ayrı e-posta kaydı |
| `/burc-uyumu`, `/gunun-karti` | Hafif araçlar | açık | — |
| `/sinastri`, `/horary`, `/tarot` | Rehber yazıları | **noindex** | — |
| `/destek` | SSS, abonelik, iade | açık | `/destek` → `/destek.html` 301 |
| Burç sayfaları (48 adet) | SEO içeriği | açık | Günlük yorum + özellikler |
| `404.html` | Bulunamadı | noindex, follow | 5 Eylül'de eklendi |

### Açık maddeler

42. **`/sinastri`, `/horary` ve `/tarot` sayfaları `noindex,nofollow` etiketi taşıdığı hâlde `sitemap.xml` içindedir.** Bu bir çelişkidir: sitemap arama motorunu davet ederken sayfa girişi reddeder. Hangisi doğrudur?
43. **İki ayrı e-posta toplama mekanizması vardır:** ana sayfada `POST /api/liste` (`liste` tablosu), doğum haritası hesaplama sayfasında `POST /api/profile` (`profiles` tablosu). Kayıtlar iki farklı yerde birikmektedir. Birleştirilecek mi?
44. `/destek` sayfası App Store aboneliği ve iade süreçlerini anlatmaktadır; uygulama henüz yayında değildir. Sayfa erken mi yayında?

---

# BÖLÜM C — SORBİ TOPLULUK (yayında değil)

> Bu bölümdeki ekranlar `topluluk-mvp` dalında hazırdır, **canlıya alınmamıştır**. Yayın kararı verilmemiştir.

---

## C.1 — Topluluk ana ekranı

**Rota:** `/topluluk` · **Dosya:** `topluluk.html`

### Kim görür

Okuma herkese açıktır. **Yazmak için** e-posta doğrulaması, davet kodu ve rumuz gerekir.

### Amaç

Ekşi sözlük tarzı, astroloji bilgisinin paylaşıldığı bir kayıt alanı — sözlük maddeleri ve vaka başlıkları.

### Ekran yapısı

| Bölüm | İçerik |
|---|---|
| Başlık listesi | Arama (`ara`), tip filtresi, son hareket sıralı |
| Giriş bloğu | E-posta → 6 haneli kod → davet kodu + rumuz + ekol |
| Başlık aç | Başlık metni + tip seçimi |
| Buranın beş kuralı | Aşağıda |

### Buranın beş kuralı (sayfa metninden birebir)

1. **Burada hizmet satılmaz.** Fiyat, paket, randevu, telefon, "bana yaz" yok — ne entry'de ne profilde. Burası bilgi paylaşım alanı.
2. Kişiyi değil haritayı yorumla.
3. Sağlık, ölüm, hamilelik ve hukuki sonuç hakkında kesin hüküm yok.
4. Üçüncü kişinin doğum verisi, o kişi bilmeden paylaşılmaz.
5. Ekol farkı tartışma konusu değil, etiket.

### Hizmet süzgeci (kodla uygulanan kural)

Entry ve başlık metni iki listeye karşı taranır:

| Liste | Yakalanan | Sonuç |
|---|---|---|
| **Sert** | Telefon numarası, WhatsApp/Telegram bağlantısı, ödeme yüzeyi (Shopier, iyzico, Stripe, Papara, PayTR, IBAN), fiyat (`### TL`), ücretli hizmet ilanı | **403 — kayıt reddedilir** |
| **Yumuşak** | "DM at", "özelden yaz", "iletişime geç", randevu/seans/danışmanlık daveti, sorbiapp.com dışına bağlantı | Kayıt geçer, **otomatik rapor** açılır |

Aynı süzgeç profildeki `ekol` alanına da uygulanır.

### Açık maddeler

45. Davet kodu (`TOPLULUK_DAVET`) tanımlıdır ancak dağıtım politikası yoktur: kimler alacak, kaç kişi, süreli mi?
46. Gökyüzü takvimine bağlı otomatik başlık açma mekanizması vardır (olaydan 3 gün önce açılır, 14 gün sonra kapanır). Kapanan başlığa ne olacağı tanımlı değildir.
47. Sözlük tohumlaması yapılmamıştır. Boş sözlükle yayına çıkma riski değerlendirilmelidir.

---

## C.2 — Başlık ekranı

**Rota:** `/baslik/<slug>` — sunucu tarafında üretilir (`functions/baslik/[slug].js`)

### Davranış

| Durum | Sonuç |
|---|---|
| Başlık yok | 404 + `noindex` |
| Başlık var, entry yok | Sayfa açılır, `noindex,follow` (ince içerik koruması) |
| Tip: sözlük | `DefinedTerm` şeması, "Sorbi Astroloji Sözlüğü" seti |
| Tip: vaka | `QAPage` şeması, kabul edilen entry `suggestedAnswer` olur |

Sitemap yalnız `entry_sayisi > 0` olan başlıkları içerir.

### Açık maddeler

48. "Kabul edilen entry" (vaka tipinde) kimin tarafından, hangi ölçütle işaretlenir — başlığı açan mı, moderatör mü? Kodda `/api/topluluk/kabul` ucu vardır, yetki kuralı dokümante edilmemiştir.

---

## C.3 — Astrolog kaydı

**Rota:** `/astrolog` · **Dosya:** `astrolog.html`

### Amaç

Harita Atölyesi'nin kilitli katmanlarını açacak astrolog kaydını almak.

### Alanlar

| Alan | Tip | Zorunlu |
|---|---|---|
| Ad | metin | Evet |
| E-posta | e-posta | Evet |
| Ekol | seçim | — |
| Deneyim | seçim | — |
| Bağlantı | metin | — |
| KVKK onayı | onay kutusu | **Evet** |
| Bot tuzağı | gizli | — |

Giriş: e-posta → 6 haneli kod. `POST /api/astrolog/giris` ucu **410** döner (kaldırılmıştır).

### Kilit davranışı (`sorbi-kilit.js`)

| Katman | Kayıtsız kullanıcıya |
|---|---|
| Açı listesi (p4) | 3 satır görünür, gerisi bulanık |
| Dignite, ilerletim tabloları (p3/p6/p9) | Tamamen kapalı |
| Sabit yıldızlar (p8) | 3 satır görünür |
| Sinastri | Açık |
| İlerletim / solar | Yalnız harita olarak |

Kilit `localStorage.sorbiPanel` veya `sorbiAstrolog==='1'` ile açılır.

### Açık maddeler

49. Kayıt onayı manueldir (`/api/astrolog/yonetim/onay`). Onay ölçütü tanımlı değildir: kim astrolog sayılır?
50. Kurucu'nun 4 Eylül kararına göre platformda hizmet satılamaz. Astrolog rozetinin ziyaretçi tarafından "bu kişiden hizmet alınabilir" diye okunmaması için bir tedbir tanımlanmamıştır.
51. Kilit yalnız tarayıcı tarafındadır; `localStorage` elle değiştirilerek açılabilir. Sunucu tarafı doğrulama isteniyor mu?

---

## C.4 — Yönetim Paneli

**Rota:** `/panel` · **Indeksleme:** noindex, nofollow

### Kim görür

Yalnız Kurucu — `/api/admin/login` parolasıyla.

### Bölümler

| Bölüm | Uç |
|---|---|
| Danışan dosyaları ve seanslar | `/api/panel/danisan*`, `/api/panel/seans` |
| Geri bildirim kuyruğu | `/api/geri-bildirim/kuyruk`, `/durum` |
| Moderasyon | `/api/panel/moderasyon/kuyruk`, `/akis`, `/karar` |
| Astrolog kayıtları | `/api/astrolog/yonetim/liste`, `/onay`, `/tekrar` |
| Gelen talepler | `/api/panel/talepler` |

Moderasyon eylemleri: `gizle`, `geri-al`, `birak`, `askiya-al`, `askiyi-kaldir`.

### Açık maddeler

52. Panel'deki danışan dosyası bölümü ile `/masa` **aynı işi iki ayrı yerde ve iki ayrı depoda** yapmaktadır (Panel sunucuda, Masa tarayıcıda). Panel'in bu bölümü kaldırılacak mı?
53. Askıya alma süresi ve itiraz yolu tanımlı değildir.
54. `/api/panel/talepler` ucu, kaldırılmış olan `bookings` akışına bağlıdır. Bölümün akıbeti kararlaştırılmalıdır.

---

# BÖLÜM D — SİSTEM GENELİ

---

## D.1 — Kimlik

Parola yoktur. Akış: e-posta → 6 haneli kod → imzalı belirteç.

| Konu | Uygulama |
|---|---|
| Kod saklama | HMAC-SHA256 özet (açık metin saklanmaz) |
| Geçerlilik | 15 dakika |
| Kullanım | Tek kullanımlık |
| Deneme | 5 hatalı denemede kod yakılır |
| Hız sınırı | Adres başına saatte 3, IP başına saatte 12 |
| Belirteç | HMAC imzalı: yönetici `{a:1}`, astrolog/üye `{e,r,exp}`, topluluk `{h,exp}` |

### Açık maddeler

55. Belirteç geçerlilik süresi ve yenileme davranışı dokümante edilmemiştir.
56. E-posta gönderimi Resend üzerinden yapılandırılmıştır ancak **canlıda kurulu değildir** (`RESEND_API_KEY`, `MAIL_FROM`, SPF/DKIM). Topluluk yayına alınmadan önce zorunludur.

---

## D.2 — Veri yerleşimi

| Veri | Nerede | Kim erişir |
|---|---|---|
| Masa danışan/seans | Kullanıcının tarayıcısı (`sorbiMasa_v1`) | Yalnız kullanıcı |
| Ziyaretçi doğum bilgisi | Tarayıcı (`sorbi_birth`, `sorbi_profile`, `sorbi_charts`) | Yalnız ziyaretçi |
| E-posta listesi | D1 · `liste` | Kurucu |
| Profil kaydı | D1 · `profiles` | Kurucu |
| Ölçüm olayları | D1 · `events` | Kurucu |
| Topluluk içeriği | D1 · `t_*` tabloları | Herkese açık okuma |
| Astrolog başvuruları | D1 · `a_astrologlar` | Kurucu |
| Geri bildirim | D1 · `g_bildirim` | Kurucu |

### Açık maddeler

57. KVKK aydınlatma metni (`/privacy`) e-posta formlarından bağlanmaktadır; içeriğinin güncel veri yerleşimini yansıtıp yansıtmadığı **doğrulanmamıştır**.
58. Veri saklama süresi ve silme talebi süreci tanımlı değildir.

---

## D.3 — Ölçüm

Çerezsiz, kimliksiz sayaç (`sorbi-olcum.js`), tüm sayfalarda. Oturum başına sayfa başına bir kayıt.

| Olay | Kaynak |
|---|---|
| `sayfa` | Tüm sayfalar |
| `masa_acildi`, `masa_dosya`, `masa_seans`, `masa_cikti` | Masa |
| `seni_taniyorum`, `seni_taniyorum_react` | Seni Tanıyorum |
| `liste_kaydi` | E-posta listesi |
| `chart_calculated`, `uyum_hesaplandi`, vb. | Araç sayfaları |

### Açık maddeler

59. **Toplanan ölçümü gösteren bir ekran yoktur.** Veriye yalnız veritabanı sorgusuyla ulaşılabilmektedir. Rapor ekranı isteniyor mu?
60. Üçüncü taraf analitik (ör. Cloudflare Web Analytics) kurulmamıştır; ziyaretçi sayısı yalnız kendi sayacımızla ölçülmektedir.

---

## D.4 — Uyum kuralları (tüm ekranlar için bağlayıcı)

| Kural | Kaynak |
|---|---|
| Astroloji hizmeti reklamı yasak | RG 1 Temmuz 2026 / No. 33297, yürürlük 1 Ağustos 2026 |
| Ceza hem içerik üreticisine hem mecraya | Emsal: 863.580 TL |
| Erişim engeli yaptırımı anayasaya uygun | AYM, 14 Mayıs 2026 |
| Kişinin hayatı için kesin gelecek kipi yasak | Marka anayasası |
| "fal", "kehanet", "şanslı" yasak | Marka anayasası |
| Gök olayının kendisi kesin dille anlatılabilir | Marka anayasası |

**Kurucu kararı (4 Eylül 2026):** sorbiapp.com'da hiç kimse astroloji hizmeti satamaz — Kurucu dahil.

### Açık maddeler

61. Kart imzasında geçen `@astrodefnee` hesabının biyografisinde fiyat/paket/"DM at" bulunmadığı **doğrulanmamıştır**. Bulunursa kart, hizmet reklamına giden zincirin ilk halkası sayılabilir.

---

# TOPLU AÇIK MADDELER

Karar merci: **Kurucu**. Toplam 61 madde.

| # | Ekran | Konu | Aciliyet |
|---|---|---|---|
| 42 | Site geneli | `/sinastri`, `/horary`, `/tarot` noindex ama sitemap'te — çelişki | Yüksek |
| 43 | Site geneli | İki ayrı e-posta toplama mekanizması, iki ayrı tablo | Yüksek |
| 29 | Seni Tanıyorum | Sayfa ana hesap motorunu kullanmıyor | Yüksek |
| 30 | Seni Tanıyorum | Saat yokken yanlış Ay burcu riski | Yüksek |
| 56 | Kimlik | Resend canlıda kurulu değil — Topluluk yayınının ön koşulu | Yüksek |
| 5 | Masa | Ücretli katman tanımı | Yüksek |
| 52 | Panel / Masa | Aynı iş iki ayrı depoda | Orta |
| 10 | Masa | Ev sistemi sabit (Placidus) | Orta |
| 20 | Masa | Çıktıda astroloğun markası yok | Orta |
| 45 | Topluluk | Davet kodu dağıtım politikası | Orta |
| 47 | Topluluk | Sözlük tohumlaması | Orta |
| 49 | Astrolog | Onay ölçütü tanımsız | Orta |
| 57 | Veri | KVKK metni güncel mi | Orta |
| 59 | Ölçüm | Rapor ekranı yok | Orta |
| 61 | Uyum | `@astrodefnee` biyografi kontrolü | Orta |
| 1–4, 6–9, 11–19, 21–28, 31–41, 44, 46, 48, 50, 51, 53–55, 58, 60 | Muhtelif | Ayrıntılar ilgili bölümlerde | Düşük–Orta |

---

*Bu doküman çalışan sistemden çıkarılmıştır. Kodda karşılığı olmayan hiçbir kural yazılmamış, karar gerektiren hiçbir konu analiz tarafından çözülmemiştir.*
