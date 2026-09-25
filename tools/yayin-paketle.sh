#!/bin/sh
# Yayın paketi — yalnız siteye ait dosyalar _yayin/ klasörüne kopyalanır, deploy oradan yapılır.
# Neden: `wrangler pages deploy .` repo kökündeki HER ŞEYİ yüklüyordu; belge/, tools/,
# "Claude outputs"/, schema.sql ve wrangler.toml canlıda herkese açıktı (24 Eyl 2026 PO kapısı).
# İzin listesi mantığı: burada sayılmayan hiçbir şey yayına gitmez.
set -e
cd "$(dirname "$0")/.."
rm -rf _yayin && mkdir -p _yayin
cp -- *.html _yayin/
cp -- sorbi-*.js astronomy.browser.min.js _yayin/
cp -- sorbi-fonts.css _yayin/
cp -- ozellik-veri.json sayim-veri.json ogren-veri.json nadirlik-veri.json _yayin/
cp -- _redirects _headers robots.txt sitemap.xml ads.txt _yayin/
cp -- og-*.png _yayin/
cp -R fontlar _yayin/fontlar
cp -R functions _yayin/functions
# kapalı sayfalar da kopyalanır; _redirects onları önce yakalar, dosya yedek olarak durur
echo "_yayin hazır: $(find _yayin -type f | wc -l | tr -d ' ') dosya"
# sızıntı kontrolü: yayın klasöründe olmaması gerekenler
if find _yayin -name '*.md' -o -name '*.sql' -o -name '*.toml' -o -name '*.py' -o -name '*.mjs' -o -name '*.zip' | grep -q .; then
  echo "HATA: yayın klasöründe kaynak/belge dosyası var"; find _yayin -name '*.md' -o -name '*.sql' -o -name '*.toml' -o -name '*.py' -o -name '*.mjs' -o -name '*.zip'; exit 1
fi
