# Sorbi — Arayüz araştırması ve karar masası
**20 Eylül 2026 · üç araştırmacı (rakip UI, Türkiye pazarı, üç kitle UX) + bir denetçi**

Karar masası: her maddede amaç, kanıt, maliyet ve karşı argüman var. Hiçbiri onay
almadan yapılmaz; sıralama da bir öneridir, karar değil.

---

## 0. Önce cevaplanması gereken soru

**Web sitesi ile mobil uygulamanın işi ne?**

Bu belge boyunca çıkan her sıralama bu cevaba bağlı ve cevabı bende yok:

- Uygulamada "bugün" ekranı var mı? Varsa web'e bugün eklemek aynı işi ikinci kez yapmaktır.
- Uygulama hangi motoru kullanıyor? Web'de `sorbi-astro.js` çalışıyor. Uygulama farklı bir
  motor kullanıyorsa aynı doğum verisi iki üründe farklı sonuç verebilir; bu, aşağıda
  `/bugun` için söylenen "iki hesap iki hata" sorununun büyüğü demektir.
- Web SEO hunisi mi (görev: arayanı bulup uygulamaya taşımak), yoksa bağımsız ürün mü
  (görev: tek başına yeterli olmak)?

İlk ikisi doğrulanamadı: `sorbi-internal-docs` altındaki mobil kaynak bu oturumdan
okunamıyor (yalnız `__tests__` klasörü erişilebilir). Üçüncüsü senin kararın.
**Bu üç cevap gelmeden sprint sırası kesinleşmemeli.**

---

## 1. Araştırmanın üç bulgusu

**1) Rakiplerin açılış ekranı "bugün".** İncelenen sekiz uygulamadan beşinde
(Co–Star, CHANI, Sanctuary, TimePassages, Astro Future) ilk ekran günlük yorum ya da
anlık gökyüzü. Sorbi'nin ilk ekranı canlı halka; `/bugun` ayrı sayfada duruyor.
*Kaynak: ürünlerin mağaza ve destek sayfaları, oturum kaydında link listesi.*

**2) Türkiye'de teknik boşluk gerçek.** "Yükselen burç hesaplama" sorgusunu tutan
Hürriyet Mahmure ve Milliyet Pembenar formlarında **doğum yeri alanı yok**
(sayfalar 20.09.2026'da tek tek çekildi); Sabah yer soruyor ama çark çizmiyor;
Mynet metin döndürüyor; Oggusto kendi aracı olmadığı için astro.com'a yönlendiriyor.
Harita çizen Türkçe uygulamalar kayıt istiyor ve ücretli: MapAstro (App Store TR)
premium ₺199,99–799,99; Ms Astro ₺169,99/ay, ₺1.119,99/yıl.
**Kayıtsız + ücretsiz + gerçek efemeris + tarayıcıda çark birleşimi Türkiye'de yok.**

**3) Astrolog katmanımız yok, ama astrolog talebimiz de ölçülmedi.**
Ev sistemi seçimi, orb ayarı, efemeris tablosu, dışa aktarma, hesap künyesi — hiçbiri
arayüzde yok. Motor ise yedi ev sistemini zaten hesaplıyor (`sorbi-astro.js`
`buildHouses`: Placidus, Whole Sign, Koch, Equal, Campanus, Porphyry, Regiomontanus).
**Ama:** Sorbi'ye kaç astrolog geliyor, ne istiyor, bilmiyoruz. Bu bölümdeki şikâyet
alıntıları rakip uygulamaların mağaza yorumları — başkalarının kullanıcısının derdi.
"Katman yok" bir gözlem; "katman ilk sıraya" bir fikir ve tartışmalı (bkz. 4).

---

## 2. Mimari karar önerisi: mod yok, tek sayfa, sabit sıra

Kanıtlanan şey şu: **varsayılanlar değişmiyor.** Word çalışmasında kullanıcıların
%95'inden fazlası hiçbir ayarı değiştirmemiş (UIE, *Do Users Change Their Settings?*).
NN/G aynı yönde: *"most users won't bother to customize"*, çözüm "varsayılanı optimize et".
Office'in kendini kısaltan menüsü öngörülemezlik yüzünden kaldırıldı (Microsoft, Jensen Harris).

