# Sorbi — Ürünler, fiyatlar, kanallar ve satış dili
**20 Eylül 2026 · yasal çerçeve içinde, tek kişiyle yürütülebilir**

Kural tek cümle: **satılan şey bir nesne olacak, bir kişinin zamanı değil.**
Nesne = kitapçık, eğitim, yazılım, baskı. Kişinin zamanı = danışmanlık. Birincisi serbest,
ikincisi kapalı.

---

## 1. Teşhis: huninin sonu yok

Bugün siteye biri geliyor, haritasını çıkarıyor, üç cümleyi okuyor, gidiyor. Ücretsiz olan
her şey var; ücretlinin başladığı an yok. Aşağıdaki ürünlerin hepsi aynı eksik parçayı
dolduruyor: **bedavanın bittiği, ücretlinin başladığı ve arada bir insanın olmadığı an.**

---

## 2. Ürün merdiveni

### Ü1 · Doğum Haritası Kitapçığı — ₺199 (TR) / $11 (EN)
**Ne:** doğum verisinden otomatik üretilen, anında e-postaya düşen PDF. Aynı veri → aynı
kitapçık. Sipariş sonrası hiç kimse çalışmıyor.
**İçinde:** hesaplanan her şey (gezegen, burç, derece, ev, açı, dignite, sabit yıldız,
yığın, düğüm) + her biri için geleneğin okuması + **her yerleşimin kaç kişide bir olduğu.**
Son madde hiçbir rakipte yok; bizim sayım serimizin ürüne dönüşmüş hâli.
**Neden hazır:** motor var ve deterministik (`insight_generator.py` on üç kalıbı tespit
ediyor, `natal_meanings.py` metne çeviriyor, LLM yok). Yorum korpusu da var: açılar,
hayat alanları, evlerdeki gezegenler, burçlardaki gezegenler, yükselen etkileri.
**Yapılacak iş:** metinleri atıf diline çevirmek (aşağıda), PDF şablonu, ödeme akışı.
**Net:** ₺199 − KDV − komisyon ≈ **₺150.**

### Ü2 · Atölye — ₺500-750, ayda bir
**Ne:** 2 saat canlı, Zoom, kayıt katılımcıya veriliyor. Konu: kendi haritanı okumaya
başlamak. Ders materyali sitede zaten duruyor (halka, anlat modülü, öğren gösterileri).
**Neden:** eğitim yasak metninde hiç geçmiyor; Öner Döşer birebiri 2022'de bırakıp okula
geçmiş, Kırkoğlu ve diğerleri fiyatlarını bugün açıkça ilan ediyor.
**Hazırlık:** 6-8 saat, tek seferlik. Sonraki aylar tekrar.
**30 kişi = ₺15.000-22.500.**

### Ü3 · Kayıtlı kurs — ₺2.500-4.000 (2027)
**Ne:** atölyelerin birikmiş kaydından kurulan 8 bölümlük program.
**Neden sonra:** sıfırdan 32-64 saat. Ama atölye kayıtları biriktikçe iskelet kendiliğinden
çıkar. **Kurs kararı atölye doluluğuna bakılarak verilir, önce değil.**
**Konumlanma:** piyasa 36-64 bin TL istiyor (Döşer, Kırkoğlu). Bizimki kısa, ucuz ve
"kendi haritanı oku" odaklı — astrolog yetiştirmiyor, okur yetiştiriyor. Udemy'deki
Türkçe kurslar 200-1.200 öğrenci alıyor ama puanları 2,9-3,8: talep var, arz kötü.

### Ü4 · Nadirlik Baskısı — ₺350-500
**Ne:** kendi haritanın halkası, altında "bu gökyüzü 2.170 kişide bir" cümlesi. Dijital
dosya ya da basılı. Hediye ürünü.
**Neden:** nadirlik sayısı bizim tek gerçek farkımız ve en paylaşılabilir şey. Üretimi
neredeyse sıfır maliyet; halka zaten çiziliyor.
**Ne zaman:** Ü1 çalıştıktan sonra, aynı ödeme altyapısıyla.

### Sırada değil ama masada
- **Yazılım katmanı:** kayıtlı haritalar, dışa aktarma, ev sistemi seçimi. Abonelik değil, tek seferlik.
- **Motor lisansı (B2B):** başka geliştiriciye. Tüketiciye astroloji hizmeti reklamı hiç değil.
- **E-kitap:** kitap her yerde serbest satılıyor; hukuken en temiz kategori.

---

## 3. Nerede satılır

