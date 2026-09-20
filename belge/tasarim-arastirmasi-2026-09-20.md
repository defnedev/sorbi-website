# Sorbi — Arayüz araştırması ve karar belgesi
**20 Eylül 2026 · üç araştırmacı (rakip UI, Türkiye pazarı, üç kitle UX) + sentez**

Bu belge bir öneri listesi değil, bir **karar masası**. Her maddede amaç, gerekçe,
fayda–zarar ve "gerçekten yapmalı mıyız" sorusu var. Hiçbiri onay alınmadan yapılmaz.

---

## 0. Araştırmanın üç bulgusu

**1) Herkesin açılış ekranı "bugün".** İncelenen sekiz uygulamanın beşinde ilk sekme
Today / Current / Bugün. Sorbi'nin ilk ekranı canlı gökyüzü halkası: güzel, ama
"şimdi ne yapacağım" sorusuna cevap vermiyor. Bizde `/bugun` var, ama ayrı sayfada
ve ana akışın dışında.

**2) Türkiye'de teknik boşluk büyük.** Hürriyet, Milliyet, Sabah, Mynet "yükselen burç
hesaplama" sorgusunu tutuyor ama **doğum yeri bile sormuyorlar** (Hürriyet, Milliyet),
çark çizmiyorlar, metin döndürüyorlar. Harita çizen Türkçe rakiplerin hepsi kayıt
istiyor ve aylık 119–799 TL arası ücret alıyor. Kayıtsız + ücretsiz + gerçek efemeris
+ tarayıcıda çark: Türkiye'de karşılığı yok.

**3) Astrolog katmanımız sıfır.** Ev sistemi seçimi, orb ayarı, efemeris tablosu,
dışa aktarma, hesap künyesi — hiçbiri yok. Motor bunları zaten hesaplıyor; eksik olan
yalnız arayüz. Uygulama yorumlarında en sert eleştiriler tam buradan geliyor:
*"wrong house numbers in description, therefore wrong horoscope"*, *"there's a link
where you're supposed to be able to change from placidus to whole house and the link
appears to be broken"*. Astrolog bir aracı önce **sınar**, sonra konuşur.

---

## 1. Mimari karar: mod yok, tek sayfa, sabit sıra

Araştırmanın en net sonucu: **"basit mod / gelişmiş mod" çalışmıyor.**
Word çalışmasında kullanıcıların %95'inden fazlası hiçbir ayarı değiştirmiyor
(UIE). Office'in kendini kısaltan menüsü kaldırıldı. Interactive Brokers acemiler
için ayrı uygulama yaptı, kullanıcıların çoğu varlığından habersiz.

Önerilen tek mimari: **her yerleşim bloğu üç sabit katman**, sıra hiç değişmez.

```
(a) cümle          → hiç bilmeyen burada kalır. Sembol yok, derece yok.
(b) tablo          → tek tuş: "Tabloyu göster". İlgili öğrenir, astrolog sınar.
(c) hesap ayarları → tablo açılınca görünür. Ev sistemi, orb, zodyak.
```

Acemiye soru sorulmuyor ("astroloji biliyor musun?" diye sormak = ayar; ayar
değiştirilmiyor). Astrolog kendini davranışıyla tanıtıyor: tabloyu açan, ev sistemini
değiştiren kişi zaten o kişidir. Ana sayfa hiç değişmiyor.

---

## 2. Sprint önerisi (sıralı, her biri ayrı onay ister)

### S1 · "Bugün" ana akışa giriyor
**Amaç:** geri dönme sebebi yaratmak. **Neden:** sekiz üründen beşinin ilk ekranı bu;
bizde halka tek başına "ne yapacağım"ı cevaplamıyor.
**İş:** ana sayfadaki halkanın altına üç satırlık bugün özeti (Ay hangi burçta ve evresi,
bugün tam olan açı, geri giden gezegen) + `/bugun`'e tek bağlantı. `/bugun` sayfası
kendi kopya motorunu bırakıp `sorbi-astro.js` kullanır (bugün ayrı bir efemeris kodu
taşıyor, iki yerde iki hesap = iki hata kaynağı).
**Zarar riski:** ana sayfa uzar, halkanın sessizliği bozulur. **Karar gerekiyor.**

