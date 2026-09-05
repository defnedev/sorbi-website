sleep 4
printf "sorbi-yer.js "; curl -s -o /tmp/y -w "%{http_code} %{content_type}\n" https://sorbiapp.com/sorbi-yer.js; head -c 60 /tmp/y; echo