| Kanal | İşi ne | Yasal not |
|---|---|---|
| **sorbiapp.com** | Trafiği ürüne bağlayan tek yer. Harita sayfasının altında tek düğme. | Ürün sayfası olağan ürün tanıtımı |
| **Shopier** | Ödeme ve teslim. | Ödeme rayı; ne sattığın belirleyici, nerede tahsil ettiğin değil |
| **Instagram** | İçerik → siteye trafik. Satış cümlesi değil, içerik. | İçerik yasak değil; hizmet çağrısı yasak |
| **E-posta listesi** | Sayım serisi bülteni; ürün duyurusu. | Ticari ileti için İYS izni şart (6563) |
| **SEO** | En büyük kaldıraç. Araştırmada boş sorgular çıktı: saatsiz harita, Türkiye yaz saati, ay/venüs burcu, harita-harita sinastri. | — |
| **İngilizce site** | AdSense 8-12 kat; anında rapor için 9-12 $ bandı boş. | Türkiye dışı kitle |

**Kanal olmayanlar:** WhatsApp'a çağırma, DM'den satış, "bana yaz" — hepsi hizmet çağrısı.

---

## 4. Satış dili: yan yana

| Yazılmaz | Yazılır |
|---|---|
| Kişiye özel astroloji analizi | Doğum haritası kitapçığı |
| Haritanı yorumlayayım | Haritan hesaplanır, kitapçık anında gelir |
| Detay için bana ulaş | Örnek kitapçığı buradan oku |
| Geleceğini öğren | Doğduğun anda gökyüzü neredeydi, gör |
| Sen şöyle birisin | Bu yerleşimi klasik metinler şöyle okur |
| %40 indirimli özel paket | ₺199, tek seferlik |
| Bu ay 3 kontenjan kaldı | Atölye 12 Ekim'de, kayıt açık |
| Ücretsiz ilk görüşme | Ücretsiz: harita, halka, terim kartları |

**İçerik kuralı — hem hukuk hem marka:** kişi hakkında iddia etme, geleneğe atfet ve
sayıyı ver. Mevcut yorum korpusumuz "Güçlü kimlik ve liderlik" diyor; bu bir iddia.
Aynı bilgi şöyle yazılırsa hem daha dürüst hem daha Sorbi olur:
*"Güneş 1. evde. Klasik metinler bu yerleşimi kimliğin öne çıkması diye okur.
Bu yerleşim 12 kişide bir görülüyor."*
Md. 5/g korku ve batıl inanç istismarını yasaklıyor; iddia eden cümle o maddeye açık,
atfeden cümle değil.

---

## 5. İlk 30 gün

| Gün | İş | Saat |
|---|---|---|
| 1 | Deploy + trafik sorgusu + Instagram erişim sayısı + AdSense kategori engeli | 2 |
| 2-3 | Şirket/fatura durumu netleşir; Shopier hesabı; KVKK, cayma, iade metinleri | 3 |
| 4-8 | Örnek kitapçık: korpus atıf diline çevrilir, PDF şablonu, bir örnek üretilir | 6 |
| 9-10 | Avukat görüşmesi — elinde örnek kitapçık metniyle | 1 |
| 11-15 | Ü1 satışa açılır: satış sayfası, Shopier, harita altına tek düğme | 5 |
| 16-20 | Atölye duyurusu: tarih, sayfa, Instagram | 3 |
| 25-30 | **Atölye #1 canlı** | 3 |

Toplam ≈ 23 saat. Bu ay yeni özellik yok, temizlik yok; yalnız ilk iki ürün.

---

## 6. Elimizde zaten olan (sıfırdan yapılmayacaklar)

- Gerçek efemeris motoru, tarayıcıda ve Python'da.
- Deterministik rapor motoru: on üç kalıp tespiti + Türkçe yorum korpusu (açılar, hayat
  alanları, evlerdeki ve burçlardaki gezegenler, yükselen etkileri).
- Nadirlik sayıları: 1.367.496 gök anı + 19.359 gün sayımı.
- Ders materyali: altı animasyonlu gösteri, sınavlar, on iki terim kartı, canlı halka.
- Paylaşım paneli ve story kartları.
- Marka sesi ve korpus.

Eksik olan üretim değil, **satış akışı ve ilk duyuru.**

---

## 7. Karar bekleyen üç şey

1. Atölye tarihi. Söyle, sayfayı ve duyuruyu hazırlayayım.
2. Kitapçık Türkçe'de mi İngilizce'de mi önce açılsın? (Trafik sorgusu cevabı belirler.)
3. Yorum korpusu atıf diline çevrilsin mi? Çevrilirse hem hukuk hem marka kazanır, ama
   metinlerin elden geçmesi gerekir.