Bundan çıkan: kullanıcıya "acemi misin uzman mısın" diye sormak bir ayardır, ayarlar
değiştirilmez. Bunun yerine **sabit yerleşim, değişen genişleme** (NN/G, kademeli
açığa çıkarma; Shneiderman 2003, çok katmanlı arayüz: katman seçimi kullanıcının
ihtiyaç anında verdiği karardır, kayıtta sorulan soru değil).

```
(a) cümle          → hiç bilmeyen burada kalır. Sembol yok, derece yok.
(b) tablo          → tek tuş. İlgili öğrenir, astrolog sınar.
(c) hesap ayarları → tablo açılınca görünür.
```

Astrolog kendini davranışıyla tanıtır: tabloyu açan, ev sistemini değiştiren kişidir.
Ana sayfa değişmez.

*Not: "basit mod / gelişmiş mod ayrımı işe yaramaz" cümlesi bu kanıtlardan doğrudan
çıkmıyor; kanıt yalnız "ayar değiştirilmiyor"u söylüyor. Mimari öneri buna dayanıyor.*

---

## 3. Temizlik önce (senin kuralın)

65 HTML sayfa var. Tek kişi, haftada 2-3 saat. Denetçinin itirazı yerinde:
**bu ölçek sürdürülebilir değil, hedef 20–25 sayfa olmalı.**

Karar veriden sonra, ama sorgu tek komut — Mac'te:

```
npx wrangler d1 execute sorbi-randevu --remote --command \
"SELECT meta, COUNT(*) n FROM events WHERE type='sayfa' GROUP BY meta ORDER BY n DESC LIMIT 60;"
```

Önerilen eşik: **son 90 günde 100 görüntülemenin altındaki sayfa birleşir ya da gider.**
(İlk taslakta 10 yazmıştım; o eşikle hiçbir şey gitmezdi.)

Veriden bağımsız söylenebilecekler:

- **`/araclar`'daki 18 araç listesi bir gezinme değil, bir sitemap.** Trafiğin %76,3'ü
  mobil (StatCounter, Türkiye geneli, Ağu 2026 — Sorbi'nin kendi oranı değil, o da
  yukarıdaki sorguyla çıkar). Rakiplerde 3–5 sabit sekme var. Öneri: dört başlık
  (Haritam · Bugün · Öğren · Sayım), gerisi altlarında.
- **Nav'daki dokuz bağlantı** mobilde yatay kaydırıyor; aynı dörde inmeli.
- **`/bugun` kendi efemeris kodunu taşıyor**, `sorbi-astro.js` kullanmıyor. İki hesap =
  iki hata kaynağı. Ama bu bir refactor, bir oturumluk iş değil (regresyon riski).
- **Tekrar eden hesaplayıcılar** (yükselen, ay burcu, doğum haritası, detaylı doğum
  haritası, natal harita rehberi): SEO için URL'ler kalsın, içerik tek kaynaktan gelsin.

---

## 4. Masadaki işler — maliyetleriyle

Süreler haftada 2-3 saate göre, denetçinin düzeltmesiyle.

| # | İş | Süre | Kime yarar | Karşı argüman |
|---|---|---|---|---|
| A | Terimleri haritaya bağlamak (`data-anlat`) | **1 oturum** | Bilmeyen + ilgili | Yok denecek kadar az |
| B | Tahminli saat rozeti + ev yorumlarını kısma | **2 oturum** | Herkes | Yok |
| C | Ana sayfaya 3 satırlık "bugün" özeti | **1 oturum** | İlgili | Web'de geri dönüşü bildirim sağlar, bizde bildirim yok; asıl geri dönüş aracı uygulama olabilir (bkz. 0) |
| D | Türkiye saat rejimi sayfası (1978–85 vb.) | **2 oturum** + kaynak doğrulama | Üçü de | 1978–85 verisi birincil kaynaktan doğrulanmadan yayınlanmamalı |
| E | Astrolog katmanı, tam hâli (7 ev sistemi, orb, düğüm, künye, CSV/PNG/SVG, URL durumu) | **8–12 hafta** | Astrolog | Aşağıda |
| E′ | Astrolog katmanı, küçük hâli (tablo + Placidus/Whole Sign + hesap künyesi) | **3–4 oturum** | Astrolog + ilgili | — |
| F | `/bugun` motor birleştirme | **2-3 hafta** | Doğruluk | Regresyon riski yüksek |