### S2 · Astrolog katmanı (en yüksek getiri / en düşük maliyet)
**Amaç:** aracı sınayan kişiyi ilk beş dakikada ikna etmek.
**Neden:** motor zaten hesaplıyor, yalnız arayüz yok; Türkiye'de hiçbir ücretsiz araçta yok.
**İş:** harita sayfasında "Tabloyu göster" → gezegen, burç, derece-dakika, ev, hız/retro,
dignite sütunları. Altında hesap ayarları: **ev sistemi** (Placidus, Whole Sign, Koch,
Equal, Porphyry), **orb**, **düğüm** (gerçek/ortalama). Ayarlar URL'de taşınır
(`?ev=whole&orb=6`) ve telefonda hatırlanır. Altına **hesap künyesi**: efemeris kaynağı,
zaman dilimi kaynağı, tropikal/sideral. En sonda **dışa aktarma**: tablo CSV, çark PNG/SVG.
**Zarar riski:** yok denecek kadar az; katman kapalı geldiği için acemiyi görmüyor.
**Önerim: evet, ilk sıraya.**

### S3 · Terimleri haritanın içine bağlamak
**Amaç:** "isolated details about houses and signs" şikâyetini çözmek.
**Neden:** dün yazılan 12 terimlik anlat modülü şu an yalnız `/ogren` ve ana sayfada.
**İş:** harita sayfasındaki her yerleşim cümlesindeki terim `data-anlat` ile tıklanır olur;
açı listesindeki her açı adı da. Yeni sayfa yok, yeni kod yok, yalnız bağlama.
**Önerim: evet, ucuz ve doğrudan kitle C'ye çalışıyor.**

### S4 · Saatsiz akışın dürüstlüğü görünür olsun
**Amaç:** rakiplerin sessiz 12:00 varsayılanının tersini yapmak ve bunu göstermek.
**Neden:** Co-Star ve CHANI sessizce öğlen alıyor, kullanıcı yükselenini kesin sanıyor;
astro-seek 10:00 alıp "doğrulanmamış" diyor. Bizim `/yukselen-tahmini` sayfamız zaten
daha dürüst; ama tahminle kaydedilen saat diğer sayfalarda işaretlenmiyor.
**İş:** `tahmin:true` olan haritada yükselen ve ev satırlarının yanında "tahmin" rozeti;
ev yorumları tek cümleye iner. Fable'ın şartıydı, yapılmadı.
**Önerim: evet — yapmazsak yanlış saatle üretilen yorum sitede büyür.**

### S5 · Türkiye'nin saat tuzağı sayfası
**Amaç:** hem SEO hem astrolog güveni.
**Neden:** Türkiye 1978–1985 arası kalıcı yaz saati dahil birçok kez saat rejimi değiştirdi;
Türkçe sitelerin çoğu bunu yanlış hesaplıyor. Bizim motorumuz IANA tarihsel verisini
kullandığı için doğru. Bunu **gösteren** kimse yok.
**İş:** tek sayfa: "Doğum saatin kayıtta yazandan farklı olabilir" — hangi yıllarda ne
oldu, aynı doğum verisinin iki farklı hesapla nasıl farklı yükselen verdiği, bizim
hangi veriyi kullandığımız. Sayım serisinin diliyle.
**Önerim: evet — tek sayfa, üç kitleye birden çalışıyor.**

---

## 3. Çıkarılacaklar (önce trafik verisi, sonra karar)

Bu listeyi **veri olmadan uygulamıyoruz.** Mac'te tek komut:

```
npx wrangler d1 execute sorbi-randevu --remote --command \
"SELECT meta, COUNT(*) n FROM events WHERE type='sayfa' GROUP BY meta ORDER BY n DESC LIMIT 60;"
```

