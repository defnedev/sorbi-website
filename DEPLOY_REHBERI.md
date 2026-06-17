# SORBI.APP — DEPLOY REHBERI

## Domain Alma

### Secenekler:
1. **Cloudflare Registrar** — En ucuz (.app domainler icin ~$14/yil)
   - dash.cloudflare.com → Domain Registration → Register Domain → "sorbiapp.com"
   - Otomatik olarak Cloudflare DNS ve CDN aktif olur

2. **Namecheap** — Alternatif (~$13-16/yil)
   - namecheap.com → "sorbiapp.com" ara → satin al
   - DNS'i Cloudflare'e yonlendir (Cloudflare free plan kullan)

### Onerilen Yol: Cloudflare
- DNS + CDN + SSL + DDoS koruma hepsi dahil
- Pages ile ucretsiz hosting

---

## Hosting: Cloudflare Pages (UCRETSIZ)

### Adimlar:
1. GitHub'a repo olustur: `sorbi-website`
2. `sorbi-website/` klasorunun icerigini push et
3. Cloudflare Dashboard → Pages → Create Project
4. GitHub repo'yu bagla
5. Build settings:
   - Build command: (bos birak — static site)
   - Output directory: `/`
6. Custom domain: `sorbiapp.com` ekle
7. Deploy!

### Alternatif: Direkt Upload
1. Cloudflare Pages → Create Project → Direct Upload
2. `sorbi-website/` klasorunu yukle
3. Custom domain ekle

---

## Google AdSense Kurulumu

1. adsense.google.com → Basvur
2. Site URL: `sorbiapp.com`
3. Onay süreci: 1-14 gun
4. Onaylaninca `index.html`'deki placeholder'lari degistir:
   ```html
   <!-- Bu satiri uncomment et ve pub ID'ni gir: -->
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-SENIN_ID" crossorigin="anonymous"></script>
   ```
5. Reklam birimlerini olustur (Leaderboard 728x90, In-article, Bottom banner)
6. `ad-placeholder` div'lerini gercek reklam kodlariyla degistir

---

## Google Analytics Kurulumu

1. analytics.google.com → Property olustur
2. Site URL: `sorbiapp.com`
3. `index.html`'deki placeholder'i degistir:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-SENIN_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-SENIN_ID');
   </script>
   ```

---

## Google Search Console

1. search.google.com/search-console → Property ekle
2. Domain: `sorbiapp.com`
3. DNS dogrulama (Cloudflare'de TXT record ekle)
4. Sitemap gonder: `https://sorbiapp.com/sitemap.xml`

---

## SEO Kontrol Listesi

- [x] Meta title ve description (her sayfada)
- [x] Open Graph tags (sosyal paylasim)
- [x] Twitter Card tags
- [x] Structured Data (JSON-LD)
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Responsive design (mobile-first)
- [x] Semantic HTML
- [x] Fast loading (tek HTML dosyasi, no framework)
- [ ] Google Analytics (deploy sonrasi)
- [ ] Google Search Console (deploy sonrasi)
- [ ] Google AdSense (deploy sonrasi)

---

## Gunluk Icerik Guncelleme

Site simdilik statik. Gunluk burc yorumlarini guncellemek icin:
1. `index.html` icindeki `signs` JavaScript array'ini guncelle
2. `hero-transit` bolumunu o gunun transitiyle degistir
3. Tarih bilgilerini guncelle
4. Git push → Cloudflare otomatik deploy eder

### Gelecek Gelistirmeler:
- Backend API ile otomatik gunluk icerik (astro_engine entegrasyonu)
- Natal harita hesaplama formu
- Kullanici hesaplari
- Email newsletter
- Haftalik/aylik yorum sayfalari
