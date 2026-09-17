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

- `/`, `/dogum-haritasi-hesaplama` ve `/natal-harita` aynı işi yapıyor — birleştirme/301 ayrıca konuşulacak.
- Öğren sayfası mobilde yana taşıyor (502px) — mobile dokunmama kararı nedeniyle bırakıldı.
- `/rapor-araci` sitemap'te yok ama herkese açık.