Karar kuralı önerisi: **son 90 günde 10'dan az görüntülenen sayfa** ya birleşir ya gider.

Veri gelmeden de söylenebilecekler:

- **`/araclar` 18 araç listesi mobilde işe yaramıyor.** Trafiğin %76,3'ü mobil.
  Sekiz ürünün beşinde 3–5 sekmeli sabit gezinme var. 18 satırlık liste bir gezinme değil,
  bir sitemap. Öneri: dört başlık (Haritam · Bugün · Öğren · Sayım) ve gerisi bunların altında.
- **Nav'daki dokuz bağlantı** mobilde yatay kaydırma gerektiriyor; keşfedilebilirliği düşük.
  Aynı dörde inmeli.
- **`/bugun` içindeki kopya efemeris kodu** silinmeli, `sorbi-astro.js` kullanmalı.
- **Birbirini tekrar eden hesaplayıcılar** (yükselen, ay burcu, doğum haritası, detaylı
  doğum haritası, natal harita rehberi) tek sayfada toplanıp aralarında bağ kurulabilir;
  SEO için ayrı URL'ler korunur ama içerik tek kaynaktan gelir.

---

## 4. Yasal sınır (değişmez kural)

1 Ağustos 2026'da yürürlüğe giren değişiklikle birlikte Ticari Reklam Yönetmeliği
md. 27/3 yürürlükte: *falcı, medyum, astrolog ve benzerlerinin **hizmet reklamı**
hiçbir şekilde yapılamaz.* Reklam Kurulu 2023'te 39, Ocak 2026'da 26 siteye erişim
engeli verdi; tek dosyada 863.580 TL ceza + 24 saat içinde kaldırma kararı var.

**Yapılabilir:** ücretsiz hesaplama aracı, açıklayıcı içerik, AdSense, yazılım aboneliği.
**Yapılamaz:** "astroloğa sor", "danışmanlık", "ücretsiz seans", DM'ye yönlendirme,
korku/kader temalı satış dili.

**Gözden geçirilmeli:** `/soru-sor` sayfasının adı ve dili. İçerik bir hesaplama
(horary) ama "sor" fiili hizmet çağrısı gibi okunabilir. Hukuki risk değerlendirmesi
yapılmadan ücretli katman açılmamalı.

---

## 5. Kopyalamayacaklarımız

- Quiz → 1$ deneme → 29,99$ otomatik yenileme, iptal butonu gizli (Nebula modeli).
- Ücretsiz katmanı sonradan daraltmak (Co-Star ve The Pattern'in 2026'da yaptığı;
  yorumlardaki bir yıldızların ana sebebi).
- Çarkı tamamen gizleyip yalnız metin slaytı vermek (The Pattern) — astrolog katmanını
  kaybettirir, "hesaplama aracı" konumlanmamızla çelişir.
- Sessiz 12:00 varsayılanı.
- Başlıksız, soyut ikonlu gezinme.
- Bulut hesabı ve profil slotu satışı — "kayıt yok" sözümüzle uyumsuz.

---

## 6. Karar bekleyenler

1. S1 "Bugün" ana sayfaya girsin mi, yoksa halka sessiz mi kalsın?
2. S2 astrolog katmanı ilk sıraya mı? (önerim: evet)
3. Gezinme dörde inecek mi? (`/araclar` yeniden düzenlenir)
4. Trafik sorgusu çalıştırılacak mı — çıkarma listesi buna bağlı.
5. `/soru-sor` hukuki gözden geçirme.

**Kaynaklar:** NN/G (kademeli açığa çıkarma, varsayılanların gücü, tooltip),
Shneiderman 2003 çok katmanlı arayüz, UIE ayar değiştirme çalışması, StatCounter TR
mobil oranı, DataReportal 2026 TR, NG Araştırma burç okuma sıklığı, Reklam Kurulu
kararları, on bir ürünün mağaza ve destek sayfaları. Tam liste oturum kaydında.
