for u in "" masa sayim sayim-yukselen nadirlik ogren soru-sor detayli-dogum-haritasi dogum-haritasi-hesaplama araclar bugun haritam destek yokbolebirsey; do
  printf "/%-26s " "$u"
  curl -s -o /tmp/p -w "%{http_code} " "https://sorbiapp.com/$u"
  grep -o "<title>[^<]*" /tmp/p | head -1 | cut -c8-58
done
echo "--- kritik dosyalar:"
for f in sorbi-kart.js sorbi-olcum.js sorbi-dignite.js nadirlik-veri.json ogren-veri.json og-sayim-yukselen.png sitemap.xml robots.txt; do
  printf "%-24s " "$f"; curl -s -o /dev/null -w "%{http_code}\n" "https://sorbiapp.com/$f"
done
echo "--- kapali olmasi gerekenler:"
for f in randevu-backend/server.js api/bookings api/pay/start; do
  printf "%-24s " "$f"; curl -s -o /dev/null -w "%{http_code}\n" "https://sorbiapp.com/$f"
done