**E'ye karşı argüman (denetçiden, katılıyorum):** AdSense geliri "yükselen burç
hesaplama" arayan kitleden gelir, astrologdan değil. Astrolog bu özelliklerin hepsine
astro-seek ve astro.com'da zaten ücretsiz sahip; tablo gördü diye Sorbi'ye geçmez.
Getirisi itibar, o da ölçülmüyor. **Yarım kalmış bir ev sistemi anahtarı ise
doğrudan zarar:** belgenin kendi alıntıladığı *"the link appears to be broken"*
şikâyetinin birebir tarifi. Bu yüzden E değil, E′ masada.

**Denetçinin önerdiği sıra:** temizlik → A → B → C → D → E′.
Benim eklemem yok; bu sıra senin "temizlik önce" kuralına da uyuyor.

---

## 5. Yasal sınır

Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği md. 27/3: *falcı, medyum,
astrolog ve benzerlerinin hizmet reklamı hiçbir şekilde yapılamaz.* Bu fıkra yeni
değil; 1 Temmuz 2026 tarihli değişiklikle (yürürlük 1 Ağustos 2026) aynı fıkraya
yasa dışı şans oyunları eklendi. Reklam Kurulu uygulaması sert: Ekim 2023'te 39 siteye
erişim engeli, Ocak 2026'da 26 siteye erişim engeli; bir dosyada 863.580 TL ceza ve
24 saat içinde kaldırma kararı var. *Bunlar basın ve hukuk bürosu kaynaklarından;
ücretli katman açılmadan önce avukat teyidi şart.*

**Yapılabilir:** ücretsiz hesaplama aracı, açıklayıcı içerik, yazılım aboneliği.
**Yapılamaz:** "astroloğa sor", "danışmanlık", "ücretsiz seans", DM'ye yönlendirme,
korku ve kader temalı satış dili.

**Üç açık risk:**
1. `/soru-sor` — içerik bir hesaplama (horary), ama "sor" fiili hizmet çağrısı gibi okunabilir.
2. **AdSense'in gösterdiği reklamlar.** Sitede medyum/fal reklamı çıkarsa sorun bizim
   sayfamızdadır. AdSense panelinden bu kategoriler engellenmeli — kontrol edilmedi.
3. D1 veritabanının adı `sorbi-randevu`. Sitede randevu altyapısı kaldıysa bu
   `/soru-sor`'dan büyük bir risktir; ne olduğu doğrulanmalı.

---

## 6. Kopyalamayacaklarımız

Tek satır: gizli iptalli abonelik tuzağı (Nebula), ücretsiz katmanı sonradan daraltmak
(Co–Star, The Pattern 2026), çarkı tamamen gizlemek (The Pattern), sessiz 12:00
varsayılanı, başlıksız soyut ikonlu gezinme, bulut hesabı ve profil slotu satışı.

---

## 7. Sana düşen kararlar

1. **Web ve uygulama ilişkisi** (bölüm 0) — bu cevaplanmadan sıra kesinleşmiyor.
2. Trafik sorgusu çalıştırılacak mı? Temizlik buna bağlı.
3. Gezinme dörde insin mi?
4. E′ (küçük astrolog katmanı) masada kalsın mı, yoksa şimdilik rafa mı?
5. AdSense kategori kontrolü ve `sorbi-randevu` ne?

**Kaynaklar** (belgede geçen her sayı için): NN/G kademeli açığa çıkarma ·
NN/G varsayılanların gücü · UIE *Do Users Change Their Settings?* · Shneiderman 2003,
ACM CUU çok katmanlı arayüz · StatCounter Türkiye platform payı Ağu 2026 ·
DataReportal Digital 2026 Turkey · NG Araştırma burç okuma anketi 2023 (n=1.975) ·
Reklam Kurulu kararları (Sözcü, Diken, Aser Legal aktarımları) · Lexpera yönetmelik
metni · on bir ürünün mağaza ve destek sayfaları · Hürriyet, Milliyet, Sabah, Mynet,
Oggusto, hesaplama.net, astroasist, MapAstro, Ms Astro sayfaları (20.09.2026 çekimi).
Tam link listesi oturum kaydında; istediğin maddenin linkini isteyince veririm.
