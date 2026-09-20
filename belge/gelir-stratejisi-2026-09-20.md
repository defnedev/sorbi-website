# Sorbi — Gelir stratejisi
**20 Eylül 2026 · haftada 2-3 saat · tek kişi**

Tek cümle: **Sorbi hizmet satmaz, ürün satar. Trafik siteden gelir, para üründen.**

---

## 1. Durum (süslemesiz)

- **Web canlı**, gerçek motor, 65 sayfa, AdSense tek gelir. Bu oturumun 6 commit'i hâlâ Mac'te, yayında değil.
- **iOS uygulaması 4.3(b) "saturated category" ile reddedildi.** İtiraz mektubu hazır (Build 327). 4.3(b) itirazları nadiren döner; plan buna bağlanamaz.
- **Nisan'daki 3 aylık plan** (₺270.000 hedef) yedi kanalın ikisini danışmanlık ve "kıtlık/FOMO" diline dayamıştı. O iki kanal ve o dil artık md. 27/3 ve 5/g yüzünden kapalı. Kalan kanallar (rapor, kurs, sponsor) ayakta.
- **Zaten yapılmış ürün var:** Karakter Raporu — Python rapor motoru + C# orkestrasyon + 199 TL tek seferlik SKU. Mühendisliği bitmiş, sadece satışa açılmamış.
- **Trafik sayısı bilinmiyor.** D1 sorgusu çalıştırılmadı. Bütün model buna bağlı.

---

## 2. Kanal masası

| Kanal | Yasal durum | Efor | Tavan | Karar |
|---|---|---|---|---|
| **A. AdSense** | Temiz (kategori engeli şart) | Düşük | Düşük, trafikle büyür | Devam, iyileştir |
| **B. Otomatik rapor (Karakter Raporu)** | Yazılım çıktısı; dil avukatla | Orta (motor hazır, satış akışı yok) | Orta | **İlk ürün** |
| **C. Kayıtlı kurs ("Haritanı Oku")** | Eğitim mi hizmet mi — avukat | Yüksek bir kez, sonra sıfır | **En yüksek** | Avukat "evet" derse ikinci ürün |
| **D. Motor lisansı / API (B2B)** | Tüketici reklamı değil, temiz | Orta | Belirsiz | Backlog, bir müşteri adayı çıkınca |
| **E. Sponsorlu içerik** | Marka astroloji hizmeti değilse temiz | Düşük | Düşük-orta | Gelirse al, peşinden koşma |
| **F. Uygulama** | — | Yüksek | Orta | Google Play + PWA, App Store'a bağımlı değil |
| ~~1:1 danışmanlık tanıtımı~~ | md. 27/3 | — | — | Kapalı |
| ~~"Bu ay 3 randevu kaldı" dili~~ | md. 5/g | — | — | Kapalı, hiçbir üründe kullanılmaz |
| ~~Instagram abonelikle astrolog erişimi~~ | Hizmet satışı görünümü | — | — | Kapalı |

**B için dil kuralı:** rapor "yazılımın ürettiği hesaplama ve açıklama"dır. "Astrolog yorumu", "kişisel danışmanlık", "geleceğini öğren" yok. Nisan planındaki "AI + astrolog yorumu" ifadesi kullanılmaz. Kesin gelecek zaman yok (uygulamadaki guardrail zaten bunu test ediyor).

---

## 3. Uygulama gerçeği: App Store'a bağımlı olmayan iki yol

1. **PWA.** Web sitesi manifest + "ana ekrana ekle" ile iPhone'da uygulama gibi açılır. App Store yok, inceleme yok, 4.3(b) yok. Motor zaten tarayıcıda; birleşik ürün kararına da uyuyor. **Bir oturum.**
2. **Google Play.** 4.3(b) benzeri "doygun kategori" reddi yok. Türkiye'de Android payı yüksek. REALITY_CHECK'e göre dört ekran çöküyor (API dosyaları yok); çözüm o ekranları kapatıp **Ana + Günlük + Harita** ile küçük sürüm çıkarmak. Karakter Raporu satın alması Play'de tek seferlik ürün olarak açılır.
3. Apple itirazı arka planda gönderilir; dönerse bonus.

