for u in "sayim-yukselen.html" "sayim-yukselen" "sayim.html" "sayim" "nadirlik"; do
  printf "%-24s " "$u"
  curl -s "https://sorbiapp.com/$u" | grep -o "<title>[^<]*" | head -1
done