---

## 4. 90 gün, haftada 2-3 saat

### Hafta 0 (bu hafta) — açılış
- `sh _d.sh && git push` — 6 commit yayına.
- Trafik sorgusu → hangi sayfalar çalışıyor. **Model bu sayıyla kurulur.**
- AdSense'te "fal/medyum/astroloji hizmeti" kategorilerini engelle.
- Avukata yazılı dört soru (bölüm 6). Cevap gelene kadar B ve C açılmaz, hazırlığı yapılır.

### Hafta 1-3 — trafik motoru
- Rakip araştırmasındaki boş sorgulardan üç sayfa: **Türkiye yaz saati ve doğum saati düzeltme** (1978–85), **Venüs burcu hesaplama**, **sinastri (harita-harita)**. Her biri bir oturum, motor hazır.
- PWA manifest + ana sayfada "ana ekrana ekle" ipucu.
- Instagram döngüsü: haftada bir sayım kartı + bir halka videosu (paylaşım paneli hazır). Amaç trafik, satış cümlesi yok.
- Gezinme dörde iner (Haritam · Bugün · Öğren · Sayım); `/araclar` altına katlanır.

### Hafta 4-6 — ürün 1: Karakter Raporu web'de
- Shopier'da ürün (199 TL), ödeme sonrası e-postaya PDF. Motor uygulama backend'inde; web'den tetiklenmesi için tek uç.
- Satış sayfası: örnek rapor, ne içerir, ne içermez (avukat onaylı dil).
- Harita sayfasının altına tek düğme; pop-up yok, kıtlık yok.
- Ölçüm: harita sayfası ziyaretçisi → düğme → ödeme.

### Hafta 7-12 — ürün 2 ve uygulama
- Avukat "eğitim ayrı" derse: kurs ön satışı. Sekiz modül, kayıtlı, kendi hızında. Malzeme skill'lerde ve korpusta var; en pahalı iş kayıt.
- Avukat "hayır" derse: rapor tier'ları (mini / standart) ve İngilizce rapor (Türkiye dışı, yasak dışı).
- Google Play küçük sürüm.

---

## 5. Sayılar (varsayım, veri gelince değişir)

Rapor geliri = aylık harita sayfası ziyaretçisi × dönüşüm × ₺199.

| Aylık harita ziyaretçisi | %0,3 | %0,7 | %1,2 |
|---|---|---|---|
| 5.000 | ₺3.000 | ₺7.000 | ₺12.000 |
| 20.000 | ₺12.000 | ₺28.000 | ₺48.000 |
| 50.000 | ₺30.000 | ₺70.000 | ₺119.000 |

Tüketici dijital ürünlerinde %0,3–1 arası dönüşüm olağan; %1,2 iyimser. Nisan planındaki
"Haziran'da 170 rapor" varsayımı hangi trafikten geldiğini söylemiyordu; bu tablo söylüyor.
**Trafik sorgusu hangi satırda olduğumuzu gösterecek.** Kurs açılırsa tavan başka bir tabloya geçer:
bir kez ₺799 × yüz kişi = ₺79.900, ek efor sıfır.

---

## 6. Avukata yazılı sorular

1. Yazılımın otomatik ürettiği doğum haritası raporunun web'de satışı ve tanıtımı md. 27/3 kapsamında mı?
2. Kayıtlı astroloji eğitimi (kurs) "astrolog tarafından verilen hizmet" mi, eğitim hizmeti mi?
3. Yazılım aboneliği (ileri hesaplar, dışa aktarma, kayıtlı harita) nasıl konumlanmalı?
4. İngilizce sürümle Türkiye dışı tüketiciye satış yönetmeliğin dışında mı?
5. Mevcut `/soru-sor` sayfasının adı ve dili risk taşıyor mu?

Bu beş cevap gelmeden ürün açılmaz; hazırlık (satış sayfası, akış, Shopier) cevap beklenirken yapılır.

---

## 7. Haftalık üç sayı

Her hafta yalnız bunlar bakılır: **ziyaretçi · rapor satışı · AdSense.** Üçü de yükselmiyorsa plan değişir, plan değişmeden efor artırılmaz.
